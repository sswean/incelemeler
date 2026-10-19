import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  CurrentUser,
  LoginResult,
  MfaConfirmResult,
  MfaSetupResult,
  Problem,
} from '@incelemeler/contracts';
import { currentStep, totpAt } from '../src/modules/identity/crypto.js';
import { hashPassword } from '../src/modules/identity/password.js';
import { startTestApp, tokenFromMail, type TestContext } from './app.js';

let t: TestContext;
const http = () => request(t.app.getHttpServer());
let ipCounter = 0;
/** Her çağrı farklı istemci IP'si (IP başına sınır yalnızca ilgili testte denenir). */
const nextIp = () => `10.0.${Math.floor(++ipCounter / 250)}.${ipCounter % 250}`;
const PASSWORD = 'Guclu-Parola-2026!';

async function register(email: string, displayName = 'Deneme Kullanıcı') {
  return http().post('/v1/auth/register').set('X-Forwarded-For', nextIp()).send({
    email,
    password: PASSWORD,
    displayName,
    ageConfirmed: true,
    termsVersion: '2026-10-taslak',
  });
}

async function login(email: string, password = PASSWORD) {
  const res = await http()
    .post('/v1/auth/login')
    .set('X-Forwarded-For', nextIp())
    .send({ email, password });
  return res;
}

async function createStaff(
  email: string,
  roles: Array<'SUPER_ADMIN' | 'ADMIN' | 'EDITOR' | 'AUTHOR' | 'MODERATOR' | 'SALES'>,
) {
  return t.prisma.user.create({
    data: {
      email,
      passwordHash: await hashPassword(PASSWORD),
      displayName: 'Personel',
      emailVerifiedAt: new Date(),
      ageConfirmedAt: new Date(),
      termsVersion: 'test',
      roles: { create: roles.map((role) => ({ role })) },
    },
  });
}

/** Personel girişi + 2FA kurulumu; 2FA doğrulanmış oturum token'ı döner. */
async function staffSessionWithMfa(email: string) {
  const loginRes = await login(email);
  const token = LoginResult.parse(loginRes.body).sessionToken;
  const setup = MfaSetupResult.parse(
    (await http().post('/v1/auth/mfa/setup').set('Authorization', `Bearer ${token}`)).body,
  );
  const code = totpAt(setup.secret, currentStep(Date.now()));
  const confirm = await http()
    .post('/v1/auth/mfa/confirm')
    .set('Authorization', `Bearer ${token}`)
    .send({ code });
  expect(confirm.status).toBe(200);
  return {
    token,
    secret: setup.secret,
    recoveryCodes: MfaConfirmResult.parse(confirm.body).recoveryCodes,
  };
}

beforeAll(async () => {
  t = await startTestApp();
});

afterAll(async () => {
  await t?.close();
});

