/**
 * AzuraJS Swagger/OpenAPI Integration
 * Import from "azurajs/swagger" to use Swagger documentation
 */

// Main Swagger exports
export { setupSwagger, SwaggerIntegration } from "./shared/swagger";
export { SwaggerGenerator } from "./shared/swagger/SwaggerGenerator";
export { setupSwaggerWithControllers } from "./shared/swagger/SwaggerHelper";

// Swagger decorators
export {
  ApiDoc,
  ApiResponse,
  ApiParameter,
  ApiBody,
  ApiTags,
  ApiDeprecated,
  ApiSecurity,
  getSwaggerMetadata,
} from "./decorators/Swagger";

// Swagger types
export type * from "./types/swagger.type";
