import 'reflect-metadata';
import { RequestMethod, type ExecutionContext } from '@nestjs/common';
import { METHOD_METADATA, PATH_METADATA } from '@nestjs/common/constants.js';
import { Reflector } from '@nestjs/core';
import { describe, expect, it } from 'vitest';
import { endpoints } from '@incelemeler/contracts';
import { CONTROLLERS } from '../../app.module.js';
import { AUTH_KEY, type AuthRequirement, PUBLIC_KEY } from './auth.context.js';
import { AuthGuard } from './auth.guard.js';
import type { AuthService } from './auth.service.js';

type Route = { method: string; path: string; auth?: AuthRequirement; isPublic: boolean };

function join(...parts: string[]): string {
  const p = parts
    .flatMap((x) => x.split('/'))
    .filter(Boolean)
    .map((seg) => (seg.startsWith(':') ? `{${seg.slice(1)}}` : seg))
    .join('/');
  return `/${p}`;
}

function routes(): Route[] {
  const out: Route[] = [];
  for (const ctrl of CONTROLLERS) {
    const base = Reflect.getMetadata(PATH_METADATA, ctrl) as string;
    for (const name of Object.getOwnPropertyNames(ctrl.prototype)) {
      if (name === 'constructor') continue;
      const handler = (ctrl.prototype as unknown as Record<string, object>)[name]!;
      const sub = Reflect.getMetadata(PATH_METADATA, handler) as string | undefined;
      const method = Reflect.getMetadata(METHOD_METADATA, handler) as RequestMethod | undefined;
      if (sub === undefined || method === undefined) continue;
      out.push({
        method: RequestMethod[method].toLowerCase(),
        path: join(base, sub),
        auth: Reflect.getMetadata(AUTH_KEY, handler) as AuthRequirement | undefined,
        isPublic: Reflect.getMetadata(PUBLIC_KEY, handler) === true,
      });
    }
  }
  return out;
}

describe('rota güvenliği (varsayılan reddet)', () => {
  const all = routes();

  it('[REQ-GUV-001] her rota ya @Public ya da @RequireAuth taşır (ikisi birden değil)', () => {
    expect(all.length).toBeGreaterThan(10);
    for (const r of all) {
      expect(Boolean(r.auth) !== r.isPublic, `${r.method} ${r.path}`).toBe(true);
    }
  });

  it('[REQ-GUV-001] sözleşmedeki (OpenAPI) yetki düzeyi denetleyiciyle birebir aynı', () => {
    const byKey = new Map(all.map((r) => [`${r.method} ${r.path}`, r]));
    for (const ep of endpoints) {
      const r = byKey.get(`${ep.method} ${ep.path}`);
      expect(r, `${ep.method} ${ep.path} denetleyicide yok`).toBeDefined();
      expect(r!.auth?.level, `${ep.method} ${ep.path}`).toBe(ep.auth);
    }
    expect(all.length).toBe(endpoints.length);
  });

  it('[REQ-GUV-001] işaretsiz rota 403 FORBIDDEN ile reddedilir', async () => {
    const guard = new AuthGuard(new Reflector(), {} as AuthService);
    class Unmarked {
      handler() {}
    }
    const ctx = {
      getHandler: () => Unmarked.prototype.handler,
      getClass: () => Unmarked,
      switchToHttp: () => ({ getRequest: () => ({ headers: {} }) }),
    } as unknown as ExecutionContext;
    await expect(guard.canActivate(ctx)).rejects.toMatchObject({ status: 403 });
  });
});
