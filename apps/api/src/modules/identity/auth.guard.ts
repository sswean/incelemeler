import { CanActivate, ExecutionContext, HttpStatus, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { ProblemException } from '../../common/problem.js';
import { can } from '../access/permissions.js';
import { AUTH_KEY, type AuthRequirement, PUBLIC_KEY, setAuth } from './auth.context.js';
import { AuthService, STEP_UP_WINDOW_MS } from './auth.service.js';

/**
 * Varsayılan reddet (REQ-GUV-001): her rota ya `@Public()` ya da `@RequireAuth(...)` taşır; ikisini de
 * taşımayan rota 403 döner. Panel rotaları (`staff-mfa`) 2FA doğrulanmış personel oturumu ister (REQ-HSP-007).
 */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly auth: AuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const targets = [context.getHandler(), context.getClass()];
    const requirement = this.reflector.getAllAndOverride<AuthRequirement | undefined>(
      AUTH_KEY,
      targets,
    );
    if (!requirement) {
      if (this.reflector.getAllAndOverride<boolean | undefined>(PUBLIC_KEY, targets)) return true;
      throw new ProblemException(HttpStatus.FORBIDDEN, 'FORBIDDEN', 'Bu işlem için yetkin yok');
    }

    const req = context.switchToHttp().getRequest<Request>();
    const header = req.headers.authorization;
    const token = header?.startsWith('Bearer ') ? header.slice(7).trim() : null;
    const ctx = token ? await this.auth.resolveSession(token) : null;
    if (!ctx) {
      throw new ProblemException(
        HttpStatus.UNAUTHORIZED,
        'UNAUTHENTICATED',
        'Oturum açman gerekiyor',
      );
    }
    setAuth(req, ctx);

    if (requirement.level === 'staff-mfa') {
      if (!ctx.isStaff) {
        throw new ProblemException(HttpStatus.FORBIDDEN, 'FORBIDDEN', 'Bu işlem için yetkin yok');
      }
      if (!ctx.mfaVerified) {
        throw new ProblemException(
          HttpStatus.FORBIDDEN,
          'MFA_REQUIRED',
          'İki adımlı doğrulama gerekli',
        );
      }
    }
    const required = requirement.permission === undefined ? [] : [requirement.permission].flat();
    if (required.length && !required.some((p) => can(ctx.roles, p))) {
      throw new ProblemException(HttpStatus.FORBIDDEN, 'FORBIDDEN', 'Bu işlem için yetkin yok');
    }
    if (requirement.stepUp) {
      const fresh = ctx.stepUpAt && Date.now() - ctx.stepUpAt.getTime() <= STEP_UP_WINDOW_MS;
      if (!fresh) {
        throw new ProblemException(
          HttpStatus.FORBIDDEN,
          'STEP_UP_REQUIRED',
          'Bu işlem için ikinci faktörü yeniden doğrula',
        );
      }
    }
    return true;
  }
}
