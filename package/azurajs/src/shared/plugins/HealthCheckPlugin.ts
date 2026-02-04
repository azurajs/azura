import type { RequestHandler } from "../../types/common.type";

interface HealthCheckOptions {
  path?: string;
  healthChecks?: Record<string, () => Promise<boolean>>;
}

export function healthCheck(options: HealthCheckOptions = {}): RequestHandler {
  const path = options.path || "/health";
  const checks = options.healthChecks || {};

  return async (req, res, next) => {
    if (req.path !== path) {
      return next ? next() : Promise.resolve();
    }

    const results: Record<string, { status: string; error?: string }> = {};
    let allHealthy = true;

    for (const [name, check] of Object.entries(checks)) {
      try {
        const healthy = await check();
        results[name] = { status: healthy ? "healthy" : "unhealthy" };
        if (!healthy) allHealthy = false;
      } catch (error: any) {
        results[name] = { status: "unhealthy", error: error.message };
        allHealthy = false;
      }
    }

    const status = allHealthy ? 200 : 503;
    res.status(status).json({
      status: allHealthy ? "healthy" : "unhealthy",
      timestamp: new Date().toISOString(),
      checks: results,
    });
  };
}
