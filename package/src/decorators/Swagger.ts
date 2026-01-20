import type {
  ApiDocMetadata,
  ApiResponseMetadata,
  ApiParameterMetadata,
  ApiBodyMetadata,
  Schema,
  SecurityRequirement,
  Header,
} from "../types/swagger.type";

const KEY_META = Symbol.for("azura:swagger:meta");
const KEY_RESP = Symbol.for("azura:swagger:resp");
const KEY_PARAMS = Symbol.for("azura:swagger:params");
const KEY_BODY = Symbol.for("azura:swagger:body");
const KEY_TAGS = Symbol.for("azura:swagger:tags");

function getStorage<T>(target: any, key: symbol): Map<string, T> {
  const source = typeof target === "function" && target.prototype ? target.prototype : target;

  if (!source[key]) {
    Object.defineProperty(source, key, {
      value: new Map<string, T>(),
      enumerable: false,
      writable: true,
      configurable: true,
    });
  }
  return source[key];
}

export function getSwaggerMetadata(target: any) {
  if (!target) {
    return {
      metadata: new Map(),
      responses: new Map(),
      parameters: new Map(),
      body: new Map(),
      tags: [],
    };
  }

  const source = typeof target === "function" && target.prototype ? target.prototype : target;

  return {
    metadata: (source[KEY_META] as Map<string, ApiDocMetadata>) ?? new Map(),
    responses: (source[KEY_RESP] as Map<string, ApiResponseMetadata[]>) ?? new Map(),
    parameters: (source[KEY_PARAMS] as Map<string, ApiParameterMetadata[]>) ?? new Map(),
    body: (source[KEY_BODY] as Map<string, ApiBodyMetadata>) ?? new Map(),
    tags: (source[KEY_TAGS] as string[]) ?? [],
  };
}

export function Swagger(config: {
  summary?: string;
  description?: string;
  tags?: string[];
  operationId?: string;
  deprecated?: boolean;
  security?: SecurityRequirement[];
  parameters?: Array<{
    name: string;
    in: "query" | "header" | "path" | "cookie";
    description?: string;
    required?: boolean;
    schema?: Schema;
    example?: any;
    type?: any;
  }>;
  requestBody?: {
    description?: string;
    required?: boolean;
    content?: any;
    example?: any;
    schema?: Schema;
  };
  responses?: Record<
    number,
    {
      description: string;
      example?: any;
      schema?: Schema;
      headers?: Record<string, Header>;
      type?: any;
    }
  >;
}): MethodDecorator {
  return (target, propertyKey) => {
    const key = String(propertyKey);

    const metaMap = getStorage<ApiDocMetadata>(target, KEY_META);
    const existingMeta = metaMap.get(key) ?? {};
    metaMap.set(key, {
      ...existingMeta,
      summary: config.summary ?? existingMeta.summary,
      description: config.description ?? existingMeta.description,
      operationId: config.operationId ?? existingMeta.operationId,
      deprecated: config.deprecated ?? existingMeta.deprecated,
      security: config.security ?? existingMeta.security,
      tags: config.tags ?? existingMeta.tags,
    });

    if (config.parameters) {
      const paramMap = getStorage<ApiParameterMetadata[]>(target, KEY_PARAMS);
      const currentParams = paramMap.get(key) ?? [];
      const newParams = config.parameters.map((p) => ({
        name: p.name,
        in: p.in,
        description: p.description,
        required: p.required,
        schema: p.schema,
        example: p.example,
        type: p.type,
      }));
      paramMap.set(key, [...currentParams, ...newParams]);
    }

    if (config.requestBody) {
      const bodyMap = getStorage<ApiBodyMetadata>(target, KEY_BODY);
      bodyMap.set(key, {
        description: config.requestBody.description,
        required: config.requestBody.required,
        type: config.requestBody.content,
        examples: config.requestBody.example
          ? { default: { value: config.requestBody.example } }
          : undefined,
      });
    }

    if (config.responses) {
      const respMap = getStorage<ApiResponseMetadata[]>(target, KEY_RESP);
      const currentResponses = respMap.get(key) ?? [];
      const newResponses = Object.entries(config.responses).map(([code, resp]) => ({
        statusCode: Number(code),
        description: resp.description,
        type: resp.type ?? resp.schema,
        examples: resp.example ? { default: { value: resp.example } } : undefined,
        headers: resp.headers,
      }));
      respMap.set(key, [...currentResponses, ...newResponses]);
    }
  };
}

export function ApiTags(...tags: string[]): ClassDecorator {
  return (target) => {
    const source = target.prototype || target;
    Object.defineProperty(source, KEY_TAGS, {
      value: tags,
      enumerable: false,
      writable: true,
      configurable: true,
    });
  };
}

export function ApiDoc(metadata: Omit<ApiDocMetadata, "method" | "path">): MethodDecorator {
  return (target, propertyKey) => {
    const metaMap = getStorage<ApiDocMetadata>(target, KEY_META);
    metaMap.set(String(propertyKey), metadata);
  };
}

export function ApiResponse(
  statusCode: number,
  description: string,
  options?: any,
): MethodDecorator {
  return (target, propertyKey) => {
    const respMap = getStorage<ApiResponseMetadata[]>(target, KEY_RESP);
    const key = String(propertyKey);
    const responses = respMap.get(key) ?? [];
    responses.push({ statusCode, description, ...options });
    respMap.set(key, responses);
  };
}

export function ApiParameter(name: string, paramIn: any, options?: any): MethodDecorator {
  return (target, propertyKey) => {
    const paramMap = getStorage<ApiParameterMetadata[]>(target, KEY_PARAMS);
    const key = String(propertyKey);
    const params = paramMap.get(key) ?? [];
    params.push({ name, in: paramIn, ...options });
    paramMap.set(key, params);
  };
}

export function ApiBody(description: string, options?: any): MethodDecorator {
  return (target, propertyKey) => {
    const bodyMap = getStorage<ApiBodyMetadata>(target, KEY_BODY);
    bodyMap.set(String(propertyKey), { description, ...options });
  };
}

export function ApiDeprecated(): MethodDecorator {
  return (target, propertyKey) => {
    const metaMap = getStorage<ApiDocMetadata>(target, KEY_META);
    const key = String(propertyKey);
    const existing = metaMap.get(key) ?? {};
    metaMap.set(key, { ...existing, deprecated: true });
  };
}

export function ApiSecurity(...requirements: SecurityRequirement[]): MethodDecorator {
  return (target, propertyKey) => {
    const metaMap = getStorage<ApiDocMetadata>(target, KEY_META);
    const key = String(propertyKey);
    const existing = metaMap.get(key) ?? {};
    metaMap.set(key, { ...existing, security: requirements });
  };
}
