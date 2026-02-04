import type { CDNMetrics } from "./types/common.js";

export class MetricsCollector {
  private metrics: CDNMetrics;
  private latencies: number[] = [];
  private maxLatencySamples = 1000;

  constructor() {
    this.metrics = {
      hits: { memory: 0, disk: 0 },
      misses: 0,
      errors: 0,
      bytesServed: 0,
      bytesSaved: 0,
      requests: 0,
      avgLatencyMs: 0,
      uptime: 0,
      startedAt: Date.now(),
    };
  }

  recordHit(source: "memory" | "disk" | "redis", bytes: number): void {
    this.metrics.requests++;
    if (source === "memory") {
      this.metrics.hits.memory++;
    } else if (source === "disk") {
      this.metrics.hits.disk++;
    } else if (source === "redis") {
      this.metrics.hits.redis = (this.metrics.hits.redis || 0) + 1;
    }
    this.metrics.bytesSaved += bytes;
  }

  recordMiss(bytes: number): void {
    this.metrics.requests++;
    this.metrics.misses++;
    this.metrics.bytesServed += bytes;
  }

  recordError(): void {
    this.metrics.errors++;
  }

  recordLatency(latencyMs: number): void {
    this.latencies.push(latencyMs);
    if (this.latencies.length > this.maxLatencySamples) {
      this.latencies.shift();
    }
    this.metrics.avgLatencyMs =
      this.latencies.reduce((a, b) => a + b, 0) / this.latencies.length;
  }

  getMetrics(): CDNMetrics {
    return {
      ...this.metrics,
      uptime: Date.now() - this.metrics.startedAt,
    };
  }

  getHitRate(): string {
    const total =
      this.metrics.hits.memory +
      this.metrics.hits.disk +
      (this.metrics.hits.redis || 0) +
      this.metrics.misses;
    if (total === 0) return "0.00";
    const hits =
      this.metrics.hits.memory +
      this.metrics.hits.disk +
      (this.metrics.hits.redis || 0);
    return ((hits / total) * 100).toFixed(2);
  }

  formatBytes(bytes: number): string {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }

  getSummary(): object {
    const metrics = this.getMetrics();
    return {
      requests: metrics.requests,
      hitRate: this.getHitRate() + "%",
      hits: {
        memory: metrics.hits.memory,
        disk: metrics.hits.disk,
        ...(metrics.hits.redis && { redis: metrics.hits.redis }),
      },
      misses: metrics.misses,
      errors: metrics.errors,
      bandwidth: {
        served: this.formatBytes(metrics.bytesServed),
        saved: this.formatBytes(metrics.bytesSaved),
      },
      avgLatency: metrics.avgLatencyMs.toFixed(2) + "ms",
      uptime: Math.floor(metrics.uptime / 1000) + "s",
    };
  }

  reset(): void {
    this.metrics = {
      hits: { memory: 0, disk: 0 },
      misses: 0,
      errors: 0,
      bytesServed: 0,
      bytesSaved: 0,
      requests: 0,
      avgLatencyMs: 0,
      uptime: 0,
      startedAt: Date.now(),
    };
    this.latencies = [];
  }
}
