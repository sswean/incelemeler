import { z } from 'zod';
import { endpoints } from './endpoints.js';
import { Problem } from './problem.js';

type JsonObject = Record<string, unknown>;

function toSchema(schema: z.ZodType, io: 'input' | 'output' = 'output'): JsonObject {
  return z.toJSONSchema(schema, {
    target: 'openapi-3.0',
    io,
    unrepresentable: 'any',
  }) as JsonObject;
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
  };
}
