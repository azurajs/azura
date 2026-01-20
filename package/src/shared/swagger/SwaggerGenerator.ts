import { getSwaggerMetadata } from "../../decorators/Swagger";

import type { RouteDefinition } from "../../types";
import type {
  OpenAPIDocument,
  Operation,
  PathItem,
  Parameter,
  Response,
  Schema,
  MediaType,
  SwaggerConfig,
  RequestBody,
} from "../../types/swagger.type";

export class SwaggerGenerator {
  private config: Required<SwaggerConfig>;
  private document: OpenAPIDocument;

  constructor(config?: SwaggerConfig) {
    this.config = {
      enabled: config?.enabled ?? true,
      path: config?.path ?? "/docs",
      title: config?.title ?? "AzuraJS API",
      description: config?.description ?? "API documentation powered by AzuraJS",
      version: config?.version ?? "1.0.0",
      servers: config?.servers ?? [{ url: "http://localhost:3000" }],
      security: config?.security ?? [],
      tags: config?.tags ?? [],
      contact: config?.contact ?? {},
      license: config?.license ?? { name: "MIT" },
    };
    this.document = {
      openapi: "3.0.3",
      info: {
        title: this.config.title,
        description: this.config.description,
        version: this.config.version,
        contact: this.config.contact,
        license: this.config.license,
      },
      servers: this.config.servers,
      paths: {},
      components: {
        schemas: {},
        responses: {},
        parameters: {},
        securitySchemes: {},
      },
      tags: this.config.tags,
      security: this.config.security,
    };
  }

  public addController(ControllerClass: Function, routes: RouteDefinition[], prefix = ""): void {
    const metadata = getSwaggerMetadata(ControllerClass);
    const controllerTags = metadata.tags ?? [];

    for (const route of routes) {
      const fullPath = this.normalizePath(prefix + route.path);
      const method = route.method.toLowerCase() as keyof PathItem;

      if (!this.document.paths[fullPath]) {
        this.document.paths[fullPath] = {};
      }

      const propertyKey = String(route.propertyKey);

      const methodMetadata = metadata.metadata.get(propertyKey);
      const responses = metadata.responses.get(propertyKey) ?? [];
      const parameters = metadata.parameters.get(propertyKey) ?? [];
      const body = metadata.body.get(propertyKey);

      const operation: Operation = {
        summary: methodMetadata?.summary ?? route.description,
        description: methodMetadata?.description,
        tags: methodMetadata?.tags ?? controllerTags,
        operationId:
          methodMetadata?.operationId ??
          `${route.method}_${fullPath.replace(/[^a-zA-Z0-9]/g, "_")}`,
        deprecated: methodMetadata?.deprecated,
        security: methodMetadata?.security,
        parameters: this.buildParameters(parameters, route),
        responses: this.buildResponses(responses),
      };

      if (body) {
        operation.requestBody = this.buildRequestBody(body);
      }

      (this.document.paths[fullPath] as any)[method] = operation;
    }
  }

  private buildParameters(parameters: Array<any>, route: RouteDefinition): Parameter[] {
    const params: Parameter[] = [];
    const pathParams = this.extractPathParams(route.path);

    for (const paramName of pathParams) {
      const existing = parameters.find((p) => p.name === paramName && p.in === "path");
      params.push({
        name: paramName,
        in: "path",
        required: true,
        description: existing?.description ?? `Path parameter ${paramName}`,
        schema: existing?.schema ?? this.typeToSchema(existing?.type) ?? { type: "string" },
        example: existing?.example,
      });
    }

    for (const param of parameters) {
      if (param.in === "path" && pathParams.includes(param.name)) continue;

      params.push({
        name: param.name,
        in: param.in,
        required: param.required ?? false,
        description: param.description,
        schema: param.schema ?? this.typeToSchema(param.type) ?? { type: "string" },
        example: param.example,
      });
    }
    return params;
  }

  private buildResponses(responses: Array<any>): { [key: string]: Response } {
    const result: { [key: string]: Response } = {};
    if (responses.length === 0) {
      result["200"] = {
        description: "Successful response",
        content: { "application/json": { schema: { type: "object" } } },
      };
    } else {
      for (const response of responses) {
        const content: Record<string, MediaType> = {};
        if (response.type || response.examples) {
          const schema =
            response.type && typeof response.type !== "object" && response.type !== null
              ? this.typeToSchema(response.type)
              : (response.type as Schema);
          content["application/json"] = {
            schema: schema ?? { type: "object" },
            examples: response.examples,
          };
        }
        result[String(response.statusCode)] = {
          description: response.description,
          content: Object.keys(content).length > 0 ? content : undefined,
          headers: response.headers,
        };
      }
    }
    return result;
  }

