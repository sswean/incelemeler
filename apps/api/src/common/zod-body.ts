import { HttpStatus } from '@nestjs/common';
import type { z } from 'zod';
import { ProblemException } from './problem.js';

/** İstek gövdesini şemaya göre doğrular; geçersizse 422 (REQ-MIM-010, REQ-GUV-002). */
export function parseBody<T extends z.ZodType>(schema: T, body: unknown): z.infer<T> {
  const parsed = schema.safeParse(body ?? {});
  if (!parsed.success) {
    throw new ProblemException(
      HttpStatus.UNPROCESSABLE_ENTITY,
      'VALIDATION_FAILED',
      'İstek doğrulanamadı',
      undefined,
      parsed.error.issues.map((i) => ({
        pointer: `/body/${i.path.join('/')}`,
        code: i.code.toUpperCase(),
        message: i.message,
      })),
    );
  }
  return parsed.data;
}
