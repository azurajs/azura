import type {
  ApiDocMetadata,
  ApiResponseMetadata,
  ApiParameterMetadata,
  ApiBodyMetadata,
  Schema,
  SecurityRequirement,
  Header,
} from "../types/swagger.type";

const AZURA_SWAGGER = {
  META: "__azura_api_metadata__",
  RESP: "__azura_api_responses__",
  PARAMS: "__azura_api_parameters__",
  BODY: "__azura_api_body__",
  TAGS: "__azura_api_tags__",
};

export function ApiDoc(metadata: Omit<ApiDocMetadata, "method" | "path">): MethodDecorator {
  return (target, propertyKey) => {
    const ctor = (typeof target === "function" ? target : (target as any).constructor) as any;
    if (!ctor[AZURA_SWAGGER.META]) ctor[AZURA_SWAGGER.META] = new Map<string, ApiDocMetadata>();
    ctor[AZURA_SWAGGER.META].set(String(propertyKey), metadata);
  };
}

export function ApiResponse(
  statusCode: number,
  description: string,
  options?: {
    type?: any;
    examples?: Record<string, any>;
    headers?: Record<string, Header>;
  },
): MethodDecorator {
  return (target, propertyKey) => {
    const ctor = (typeof target === "function" ? target : (target as any).constructor) as any;
    if (!ctor[AZURA_SWAGGER.RESP])
      ctor[AZURA_SWAGGER.RESP] = new Map<string, ApiResponseMetadata[]>();
    const key = String(propertyKey);
    const responses = ctor[AZURA_SWAGGER.RESP].get(key) ?? [];
    responses.push({
      statusCode,
      description,
      type: options?.type,
      examples: options?.examples,
      headers: options?.headers,
    });
    ctor[AZURA_SWAGGER.RESP].set(key, responses);
  };
}

export function ApiParameter(
  name: string,
  paramIn: "query" | "header" | "path" | "cookie",
  options?: {
    description?: string;
    required?: boolean;
    type?: any;
    example?: any;
    schema?: Schema;
  },
): MethodDecorator {
  return (target, propertyKey) => {
    const ctor = (typeof target === "function" ? target : (target as any).constructor) as any;
    if (!ctor[AZURA_SWAGGER.PARAMS])
      ctor[AZURA_SWAGGER.PARAMS] = new Map<string, ApiParameterMetadata[]>();
    const key = String(propertyKey);
    const params = ctor[AZURA_SWAGGER.PARAMS].get(key) ?? [];
    params.push({
      name,
      in: paramIn,
      description: options?.description,
      required: options?.required,
      type: options?.type,
      example: options?.example,
      schema: options?.schema,
    });
    ctor[AZURA_SWAGGER.PARAMS].set(key, params);
  };
}

export function ApiBody(
  description: string,
  options?: {
    type?: any;
    required?: boolean;
    examples?: Record<string, any>;
  },
): MethodDecorator {
  return (target, propertyKey) => {
    const ctor = (typeof target === "function" ? target : (target as any).constructor) as any;
    if (!ctor[AZURA_SWAGGER.BODY]) ctor[AZURA_SWAGGER.BODY] = new Map<string, ApiBodyMetadata>();
    ctor[AZURA_SWAGGER.BODY].set(String(propertyKey), {
      description,
      type: options?.type,
      required: options?.required,
      examples: options?.examples,
    });
  };
}

export function ApiTags(...tags: string[]): ClassDecorator {
  return (target) => {
    (target as any)[AZURA_SWAGGER.TAGS] = tags;
  };
}

export function ApiDeprecated(): MethodDecorator {
  return (target, propertyKey) => {
    const ctor = (typeof target === "function" ? target : (target as any).constructor) as any;
    if (!ctor[AZURA_SWAGGER.META]) ctor[AZURA_SWAGGER.META] = new Map<string, ApiDocMetadata>();
    const key = String(propertyKey);
    const existing = ctor[AZURA_SWAGGER.META].get(key) ?? {};
    ctor[AZURA_SWAGGER.META].set(key, { ...existing, deprecated: true });
  };
}

