import type {
  ApiDocMetadata,
  ApiResponseMetadata,
  ApiParameterMetadata,
  ApiBodyMetadata,
  Schema,
  SecurityRequirement,
  Header,
} from "../types/swagger.type";

const API_METADATA = new WeakMap<Function, Map<string, ApiDocMetadata>>();
const API_RESPONSES = new WeakMap<Function, Map<string, ApiResponseMetadata[]>>();
const API_PARAMETERS = new WeakMap<Function, Map<string, ApiParameterMetadata[]>>();
const API_BODY = new WeakMap<Function, Map<string, ApiBodyMetadata>>();
const API_TAGS = new WeakMap<Function, string[]>();

/**
 * Decorator to document an endpoint
 */
export function ApiDoc(metadata: Omit<ApiDocMetadata, "method" | "path">): MethodDecorator {
  return (target, propertyKey) => {
    const ctor =
      typeof target === "function" ? (target as Function) : (target as any).constructor;
    let map = API_METADATA.get(ctor);
    if (!map) {
      map = new Map<string, ApiDocMetadata>();
      API_METADATA.set(ctor, map);
    }
    map.set(String(propertyKey), metadata);
  };
}

/**
 * Decorator to document a response
 */
export function ApiResponse(
  statusCode: number,
  description: string,
  options?: {
    type?: any;
    examples?: Record<string, any>;
    headers?: Record<string, Header>;
  }
): MethodDecorator {
  return (target, propertyKey) => {
    const ctor =
      typeof target === "function" ? (target as Function) : (target as any).constructor;
    let map = API_RESPONSES.get(ctor);
    if (!map) {
      map = new Map<string, ApiResponseMetadata[]>();
      API_RESPONSES.set(ctor, map);
    }

    const key = String(propertyKey);
    const responses = map.get(key) ?? [];
    responses.push({
      statusCode,
      description,
      type: options?.type,
      examples: options?.examples,
      headers: options?.headers,
    });
    map.set(key, responses);
  };
}

/**
 * Decorator to document a parameter
 */
export function ApiParameter(
  name: string,
  paramIn: "query" | "header" | "path" | "cookie",
  options?: {
    description?: string;
    required?: boolean;
    type?: any;
    example?: any;
    schema?: Schema;
  }
): MethodDecorator {
  return (target, propertyKey) => {
    const ctor =
      typeof target === "function" ? (target as Function) : (target as any).constructor;
    let map = API_PARAMETERS.get(ctor);
    if (!map) {
      map = new Map<string, ApiParameterMetadata[]>();
      API_PARAMETERS.set(ctor, map);
    }

    const key = String(propertyKey);
    const params = map.get(key) ?? [];
    params.push({
      name,
      in: paramIn,
      description: options?.description,
      required: options?.required,
      type: options?.type,
      example: options?.example,
      schema: options?.schema,
    });
    map.set(key, params);
  };
}

/**
 * Decorator to document a request body
 */
export function ApiBody(
  description: string,
  options?: {
    type?: any;
    required?: boolean;
    examples?: Record<string, any>;
  }
): MethodDecorator {
  return (target, propertyKey) => {
    const ctor =
      typeof target === "function" ? (target as Function) : (target as any).constructor;
    let map = API_BODY.get(ctor);
    if (!map) {
      map = new Map<string, ApiBodyMetadata>();
      API_BODY.set(ctor, map);
    }

    map.set(String(propertyKey), {
      description,
      type: options?.type,
      required: options?.required,
      examples: options?.examples,
    });
  };
}

/**
 * Decorator to add tags to a controller
 */
export function ApiTags(...tags: string[]): ClassDecorator {
  return (target) => {
    API_TAGS.set(target as Function, tags);
  };
}

/**
 * Decorator to mark an endpoint as deprecated
 */
export function ApiDeprecated(): MethodDecorator {
  return (target, propertyKey) => {
    const ctor =
      typeof target === "function" ? (target as Function) : (target as any).constructor;
    let map = API_METADATA.get(ctor);
    if (!map) {
      map = new Map<string, ApiDocMetadata>();
      API_METADATA.set(ctor, map);
    }

    const key = String(propertyKey);
    const existing = map.get(key) ?? {};
    map.set(key, { ...existing, deprecated: true });
  };
}

/**
 * Decorator to add security requirements
 */
export function ApiSecurity(...requirements: SecurityRequirement[]): MethodDecorator {
  return (target, propertyKey) => {
    const ctor =
      typeof target === "function" ? (target as Function) : (target as any).constructor;
    let map = API_METADATA.get(ctor);
    if (!map) {
      map = new Map<string, ApiDocMetadata>();
      API_METADATA.set(ctor, map);
    }

    const key = String(propertyKey);
    const existing = map.get(key) ?? {};
    map.set(key, { ...existing, security: requirements });
  };
}

/**
 * Helper to get all swagger metadata
 */
export function getSwaggerMetadata(target: Function) {
  return {
    metadata: API_METADATA.get(target),
    responses: API_RESPONSES.get(target),
    parameters: API_PARAMETERS.get(target),
    body: API_BODY.get(target),
    tags: API_TAGS.get(target),
  };
}
