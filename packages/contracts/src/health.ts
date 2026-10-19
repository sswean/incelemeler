import { z } from 'zod';

export const HealthStatus = z
  .object({
    status: z.enum(['ok', 'degraded']),
    database: z.enum(['up', 'down']),
    version: z.string(),
    time: z.iso.datetime(),
  })
  .meta({ id: 'HealthStatus' });
export type HealthStatus = z.infer<typeof HealthStatus>;
