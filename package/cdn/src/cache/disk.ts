import fs from "fs";
import path from "path";
import crypto from "crypto";
import { promises as fsp } from "fs";

export class DiskCache {
  private base: string;

  constructor(base: string) {
    this.base = base;
    try {
      fs.mkdirSync(this.base, { recursive: true });
    } catch (e) {}
  }

  private file(key: string) {
    const hash = crypto.createHash("sha256").update(key).digest("hex");
    return path.join(this.base, hash);
  }

  async get(key: string): Promise<Buffer | null> {
    const f = this.file(key);
    try {
      const meta = await fsp.readFile(f);
      return meta;
    } catch (e) {
      return null;
    }
  }

  async set(key: string, data: Buffer): Promise<void> {
    const f = this.file(key);
    await fsp.writeFile(f, data);
  }

  async delete(key: string): Promise<void> {
    const f = this.file(key);
    try {
      await fsp.unlink(f);
    } catch (e) {}
  }
}
