import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import type {
  CurrentUser,
  LoginResult,
  MfaState,
  RegisterBody,
  StaffRole,
} from '@incelemeler/contracts';
import { ENV, type EnvToken } from '../../config/env.provider.js';
import { permissionsOf } from '../access/permissions.js';
import { ProblemException } from '../../common/problem.js';
import type { RequestMeta } from '../../common/request-meta.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { AuditService } from '../platform/audit.service.js';
import { RateLimitedException, RateLimitService } from '../platform/rate-limit.service.js';
import { EMAIL_PORT, type EmailPort } from '../notifications/email.port.js';
import { emailTemplates } from '../notifications/email-templates.js';
import type { AuthContext } from './auth.context.js';
import {
  decrypt,
  encrypt,
  generateTotpSecret,
  otpauthUrl,
  randomToken,
  sha256,
  verifyTotp,
} from './crypto.js';
import { checkPassword, hashPassword, verifyPassword } from './password.js';
import type { Session, User } from '../../generated/prisma/client.js';

const HOUR = 3_600_000;
const DAY = 24 * HOUR;
/** Oturum ömürleri (REQ-HSP-004): üye kayan 30 gün / mutlak 90 gün; personel kayan 12 saat / mutlak 7 gün. */
export const SESSION_TTL = {
  member: { idle: 30 * DAY, absolute: 90 * DAY },
  staff: { idle: 12 * HOUR, absolute: 7 * DAY },
} as const;
export const STEP_UP_WINDOW_MS = 10 * 60_000;
const VERIFY_TOKEN_TTL = DAY;
const RESET_TOKEN_TTL = 30 * 60_000;
const RECOVERY_CODE_COUNT = 10;

// Var olmayan kullanıcıda zamanlama farkını azaltmak için sabit bir karma ile doğrulama yapılır.
let dummyHash: Promise<string> | null = null;

function weakPassword(problem: string): ProblemException {
  return new ProblemException(
    HttpStatus.UNPROCESSABLE_ENTITY,
    'WEAK_PASSWORD',
    'Parola yeterince güçlü değil',
    undefined,
    [{ pointer: '/body/password', code: problem, message: problem }],
  );
}

const invalidCredentials = () =>
  new ProblemException(
    HttpStatus.UNAUTHORIZED,
    'INVALID_CREDENTIALS',
    'E-posta ya da parola hatalı',
  );
