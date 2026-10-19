import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  AdminDataRequest,
  AdminDataRequestList,
  PendingAcceptances,
  Problem,
} from '@incelemeler/contracts';
import { RetentionService } from '../src/modules/privacy/retention.service.js';
import { startTestApp, type TestContext } from './app.js';
import { memberToken, nextIp, STAFF_PASSWORD, staffToken } from './staff.js';

let t: TestContext;
let admin: string;
const http = () => request(t.app.getHttpServer());
const as = (token: string) => ({ Authorization: `Bearer ${token}`, 'X-Forwarded-For': nextIp() });
const DAY = 86_400_000;
const belirtec = (to: string) => {
  const m = [...t.mail.sent].reverse().find((x) => x.to === to);
  const match = /belirtec=([A-Za-z0-9_.%-]+)/.exec(m?.text ?? '');
  if (!match?.[1]) throw new Error(`${to} için bağlantı yok`);
  return decodeURIComponent(match[1]);
};

beforeAll(async () => {
  t = await startTestApp();
  admin = await staffToken(t, 'kvkk-yonetici@example.com', ['ADMIN']);
}, 120_000);

afterAll(async () => {
  await t?.close();
});

describe('KVKK (REQ-KVK-004/022/023/024)', () => {
  it('[REQ-KVK-022] başvuru: girişsizde e-posta doğrulaması, üyede oturumla; gereksiz kimlik verisi yok', async () => {
    const send = (body: Record<string, unknown>, headers: Record<string, string> = {}) =>
      http()
        .post('/v1/data-requests')
        .set({ 'X-Forwarded-For': nextIp(), ...headers })
        .send(body);
    const description = 'Hakkımda hangi verilerin işlendiğini öğrenmek istiyorum.';
    expect(
      Problem.parse((await send({ type: 'ACCESS', description }).expect(422)).body).errors?.[0]
        ?.code,
    ).toBe('required');
    expect(
      (await send({ type: 'ACCESS', description, email: 'Misafir@Example.com' }).expect(202)).body,
    ).toEqual({ accepted: true, verificationRequired: true });
    const guest = await t.prisma.dataSubjectRequest.findFirstOrThrow({
      where: { email: 'misafir@example.com' },
    });
    expect(guest.identityVerified).toBe(false);
    expect(guest.dueAt.getTime() - guest.receivedAt.getTime()).toBe(30 * DAY);
    await http()
      .post('/v1/data-requests/verify')
      .send({ token: belirtec('misafir@example.com') })
      .expect(202);
    expect(
      (await t.prisma.dataSubjectRequest.findUniqueOrThrow({ where: { id: guest.id } }))
        .identityVerified,
    ).toBe(true);
    await http()
      .post('/v1/data-requests/verify')
      .send({ token: 'sahte.belirtec-imzasiz-uzun-deger' })
      .expect(400);

    // Üye: oturumdaki e-posta kullanılır, doğrulanmış sayılır.
    const m = await memberToken(t, 'uye-kvkk@example.com');
    expect(
      (
        await send(
          { type: 'ERASURE', description, email: 'baskasi@example.com' },
          { Authorization: `Bearer ${m.token}` },
        ).expect(202)
      ).body,
    ).toEqual({ accepted: true, verificationRequired: false });
    const own = await t.prisma.dataSubjectRequest.findFirstOrThrow({
      where: { userId: m.userId },
    });
    expect(own).toMatchObject({ email: 'uye-kvkk@example.com', identityVerified: true });
  });

  it('[REQ-KVK-022] panel: süre sayacı, 20./27. gün uyarıları, süresi geçen alarmı, gerekçeli ret', async () => {
    const manual = async (daysAgo: number) =>
      AdminDataRequest.parse(
        (
          await http()
            .post('/v1/admin/data-requests')
            .set(as(admin))
            .send({
              type: 'INFO',
              email: `kanal-${daysAgo}@example.com`,
              description: 'Telefonla iletilen bilgi talebi, panelden kaydedildi.',
              receivedAt: new Date(Date.now() - daysAgo * DAY - 3_600_000).toISOString(),
            })
            .expect(201)
        ).body,
      );
    expect((await manual(21)).alert).toBe('WARN_20');
    expect((await manual(28)).alert).toBe('WARN_27');
    const late = await manual(31);
    expect(late.alert).toBe('OVERDUE');
    const list = AdminDataRequestList.parse(
      (await http().get('/v1/admin/data-requests').set(as(admin)).expect(200)).body,
    );
    expect(list.overdue).toBe(1);

    const patch = (body: Record<string, unknown>) =>
      http()
        .patch(`/v1/admin/data-requests/${late.id}`)
        .set(as(admin))
        .send({ version: late.version, ...body });
    await patch({ status: 'REJECTED' }).expect(422);
    const rejected = AdminDataRequest.parse(
      (
        await patch({
          status: 'REJECTED',
          rejectionReason: 'MANIFESTLY_UNFOUNDED',
          responseNote: 'Gerekçeli ret yanıtı gönderildi.',
        }).expect(200)
      ).body,
    );
    expect(rejected).toMatchObject({ status: 'REJECTED', alert: 'NONE' });
    expect(rejected.answeredAt).not.toBeNull();
    const editor = await staffToken(t, 'kvkk-editor@example.com', ['EDITOR']);
    await http().get('/v1/admin/data-requests').set(as(editor)).expect(403);
    expect(
      await t.prisma.auditLog.count({ where: { action: { startsWith: 'privacy.dsr.' } } }),
    ).toBe(4);
  });

  it('[REQ-KVK-004] hukuki metin sürümleri: kayıtta kabul; esaslı değişiklikte yeniden kabul; onaysız metin TASLAK', async () => {
    const docs = await t.prisma.legalDocumentVersion.findMany();
    expect(docs.map((d) => d.docType).sort()).toEqual(['COOKIE_POLICY', 'PRIVACY_NOTICE', 'TERMS']);
    expect(docs.every((d) => d.approvedBy === null && /^[0-9a-f]{64}$/.test(d.contentHash))).toBe(
      true,
    );
    await http()
      .post('/v1/auth/register')
      .set('X-Forwarded-For', nextIp())
      .send({
        email: 'yeni-uye@example.com',
        password: STAFF_PASSWORD,
        displayName: 'Yeni Üye',
        ageConfirmed: true,
        termsVersion: '2026-10-taslak',
      })
      .expect(202);
    const user = await t.prisma.user.findUniqueOrThrow({
      where: { email: 'yeni-uye@example.com' },
    });
    expect(await t.prisma.legalAcceptance.count({ where: { userId: user.id } })).toBe(2);

    const m = await memberToken(t, 'yeniden-kabul@example.com');
    const pending = async () =>
      PendingAcceptances.parse(
        (await http().get('/v1/me/legal-acceptances/pending').set(as(m.token)).expect(200)).body,
      );
    expect((await pending()).data).toEqual([]);
    await t.prisma.legalDocumentVersion.create({
      data: {
        docType: 'TERMS',
        version: '2026-11-taslak',
        effectiveAt: new Date(Date.now() - 1000),
        contentHash: 'a'.repeat(64),
        material: true,
      },
    });
    const p = await pending();
    expect(p.data).toMatchObject([{ docType: 'TERMS', version: '2026-11-taslak', draft: true }]);
    const after = PendingAcceptances.parse(
      (
        await http()
          .post('/v1/me/legal-acceptances')
          .set(as(m.token))
          .send({ versionIds: [p.data[0]!.id] })
          .expect(200)
      ).body,
    );
    expect(after.data).toEqual([]);
  });

  it('[REQ-KVK-023] [REQ-KVK-025] periyodik imha: süresi dolan kayıtlar silinir/anonimleşir, imha kaydı tutulur', async () => {
    const m = await memberToken(t, 'imha@example.com');
    const old = new Date(Date.now() - 400 * DAY);
    await t.prisma.emailToken.create({
      data: {
        userId: m.userId,
        purpose: 'VERIFY_EMAIL',
        tokenHash: 'eski'.padEnd(64, '0'),
        expiresAt: old,
      },
    });
    await t.prisma.searchEvent.create({
      data: { createdAt: old, queryNorm: 'eski sorgu', filters: {}, resultCount: 0 },
    });
    const anon = '0b6f3c1e-5d2a-4f7b-9c8e-1a2b3c4d5e6f';
    await t.prisma.consentRecord.createMany({
      data: [
        {
          createdAt: old,
          anonymousId: anon,
          purpose: 'ANALYTICS',
          granted: false,
          textVersion: 'x',
          channel: 'WEB',
          ipHash: 'eski',
        },
        {
          anonymousId: anon,
          purpose: 'ANALYTICS',
          granted: false,
          textVersion: 'x',
          channel: 'WEB',
          ipHash: 'yeni',
        },
      ],
    });
    const out = await t.app.get(RetentionService).run();
    expect(out['email_tokens']).toBeGreaterThanOrEqual(1);
    expect(out['search_events']).toBe(1);
    expect(out['consent_records.ip_hash']).toBe(1);
    const hashes = (
      await t.prisma.consentRecord.findMany({
        where: { anonymousId: anon },
        orderBy: { id: 'asc' },
      })
    ).map((r) => r.ipHash);
    expect(hashes).toEqual([null, 'yeni']);
    const logs = await t.prisma.destructionLog.findMany();
    expect(logs.map((l) => l.category)).toEqual(
      expect.arrayContaining(['email_tokens', 'search_events', 'consent_records.ip_hash']),
    );
    expect(logs.find((l) => l.category === 'consent_records.ip_hash')?.method).toBe('ANONYMIZE');
  });

  it('[REQ-KVK-024] ihlal kaydı yalnızca yönetici; denetim kaydına girer', async () => {
    await http()
      .post('/v1/admin/breaches')
      .set(as(admin))
      .send({
        detectedAt: new Date().toISOString(),
        summary: 'Tatbikat kaydı: test ortamında kurgusal ihlal senaryosu.',
        dataCategories: ['e-posta'],
      })
      .expect(201);
    const list = (await http().get('/v1/admin/breaches').set(as(admin)).expect(200)).body;
    expect(list.data[0]).toMatchObject({ stage: 'DETECTED', dataCategories: ['e-posta'] });
    expect(await t.prisma.auditLog.count({ where: { action: 'privacy.breach.created' } })).toBe(1);
  });
});
