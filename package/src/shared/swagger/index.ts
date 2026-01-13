import type { AzuraClient } from "../../infra/Server";
import { SwaggerGenerator } from "./SwaggerGenerator";
import type { SwaggerConfig } from "../../types/swagger.type";
import { readFileSync } from "node:fs";
import { join } from "node:path";

export class SwaggerIntegration {
  private generator: SwaggerGenerator;
  private app: AzuraClient;

  constructor(app: AzuraClient, config?: SwaggerConfig) {
    this.app = app;
    this.generator = new SwaggerGenerator(config);
  }

  /**
   * Setup Swagger routes
   */
  public setup(): void {
    const config = this.generator.getConfig();

    if (!config.enabled) {
      return;
    }

    // Route to serve OpenAPI spec JSON
    this.app.get(`/api-spec.json`, (_req: any, res: any) => {
      res.json(this.generator.getDocument());
    });

    // Route to serve Swagger UI
    this.app.get(config.path, (_req: any, res: any) => {
      try {
        const htmlPath = join(__dirname, "swagger-ui-modern.html");
        let html = readFileSync(htmlPath, "utf-8");

        // Replace placeholders
        const doc = this.generator.getDocument();
        html = html.replace(/{{TITLE}}/g, doc.info.title);
        html = html.replace(/{{VERSION}}/g, doc.info.version);
        html = html.replace(/{{DESCRIPTION}}/g, doc.info.description || "");

        res.type("html").send(html);
      } catch (error) {
        res.status(500).json({ error: "Failed to load Swagger UI" });
      }
    });
  }

  /**
   * Get the generator instance
   */
  public getGenerator(): SwaggerGenerator {
    return this.generator;
  }
}

/**
 * Helper function to setup Swagger in an AzuraClient instance
 */
export function setupSwagger(app: AzuraClient, config?: SwaggerConfig): SwaggerGenerator {
  const integration = new SwaggerIntegration(app, config);
  integration.setup();
  return integration.getGenerator();
}