const invalidToken = () =>
  new ProblemException(
    HttpStatus.BAD_REQUEST,
    'INVALID_TOKEN',
    'Bağlantı geçersiz ya da süresi dolmuş',
  );

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly rateLimit: RateLimitService,
    @Inject(EMAIL_PORT) private readonly email: EmailPort,
    @Inject(ENV) private readonly env: EnvToken,
  ) {}

  // ── Üyelik ──

  async register(body: RegisterBody, meta: RequestMeta): Promise<void> {
    await this.rateLimit.enforce(`register:ip:${meta.ip}`, 5, 3600);
    const problem = checkPassword(body.password, body.email);
    if (problem) throw weakPassword(problem);

    const passwordHash = await hashPassword(body.password);
    const existing = await this.prisma.user.findUnique({ where: { email: body.email } });
    if (existing) {
      // Hesabın varlığı yanıttan anlaşılmaz; sahibine bilgilendirme gider (REQ-HSP-008).
      const t = emailTemplates.alreadyRegistered(`${this.env.WEB_BASE_URL}/parola-sifirla`);
      await this.email.send({ to: existing.email, ...t, category: 'transactional' });
      return;
    }
    const user = await this.prisma.user.create({
      data: {
        email: body.email,
        passwordHash,
        displayName: body.displayName,
        ageConfirmedAt: new Date(),
        termsVersion: body.termsVersion,
      },
    });
    const token = await this.issueEmailToken(user.id, 'VERIFY_EMAIL', VERIFY_TOKEN_TTL);
    const t = emailTemplates.verifyEmail(
      user.displayName,
      `${this.env.WEB_BASE_URL}/eposta-dogrula?token=${encodeURIComponent(token)}`,
    );
    await this.email.send({ to: user.email, ...t, category: 'transactional' });
  }

  async verifyEmail(token: string): Promise<void> {
    const row = await this.consumeEmailToken(token, 'VERIFY_EMAIL');
    await this.prisma.user.update({
      where: { id: row.userId },
      data: { emailVerifiedAt: new Date() },
    });
  }

  // ── Oturum ──

  async login(email: string, password: string, meta: RequestMeta): Promise<LoginResult> {
    await this.rateLimit.enforce(`login:ip:${meta.ip}`, 10, 60);
    // Hesap başına sınır yalnızca başarısız denemeleri sayar (kimlik bilgisi doldurma koruması).
    const acctKey = `login:acct:${sha256(email)}`;
    const blocked = await this.rateLimit.isBlocked(acctKey, 5, 60);
    if (blocked.blocked) throw new RateLimitedException(blocked.retryAfter);
    const fail = async () => {
      await this.rateLimit.hit(acctKey, 5, 60);
      return invalidCredentials();
    };

    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { roles: true, mfaFactor: true },
    });
    if (!user) {
      dummyHash ??= hashPassword('zamanlama-esitleme-icin-sabit-parola');
      await verifyPassword(await dummyHash, password);
      throw await fail();
    }
    if (!(await verifyPassword(user.passwordHash, password))) throw await fail();
    if (user.status === 'SUSPENDED') {
      throw new ProblemException(
        HttpStatus.FORBIDDEN,
        'ACCOUNT_SUSPENDED',
        'Hesabın askıya alınmış',
      );
    }
    if (user.status === 'PENDING_DELETION') {
      // Geri alma e-postadaki bağlantıyla (REQ-HSP-011); giriş silme beklerken kapalı.
      throw new ProblemException(
        HttpStatus.FORBIDDEN,
        'ACCOUNT_PENDING_DELETION',
        'Hesabın silme bekliyor',
      );
    }
    if (user.status !== 'ACTIVE') throw invalidCredentials();

    const roles = user.roles.map((r) => r.role as StaffRole);
    const isStaff = roles.length > 0;
    const ttl = isStaff ? SESSION_TTL.staff : SESSION_TTL.member;
    const token = randomToken();
    const now = Date.now();
    const session = await this.prisma.session.create({
      data: {
        userId: user.id,
        tokenHash: sha256(token),
        isStaff,
        idleExpiresAt: new Date(now + ttl.idle),
        absoluteExpiresAt: new Date(now + ttl.absolute),
        ipPrefix: meta.ipPrefix,
        userAgent: meta.userAgent,
      },
    });
    if (isStaff) {
      await this.audit.record({
        actorId: user.id,
        actorRole: roles.join(','),
        action: 'auth.staff_login',
        targetType: 'session',
        targetId: session.id,
        ipPrefix: meta.ipPrefix,
        traceId: meta.traceId,
      });
    }
    return {
      sessionToken: token,
      expiresAt: new Date(Math.min(now + ttl.idle, now + ttl.absolute)).toISOString(),
      user: this.toCurrentUser(user, roles, session),
    };
  }

  /** Bearer token'ı doğrular; geçerliyse kayan süreyi uzatır (en çok dakikada bir yazar). */
  async resolveSession(token: string): Promise<AuthContext | null> {
    const session = await this.prisma.session.findUnique({
      where: { tokenHash: sha256(token) },
      include: { user: { include: { roles: true, mfaFactor: true } } },
    });
    if (!session || session.revokedAt) return null;
    const now = Date.now();
    if (session.idleExpiresAt.getTime() <= now || session.absoluteExpiresAt.getTime() <= now) {
      return null;
    }
    if (session.user.status !== 'ACTIVE') return null;
    const roles = session.user.roles.map((r) => r.role as StaffRole);
    // Personel rolleri sonradan kaldırıldıysa personel oturumu geçersizdir.
    if (session.isStaff !== roles.length > 0) return null;
    if (now - session.lastSeenAt.getTime() > 60_000) {
      const ttl = session.isStaff ? SESSION_TTL.staff : SESSION_TTL.member;
      await this.prisma.session.update({
        where: { id: session.id },
        data: { lastSeenAt: new Date(now), idleExpiresAt: new Date(now + ttl.idle) },
      });
    }
    return {
      userId: session.userId,
      sessionId: session.id,
      email: session.user.email,
      displayName: session.user.displayName,
      emailVerified: session.user.emailVerifiedAt !== null,
      roles,
      isStaff: session.isStaff,
      mfaVerified: session.mfaVerifiedAt !== null,
      mfaConfigured: session.user.mfaFactor?.confirmedAt != null,
      stepUpAt: session.stepUpAt,
    };
  }

  async logout(sessionId: string): Promise<void> {
    await this.prisma.session.updateMany({
      where: { id: sessionId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async listSessions(ctx: AuthContext) {
    const rows = await this.prisma.session.findMany({
      where: {
        userId: ctx.userId,
        revokedAt: null,
        idleExpiresAt: { gt: new Date() },
        absoluteExpiresAt: { gt: new Date() },
      },
      orderBy: { lastSeenAt: 'desc' },
    });
    return {
      data: rows.map((s) => ({
        id: s.id,
        current: s.id === ctx.sessionId,
        createdAt: s.createdAt.toISOString(),
        lastSeenAt: s.lastSeenAt.toISOString(),
        userAgent: s.userAgent,
        ipPrefix: s.ipPrefix,
      })),
    };
  }

  async revokeSession(ctx: AuthContext, sessionId: string): Promise<void> {
    const res = await this.prisma.session.updateMany({
      where: { id: sessionId, userId: ctx.userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    // Başkasının oturumu ya da olmayan oturum: 404 (varlık sızdırılmaz).
    if (res.count === 0) {
      throw new ProblemException(HttpStatus.NOT_FOUND, 'NOT_FOUND', 'Oturum bulunamadı');
    }
  }

  // ── Parola sıfırlama ──

  async requestPasswordReset(email: string, meta: RequestMeta): Promise<void> {
    await this.rateLimit.enforce(`reset:ip:${meta.ip}`, 10, 3600);
    const limited = await this.rateLimit.hit(`reset:acct:${sha256(email)}`, 3, 3600);
    if (!limited.allowed) return; // Sessizce yut: hesabın varlığı ve sınır sızdırılmaz.
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || user.status !== 'ACTIVE') return;
    await this.prisma.emailToken.updateMany({
      where: { userId: user.id, purpose: 'RESET_PASSWORD', usedAt: null },
      data: { usedAt: new Date() },
    });
    const token = await this.issueEmailToken(user.id, 'RESET_PASSWORD', RESET_TOKEN_TTL);
    const t = emailTemplates.resetPassword(
      `${this.env.WEB_BASE_URL}/parola-sifirla?token=${encodeURIComponent(token)}`,
    );
    await this.email.send({ to: user.email, ...t, category: 'transactional' });
  }

  async confirmPasswordReset(token: string, newPassword: string, meta: RequestMeta): Promise<void> {
    const tokenHash = sha256(token);
    const row = await this.prisma.emailToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });
    if (
      !row ||
      row.purpose !== 'RESET_PASSWORD' ||
      row.usedAt ||
      row.expiresAt.getTime() <= Date.now()
    ) {
      throw invalidToken();
    }
    const problem = checkPassword(newPassword, row.user.email);
    if (problem) throw weakPassword(problem);
    const passwordHash = await hashPassword(newPassword);
    await this.prisma.$transaction(async (tx) => {
      const used = await tx.emailToken.updateMany({
        where: { id: row.id, usedAt: null },
        data: { usedAt: new Date() },
      });
      if (used.count !== 1) throw invalidToken();
      await tx.user.update({ where: { id: row.userId }, data: { passwordHash } });
      await tx.session.updateMany({
        where: { userId: row.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      await this.audit.record(
        {
          actorId: row.userId,
          action: 'auth.password_reset',
          targetType: 'user',
          targetId: row.userId,
          ipPrefix: meta.ipPrefix,
          traceId: meta.traceId,
        },
        tx,
      );
    });
    await this.email.send({
      to: row.user.email,
      ...emailTemplates.passwordChanged(),
      category: 'transactional',
    });
  }

  // ── İkinci faktör (personel) ──

  async mfaSetup(ctx: AuthContext): Promise<{ secret: string; otpauthUrl: string }> {
    this.assertStaff(ctx);
    if (ctx.mfaConfigured) {
      throw new ProblemException(
        HttpStatus.CONFLICT,
        'CONFLICT',
        'İki adımlı doğrulama zaten kurulu',
      );
    }
    const secret = generateTotpSecret();
    const secretEncrypted = encrypt(secret, this.env.DATA_ENCRYPTION_KEY);
    await this.prisma.mfaFactor.upsert({
      where: { userId: ctx.userId },
      create: { userId: ctx.userId, secretEncrypted },
      update: { secretEncrypted, confirmedAt: null, lastUsedStep: null },
    });
    return { secret, otpauthUrl: otpauthUrl(secret, ctx.email) };
  }

  async mfaConfirm(
    ctx: AuthContext,
    code: string,
    meta: RequestMeta,
  ): Promise<{ recoveryCodes: string[] }> {
    this.assertStaff(ctx);
    await this.rateLimit.enforce(`mfa:session:${ctx.sessionId}`, 5, 60);
    const factor = await this.prisma.mfaFactor.findUnique({ where: { userId: ctx.userId } });
    if (!factor || factor.confirmedAt) {
      throw new ProblemException(HttpStatus.CONFLICT, 'CONFLICT', 'Onaylanacak bir kurulum yok');
    }
    const step = verifyTotp(
      decrypt(factor.secretEncrypted, this.env.DATA_ENCRYPTION_KEY),
      code,
      Date.now(),
      null,
    );
    if (step === null)
      throw new ProblemException(HttpStatus.UNAUTHORIZED, 'MFA_INVALID', 'Kod hatalı');
    const codes = Array.from({ length: RECOVERY_CODE_COUNT }, () => {
      const raw = randomToken(8)
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '')
        .padEnd(10, '0')
        .slice(0, 10);
      return `${raw.slice(0, 5)}-${raw.slice(5)}`;
    });
    const now = new Date();
    await this.prisma.$transaction(async (tx) => {
      await tx.mfaFactor.update({
        where: { userId: ctx.userId },
        data: { confirmedAt: now, lastUsedStep: step },
      });
      await tx.recoveryCode.deleteMany({ where: { userId: ctx.userId } });
      await tx.recoveryCode.createMany({
        data: codes.map((c) => ({ userId: ctx.userId, codeHash: sha256(c) })),
      });
      await tx.session.update({
        where: { id: ctx.sessionId },
        data: { mfaVerifiedAt: now, stepUpAt: now },
      });
      await this.audit.record(
        {
          actorId: ctx.userId,
          actorRole: ctx.roles.join(','),
          action: 'auth.mfa_enabled',
          targetType: 'user',
          targetId: ctx.userId,
          ipPrefix: meta.ipPrefix,
          traceId: meta.traceId,
        },
        tx,
      );
    });
    return { recoveryCodes: codes };
  }

  async mfaVerify(ctx: AuthContext, code: string, meta: RequestMeta): Promise<CurrentUser> {
    this.assertStaff(ctx);
    await this.rateLimit.enforce(`mfa:session:${ctx.sessionId}`, 5, 60);
    const factor = await this.prisma.mfaFactor.findUnique({ where: { userId: ctx.userId } });
    if (!factor?.confirmedAt) {
      throw new ProblemException(
        HttpStatus.FORBIDDEN,
        'MFA_REQUIRED',
        'Önce iki adımlı doğrulamayı kur',
      );
    }
    let ok = false;
    if (/^\d{6}$/.test(code)) {
      const secret = decrypt(factor.secretEncrypted, this.env.DATA_ENCRYPTION_KEY);
      const step = verifyTotp(secret, code, Date.now(), factor.lastUsedStep);
      if (step !== null) {
        // Aynı kod iki kez kullanılamaz (eşzamanlı istekler dahil).
        const upd = await this.prisma.mfaFactor.updateMany({
          where: {
            userId: ctx.userId,
            OR: [{ lastUsedStep: null }, { lastUsedStep: { lt: step } }],
          },
          data: { lastUsedStep: step },
        });
        ok = upd.count === 1;
      }
    } else {
      const used = await this.prisma.recoveryCode.updateMany({
        where: { userId: ctx.userId, codeHash: sha256(code), usedAt: null },
        data: { usedAt: new Date() },
      });
      ok = used.count === 1;
      if (ok) {
        await this.audit.record({
          actorId: ctx.userId,
          action: 'auth.recovery_code_used',
          targetType: 'user',
          targetId: ctx.userId,
          ipPrefix: meta.ipPrefix,
          traceId: meta.traceId,
        });
      }
    }
    if (!ok) throw new ProblemException(HttpStatus.UNAUTHORIZED, 'MFA_INVALID', 'Kod hatalı');
    const now = new Date();
    const session = await this.prisma.session.update({
      where: { id: ctx.sessionId },
      data: { mfaVerifiedAt: now, stepUpAt: now },
      include: { user: { include: { roles: true, mfaFactor: true } } },
    });
    return this.toCurrentUser(session.user, ctx.roles, session);
  }

  // ── Roller ──

  async setRoles(
    actor: AuthContext,
    targetUserId: string,
    roles: StaffRole[],
    meta: RequestMeta,
  ): Promise<CurrentUser> {
    const unique = [...new Set(roles)];
    const result = await this.prisma.$transaction(async (tx) => {
      const target = await tx.user.findUnique({
        where: { id: targetUserId },
        include: { roles: true },
      });
      if (!target)
        throw new ProblemException(HttpStatus.NOT_FOUND, 'NOT_FOUND', 'Kullanıcı bulunamadı');
      const before = target.roles.map((r) => r.role).sort();
      if (before.includes('SUPER_ADMIN') && !unique.includes('SUPER_ADMIN')) {
        const supers = await tx.staffRoleAssignment.count({ where: { role: 'SUPER_ADMIN' } });
        if (supers <= 1) {
          throw new ProblemException(
            HttpStatus.CONFLICT,
            'CONFLICT',
            'Son süper yönetici kaldırılamaz',
          );
        }
      }
      await tx.staffRoleAssignment.deleteMany({ where: { userId: targetUserId } });
      if (unique.length) {
        await tx.staffRoleAssignment.createMany({
          data: unique.map((role) => ({ userId: targetUserId, role, grantedBy: actor.userId })),
        });
      }
      // Rol değişince hedefin tüm oturumları kapanır (REQ-GUV-012).
      await tx.session.updateMany({
        where: { userId: targetUserId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      await this.audit.record(
        {
          actorId: actor.userId,
          actorRole: actor.roles.join(','),
          action: 'access.roles_set',
          targetType: 'user',
          targetId: targetUserId,
          summary: { before, after: [...unique].sort() },
          ipPrefix: meta.ipPrefix,
          traceId: meta.traceId,
        },
        tx,
      );
      return tx.user.findUniqueOrThrow({
        where: { id: targetUserId },
        include: { roles: true, mfaFactor: true },
      });
    });
    return this.toCurrentUser(
      result,
      result.roles.map((r) => r.role as StaffRole),
      null,
    );
  }

  // ── Yardımcılar ──

  currentUserFromContext(ctx: AuthContext): CurrentUser {
    return {
      id: ctx.userId,
      email: ctx.email,
      displayName: ctx.displayName,
      emailVerified: ctx.emailVerified,
      roles: ctx.roles,
      permissions: permissionsOf(ctx.roles),
      mfa: mfaState(ctx.roles.length > 0, ctx.mfaConfigured, ctx.mfaVerified),
    };
  }

  private toCurrentUser(
    user: User & { mfaFactor: { confirmedAt: Date | null } | null },
    roles: StaffRole[],
    session: Session | null,
  ): CurrentUser {
    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      emailVerified: user.emailVerifiedAt !== null,
      roles,
      permissions: permissionsOf(roles),
      mfa: mfaState(
        roles.length > 0,
        user.mfaFactor?.confirmedAt != null,
        session?.mfaVerifiedAt != null,
      ),
    };
  }

  private assertStaff(ctx: AuthContext): void {
    if (!ctx.isStaff)
      throw new ProblemException(HttpStatus.FORBIDDEN, 'FORBIDDEN', 'Bu işlem için yetkin yok');
  }

  private async issueEmailToken(
    userId: string,
    purpose: 'VERIFY_EMAIL' | 'RESET_PASSWORD',
    ttlMs: number,
  ): Promise<string> {
    const token = randomToken();
    await this.prisma.emailToken.create({
      data: { userId, purpose, tokenHash: sha256(token), expiresAt: new Date(Date.now() + ttlMs) },
    });
    return token;
  }

  private async consumeEmailToken(token: string, purpose: 'VERIFY_EMAIL' | 'RESET_PASSWORD') {
    const row = await this.prisma.emailToken.findUnique({ where: { tokenHash: sha256(token) } });
    if (!row || row.purpose !== purpose || row.usedAt || row.expiresAt.getTime() <= Date.now()) {
      throw invalidToken();
    }
    const used = await this.prisma.emailToken.updateMany({
      where: { id: row.id, usedAt: null },
      data: { usedAt: new Date() },
    });
    if (used.count !== 1) throw invalidToken();
    return row;
  }
}

function mfaState(isStaff: boolean, configured: boolean, verified: boolean): MfaState {
  if (!isStaff) return 'NONE';
  if (!configured) return 'SETUP_REQUIRED';
  return verified ? 'VERIFIED' : 'VERIFY_REQUIRED';
}
