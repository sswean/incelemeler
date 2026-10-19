import type { Request } from 'express';
import { ipPrefix } from '../modules/identity/crypto.js';
import { traceIdOf } from './trace.js';

export interface RequestMeta {
  ip: string;
  ipPrefix: string | null;
  userAgent: string | null;
  traceId: string;
}

export function requestMeta(req: Request): RequestMeta {
  const ip = req.ip ?? 'unknown';
  const ua = req.headers['user-agent'];
  return {
    ip,
    ipPrefix: ipPrefix(req.ip),
    userAgent: typeof ua === 'string' ? ua.slice(0, 200) : null,
    traceId: traceIdOf(req),
  };
}
