import type { CacheEntry } from "../types/common";

export class MemoryCache {
  private map = new Map<string, CacheEntry>();
  private maxBytes: number;
  private currentBytes: number;

  constructor(maxBytes = 512 * 1024 * 1024) {
    this.map = new Map();
    this.maxBytes = maxBytes;
    this.currentBytes = 0;
  }

  get(key: string): CacheEntry | null {
    const v = this.map.get(key);
    if (!v) return null;

    if (Date.now() > v.expiresAt) {
      this.delete(key);
      return null;
    }

    this.map.delete(key);
    this.map.set(key, v);
    return v;
  }

  set(key: string, entry: CacheEntry): void {
    const existing = this.map.get(key);
    if (existing) {
      this.currentBytes -= existing.size;
      this.map.delete(key);
    }

    while (this.currentBytes + entry.size > this.maxBytes && this.map.size > 0) {
      const firstKey = this.map.keys().next().value;
      if (!firstKey) break;

      const first = this.map.get(firstKey) as CacheEntry;
      this.currentBytes -= first.size;
      this.map.delete(firstKey);
    }

    this.map.set(key, entry);
    this.currentBytes += entry.size;
  }

  delete(key: string): void {
    const v = this.map.get(key);
    if (!v) return;
    
    this.currentBytes -= v.size;
    this.map.delete(key);
  }

  purge(): void {
    this.map.clear();
    this.currentBytes = 0;
  }
}
