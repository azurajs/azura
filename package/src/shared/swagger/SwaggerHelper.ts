import type { AzuraClient } from "../../infra/Server";
import type { SwaggerConfig } from "../../types/swagger.type";
import { SwaggerIntegration } from "./index";
import { SwaggerGenerator } from "./SwaggerGenerator";
import { getControllerMetadata, applyDecorators } from "../../decorators/Route";

/**
 * Setup Swagger with automatic controller registration
 * This is the SIMPLEST way to use Swagger in AzuraJS - just pass your controllers!
 * 
 * @example
 * ```typescript
 * import { AzuraClient } from "azurajs";
 * import { setupSwaggerWithControllers } from "azurajs";
 * 
 * const app = new AzuraClient();
 * 
 * setupSwaggerWithControllers(app, {
 *   title: "My API",
 *   version: "1.0.0",
 *   description: "Simple and beautiful API docs"
 * }, [UserController, ProductController]);
 * 
 * app.listen(3000);
 * // That's it! Visit http://localhost:3000/docs
 * ```
 */
export function setupSwaggerWithControllers(
  app: AzuraClient,
  config: SwaggerConfig,
  controllers: Array<new () => any>
): SwaggerGenerator {
  // Setup Swagger first
  const integration = new SwaggerIntegration(app, config);
  integration.setup();
  const swaggerGen = integration.getGenerator();

  // Register all controllers - both routes and swagger
  applyDecorators(app, controllers);
  
  // Add controllers to Swagger
  controllers.forEach((ControllerClass) => {
    const metadata = getControllerMetadata(ControllerClass);
    
    if (metadata.routes.length > 0) {
      const instance = new ControllerClass();
      swaggerGen.addController(instance, metadata.routes, metadata.prefix);
    }
  });

  return swaggerGen;
}
