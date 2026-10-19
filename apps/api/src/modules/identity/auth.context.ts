import { createParamDecorator, type ExecutionContext, SetMetadata } from '@nestjs/common';
import type { StaffRole } from '@incelemeler/contracts';
import type { Request } from 'express';
import type { Permission } from '../access/permissions.js';

export interface AuthContext {
  userId: string;
  sessionId: string;
  email: string;
  displayName: string;
  emailVerified: boolean;
  roles: StaffRole[];
  isStaff: boolean;
  mfaVerified: boolean;
  mfaConfigured: boolean;
  stepUpAt: Date | null;
}

export interface AuthRequirement {
  /** session: geçerli oturum · staff-mfa: 2FA doğrulanmış personel oturumu */
  level: 'session' | 'staff-mfa';
  permission?: Permission;
  /** Son 10 dakika içinde ikinci faktör doğrulaması (REQ-HSP-007). */
  stepUp?: boolean;
}

export const AUTH_KEY = 'auth:requirement';
export const PUBLIC_KEY = 'auth:public';
export const RequireAuth = (req: AuthRequirement) => SetMetadata(AUTH_KEY, req);
/** Kimlik doğrulaması gerektirmeyen rota. İşaretsiz rotalar reddedilir (REQ-GUV-001: varsayılan reddet). */
export const Public = () => SetMetadata(PUBLIC_KEY, true);

type RequestWithAuth = Request & { auth?: AuthContext };

export function setAuth(req: Request, ctx: AuthContext): void {
  (req as RequestWithAuth).auth = ctx;
}

export function getAuth(req: Request): AuthContext | undefined {
  return (req as RequestWithAuth).auth;
}

export const Auth = createParamDecorator((_: unknown, ctx: ExecutionContext): AuthContext => {
  const auth = getAuth(ctx.switchToHttp().getRequest<Request>());
  if (!auth) throw new Error('Auth bağlamı yok: rota @RequireAuth ile işaretlenmemiş');
  return auth;
});