describe('üyelik ve e-posta doğrulama', () => {
  it('[REQ-HSP-002] kayıt 202 döner ve doğrulama e-postası gönderir', async () => {
    const res = await register('Ayse@Example.com');
    expect(res.status).toBe(202);
    const mail = t.mail.sent.at(-1)!;
    expect(mail.to).toBe('ayse@example.com');
    expect(mail.category).toBe('transactional');
    const token = tokenFromMail(mail.text);

    const loginRes = LoginResult.parse((await login('ayse@example.com')).body);
    expect(loginRes.user.emailVerified).toBe(false);
    expect(loginRes.user.mfa).toBe('NONE');

    await http().post('/v1/auth/verify-email').send({ token }).expect(200);
    const me = await http()
      .get('/v1/me')
      .set('Authorization', `Bearer ${loginRes.sessionToken}`)
      .expect(200);
    expect(CurrentUser.parse(me.body).emailVerified).toBe(true);

    const reuse = await http().post('/v1/auth/verify-email').send({ token }).expect(400);
    expect(Problem.parse(reuse.body).code).toBe('INVALID_TOKEN');
  });

  it('[REQ-HSP-008] var olan e-postayla kayıt aynı yanıtı verir, hesabın varlığını sızdırmaz', async () => {
    const before = t.mail.sent.length;
    const res = await register('ayse@example.com');
    expect(res.status).toBe(202);
    expect(res.body).toEqual({ accepted: true });
    expect(t.mail.sent.length).toBe(before + 1);
    expect(t.mail.sent.at(-1)!.subject).toContain('zaten');
    expect(await t.prisma.user.count({ where: { email: 'ayse@example.com' } })).toBe(1);
  });

  it('[REQ-HSP-003] zayıf parola 422 WEAK_PASSWORD', async () => {
    const res = await http()
      .post('/v1/auth/register')
      .send({
        email: 'zayif@example.com',
        password: 'Galatasaray',
        displayName: 'Zayıf',
        ageConfirmed: true,
        termsVersion: 'x',
      })
      .expect(422);
    expect(Problem.parse(res.body).code).toBe('WEAK_PASSWORD');
  });

  it('[REQ-HSP-014] 18+ beyanı olmadan kayıt reddedilir', async () => {
    await http()
      .post('/v1/auth/register')
      .send({
        email: 'genc@example.com',
        password: PASSWORD,
        displayName: 'Genç',
        ageConfirmed: false,
        termsVersion: 'x',
      })
      .expect(422);
  });
});

describe('oturum', () => {
  it('[REQ-HSP-008] hatalı parola ve olmayan hesap aynı 401 yanıtını verir', async () => {
    const a = await login('ayse@example.com', 'yanlis-parola-1234').then((r) => r.body);
    const b = await login('yok@example.com', 'yanlis-parola-1234').then((r) => r.body);
    expect(Problem.parse(a).code).toBe('INVALID_CREDENTIALS');
    expect(Problem.parse(b).code).toBe('INVALID_CREDENTIALS');
    expect(a.title).toBe(b.title);
  });

  it('[REQ-HSP-004] token olmadan korumalı uç nokta 401, çıkıştan sonra token geçersiz', async () => {
    await http().get('/v1/me').expect(401);
    const { sessionToken } = LoginResult.parse((await login('ayse@example.com')).body);
    await http().get('/v1/me').set('Authorization', `Bearer ${sessionToken}`).expect(200);
    await http().post('/v1/auth/logout').set('Authorization', `Bearer ${sessionToken}`).expect(204);
    await http().get('/v1/me').set('Authorization', `Bearer ${sessionToken}`).expect(401);
  });

  it('[REQ-HSP-004] oturum listesi ve iptali; başkasının oturumu 404', async () => {
    const s1 = LoginResult.parse((await login('ayse@example.com')).body).sessionToken;
    const s2 = LoginResult.parse((await login('ayse@example.com')).body).sessionToken;
    const list = await http()
      .get('/v1/me/sessions')
      .set('Authorization', `Bearer ${s1}`)
      .expect(200);
    const sessions = list.body.data as Array<{ id: string; current: boolean }>;
    expect(sessions.filter((s) => s.current)).toHaveLength(1);
    const other = sessions.find((s) => !s.current)!;
    await http()
      .delete(`/v1/me/sessions/${other.id}`)
      .set('Authorization', `Bearer ${s1}`)
      .expect(204);
    await http().get('/v1/me').set('Authorization', `Bearer ${s2}`).expect(401);

    await register('mehmet@example.com', 'Mehmet');
    const m = LoginResult.parse((await login('mehmet@example.com')).body).sessionToken;
    const mine = (await http().get('/v1/me/sessions').set('Authorization', `Bearer ${m}`)).body
      .data[0].id;
    await http().delete(`/v1/me/sessions/${mine}`).set('Authorization', `Bearer ${s1}`).expect(404);
  });

  it('[REQ-HSP-004] süresi dolmuş oturum reddedilir', async () => {
    const { sessionToken, user } = LoginResult.parse((await login('ayse@example.com')).body);
    await t.prisma.session.updateMany({
      where: { userId: user.id, revokedAt: null },
      data: { idleExpiresAt: new Date(Date.now() - 1000) },
    });
    await http().get('/v1/me').set('Authorization', `Bearer ${sessionToken}`).expect(401);
  });

  it('[REQ-HSP-008] hesap başına giriş sınırı aşılınca 429 + Retry-After', async () => {
    await register('sinir@example.com', 'Sınır');
    const codes: number[] = [];
    let last;
    for (let i = 0; i < 6; i++) {
      last = await login('sinir@example.com', 'yanlis-parola-1234');
      codes.push(last.status);
    }
    expect(codes.slice(0, 5).every((c) => c === 401)).toBe(true);
    expect(codes[5]).toBe(429);
    expect(Number(last!.headers['retry-after'])).toBeGreaterThan(0);
    expect(Problem.parse(last!.body).code).toBe('RATE_LIMITED');
  });
});

