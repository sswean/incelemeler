import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Problem } from '@incelemeler/contracts';
import { startTestApp, type TestContext } from './app.js';
import { nextIp, staffToken } from './staff.js';

let t: TestContext;
let admin: string;
let sponsorId: string;
const http = () => request(t.app.getHttpServer());
const as = (token: string) => ({ Authorization: `Bearer ${token}`, 'X-Forwarded-For': nextIp() });
const age = (minutes: number) =>
  t.prisma.session.updateMany({
    where: { revokedAt: null, user: { email: 'stepup-yonetici@example.com' } },
    data: { stepUpAt: new Date(Date.now() - minutes * 60_000) },
  });
const code = (res: request.Response) => Problem.parse(res.body).code;

beforeAll(async () => {
  t = await startTestApp();
  admin = await staffToken(t, 'stepup-yonetici@example.com', ['ADMIN']);
  sponsorId = (
    await t.prisma.organization.create({
      data: { type: 'ADVERTISER', slug: 'stepup-sponsor', name: 'Step-up Sponsor' },
    })
  ).id;
}, 120_000);

afterAll(async () => {
  await t?.close();
});

describe('kritik yönetici işlemlerinde step-up (REQ-GUV-017, REQ-HSP-007)', () => {
  it('[REQ-GUV-017] kampanya tutarı, gelir raporu ve toplu geri alma son 10 dakikada ikinci faktör ister', async () => {
    const campaign = {
      name: 'Step-up kampanyası',
      sponsorId,
      startsAt: new Date(Date.now() + 86_400_000).toISOString(),
      endsAt: new Date(Date.now() + 5 * 86_400_000).toISOString(),
    };
    // Taze doğrulama (kurulumdan hemen sonra): tutar kabul.
    await http()
      .post('/v1/admin/campaigns')
      .set(as(admin))
      .send({ ...campaign, budgetKurus: 100_000 })
      .expect(201);

    await age(11);
    expect(
      code(
        await http()
          .post('/v1/admin/campaigns')
          .set(as(admin))
          .send({ ...campaign, budgetKurus: 200_000 })
          .expect(403),
      ),
    ).toBe('STEP_UP_REQUIRED');
    // Tutarsız kampanya kritik değil.
    await http().post('/v1/admin/campaigns').set(as(admin)).send(campaign).expect(201);
    expect(
      code(
        await http()
          .get('/v1/admin/reports/revenue')
          .query({ from: '2026-10-01', to: '2026-10-31' })
          .set(as(admin))
          .expect(403),
      ),
    ).toBe('STEP_UP_REQUIRED');
    expect(
      code(
        await http()
          .post('/v1/admin/imports/0192f0a0-0000-7000-8000-000000000001/rollback')
          .set(as(admin))
          .expect(403),
      ),
    ).toBe('STEP_UP_REQUIRED');
    // Kritik olmayan panel okumaları etkilenmez.
    await http().get('/v1/admin/campaigns').set(as(admin)).expect(200);

    await age(5);
    await http()
      .get('/v1/admin/reports/revenue')
      .query({ from: '2026-10-01', to: '2026-10-31' })
      .set(as(admin))
      .expect(200);
    expect(
      await t.prisma.auditLog.count({ where: { action: 'sponsorship.campaign.created' } }),
    ).toBe(2);
  });
});
