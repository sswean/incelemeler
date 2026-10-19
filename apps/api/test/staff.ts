import request from 'supertest';
import { LoginResult, MfaSetupResult, type StaffRole } from '@incelemeler/contracts';
import { currentStep, totpAt } from '../src/modules/identity/crypto.js';
import { hashPassword } from '../src/modules/identity/password.js';
import type { TestContext } from './app.js';

export const STAFF_PASSWORD = 'Guclu-Parola-2026!';
let ipCounter = 0;
/** Her çağrı farklı istemci IP'si (IP başına hız sınırları testleri birbirine bağlamasın). */
export const nextIp = () => `10.1.${Math.floor(++ipCounter / 250)}.${ipCounter % 250}`;

/** Personel oluşturur, giriş + 2FA kurulumu yapar; 2FA doğrulanmış oturum token'ı döner. */
export async function staffToken(
  t: TestContext,
  email: string,
  roles: StaffRole[],
): Promise<string> {
  await t.prisma.user.create({
    data: {
      email,
      passwordHash: await hashPassword(STAFF_PASSWORD),
      displayName: `Personel ${roles.join('+')}`,
      emailVerifiedAt: new Date(),
      ageConfirmedAt: new Date(),
      termsVersion: 'test',
      roles: { create: roles.map((role) => ({ role })) },
    },
  });
  const http = request(t.app.getHttpServer());
  const login = await http
    .post('/v1/auth/login')
    .set('X-Forwarded-For', nextIp())
    .send({ email, password: STAFF_PASSWORD })
    .expect(200);
  const token = LoginResult.parse(login.body).sessionToken;
  const setup = MfaSetupResult.parse(
    (
      await request(t.app.getHttpServer())
        .post('/v1/auth/mfa/setup')
        .set('Authorization', `Bearer ${token}`)
        .expect(200)
    ).body,
  );
  await request(t.app.getHttpServer())
    .post('/v1/auth/mfa/confirm')
    .set('Authorization', `Bearer ${token}`)
    .send({ code: totpAt(setup.secret, currentStep(Date.now())) })
    .expect(200);
  return token;
}
