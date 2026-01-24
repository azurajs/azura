import type { CDNConfig } from "./types/common.js";
import { createServer } from "./server.js";

export type CDNInstance = ReturnType<typeof createServer>;

export function cdnPlugin(config: CDNConfig) {
  const cdn = createServer(config);

  return {
    name: "@azurajs/cdn",

    register(app: any) {
      app.cdn = cdn;

      if (app.router) {
        app.router.get("/__cdn/stats", async (req: any, res: any) => {
          const memStats = cdn.getMemoryStats();
          const diskStats = await cdn.getDiskStats();
          const metrics = cdn.getMetrics();
          res.json({ memory: memStats, disk: diskStats, metrics });
        });

        app.router.post("/__cdn/purge", async (req: any, res: any) => {
          const { path, pattern, tags } = req.body || {};

          if (tags && Array.isArray(tags)) {
            const count = cdn.purgeTags(tags);
            return res.json({ ok: true, purged: count });
          }

          if (!path) {
            return res.status(400).json({ error: "Caminho obrigatório" });
          }

          const count = cdn.purge(path, { pattern });
          res.json({ ok: true, purged: count });
        });

        app.router.post("/__cdn/sign", (req: any, res: any) => {
          const { path, ttl = 60 } = req.body || {};

          if (!path) {
            return res.status(400).json({ error: "Caminho obrigatório" });
          }

          try {
            const signedUrl = cdn.generateSignedUrl(path, ttl);
            res.json({ signedUrl, expiresIn: ttl });
          } catch (e: any) {
            res.status(503).json({ error: e.message });
          }
        });

        app.router.post("/__cdn/warm", async (req: any, res: any) => {
          const { urls, concurrency } = req.body || {};

          if (!urls || !Array.isArray(urls)) {
            return res.status(400).json({ error: "URLs obrigatórias" });
          }

          const count = await cdn.warm(urls, { concurrency });
          res.json({ ok: true, warmed: count });
        });

        app.router.post("/__cdn/clear", (req: any, res: any) => {
          cdn.purgeAll();
          res.json({ ok: true, message: "Cache limpo" });
        });

        app.router.post("/__cdn/cleanup", async (req: any, res: any) => {
          const result = await cdn.cleanup();
          res.json({ ok: true, cleaned: result });
        });
      }

      console.log("📦 [Azura:CDN] Plugin registered");
    },

    instance: cdn,

    ...cdn,
  };
}

export default cdnPlugin;
