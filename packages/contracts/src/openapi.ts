import { z } from 'zod';
import { endpoints } from './endpoints.js';
import { Problem } from './problem.js';

type JsonObject = Record<string, unknown>;

const REF_PREFIX = '#/components/schemas/';

/** Kimlikli (meta id) şemalar components/schemas altına konur ve $ref ile kullanılır. */
function toSchema(schema: z.ZodType, io: 'input' | 'output' = 'output'): JsonObject {
  const id = z.globalRegistry.get(schema)?.id;
  if (id && io === 'output') return { $ref: REF_PREFIX + id };
  return z.toJSONSchema(schema, {
    target: 'openapi-3.0',
    io,
    unrepresentable: 'any',
  }) as JsonObject;
}

function buildComponents(): JsonObject {
  const all = z.toJSONSchema(z.globalRegistry, {
    target: 'openapi-3.0',
    unrepresentable: 'any',
    uri: (refId) => REF_PREFIX + refId,
  }) as { schemas: Record<string, JsonObject> };
  const schemas: JsonObject = {};
  for (const [id, schema] of Object.entries(all.schemas)) {
    const { $id: _ignored, ...rest } = schema as JsonObject & { $id?: string };
    schemas[id] = rest;
  }
  return schemas;
}

/** OpenAPI 3.0 belgesini sözleşme listesinden üretir (REQ-MIM-006). */
export function buildOpenApiDocument(version: string): JsonObject {
  const paths: JsonObject = {};
  for (const ep of endpoints) {
    const parameters: JsonObject[] = [];
    if (ep.query) {
      for (const [name, field] of Object.entries(ep.query.shape)) {
        const fieldSchema = field as z.ZodType;
        parameters.push({
          name,
          in: 'query',
          required: !fieldSchema.safeParse(undefined).success,
          schema: toSchema(fieldSchema, 'input'),
        });
      }
    }
    const responses: JsonObject = {};
    for (const [status, res] of Object.entries(ep.responses)) {
      responses[status] = {
        description: res.description,
        ...(res.schema
          ? { content: { 'application/json': { schema: toSchema(res.schema) } } }
          : {}),
      };
    }
    responses['default'] = {
      description: 'Hata (RFC 9457)',
      content: { 'application/problem+json': { schema: toSchema(Problem) } },
    };
    const pathItem = (paths[ep.path] ?? {}) as JsonObject;
    pathItem[ep.method] = {
      operationId: ep.operationId,
      summary: ep.summary,
      tags: ep.tags,
      ...(parameters.length ? { parameters } : {}),
      ...(ep.body
        ? {
            requestBody: {
              required: true,
              content: { 'application/json': { schema: toSchema(ep.body, 'input') } },
            },
          }
        : {}),
      responses,
    };
    paths[ep.path] = pathItem;
  }
  return {
    openapi: '3.0.3',
    info: { title: 'İncelemeler API', version },
    servers: [{ url: '/' }],
    paths,
    components: { schemas: buildComponents() },
  };
}
