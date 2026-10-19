import type { ArgumentsHost } from '@nestjs/common';
import { ForbiddenException, Logger } from '@nestjs/common';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ProblemFilter } from './problem.filter.js';

function host() {
  const res = {
    statusCode: 0,
    contentType: '',
    body: undefined as unknown,
    headers: {} as Record<string, string>,
    setHeader(k: string, v: string) {
      this.headers[k] = v;
    },
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    type(t: string) {
      this.contentType = t;
      return this;
    },
    json(b: unknown) {
      this.body = b;
      return this;
    },
  };
  const req = { path: '/v1/ornek', method: 'POST', headers: {}, traceId: 'a'.repeat(32) };
  const h = {
    switchToHttp: () => ({ getRequest: () => req, getResponse: () => res }),
  } as unknown as ArgumentsHost;
  return { h, res };
}

afterEach(() => vi.restoreAllMocks());

describe('hata yanıtları', () => {
  it('[REQ-GUV-015] [REQ-MIM-010] beklenmeyen hata genel 500 problem döner; ileti, SQL ve yığın izi sızmaz', () => {
    vi.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    const { h, res } = host();
    const err = new Error('relation "users" does not exist: SELECT password_hash FROM users');
    new ProblemFilter().catch(err, h);
    expect(res.statusCode).toBe(500);
    expect(res.contentType).toBe('application/problem+json');
    expect(res.body).toMatchObject({ status: 500, code: 'INTERNAL_ERROR', instance: '/v1/ornek' });
    const text = JSON.stringify(res.body);
    expect(text).not.toMatch(/relation|SELECT|password|at .*\.ts|stack/);
  });

  it('[REQ-GUV-014] yetki reddi ayrı güvenlik olayı olarak loglanır', () => {
    const warn = vi.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
    const { h, res } = host();
    new ProblemFilter().catch(new ForbiddenException(), h);
    expect(res.statusCode).toBe(403);
    expect(warn).toHaveBeenCalledWith(
      expect.objectContaining({ event: 'security.access_denied', path: '/v1/ornek' }),
    );
  });
});
