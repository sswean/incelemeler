import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AdminApplication, AdminApplicationList, Problem } from '@incelemeler/contracts';
import { seedTaxonomy } from '../src/seed/seed-taxonomy.js';
import { startTestApp, type TestContext } from './app.js';
import { nextIp, staffToken } from './staff.js';

let t: TestContext;
let editor: string;
let sales: string;
let moderator: string;
const ids = { istanbul: '', kadikoy: '', ankara: '', restoranlar: '', otel: '' };
const http = () => request(t.app.getHttpServer());
const as = (token: string) => ({ Authorization: `Bearer ${token}`, 'X-Forwarded-For': nextIp() });
const belirtec = (to: string) => {
  const m = [...t.mail.sent].reverse().find((x) => x.to === to);
  const match = /belirtec=([A-Za-z0-9_.%-]+)/.exec(m?.text ?? '');
  if (!match?.[1]) throw new Error(`${to} için bağlantı yok`);
  return decodeURIComponent(match[1]);
};
let net = 0;
/** Her başvuru ayrı /24 ağından (önek başına hız sınırı ayrıca sınanır). */
const apply = (body: Record<string, unknown>, ip = `10.77.${++net}.1`) =>
  http().post('/v1/applications').set('X-Forwarded-For', ip).send(body);
const business = (email: string, extra: Record<string, unknown> = {}) => ({
  type: 'BUSINESS',
  businessName: 'Moda Sahil Lokantası',
  kind: 'PLACE',
  categoryId: ids.restoranlar,
  provinceId: ids.istanbul,
  districtId: ids.kadikoy,
  address: 'Caferağa Mah. Moda Cad. No: 12',
  phone: '+90 216 000 00 00',
  website: 'https://moda-sahil.example',
  contactName: 'Ayşe Yılmaz',
  contactRole: 'İşletme sahibi',
  email,
  privacyNoticeAck: true,
  authorityAck: true,
  ...extra,
});
const queue = async (token: string, query: Record<string, string> = {}) =>
  AdminApplicationList.parse(
    (await http().get('/v1/admin/applications').query(query).set(as(token)).expect(200)).body,
  ).data;

beforeAll(async () => {
  t = await startTestApp();
  await seedTaxonomy(t.prisma);
  const area = (where: object) => t.prisma.adminArea.findFirstOrThrow({ where });
  ids.istanbul = (await area({ level: 'PROVINCE', code: '34' })).id;
  ids.ankara = (await area({ level: 'PROVINCE', code: '06' })).id;
  ids.kadikoy = (await area({ parentId: ids.istanbul, slug: 'kadikoy' })).id;
  ids.restoranlar = (
    await t.prisma.category.findUniqueOrThrow({ where: { slug: 'restoranlar' } })
  ).id;
  ids.otel = (
    await t.prisma.category.findFirstOrThrow({ where: { allowedKinds: { has: 'LODGING' } } })
  ).id;
  editor = await staffToken(t, 'basvuru-editor@example.com', ['EDITOR']);
  sales = await staffToken(t, 'basvuru-satis@example.com', ['SALES']);
  moderator = await staffToken(t, 'basvuru-moderator@example.com', ['MODERATOR']);
}, 120_000);

afterAll(async () => {
  await t?.close();
});

