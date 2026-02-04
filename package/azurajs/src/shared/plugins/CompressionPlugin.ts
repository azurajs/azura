import { createGzip, createDeflate, createBrotliCompress } from "node:zlib";
import type { RequestHandler } from "../../types/common.type";

type ContentType = string;
type EncodingType = "br" | "gzip" | "deflate";

interface CompressionOptions {
  readonly threshold?: number;
  readonly level?: number;
  readonly filter?: ContentTypeFilter;
}

type ContentTypeFilter = (contentType: ContentType) => boolean;

class DefaultContentTypeFilter {
  private static readonly COMPRESSIBLE_PATTERN = /text|json|javascript|css|xml|svg|wasm/;

  public static test(contentType: ContentType): boolean {
    return this.COMPRESSIBLE_PATTERN.test(contentType);
  }
}

class CompressionThreshold {
  constructor(private readonly value: number) {}

  public exceeds(size: number): boolean {
    return size >= this.value;
  }
}

class BodySize {
  constructor(private readonly body: unknown) {}

  public calculate(): number {
    if (Buffer.isBuffer(this.body)) {
      return this.body.length;
    }
    return Buffer.byteLength(String(this.body));
  }
}

class CompressionEligibility {
  constructor(
    private readonly threshold: CompressionThreshold,
    private readonly filter: ContentTypeFilter,
  ) {}

  public check(body: unknown, contentType: ContentType): boolean {
    if (!body) {
      return false;
    }

    const size = new BodySize(body).calculate();
    return this.threshold.exceeds(size) && this.filter(contentType);
  }
}

class EncodingMatcher {
  private readonly patterns: ReadonlyMap<EncodingType, RegExp>;

  constructor() {
    this.patterns = new Map([
      ["br", /\bbr\b/],
      ["gzip", /\bgzip\b/],
      ["deflate", /\bdeflate\b/],
    ]);
  }

  public match(acceptEncoding: string): EncodingType | null {
    for (const [encoding, pattern] of this.patterns) {
      if (pattern.test(acceptEncoding)) {
        return encoding;
      }
    }
    return null;
  }
}

class CompressionStreamFactory {
  constructor(private readonly level: number) {}

  public create(encoding: EncodingType) {
    if (encoding === "br") {
      return createBrotliCompress();
    }

    if (encoding === "gzip") {
      return createGzip({ level: this.level });
    }

    return createDeflate({ level: this.level });
  }
}

class BodyTransformer {
  public toBuffer(body: unknown): Buffer {
    return Buffer.isBuffer(body) ? body : Buffer.from(String(body));
  }
}

class CompressionHeaders {
  constructor(private readonly encoding: EncodingType) {}

  public apply(res: any): void {
    res.set("Content-Encoding", this.encoding);
    res.set("Vary", "Accept-Encoding");
    res.removeHeader("Content-Length");
  }
}

class StreamCompressor {
  constructor(
    private readonly streamFactory: CompressionStreamFactory,
    private readonly transformer: BodyTransformer,
  ) {}

  public compress(res: any, body: unknown, encoding: EncodingType): void {
    const buffer = this.transformer.toBuffer(body);
    new CompressionHeaders(encoding).apply(res);

    const stream = this.streamFactory.create(encoding);
    stream.pipe(res);
    stream.end(buffer);
  }
}

class CompressibleResponse {
  constructor(
    private readonly eligibility: CompressionEligibility,
    private readonly matcher: EncodingMatcher,
    private readonly compressor: StreamCompressor,
  ) {}

  public process(res: any, body: unknown, acceptEncoding: string): boolean {
    const contentType = res.get("Content-Type") ?? "";

    if (!this.eligibility.check(body, contentType)) {
      return false;
    }

    const encoding = this.matcher.match(acceptEncoding);
    if (!encoding) {
      return false;
    }

    this.compressor.compress(res, body, encoding);
    return true;
  }
}

class SendMethodInterceptor {
  constructor(
    private readonly originalMethod: any,
    private readonly processor: CompressibleResponse,
    private readonly acceptEncoding: string,
  ) {}

  public intercept(res: any): (body: unknown) => any {
    return (body: unknown) => {
      const compressed = this.processor.process(res, body, this.acceptEncoding);
      if (compressed) {
        return res;
      }
      return this.originalMethod.call(res, body);
    };
  }
}

class JsonMethodInterceptor {
  constructor(
    private readonly originalMethod: any,
    private readonly processor: CompressibleResponse,
    private readonly acceptEncoding: string,
  ) {}

  public intercept(res: any): (body: unknown) => any {
    return (body: unknown) => {
      res.set("Content-Type", "application/json");
      const jsonString = JSON.stringify(body);

      const compressed = this.processor.process(res, jsonString, this.acceptEncoding);
      if (compressed) {
        return res;
      }
      return this.originalMethod.call(res, body);
    };
  }
}

export function compression(options: CompressionOptions = {}): RequestHandler {
  const threshold = new CompressionThreshold(options.threshold ?? 1024);
  const filter = options.filter ?? DefaultContentTypeFilter.test;
  const level = options.level ?? 6;

  const eligibility = new CompressionEligibility(threshold, filter);
  const matcher = new EncodingMatcher();
  const streamFactory = new CompressionStreamFactory(level);
  const transformer = new BodyTransformer();
  const compressor = new StreamCompressor(streamFactory, transformer);
  const processor = new CompressibleResponse(eligibility, matcher, compressor);

  return (req, res, next) => {
    const acceptEncoding = req.headers?.["accept-encoding"] ?? "";

    const sendInterceptor = new SendMethodInterceptor(res.send, processor, acceptEncoding);
    const jsonInterceptor = new JsonMethodInterceptor(res.json, processor, acceptEncoding);

    res.send = sendInterceptor.intercept(res);
    res.json = jsonInterceptor.intercept(res);

    return next ? next() : Promise.resolve();
  };
}
