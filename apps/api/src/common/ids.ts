import { HttpStatus } from '@nestjs/common';
import { z } from 'zod';
import { ProblemException } from './problem.js';

const uuid = z.uuid();

/** Yol parametresindeki kimlik; biçimsiz kimlik var olmayan kaynakla aynı yanıtı alır (404). */
export function parseId(id: string): string {
  const r = uuid.safeParse(id);
  if (!r.success) throw new ProblemException(HttpStatus.NOT_FOUND, 'NOT_FOUND', 'Bulunamadı');
  return r.data;
}