describe('parola sıfırlama', () => {
  it('[REQ-HSP-002] bilinmeyen e-posta için de 202; e-posta gönderilmez', async () => {
    const before = t.mail.sent.length;
    await http()
      .post('/v1/auth/password-reset/request')
      .send({ email: 'hic-yok@example.com' })
      .expect(202);
    expect(t.mail.sent.length).toBe(before);
  });

  it('[REQ-HSP-002] [REQ-GUV-012] sıfırlama tüm oturumları kapatır; eski parola ve token geçersiz olur', async () => {
    await register('reset@example.com', 'Sıfırla');
    const old = LoginResult.parse((await login('reset@example.com')).body).sessionToken;
    await http()
      .post('/v1/auth/password-reset/request')
      .send({ email: 'reset@example.com' })
      .expect(202);
    const token = tokenFromMail(t.mail.sent.at(-1)!.text);
    const NEW = 'Yepyeni-Guclu-Parola-77';
    await http()
      .post('/v1/auth/password-reset/confirm')
      .send({ token, newPassword: NEW })
      .expect(200);
    await http().get('/v1/me').set('Authorization', `Bearer ${old}`).expect(401);
    expect((await login('reset@example.com')).status).toBe(401);
    expect((await login('reset@example.com', NEW)).status).toBe(200);
    const reuse = await http()
      .post('/v1/auth/password-reset/confirm')
      .send({ token, newPassword: NEW })
      .expect(400);
    expect(Problem.parse(reuse.body).code).toBe('INVALID_TOKEN');
    expect(t.mail.sent.at(-1)!.subject).toBe('Parolan değiştirildi');
  });
});