  private buildRequestBody(body: any): RequestBody {
    const schema =
      typeof body.type === "object" && body.type !== null
        ? body.type
        : (this.typeToSchema(body.type) ?? { type: "object" });
    return {
      description: body.description,
      required: body.required ?? false,
      content: { "application/json": { schema, examples: body.examples } },
    };
  }

  private typeToSchema(type: any): Schema | undefined {
    if (!type) return undefined;
    if (type === String || type === "string") return { type: "string" };
    if (type === Number || type === "number") return { type: "number" };
    if (type === Boolean || type === "boolean") return { type: "boolean" };
    if (Array.isArray(type))
      return {
        type: "array",
        items:
          type.length > 0 ? (this.typeToSchema(type[0]) ?? { type: "object" }) : { type: "object" },
      };
    if (typeof type === "function" && type !== Object) {
      try {
        const instance = new type();
        const properties: Record<string, Schema> = {};
        for (const key of Object.keys(instance)) properties[key] = this.inferSchema(instance[key]);
        return { type: "object", properties };
      } catch {
        return { type: "object" };
      }
    }
    if (typeof type === "object") return this.inferSchema(type);
    return { type: "object" };
  }

  private inferSchema(value: any): Schema {
    const type = typeof value;
    if (value === null) return { type: "string", nullable: true };
    if (type === "string") return { type: "string", example: value };
    if (type === "number") return { type: "number", example: value };
    if (type === "boolean") return { type: "boolean", example: value };
    if (Array.isArray(value))
      return {
        type: "array",
        items: value.length > 0 ? this.inferSchema(value[0]) : { type: "object" },
      };
    if (type === "object") {
      const properties: Record<string, Schema> = {};
      for (const key in value) properties[key] = this.inferSchema(value[key]);
      return { type: "object", properties };
    }
    return { type: "object" };
  }

  private extractPathParams(path: string): string[] {
    const matches = path.match(/:([a-zA-Z0-9_]+)/g);
    return matches ? matches.map((m) => m.slice(1)) : [];
  }

  private normalizePath(path: string): string {
    return path.replace(/:([a-zA-Z0-9_]+)/g, "{$1}");
  }

  public getConfig() {
    return this.config;
  }
  public getDocument() {
    return this.document;
  }
  public toJSON() {
    return JSON.stringify(this.document, null, 2);
  }
  public addSchema(name: string, schema: Schema) {
    if (!this.document.components) this.document.components = { schemas: {} };
    if (!this.document.components.schemas) this.document.components.schemas = {};
    this.document.components.schemas[name] = schema;
  }
  public addSecurityScheme(name: string, scheme: any) {
    if (!this.document.components) this.document.components = { securitySchemes: {} };
    if (!this.document.components.securitySchemes) this.document.components.securitySchemes = {};
    this.document.components.securitySchemes[name] = scheme;
  }
  public addRoute(config: any) {
    const fullPath = this.normalizePath(config.path);
    const method = config.method.toLowerCase();
    if (!this.document.paths[fullPath]) this.document.paths[fullPath] = {};
    (this.document.paths[fullPath] as any)[method] = {
      summary: config.summary,
      description: config.description,
      tags: config.tags,
      operationId: config.operationId,
      parameters: config.parameters,
      responses: config.responses || { 200: { description: "OK" } },
      requestBody: config.requestBody,
    };
  }

  public static createResponse = (desc: string, schema?: any, ex?: any) => ({
    description: desc,
    content: schema
      ? { "application/json": { schema, examples: ex ? { default: { value: ex } } : undefined } }
      : undefined,
  });
  public static createRequestBody = (schema: any, desc?: string, req = true) => ({
    description: desc,
    required: req,
    content: { "application/json": { schema } },
  });
  public static createParameter = (name: string, loc: any, schema: any, opts?: any) => ({
    name,
    in: loc,
    schema,
    ...opts,
  });
  public static createSchema = (props: any, req?: any) => ({
    type: "object",
    properties: props,
    required: req,
  });
}
