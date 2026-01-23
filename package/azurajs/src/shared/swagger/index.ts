import type { AzuraClient } from "../../infra/Server";
import { SwaggerGenerator } from "./SwaggerGenerator";
import type { SwaggerConfig } from "../../types/swagger.type";
import { readFileSync, existsSync } from "node:fs";
import { createRequire } from "node:module";
import { getControllerMetadata, applyDecorators } from "../../decorators/Route";
import type { RequestServer, ResponseServer } from "../../types";

export class SwaggerIntegration {
  private generator: SwaggerGenerator;
  private app: AzuraClient;

  constructor(app: AzuraClient, config?: SwaggerConfig) {
    this.app = app;
    this.generator = new SwaggerGenerator(config);
  }

  public setup(): void {
    const config = this.generator.getConfig();

    this.app.get(`/api-spec.json`, (req: RequestServer, res: ResponseServer) => {
      res.json(this.generator.getDocument());
    });

    if (!config.uiEnabled) return;

    this.app.get(config.path, (req: RequestServer, res: ResponseServer) => {
      try {
        const require = createRequire(import.meta.url);
        const htmlPath = require.resolve("azurajs/swagger-ui");

        if (!existsSync(htmlPath)) throw new Error(`Swagger UI HTML not found at ${htmlPath}`);

        let html = readFileSync(htmlPath, "utf-8");
        const doc = this.generator.getDocument();

        html = html.replace(/{{TITLE}}/g, String(doc.info.title || ""));
        html = html.replace(/{{VERSION}}/g, String(doc.info.version || ""));
        html = html.replace(/{{DESCRIPTION}}/g, String(doc.info.description || ""));

        if (typeof res.type === "function" && typeof res.send === "function") {
          res.type("text/html").send(html);
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
          res.status(500).json({ error: "Failed to load Swagger UI", details: message });
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

export function setupSwaggerWithControllers(
  app: AzuraClient,
  config: SwaggerConfig,
  controllers: Array<new () => any>,
): SwaggerGenerator {
  applyDecorators(app, controllers);
  const integration = new SwaggerIntegration(app, config);
  integration.setup();
  const swaggerGen = integration.getGenerator();
  controllers.forEach((ControllerClass) => {
    const meta = getControllerMetadata(ControllerClass);
    if (meta.routes && meta.routes.length > 0) {
      swaggerGen.addController(ControllerClass, meta.routes, meta.prefix);
    }
  });
  return swaggerGen;
}
