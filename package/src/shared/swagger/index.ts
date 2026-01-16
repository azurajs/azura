import type { AzuraClient } from "../../infra/Server";
import { SwaggerGenerator } from "./SwaggerGenerator";
import type { SwaggerConfig } from "../../types/swagger.type";
import { readFileSync, existsSync } from "node:fs";
import { join, dirname, normalize } from "node:path";
import { fileURLToPath } from "node:url";

function getCurrentDir(): string {
  if (typeof __dirname !== "undefined") {
    return __dirname;
  }
  return dirname(fileURLToPath(import.meta.url));
}

export class SwaggerIntegration {
  private generator: SwaggerGenerator;
  private app: AzuraClient;

  constructor(app: AzuraClient, config?: SwaggerConfig) {
    this.app = app;
    this.generator = new SwaggerGenerator(config);
  }

  public setup(): void {
    const config = this.generator.getConfig();

    if (!config.enabled) {
      return;
    }

    this.app.get(`/api-spec.json`, (_req: any, res: any) => {
      res.json(this.generator.getDocument());
    });

    this.app.get(config.path, (_req: any, res: any) => {
      try {
        const currentDir = getCurrentDir();
        const htmlPath = normalize(
          join(currentDir, "..", "dist", "shared", "swagger", "swagger-ui-modern.html")
        );

        if (!existsSync(htmlPath)) {
          throw new Error(`Swagger UI HTML not found at ${htmlPath}`);
        }

        let html = readFileSync(htmlPath, "utf-8");
        const doc = this.generator.getDocument();

        html = html.replace(/{{TITLE}}/g, String(doc.info.title || ""));
        html = html.replace(/{{VERSION}}/g, String(doc.info.version || ""));
        html = html.replace(/{{DESCRIPTION}}/g, String(doc.info.description || ""));

        if (typeof res.type === "function" && typeof res.send === "function") {
          res.type("html").send(html);
          return;
        }

        if (typeof res.setHeader === "function" && typeof res.end === "function") {
          res.setHeader("Content-Type", "text/html; charset=utf-8");
          res.end(html);
          return;
        }

        res.json({ error: "Response object does not support sending HTML" });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        if (typeof res.status === "function" && typeof res.json === "function") {
          res.status(500).json({
            error: "Failed to load Swagger UI",
            details: message,
          });
          return;
        }
        if (typeof res.end === "function") {
          res.end(JSON.stringify({ error: "Failed to load Swagger UI", details: message }));
          return;
        }
      }
    });
  }

  public getGenerator(): SwaggerGenerator {
    return this.generator;
  }
}

export function setupSwagger(app: AzuraClient, config?: SwaggerConfig): SwaggerGenerator {
  const integration = new SwaggerIntegration(app, config);
  integration.setup();
  return integration.getGenerator();
}
