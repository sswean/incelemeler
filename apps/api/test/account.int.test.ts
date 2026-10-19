import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  AccountDeletionStatus,
  AccountExport,
  FavoriteList,
  Problem,
} from '@incelemeler/contracts';
import { AccountService } from '../src/modules/account/account.service.js';
import { SearchIndexerService } from '../src/modules/search/search-indexer.service.js';
import { seedDemoListings } from '../src/seed/demo-listings.js';
import { seedSearchDefaults } from '../src/seed/seed-search.js';
import { seedTaxonomy } from '../src/seed/seed-taxonomy.js';
import { startTestApp, type TestContext } from './app.js';
import { memberToken, nextIp, STAFF_PASSWORD, staffToken } from './staff.js';

let t: TestContext;
let listingId: string;
const http = () => request(t.app.getHttpServer());
const as = (token: string) => ({ Authorization: `Bearer ${token}`, 'X-Forwarded-For': nextIp() });
const belirtec = (to: string) => {
  const m = [...t.mail.sent].reverse().find((x) => x.to === to);
  const match = /belirtec=([A-Za-z0-9_%-]+)/.exec(m?.text ?? '');
  if (!match?.[1]) throw new Error(`${to} için bağlantı yok`);
  return decodeURIComponent(match[1]);
};
const login = (email: string) =>
  http()
    .post('/v1/auth/login')
    .set('X-Forwarded-For', nextIp())
    .send({ email, password: STAFF_PASSWORD });

beforeAll(async () => {
  t = await startTestApp();
  await seedTaxonomy(t.prisma);
  await seedSearchDefaults(t.prisma);
  await seedDemoListings(t.prisma);
  await t.app.get(SearchIndexerService).reindexAll();
  listingId = (
    await t.prisma.listing.findUniqueOrThrow({ where: { slug: 'ornek-moda-ocakbasi-demo' } })
  ).id;
}, 120_000);

afterAll(async () => {
  await t?.close();
});

