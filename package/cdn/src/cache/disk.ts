import fs from "fs";
import path from "path";
import crypto from "crypto";
import { promises as fsp } from "fs";
import type { CacheEntry, CacheStats, ICacheBackend } from "../types/common.js";
import { filterByPattern } from "../utils/pattern.js";

interface DiskCacheMetadata {
  key: string;
  headers: Record<string, string | string[]>;
  expiresAt: number;
  etag?: string;
  lastModified?: number;
  tags?: string[];
  createdAt: number;
  size: number;
}

export class DiskCache implements ICacheBackend {
  private basePath: string;
  private maxSizeBytes: number;
  private currentBytes: number = 0;
  private keyMap = new Map<string, string>();

  constructor(basePath: string, maxSizeBytes = 1024 * 1024 * 1024) {
    this.basePath = basePath;
    this.maxSizeBytes = maxSizeBytes;

    try {
      fs.mkdirSync(this.basePath, { recursive: true });
      fs.mkdirSync(path.join(this.basePath, "data"), { recursive: true });
      fs.mkdirSync(path.join(this.basePath, "meta"), { recursive: true });
    } catch (e) {}

    this.loadIndex();
  }

  private hash(key: string): string {
    return crypto.createHash("sha256").update(key).digest("hex");
  }

  private dataPath(hash: string): string {
    return path.join(this.basePath, "data", hash);
  }

  private metaPath(hash: string): string {
    return path.join(this.basePath, "meta", `${hash}.json`);
  }

  private async loadIndex(): Promise<void> {
    try {
      const metaDir = path.join(this.basePath, "meta");
      const files = await fsp.readdir(metaDir);

      for (const file of files) {
        if (!file.endsWith(".json")) continue;
        try {
          const content = await fsp.readFile(path.join(metaDir, file), "utf-8");
          const meta: DiskCacheMetadata = JSON.parse(content);
          const hash = file.replace(".json", "");
          this.keyMap.set(meta.key, hash);
          this.currentBytes += meta.size;
        } catch (e) {}
      }
    } catch (e) {}
  }

  async get(key: string): Promise<CacheEntry | null> {
    const hash = this.keyMap.get(key);
    if (!hash) return null;

    try {
      const metaContent = await fsp.readFile(this.metaPath(hash), "utf-8");
      const meta: DiskCacheMetadata = JSON.parse(metaContent);

      if (Date.now() > meta.expiresAt) {
        await this.delete(key);
        return null;
      }

      const body = await fsp.readFile(this.dataPath(hash));

      return {
        key: meta.key,
        body,
        headers: meta.headers,
        expiresAt: meta.expiresAt,
        size: meta.size,
        etag: meta.etag,
        lastModified: meta.lastModified,
        tags: meta.tags,
        createdAt: meta.createdAt,
      };
    } catch (e) {
      this.keyMap.delete(key);
      return null;
    }
  }

  async set(key: string, entry: CacheEntry): Promise<void> {
    if (this.keyMap.has(key)) {
      await this.delete(key);
    }

    while (
      this.currentBytes + entry.size > this.maxSizeBytes &&
      this.keyMap.size > 0
    ) {
      const firstKey = this.keyMap.keys().next().value;
      if (!firstKey) break;
      await this.delete(firstKey);
    }

    const hash = this.hash(key);
    const meta: DiskCacheMetadata = {
      key: entry.key,
      headers: entry.headers,
      expiresAt: entry.expiresAt,
      etag: entry.etag,
      lastModified: entry.lastModified,
      tags: entry.tags,
      createdAt: entry.createdAt,
      size: entry.size,
    };

    await fsp.writeFile(this.dataPath(hash), entry.body);
    await fsp.writeFile(this.metaPath(hash), JSON.stringify(meta));

    this.keyMap.set(key, hash);
    this.currentBytes += entry.size;
  }

  async delete(key: string): Promise<void> {
    const hash = this.keyMap.get(key);
    if (!hash) return;

    try {
      const metaContent = await fsp.readFile(this.metaPath(hash), "utf-8");
      const meta: DiskCacheMetadata = JSON.parse(metaContent);
      this.currentBytes -= meta.size;
    } catch (e) {}

    try {
      await fsp.unlink(this.dataPath(hash));
    } catch (e) {}

    try {
      await fsp.unlink(this.metaPath(hash));
    } catch (e) {}

    this.keyMap.delete(key);
  }

  async has(key: string): Promise<boolean> {
    return this.keyMap.has(key);
  }

  async clear(): Promise<void> {
    const keys = Array.from(this.keyMap.keys());
    for (const key of keys) {
      await this.delete(key);
    }
  }

  async keys(): Promise<string[]> {
    return Array.from(this.keyMap.keys());
  }

  async deleteByPattern(pattern: string): Promise<number> {
    const allKeys = await this.keys();
    const matching = filterByPattern(allKeys, pattern);
    for (const key of matching) {
      await this.delete(key);
    }
    return matching.length;
  }

  async getStats(): Promise<CacheStats> {
    return {
      entries: this.keyMap.size,
      currentBytes: this.currentBytes,
      maxBytes: this.maxSizeBytes,
      usagePercent: ((this.currentBytes / this.maxSizeBytes) * 100).toFixed(2),
    };
  }

  async cleanup(): Promise<number> {
    const now = Date.now();
    let count = 0;
    const keys = await this.keys();

    for (const key of keys) {
      const entry = await this.get(key);
      if (!entry || now > entry.expiresAt) {
        await this.delete(key);
        count++;
      }
    }

    return count;
  }
}
