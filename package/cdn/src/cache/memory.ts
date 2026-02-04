import type { CacheEntry, CacheStats, ICacheBackend } from "../types/common.js";
import { filterByPattern } from "../utils/pattern.js";

export class MemoryCache implements ICacheBackend {
  private map = new Map<string, CacheEntry>();
  private maxBytes: number;
  private currentBytes: number = 0;
  private tagIndex = new Map<string, Set<string>>();

  constructor(maxBytes = 512 * 1024 * 1024) {
    this.maxBytes = maxBytes;
  }

  get(key: string): CacheEntry | null {
    const entry = this.map.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.delete(key);
      return null;
    }

    this.map.delete(key);
    this.map.set(key, entry);
    return entry;
  }

  set(key: string, entry: CacheEntry): void {
    const existing = this.map.get(key);
    if (existing) {
      this.currentBytes -= existing.size;
      this.removeFromTagIndex(key, existing.tags);
      this.map.delete(key);
    }

    while (
      this.currentBytes + entry.size > this.maxBytes &&
      this.map.size > 0
    ) {
      const firstKey = this.map.keys().next().value;
      if (!firstKey) break;
      this.delete(firstKey);
    }

    this.map.set(key, entry);
    this.currentBytes += entry.size;
    this.addToTagIndex(key, entry.tags);
  }

  delete(key: string): void {
    const entry = this.map.get(key);
    if (!entry) return;

    this.currentBytes -= entry.size;
    this.removeFromTagIndex(key, entry.tags);
    this.map.delete(key);
  }

  has(key: string): boolean {
    const entry = this.map.get(key);
    if (!entry) return false;
    if (Date.now() > entry.expiresAt) {
      this.delete(key);
      return false;
    }
    return true;
  }

  clear(): void {
    this.map.clear();
    this.tagIndex.clear();
    this.currentBytes = 0;
  }

  keys(): string[] {
    return Array.from(this.map.keys());
  }

  deleteByPattern(pattern: string): number {
    const allKeys = this.keys();
    const matching = filterByPattern(allKeys, pattern);
    matching.forEach((key) => this.delete(key));
    return matching.length;
  }

  deleteByTags(tags: string[]): number {
    let count = 0;
    for (const tag of tags) {
      const keys = this.tagIndex.get(tag);
      if (keys) {
        keys.forEach((key) => {
          this.delete(key);
          count++;
        });
      }
    }
    return count;
  }

  getByTag(tag: string): CacheEntry[] {
    const keys = this.tagIndex.get(tag);
    if (!keys) return [];
    return Array.from(keys)
      .map((key) => this.get(key))
      .filter((entry): entry is CacheEntry => entry !== null);
  }

  cleanup(): number {
    const now = Date.now();
    let count = 0;
    for (const [key, entry] of this.map) {
      if (now > entry.expiresAt) {
        this.delete(key);
        count++;
      }
    }
    return count;
  }

  getStats(): CacheStats {
    return {
      entries: this.map.size,
      currentBytes: this.currentBytes,
      maxBytes: this.maxBytes,
      usagePercent: ((this.currentBytes / this.maxBytes) * 100).toFixed(2),
    };
  }

  private addToTagIndex(key: string, tags?: string[]): void {
    if (!tags) return;
    for (const tag of tags) {
      if (!this.tagIndex.has(tag)) {
        this.tagIndex.set(tag, new Set());
      }
      this.tagIndex.get(tag)!.add(key);
    }
  }

  private removeFromTagIndex(key: string, tags?: string[]): void {
    if (!tags) return;
    for (const tag of tags) {
      const keys = this.tagIndex.get(tag);
      if (keys) {
        keys.delete(key);
        if (keys.size === 0) {
          this.tagIndex.delete(tag);
        }
      }
    }
  }
}
