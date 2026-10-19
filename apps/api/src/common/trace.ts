import { randomUUID } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';

const KEY = Symbol('traceId');
type WithTrace = Request & { [KEY]?: string };

/** Her isteğe bir izleme kimliği verir ve `X-Trace-Id` başlığıyla döner. */
export function traceMiddleware(req: Request, res: Response, next: NextFunction): void {
  const id = randomUUID().replace(/-/g, '');
  (req as WithTrace)[KEY] = id;
  res.setHeader('X-Trace-Id', id);
  next();
}

export function traceIdOf(req: Request): string {
  return (req as WithTrace)[KEY] ?? 'unknown';
}