describe('hesap (REQ-HSP-011/012, REQ-KVK-020/021)', () => {
  it('[REQ-KVK-003] rıza kaydı: kategori başına satır, geçmiş korunur, ham IP yok; oturum varsa üyeye bağlanır', async () => {
    const anonymousId = '0b6f3c1e-5d2a-4f7b-9c8e-1a2b3c4d5e6f';
    const send = (body: Record<string, unknown>, headers: Record<string, string> = {}) =>
      http()
        .post('/v1/consents')
        .set({ 'X-Forwarded-For': '198.51.100.7', ...headers })
        .send({ anonymousId, textVersion: '2026-10-taslak', ...body });
    await send({ functional: false, analytics: true, marketing: false }).expect(202);
    await send({ functional: false, analytics: false, marketing: false }).expect(202);
    await send({ functional: 'evet', analytics: false, marketing: false }).expect(422);
    await send({
      anonymousId: 'kimlik',
      functional: false,
      analytics: false,
      marketing: false,
    }).expect(422);
    const rows = await t.prisma.consentRecord.findMany({
      where: { anonymousId, purpose: 'ANALYTICS' },
      orderBy: { id: 'asc' },
    });
    expect(rows.map((r) => r.granted)).toEqual([true, false]);
    expect(rows.every((r) => r.channel === 'WEB' && r.userId === null)).toBe(true);
    expect(JSON.stringify(rows, (_k, v: unknown) => (typeof v === 'bigint' ? 0 : v))).not.toContain(
      '198.51.100',
    );
    const m = await memberToken(t, 'riza@example.com');
    await send(
      { functional: true, analytics: false, marketing: false },
      { Authorization: `Bearer ${m.token}` },
    ).expect(202);
    expect(await t.prisma.consentRecord.count({ where: { userId: m.userId } })).toBe(3);
  });

  it('[REQ-HSP-012] kaydedilenler ve makine tarafından okunabilir dışa aktarma (gizli alan yok)', async () => {
    const m = await memberToken(t, 'favori@example.com');
    await http().put(`/v1/me/favorites/${listingId}`).set(as(m.token)).expect(200, { saved: true });
    await http().put(`/v1/me/favorites/${listingId}`).set(as(m.token)).expect(200, { saved: true });
    await http().get(`/v1/me/favorites/${listingId}`).set(as(m.token)).expect(200, { saved: true });
    const list = FavoriteList.parse(
      (await http().get('/v1/me/favorites').set(as(m.token)).expect(200)).body,
    );
    expect(list.data.map((f) => f.listing.id)).toEqual([listingId]);
    await http().get('/v1/me/favorites').expect(401);
    await http()
      .put('/v1/me/favorites/00000000-0000-4000-8000-000000000000')
      .set(as(m.token))
      .expect(404);

    const res = await http().get('/v1/me/export').set(as(m.token)).expect(200);
    const exp = AccountExport.parse(res.body);
    expect(exp.profile.email).toBe('favori@example.com');
    expect(exp.favorites.map((f) => f.listingId)).toEqual([listingId]);
    const raw = JSON.stringify(res.body);
    expect(raw).not.toMatch(/passwordHash|password_hash|tokenHash|\$argon2/);

    await http()
      .delete(`/v1/me/favorites/${listingId}`)
      .set(as(m.token))
      .expect(200, { saved: false });
  });

  it('[REQ-KVK-020] girişsiz silme: e-posta onayı → silme bekliyor (giriş kapalı) → bağlantıyla geri alma', async () => {
    const m = await memberToken(t, 'girissiz@example.com');
    const before = t.mail.sent.length;
    await http()
      .post('/v1/account-deletion/request')
      .set('X-Forwarded-For', nextIp())
      .send({ email: 'olmayan@example.com' })
      .expect(202, { accepted: true });
    expect(t.mail.sent.length).toBe(before); // hesabın varlığı sızdırılmaz
    await http()
      .post('/v1/account-deletion/request')
      .set('X-Forwarded-For', nextIp())
      .send({ email: 'Girissiz@Example.com' })
      .expect(202, { accepted: true });
    const confirm = belirtec('girissiz@example.com');
    const status = AccountDeletionStatus.parse(
      (await http().post('/v1/account-deletion/confirm').send({ token: confirm }).expect(200)).body,
    );
    expect(new Date(status.scheduledFor).getTime() - Date.now()).toBeGreaterThan(29 * 86_400_000);
    await http().post('/v1/account-deletion/confirm').send({ token: confirm }).expect(400);
    // Oturumlar kapandı; giriş açıklayıcı hatayla reddedilir.
    await http().get('/v1/me').set(as(m.token)).expect(401);
    const denied = await login('girissiz@example.com').expect(403);
    expect(Problem.parse(denied.body).code).toBe('ACCOUNT_PENDING_DELETION');

    await http()
      .post('/v1/account-deletion/cancel')
      .send({ token: belirtec('girissiz@example.com') })
      .expect(202);
    await login('girissiz@example.com').expect(200);
    const actions = (
      await t.prisma.auditLog.findMany({ where: { targetId: m.userId }, select: { action: true } })
    ).map((a) => a.action);
    expect(actions).toEqual(
      expect.arrayContaining(['account.deletion_requested', 'account.deletion_cancelled']),
    );
  });

  it('[REQ-HSP-011] [REQ-KVK-021] self-servis silme: parola ile; pencere sonunda veriler silinir, kayıt anonimleşir', async () => {
    const m = await memberToken(t, 'silinecek@example.com');
    const other = await memberToken(t, 'kalacak@example.com');
    for (const u of [m, other]) {
      await http().put(`/v1/me/favorites/${listingId}`).set(as(u.token)).expect(200);
    }
    await t.prisma.review.create({
      data: {
        listingId,
        userId: m.userId,
        rating: 4,
        body: 'Ocakbaşı ızgaralar lezzetliydi, servis hızlıydı ve fiyatlar makuldü; tekrar gelirim.',
        incentivized: false,
        declaredAt: new Date(),
        status: 'PUBLISHED',
        moderationMode: 'POST',
        publishedAt: new Date(),
      },
    });
    await http()
      .post('/v1/me/deletion')
      .set(as(m.token))
      .send({ password: 'yanlis-parola', confirm: true })
      .expect(401);
    await http()
      .post('/v1/me/deletion')
      .set(as(m.token))
      .send({ password: STAFF_PASSWORD, confirm: true })
      .expect(200);
    // Personel hesabı bu yolla silinemez (yetkiler önce yönetici tarafından kaldırılır).
    const staff = await staffToken(t, 'personel-silme@example.com', ['EDITOR']);
    await http()
      .post('/v1/me/deletion')
      .set(as(staff))
      .send({ password: STAFF_PASSWORD, confirm: true })
      .expect(409);

    const account = t.app.get(AccountService);
    expect(await account.purgeDue()).toBe(0); // pencere dolmadı
    await t.prisma.user.update({
      where: { id: m.userId },
      data: { deletionRequestedAt: new Date(Date.now() - 31 * 86_400_000) },
    });
    expect(await account.purgeDue()).toBe(1);

    const u = await t.prisma.user.findUniqueOrThrow({ where: { id: m.userId } });
    expect(u).toMatchObject({ status: 'DELETED', displayName: 'Silinmiş üye' });
    expect(u.email).not.toContain('silinecek');
    expect(await t.prisma.favorite.count({ where: { userId: m.userId } })).toBe(0);
    expect(await t.prisma.review.count({ where: { userId: m.userId } })).toBe(0);
    expect(await t.prisma.favorite.count({ where: { userId: other.userId } })).toBe(1);
    expect(await t.prisma.auditLog.count({ where: { action: 'account.deleted' } })).toBe(1);
    expect(
      t.mail.sent.some((x) => x.to === 'silinecek@example.com' && /silindi/.test(x.subject)),
    ).toBe(true);
    await login('silinecek@example.com').expect(401);
  });
});
