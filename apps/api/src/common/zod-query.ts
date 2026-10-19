import { HttpStatus } from '@nestjs/common';
import type { z } from 'zod';
import { ProblemException } from './problem.js';

/**
 * Sorgu parametrelerini beyaz listeye göre doğrular (REQ-MIM-009):
 * bilinmeyen parametre 400, geçersiz değer 422.
 */
export function parseQuery<T extends z.ZodObject>(schema: T, query: unknown): z.infer<T> {
  const input = (query ?? {}) as Record<string, unknown>;
  const allowed = new Set(Object.keys(schema.shape));
  const unknown = Object.keys(input).filter((k) => !allowed.has(k));
  if (unknown.length) {
    throw new ProblemException(
      HttpStatus.BAD_REQUEST,
      'VALIDATION_FAILED',
      'Bilinmeyen sorgu parametresi',
      undefined,
      unknown.map((k) => ({ pointer: `/query/${k}`, code: 'UNKNOWN_PARAMETER', message: k })),
    );
  }
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    throw new ProblemException(
      HttpStatus.UNPROCESSABLE_ENTITY,
      'VALIDATION_FAILED',
      'İstek doğrulanamadı',
      undefined,
      parsed.error.issues.map((i) => ({
        pointer: `/query/${i.path.join('/')}`,
        code: i.code.toUpperCase(),
        message: i.message,
      })),
    );
  }
  return parsed.data;
}