export function ApiSecurity(...requirements: SecurityRequirement[]): MethodDecorator {
  return (target, propertyKey) => {
    const ctor = (typeof target === "function" ? target : (target as any).constructor) as any;
    if (!ctor[AZURA_SWAGGER.META]) ctor[AZURA_SWAGGER.META] = new Map<string, ApiDocMetadata>();
    const key = String(propertyKey);
    const existing = ctor[AZURA_SWAGGER.META].get(key) ?? {};
    ctor[AZURA_SWAGGER.META].set(key, { ...existing, security: requirements });
  };
}

export function getSwaggerMetadata(target: Function) {
  const ctor = target as any;
  return {
    metadata: ctor[AZURA_SWAGGER.META] ?? new Map<string, ApiDocMetadata>(),
    responses: ctor[AZURA_SWAGGER.RESP] ?? new Map<string, ApiResponseMetadata[]>(),
    parameters: ctor[AZURA_SWAGGER.PARAMS] ?? new Map<string, ApiParameterMetadata[]>(),
    body: ctor[AZURA_SWAGGER.BODY] ?? new Map<string, ApiBodyMetadata>(),
    tags: ctor[AZURA_SWAGGER.TAGS] ?? [],
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
  }>;
  requestBody?: {
    description?: string;
    required?: boolean;
    content?: any;
    example?: any;
  };
  responses?: Record<
    number,
    {
      description: string;
      example?: any;
      schema?: Schema;
      headers?: Record<string, Header>;
    }
  >;
}): MethodDecorator {
  return (target, propertyKey) => {
    const ctor = (typeof target === "function" ? target : (target as any).constructor) as any;
    if (!ctor[AZURA_SWAGGER.META]) ctor[AZURA_SWAGGER.META] = new Map<string, ApiDocMetadata>();
    const key = String(propertyKey);
    const existingMeta = ctor[AZURA_SWAGGER.META].get(key) ?? {};
    const newMeta: ApiDocMetadata = {
      summary: config.summary ?? existingMeta.summary,
      description: config.description ?? existingMeta.description,
      operationId: config.operationId ?? existingMeta.operationId,
      deprecated: config.deprecated ?? existingMeta.deprecated,
      security: config.security ?? existingMeta.security,
      tags: config.tags ?? existingMeta.tags,
    };
    ctor[AZURA_SWAGGER.META].set(key, newMeta);
    if (config.parameters && config.parameters.length > 0) {
      if (!ctor[AZURA_SWAGGER.PARAMS])
        ctor[AZURA_SWAGGER.PARAMS] = new Map<string, ApiParameterMetadata[]>();
      const existingParams = ctor[AZURA_SWAGGER.PARAMS].get(key) ?? [];
      const newParams = config.parameters.map((p) => ({
        name: p.name,
        in: p.in,
        description: p.description,
        required: p.required,
        schema: p.schema,
        example: p.example,
      }));
      ctor[AZURA_SWAGGER.PARAMS].set(key, [...existingParams, ...newParams]);
    }
    if (config.requestBody) {
      if (!ctor[AZURA_SWAGGER.BODY]) ctor[AZURA_SWAGGER.BODY] = new Map<string, ApiBodyMetadata>();
      ctor[AZURA_SWAGGER.BODY].set(key, {
        description: config.requestBody.description,
        required: config.requestBody.required,
        type: config.requestBody.content,
        examples: config.requestBody.example ? { default: config.requestBody.example } : undefined,
      });
    }
    if (config.responses) {
      if (!ctor[AZURA_SWAGGER.RESP])
        ctor[AZURA_SWAGGER.RESP] = new Map<string, ApiResponseMetadata[]>();
      const existing = ctor[AZURA_SWAGGER.RESP].get(key) ?? [];
      const responses = Object.entries(config.responses).map(([code, resp]) => ({
        statusCode: Number(code),
        description: resp.description,
        type: resp.schema,
        examples: resp.example ? { default: resp.example } : undefined,
        headers: resp.headers,
      }));
      ctor[AZURA_SWAGGER.RESP].set(key, [...existing, ...responses]);
    }
  };
}
