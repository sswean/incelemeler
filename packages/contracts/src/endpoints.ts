import { z } from 'zod';
import { HealthStatus } from './health.js';
import { CategoryList, CategoryListQuery } from './taxonomy.js';

export interface EndpointDef {
  method: 'get' | 'post' | 'put' | 'patch' | 'delete';
  path: string;
  operationId: string;
  summary: string;
  tags: string[];
  query?: z.ZodObject;
  body?: z.ZodType;
  responses: Record<number, { description: string; schema?: z.ZodType }>;
}

/**
 * API sözleşmesinin tek kaynağı (REQ-MIM-006). OpenAPI belgesi bu listeden üretilir;
 * NestJS denetleyicileri aynı şemalarla doğrulama yapar.
 */
export const endpoints: EndpointDef[] = [
  {
    method: 'get',
    path: '/v1/health',
    operationId: 'getHealth',
    summary: 'Servis ve veritabanı sağlık durumu',
    tags: ['platform'],
    responses: {
      200: { description: 'Sağlıklı', schema: HealthStatus },
      503: { description: 'Veritabanına erişilemiyor', schema: HealthStatus },
    },
  },
  {
    method: 'get',
    path: '/v1/categories',
    operationId: 'listCategories',
    summary: 'Yayındaki kategorileri listeler (cursor sayfalama)',
    tags: ['taxonomy'],
    query: CategoryListQuery,
    responses: {
      200: { description: 'Kategori listesi', schema: CategoryList },
    },
  },
];