describe('hesapsız başvurular (REQ-ISL-001/002, E2E-007)', () => {
  it('[REQ-ISL-001] işletme başvurusu: e-posta doğrulanmadan kuyruğa düşmez; doğrulama tek seferlik', async () => {
    expect((await apply(business('ayse@moda-sahil.example')).expect(202)).body).toEqual({
      accepted: true,
      verificationRequired: true,
    });
    const row = await t.prisma.application.findFirstOrThrow({
      where: { email: 'ayse@moda-sahil.example' },
    });
    expect(row).toMatchObject({ status: 'UNVERIFIED', type: 'BUSINESS', marketingConsentAt: null });
    expect(row.privacyNoticeVersion).toMatch(/taslak/);
    expect(await queue(editor)).toEqual([]);

    const token = belirtec('ayse@moda-sahil.example');
    await http().post('/v1/applications/verify').send({ token }).expect(202);
    await http().post('/v1/applications/verify').send({ token }).expect(202);
    const sent = t.mail.sent.filter((m) => m.to === 'ayse@moda-sahil.example');
    expect(sent.map((m) => m.subject)).toEqual([
      'İşletme başvurunu doğrula',
      'İşletme başvurun incelemede',
    ]);
    const [pending] = await queue(editor);
    expect(pending).toMatchObject({
      name: 'Moda Sahil Lokantası',
      status: 'PENDING',
      freeEmailDomain: false,
      business: {
        kind: 'PLACE',
        category: { name: 'Restoranlar' },
        province: { name: 'İstanbul' },
        district: { name: 'Kadıköy' },
      },
      advertising: null,
    });
    await http()
      .post('/v1/applications/verify')
      .send({ token: 'sahte.belirtec-imzasiz-uzun-deger' })
      .expect(400);
  });

  it('[REQ-ISL-001] [REQ-GUN-008] geçersiz başvurular reddedilir: uygun olmayan kategori/tür, ilçe uyuşmazlığı, eksik beyan', async () => {
    const code = async (body: Record<string, unknown>) =>
      Problem.parse((await apply(body).expect(422)).body).errors?.[0]?.code;
    expect(await code(business('x1@ornek.example', { categoryId: ids.otel }))).toBe(
      'category_not_allowed',
    );
    expect(await code(business('x2@ornek.example', { kind: 'LODGING' }))).toBeDefined();
    expect(await code(business('x3@ornek.example', { provinceId: ids.ankara }))).toBe(
      'district_mismatch',
    );
    expect(await code(business('x4@ornek.example', { authorityAck: false }))).toBeDefined();
    expect(await code(business('x5@ornek.example', { isAdmin: true }))).toBeDefined();
    expect(
      await t.prisma.application.count({ where: { email: { contains: '@ornek.example' } } }),
    ).toBe(0);
    // Aynı ağdan saatte en fazla 5 başvuru (REQ-GUN-008 kötüye kullanım koruması).
    const codes: number[] = [];
    for (let i = 0; i < 6; i++) {
      codes.push(
        (await apply(business(`y${i}@ornek.example`, { categoryId: ids.otel }), '10.78.0.9'))
          .status,
      );
    }
    expect(codes).toEqual([422, 422, 422, 422, 422, 429]);
  });

  it('[REQ-ISL-001] onay listeleme taslağı oluşturur (doğrulanmamış kaynak); ret gerekçeli e-posta; denetim kaydı', async () => {
    const [a] = await queue(editor);
    // Moderatör ve satış işletme başvurularını göremez/karara bağlayamaz.
    expect(await queue(moderator)).toEqual([]);
    expect(await queue(sales)).toEqual([]);
    await http()
      .post(`/v1/admin/applications/${a!.id}/decision`)
      .set(as(sales))
      .send({ version: a!.version, decision: 'APPROVE' })
      .expect(404);
    await http()
      .post(`/v1/admin/applications/${a!.id}/decision`)
      .set(as(editor))
      .send({ version: a!.version + 5, decision: 'APPROVE' })
      .expect(412);
    const approved = AdminApplication.parse(
      (
        await http()
          .post(`/v1/admin/applications/${a!.id}/decision`)
          .set(as(editor))
          .send({ version: a!.version, decision: 'APPROVE' })
          .expect(200)
      ).body,
    );
    expect(approved).toMatchObject({ status: 'APPROVED', rejectionReason: null });
    const listing = await t.prisma.listing.findUniqueOrThrow({
      where: { id: approved.listingId! },
      include: { location: true },
    });
    expect(listing).toMatchObject({
      status: 'DRAFT',
      kind: 'PLACE',
      slug: 'moda-sahil-lokantasi',
      sourceVerifiedAt: null,
    });
    expect(listing.source).toMatch(/İşletme başvurusu .* doğrulanmadı/);
    expect(listing.location).toMatchObject({ addressLine: 'Caferağa Mah. Moda Cad. No: 12' });
    // Karar verilmiş başvuru yeniden karara bağlanamaz.
    await http()
      .post(`/v1/admin/applications/${a!.id}/decision`)
      .set(as(editor))
      .send({ version: approved.version, decision: 'REJECT', reason: 'DUPLICATE' })
      .expect(409);

    // Aynı adla ikinci başvuru: gerekçesiz ret 422, gerekçeli ret e-postayla bildirilir.
    await apply(
      business('veli@gmail.com', {
        contactName: 'Veli Demir',
        address: undefined,
        serviceArea: 'Kadıköy ve Üsküdar',
      }),
    ).expect(202);
    await http()
      .post('/v1/applications/verify')
      .send({ token: belirtec('veli@gmail.com') })
      .expect(202);
    const second = (await queue(editor)).find((x) => x.email === 'veli@gmail.com')!;
    expect(second.freeEmailDomain).toBe(true);
    await http()
      .post(`/v1/admin/applications/${second.id}/decision`)
      .set(as(editor))
      .send({ version: second.version, decision: 'REJECT' })
      .expect(422);
    const rejected = AdminApplication.parse(
      (
        await http()
          .post(`/v1/admin/applications/${second.id}/decision`)
          .set(as(editor))
          .send({
            version: second.version,
            decision: 'REJECT',
            reason: 'DUPLICATE',
            note: 'İşletme zaten kayıtlı.',
          })
          .expect(200)
      ).body,
    );
    expect(rejected).toMatchObject({
      status: 'REJECTED',
      rejectionReason: 'DUPLICATE',
      listingId: null,
    });
    const mail = [...t.mail.sent].reverse().find((m) => m.to === 'veli@gmail.com')!;
    expect(mail.text).toContain('Bu işletme için kayıt ya da başvuru zaten var');
    expect(mail.text).toContain('İşletme zaten kayıtlı.');
    const audit = await t.prisma.auditLog.findMany({
      where: { action: { startsWith: 'application.' } },
      orderBy: { createdAt: 'asc' },
    });
    expect(audit.map((x) => x.action)).toEqual(['application.approved', 'application.rejected']);
    expect(JSON.stringify(audit)).not.toMatch(/veli@|ayse@/);
  });

  it('[REQ-ISL-002] reklam başvurusu: ticari ileti izni ayrı ve isteğe bağlı; satış kuyruğunda görünür, editörde görünmez', async () => {
    const ad = (email: string, marketingConsent?: boolean) =>
      apply({
        type: 'ADVERTISING',
        organizationName: 'Örnek Ajans',
        contactName: 'Mehmet Kaya',
        email,
        products: ['SPONSORED_PLACEMENT', 'SPONSORED_CONTENT'],
        provinceIds: [ids.istanbul],
        categoryIds: [ids.restoranlar],
        budgetRange: 'FROM_10K_TO_50K',
        message: 'İstanbul restoranları için yerleşim almak istiyoruz.',
        privacyNoticeAck: true,
        ...(marketingConsent === undefined ? {} : { marketingConsent }),
      }).expect(202);
    await ad('mehmet@ajans.example');
    await ad('zeynep@ajans.example', true);
    for (const e of ['mehmet@ajans.example', 'zeynep@ajans.example']) {
      await http()
        .post('/v1/applications/verify')
        .send({ token: belirtec(e) })
        .expect(202);
    }
    const list = await queue(sales, { type: 'ADVERTISING' });
    expect(list.map((x) => [x.email, x.advertising?.marketingConsent])).toEqual([
      ['mehmet@ajans.example', false],
      ['zeynep@ajans.example', true],
    ]);
    expect(list[0]!.advertising).toMatchObject({
      products: ['SPONSORED_PLACEMENT', 'SPONSORED_CONTENT'],
      provinces: [{ name: 'İstanbul' }],
      categories: [{ name: 'Restoranlar' }],
      budgetRange: 'FROM_10K_TO_50K',
    });
    expect((await queue(editor, { type: 'ADVERTISING' })).length).toBe(0);
    const approved = AdminApplication.parse(
      (
        await http()
          .post(`/v1/admin/applications/${list[0]!.id}/decision`)
          .set(as(sales))
          .send({ version: list[0]!.version, decision: 'APPROVE' })
          .expect(200)
      ).body,
    );
    expect(approved).toMatchObject({ status: 'APPROVED', listingId: null });
    // Veritabanı da ticari izni yalnızca reklam başvurusunda kabul eder.
    await expect(
      t.prisma.application.updateMany({
        where: { type: 'BUSINESS' },
        data: { marketingConsentAt: new Date() },
      }),
    ).rejects.toThrow();
  });
});