describe('[E2E-011] personel 2FA, roller ve yetki', () => {
  it("[REQ-HSP-007] personel girişte 2FA kurmadan panel API'sine erişemez", async () => {
    await createStaff('kurucu@example.com', ['SUPER_ADMIN']);
    const res = LoginResult.parse((await login('kurucu@example.com')).body);
    expect(res.user.mfa).toBe('SETUP_REQUIRED');
    const denied = await http()
      .get('/v1/admin/me')
      .set('Authorization', `Bearer ${res.sessionToken}`)
      .expect(403);
    expect(Problem.parse(denied.body).code).toBe('MFA_REQUIRED');
  });

  it('[REQ-HSP-007] TOTP kurulumu sonrası panel açılır; kurtarma kodları 10 adet', async () => {
    const { token, recoveryCodes } = await staffSessionWithMfa('kurucu@example.com');
    expect(recoveryCodes).toHaveLength(10);
    const me = await http().get('/v1/admin/me').set('Authorization', `Bearer ${token}`).expect(200);
    expect(CurrentUser.parse(me.body).mfa).toBe('VERIFIED');
    const audit = await t.prisma.auditLog.findMany({ where: { action: 'auth.mfa_enabled' } });
    expect(audit).toHaveLength(1);
  });

  it('[REQ-HSP-007] yeni oturumda doğrulama gerekir; aynı TOTP kodu ikinci kez kullanılamaz; kurtarma kodu tek kullanımlık', async () => {
    const factor = await t.prisma.mfaFactor.findFirstOrThrow({
      where: { user: { email: 'kurucu@example.com' } },
    });
    const secretRes = LoginResult.parse((await login('kurucu@example.com')).body);
    expect(secretRes.user.mfa).toBe('VERIFY_REQUIRED');
    // Son kullanılan adımdan sonraki adımın kodu (gelecek adım ±1 tolerans içinde).
    const step = (factor.lastUsedStep ?? 0n) + 1n;
    const { decrypt } = await import('../src/modules/identity/crypto.js');
    const secret = decrypt(factor.secretEncrypted, t.env.DATA_ENCRYPTION_KEY);
    const code = totpAt(
      secret,
      step > currentStep(Date.now()) + 1n ? currentStep(Date.now()) : step,
    );
    const ok = await http()
      .post('/v1/auth/mfa/verify')
      .set('Authorization', `Bearer ${secretRes.sessionToken}`)
      .send({ code });
    expect(ok.status).toBe(200);
    const replay = await http()
      .post('/v1/auth/mfa/verify')
      .set('Authorization', `Bearer ${secretRes.sessionToken}`)
      .send({ code })
      .expect(401);
    expect(Problem.parse(replay.body).code).toBe('MFA_INVALID');
  });

  it('[REQ-HSP-007] kurtarma kodu bir kez çalışır', async () => {
    const { recoveryCodes } = await staffSessionWithMfa('kurtarma@example.com').catch(async () => {
      await createStaff('kurtarma@example.com', ['EDITOR']);
      return staffSessionWithMfa('kurtarma@example.com');
    });
    const s = LoginResult.parse((await login('kurtarma@example.com')).body).sessionToken;
    const code = recoveryCodes[0]!;
    await http()
      .post('/v1/auth/mfa/verify')
      .set('Authorization', `Bearer ${s}`)
      .send({ code })
      .expect(200);
    const s2 = LoginResult.parse((await login('kurtarma@example.com')).body).sessionToken;
    await http()
      .post('/v1/auth/mfa/verify')
      .set('Authorization', `Bearer ${s2}`)
      .send({ code })
      .expect(401);
  });

  it("[REQ-HSP-009] üye panel API'sine ve 2FA kurulumuna erişemez", async () => {
    const m = LoginResult.parse((await login('mehmet@example.com')).body).sessionToken;
    expect(
      Problem.parse(
        (await http().get('/v1/admin/me').set('Authorization', `Bearer ${m}`).expect(403)).body,
      ).code,
    ).toBe('FORBIDDEN');
    await http().post('/v1/auth/mfa/setup').set('Authorization', `Bearer ${m}`).expect(403);
  });

  it('[REQ-HSP-009] [REQ-GUV-012] süper yönetici rol atar; işlem denetim kaydına yazılır ve hedefin oturumları kapanır', async () => {
    const { token } = await staffSessionWithMfa('kurucu2@example.com').catch(async () => {
      await createStaff('kurucu2@example.com', ['SUPER_ADMIN']);
      return staffSessionWithMfa('kurucu2@example.com');
    });
    const target = await t.prisma.user.findUniqueOrThrow({
      where: { email: 'mehmet@example.com' },
    });
    const targetSession = LoginResult.parse((await login('mehmet@example.com')).body).sessionToken;
    const res = await http()
      .put(`/v1/admin/users/${target.id}/roles`)
      .set('Authorization', `Bearer ${token}`)
      .send({ roles: ['EDITOR'] })
      .expect(200);
    expect(CurrentUser.parse(res.body).roles).toEqual(['EDITOR']);
    await http().get('/v1/me').set('Authorization', `Bearer ${targetSession}`).expect(401);
    const audit = await t.prisma.auditLog.findFirstOrThrow({
      where: { action: 'access.roles_set', targetId: target.id },
    });
    expect(audit.summary).toEqual({ before: [], after: ['EDITOR'] });
  });

  it('[REQ-HSP-009] editör rol atayamaz (403)', async () => {
    const { token } = await staffSessionWithMfa('mehmet@example.com');
    const someone = await t.prisma.user.findUniqueOrThrow({ where: { email: 'ayse@example.com' } });
    const res = await http()
      .put(`/v1/admin/users/${someone.id}/roles`)
      .set('Authorization', `Bearer ${token}`)
      .send({ roles: ['ADMIN'] })
      .expect(403);
    expect(Problem.parse(res.body).code).toBe('FORBIDDEN');
  });

  it('[REQ-HSP-007] kritik işlemde step-up süresi geçtiyse 403 STEP_UP_REQUIRED', async () => {
    const s = LoginResult.parse((await login('kurucu2@example.com')).body);
    const factor = await t.prisma.mfaFactor.findFirstOrThrow({ where: { userId: s.user.id } });
    const { decrypt } = await import('../src/modules/identity/crypto.js');
    const secret = decrypt(factor.secretEncrypted, t.env.DATA_ENCRYPTION_KEY);
    const step = currentStep(Date.now()) + 1n;
    await http()
      .post('/v1/auth/mfa/verify')
      .set('Authorization', `Bearer ${s.sessionToken}`)
      .send({ code: totpAt(secret, step) })
      .expect(200);
    await t.prisma.session.updateMany({
      where: { userId: s.user.id, revokedAt: null },
      data: { stepUpAt: new Date(Date.now() - 11 * 60_000) },
    });
    const someone = await t.prisma.user.findUniqueOrThrow({ where: { email: 'ayse@example.com' } });
    const res = await http()
      .put(`/v1/admin/users/${someone.id}/roles`)
      .set('Authorization', `Bearer ${s.sessionToken}`)
      .send({ roles: ['AUTHOR'] })
      .expect(403);
    expect(Problem.parse(res.body).code).toBe('STEP_UP_REQUIRED');
  });

  it('[REQ-HSP-009] son süper yönetici kaldırılamaz (409)', async () => {
    const { token } = await staffSessionWithMfa('tek-kurucu@example.com').catch(async () => {
      await createStaff('tek-kurucu@example.com', ['ADMIN']);
      return staffSessionWithMfa('tek-kurucu@example.com');
    });
    expect(token).toBeTruthy();
    // İki süper yönetici var (kurucu, kurucu2): biri kaldırılabilir, sonuncusu kaldırılamaz.
    const supers = await t.prisma.staffRoleAssignment.findMany({ where: { role: 'SUPER_ADMIN' } });
    expect(supers.length).toBe(2);
    const k2 = await staffSessionWithMfaFresh('kurucu2@example.com');
    const k1 = await t.prisma.user.findUniqueOrThrow({ where: { email: 'kurucu@example.com' } });
    await http()
      .put(`/v1/admin/users/${k1.id}/roles`)
      .set('Authorization', `Bearer ${k2}`)
      .send({ roles: ['ADMIN'] })
      .expect(200);
    const self = await t.prisma.user.findUniqueOrThrow({ where: { email: 'kurucu2@example.com' } });
    const res = await http()
      .put(`/v1/admin/users/${self.id}/roles`)
      .set('Authorization', `Bearer ${k2}`)
      .send({ roles: [] })
      .expect(409);
    expect(Problem.parse(res.body).code).toBe('CONFLICT');
  });
});

/** Kurulu 2FA'lı personel için yeni oturum açar ve oturumu doğrulanmış işaretler (doğrulama akışı ayrı testlerde sınanır). */
async function staffSessionWithMfaFresh(email: string): Promise<string> {
  const s = LoginResult.parse((await login(email)).body);
  await t.prisma.session.updateMany({
    where: { userId: s.user.id, revokedAt: null },
    data: { mfaVerifiedAt: new Date(), stepUpAt: new Date() },
  });
  return s.sessionToken;
}
