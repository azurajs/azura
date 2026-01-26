import zlib from "zlib";
import { promisify } from "util";
import type { CompressionOptions } from "../types/common.js";

const gzipAsync = promisify(zlib.gzip);
const brotliAsync = promisify(zlib.brotliCompress);
const gunzipAsync = promisify(zlib.gunzip);
const brotliDecompressAsync = promisify(zlib.brotliDecompress);

const DEFAULT_COMPRESSIBLE_TYPES = [
  "text/html",
  "text/css",
  "text/plain",
  "text/xml",
  "text/javascript",
  "application/javascript",
  "application/json",
  "application/xml",
  "application/xhtml+xml",
  "application/rss+xml",
  "application/atom+xml",
  "image/svg+xml",
];

export class CompressionHandler {
  private options: Required<CompressionOptions>;

  constructor(options?: CompressionOptions) {
    this.options = {
      enabled: options?.enabled ?? true,
      gzip: options?.gzip ?? true,
      brotli: options?.brotli ?? true,
      minSize: options?.minSize ?? 1024,
      mimeTypes: options?.mimeTypes ?? DEFAULT_COMPRESSIBLE_TYPES,
    };
  }

  shouldCompress(contentType: string | undefined, size: number): boolean {
    if (!this.options.enabled) return false;
    if (size < this.options.minSize) return false;
    if (!contentType) return false;

    const mimeType = contentType.split(";")[0].trim().toLowerCase();
    return this.options.mimeTypes.some((type) =>
      mimeType.startsWith(type.toLowerCase()),
    );
  }

  getBestEncoding(acceptEncoding: string | undefined): "br" | "gzip" | null {
    if (!acceptEncoding) return null;

    const encodings = acceptEncoding.toLowerCase();

    if (this.options.brotli && encodings.includes("br")) {
      return "br";
    }

    if (this.options.gzip && encodings.includes("gzip")) {
      return "gzip";
    }

    return null;
  }

  async compress(data: Buffer, encoding: "br" | "gzip"): Promise<Buffer> {
    if (encoding === "br") {
      return brotliAsync(data, {
        params: {
          [zlib.constants.BROTLI_PARAM_QUALITY]: 4,
        },
      });
    }
    return gzipAsync(data, { level: 6 });
  }

  async decompress(data: Buffer, encoding: "br" | "gzip"): Promise<Buffer> {
    if (encoding === "br") {
      return brotliDecompressAsync(data);
    }
    return gunzipAsync(data);
  }

  async compressAll(data: Buffer): Promise<{ gzip?: Buffer; brotli?: Buffer }> {
    const result: { gzip?: Buffer; brotli?: Buffer } = {};

    const tasks: Promise<void>[] = [];

    if (this.options.gzip) {
      tasks.push(
        this.compress(data, "gzip").then((buf) => {
          result.gzip = buf;
        }),
      );
    }

    if (this.options.brotli) {
      tasks.push(
        this.compress(data, "br").then((buf) => {
          result.brotli = buf;
        }),
      );
    }

    await Promise.all(tasks);
    return result;
  }

  getCompressionRatio(original: number, compressed: number): string {
    if (original === 0) return "0%";
    const ratio = ((1 - compressed / original) * 100).toFixed(1);
    return `${ratio}%`;
  }
}

export function createCompressionHandler(
  options?: CompressionOptions,
): CompressionHandler {
  return new CompressionHandler(options);
}
