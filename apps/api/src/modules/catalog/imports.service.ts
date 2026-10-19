import { HttpStatus, Injectable } from '@nestjs/common';
import {
  type AttributeDefinition,
  type ImportBatch,
  IMPORT_LIMITS,
  type ImportPreviewBody,
  type ImportRowReport,
  ListingContacts,
  type ListingKind,
} from '@incelemeler/contracts';
import { normalizeTr, slugifyTr } from '@incelemeler/utils';
import { ProblemException } from '../../common/problem.js';
import type { RequestMeta } from '../../common/request-meta.js';
import type { AdminArea, Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { AuthContext } from '../identity/auth.context.js';
import { OutboxService } from '../outbox/outbox.service.js';
import { AuditService } from '../platform/audit.service.js';
import { CategorySchemaService } from '../taxonomy/category-schema.service.js';
import { parseCsv } from './csv.js';
import {
  coerceAttribute,
  distanceMeters,
  mapHeaders,
  parseNumber,
  type RowError,
} from './import-rows.js';

/** Satırın listelemeye dönüşecek normalize hâli (yalnızca sunucuda saklanır). */
interface RowData {
  name: string;
  folded: string;
  shortDescription: string | null;
  contacts: Record<string, string>;
  location: {
    provinceId: string;
    districtId: string | null;
    neighborhood: string | null;
    addressLine: string | null;
    postalCode: string | null;
    latitude: number | null;
    longitude: number | null;
  } | null;
  priceLevel: number | null;
  attributes: Record<string, unknown>;
  product: { brand: string; model: string; gtin: string | null } | null;
  lodging: { tourismLicenseNo: string } | null;
}
type StoredRow = ImportRowReport & { data?: RowData };

const DETAIL_FIELDS: Record<string, ListingKind> = {
  brand: 'PRODUCT',
  model: 'PRODUCT',
  gtin: 'PRODUCT',
  tourismLicenseNo: 'LODGING',
};

const invalid = (code: string, title: string) =>
  new ProblemException(HttpStatus.UNPROCESSABLE_ENTITY, 'VALIDATION_FAILED', title, undefined, [
    { pointer: '/', code, message: title },
  ]);

/**
 * Toplu içe aktarma (REQ-LST-007): CSV → alan eşleme → satır doğrulama → yinelenen tespiti
 * (GTIN; normalize ad + 150 m; koordinatsızda normalize ad + ilçe) → önizleme → onay → geri alma.
 * Kaynak zorunludur; oluşan listelemeler TASLAK ve `dataOrigin=IMPORT`. Scraping ile elde edilmiş veri yasaktır (AK-07).
 */
@Injectable()
export class ImportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly outbox: OutboxService,
    private readonly schemas: CategorySchemaService,
  ) {}

  async list(): Promise<{ data: Omit<ImportBatch, 'rows'>[] }> {
    const rows = await this.prisma.importBatch.findMany({
      include: { primaryCategory: true },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return {
      data: rows.map((b) => {
        const { rows: _r, ...rest } = this.toDto(b);
        return rest;
      }),
    };
  }

  async get(id: string): Promise<ImportBatch> {
    const b = await this.prisma.importBatch.findUnique({
      where: { id },
      include: { primaryCategory: true },
    });
    if (!b) throw new ProblemException(HttpStatus.NOT_FOUND, 'NOT_FOUND', 'İçe aktarma bulunamadı');
    return this.toDto(b);
  }

  async preview(
    ctx: AuthContext,
    body: ImportPreviewBody,
    meta: RequestMeta,
  ): Promise<ImportBatch> {
    const category = await this.prisma.category.findUnique({
      where: { id: body.primaryCategoryId },
    });
    if (!category) throw invalid('not_found', 'Kategori bulunamadı');
    if (!category.allowedKinds.includes(body.kind)) {
      throw invalid('kind_not_allowed', 'Kategori bu türe izin vermiyor');
    }
    let parsed: { header: string[]; rows: string[][] };
    try {
      parsed = parseCsv(body.csv);
    } catch {
      throw invalid('csv_invalid', 'CSV okunamadı');
    }
    if (!parsed.header.length || !parsed.rows.length) throw invalid('csv_empty', 'CSV boş');
    if (parsed.rows.length > IMPORT_LIMITS.maxRows) {
      throw invalid('too_many_rows', `En fazla ${IMPORT_LIMITS.maxRows} satır`);
    }
    const schema = await this.schemas.effective(category.id);
    const defs = new Map(schema.definitions.map((d) => [d.key, d]));
    const { mapping, unmapped } = mapHeaders(parsed.header, body.mapping, new Set(defs.keys()));
    if (!Object.values(mapping).includes('name')) {
      throw invalid('name_column_required', 'Ad sütunu eşlenmeli');
    }
    const areas = await this.prisma.adminArea.findMany();
    const rows: StoredRow[] = [];
    for (const [i, cells] of parsed.rows.entries()) {
      const record: Record<string, string> = {};
      parsed.header.forEach((h, j) => {
        const target = mapping[h];
        if (target) record[target] = (cells[j] ?? '').trim();
      });
      rows.push(this.validateRow(i + 2, record, body.kind, defs, areas));
    }
    await this.markDuplicates(rows, body.kind);

    const batch = await this.prisma.$transaction(async (tx) => {
      const created = await tx.importBatch.create({
        data: {
          kind: body.kind,
          primaryCategoryId: category.id,
          source: body.source,
          fileName: body.fileName ?? null,
          mapping: { ...mapping, '#unmapped': unmapped.join('\u001f') },
          rows: rows as unknown as Prisma.InputJsonArray,
          rowCount: rows.length,
          validCount: rows.filter((r) => r.status === 'VALID').length,
          createdById: ctx.userId,
        },
        include: { primaryCategory: true },
      });
      await this.record(tx, ctx, 'catalog.import.preview', created.id, meta, {
        rows: rows.length,
        valid: created.validCount,
      });
      return created;
    });
    return this.toDto(batch);
  }

  async commit(ctx: AuthContext, id: string, meta: RequestMeta): Promise<ImportBatch> {
    const batch = await this.prisma.importBatch.findUnique({ where: { id } });
    if (!batch)
      throw new ProblemException(HttpStatus.NOT_FOUND, 'NOT_FOUND', 'İçe aktarma bulunamadı');
    if (batch.status !== 'PREVIEW') {
      throw new ProblemException(HttpStatus.CONFLICT, 'CONFLICT', 'Bu işlem zaten tamamlandı');
    }
    const rows = batch.rows as unknown as StoredRow[];
    // Önizlemeden bu yana eklenen kayıtlara karşı yinelenen denetimi yeniden yapılır.
    for (const r of rows)
      if (r.status === 'DUPLICATE' && r.duplicateOf?.listingId) r.status = 'VALID';
    await this.markDuplicates(rows, batch.kind);
    const schema = await this.schemas.effective(batch.primaryCategoryId);

    await this.prisma.$transaction(async (tx) => {
      const claim = await tx.importBatch.updateMany({
        where: { id, status: 'PREVIEW' },
        data: { status: 'COMMITTED', committedAt: new Date() },
      });
      if (claim.count === 0) {
        throw new ProblemException(HttpStatus.CONFLICT, 'CONFLICT', 'Bu işlem zaten tamamlandı');
      }
      let created = 0;
      for (const r of rows) {
        if (r.status !== 'VALID' || !r.data) {
          if (r.status === 'VALID') r.status = 'SKIPPED';
          continue;
        }
        const d = r.data;
        const listing = await tx.listing.create({
          data: {
            kind: batch.kind,
            slug: await this.freeSlug(tx, d.name),
            name: d.name,
            shortDescription: d.shortDescription,
            primaryCategoryId: batch.primaryCategoryId,
            priceLevel: d.priceLevel,
            attributes: d.attributes as Prisma.InputJsonObject,
            attributeSchemaVersion: schema.schemaVersion,
            contacts: d.contacts,
            dataOrigin: 'IMPORT',
            source: batch.source,
            status: 'DRAFT',
            importBatchId: batch.id,
            ...(d.location ? { location: { create: d.location } } : {}),
            ...(d.product ? { product: { create: d.product } } : {}),
            ...(d.lodging ? { lodging: { create: d.lodging } } : {}),
          },
        });
        r.status = 'CREATED';
        r.listingId = listing.id;
        created++;
        await this.outbox.enqueue(tx, {
          type: 'catalog.listing.created',
          aggregateType: 'listing',
          aggregateId: listing.id,
          payload: { importBatchId: batch.id },
        });
      }
      await tx.importBatch.update({
        where: { id },
        data: { rows: rows as unknown as Prisma.InputJsonArray, createdCount: created },
      });
      await this.record(tx, ctx, 'catalog.import.commit', id, meta, { created });
    });
    return this.get(id);
  }

  async rollback(ctx: AuthContext, id: string, meta: RequestMeta): Promise<ImportBatch> {
    const batch = await this.prisma.importBatch.findUnique({ where: { id } });
    if (!batch)
      throw new ProblemException(HttpStatus.NOT_FOUND, 'NOT_FOUND', 'İçe aktarma bulunamadı');
    if (batch.status !== 'COMMITTED') {
      throw new ProblemException(
        HttpStatus.CONFLICT,
        'CONFLICT',
        'Yalnızca tamamlanmış işlem geri alınır',
      );
    }
    const listings = await this.prisma.listing.findMany({
      where: { importBatchId: id, deletedAt: null },
    });
    const modified = listings.filter((l) => l.status !== 'DRAFT' || l.version > 1);
    if (modified.length) {
      throw new ProblemException(
        HttpStatus.CONFLICT,
        'CONFLICT',
        'İşlemden sonra düzenlenen ya da yayımlanan listelemeler var',
        undefined,
        [
          {
            pointer: '/listings',
            code: 'batch_modified',
            message: `${modified.length} listeleme değişmiş`,
          },
        ],
      );
    }
    await this.prisma.$transaction(async (tx) => {
      const now = new Date();
      await tx.listing.updateMany({
        where: { importBatchId: id, deletedAt: null, status: 'DRAFT', version: 1 },
        data: { deletedAt: now },
      });
      await tx.importBatch.update({
        where: { id },
        data: { status: 'ROLLED_BACK', rolledBackAt: now },
      });
      for (const l of listings) {
        await this.outbox.enqueue(tx, {
          type: 'catalog.listing.deleted',
          aggregateType: 'listing',
          aggregateId: l.id,
          payload: { importBatchId: id },
        });
      }
      await this.record(tx, ctx, 'catalog.import.rollback', id, meta, { removed: listings.length });
    });
    return this.get(id);
  }

  // ── Satır doğrulama ──

  private validateRow(
    row: number,
    rec: Record<string, string>,
    kind: ListingKind,
    defs: Map<string, AttributeDefinition>,
    areas: AdminArea[],
  ): StoredRow {
    const errors: RowError[] = [];
    const name = rec.name ?? '';
    if (name.length < 2 || name.length > 120) errors.push({ field: 'name', code: 'name_required' });

    for (const [field, forKind] of Object.entries(DETAIL_FIELDS)) {
      if (rec[field] && forKind !== kind) errors.push({ field, code: 'field_not_for_kind' });
    }

    let location: RowData['location'] = null;
    const lat = parseNumber(rec.latitude ?? '');
    const lng = parseNumber(rec.longitude ?? '');
    if ((lat === null) !== (lng === null) || Number.isNaN(lat) || Number.isNaN(lng)) {
      errors.push({ field: 'latitude', code: 'coordinates_invalid' });
    } else if (lat !== null && lng !== null && (Math.abs(lat) > 90 || Math.abs(lng) > 180)) {
      errors.push({ field: 'latitude', code: 'coordinates_invalid' });
    }
    const provinceRaw = rec.province;
    if (provinceRaw) {
      const key = normalizeTr(provinceRaw).folded;
      const province = areas.find(
        (a) =>
          a.level === 'PROVINCE' &&
          (normalizeTr(a.name).folded === key || a.code === provinceRaw.padStart(2, '0')),
      );
      if (!province) {
        errors.push({ field: 'province', code: 'province_not_found' });
      } else {
        let districtId: string | null = null;
        if (rec.district) {
          const dk = normalizeTr(rec.district).folded;
          const district = areas.find(
            (a) => a.parentId === province.id && normalizeTr(a.name).folded === dk,
          );
          if (!district) errors.push({ field: 'district', code: 'district_not_found' });
          else districtId = district.id;
        }
        const postal = rec.postalCode || null;
        if (postal && !/^\d{5}$/.test(postal))
          errors.push({ field: 'postalCode', code: 'postal_code_invalid' });
        location = {
          provinceId: province.id,
          districtId,
          neighborhood: rec.neighborhood || null,
          addressLine: rec.addressLine || null,
          postalCode: postal,
          latitude: lat !== null && !Number.isNaN(lat) ? Math.round(lat * 1e6) / 1e6 : null,
          longitude: lng !== null && !Number.isNaN(lng) ? Math.round(lng * 1e6) / 1e6 : null,
        };
      }
    } else if (rec.district || lat !== null) {
      errors.push({ field: 'province', code: 'province_required' });
    }

    const website =
      rec.website && !/^https?:\/\//i.test(rec.website) ? `https://${rec.website}` : rec.website;
    const contactsInput = Object.fromEntries(
      Object.entries({
        phone: rec.phone,
        website,
        email: rec.email,
        reservationUrl: rec.reservationUrl,
      }).filter(([, v]) => v),
    );
    const contacts = ListingContacts.safeParse(contactsInput);
    if (!contacts.success) {
      for (const issue of contacts.error.issues) {
        errors.push({ field: String(issue.path[0] ?? 'contacts'), code: 'contact_invalid' });
      }
    }

    let priceLevel: number | null = null;
    if (rec.priceLevel) {
      const p = /^₺{1,4}$/.test(rec.priceLevel)
        ? rec.priceLevel.length
        : parseNumber(rec.priceLevel);
      if (p === null || Number.isNaN(p) || !Number.isInteger(p) || p < 1 || p > 4) {
        errors.push({ field: 'priceLevel', code: 'price_level_invalid' });
      } else {
        priceLevel = p;
      }
    }

    const attributes: Record<string, unknown> = {};
    for (const [field, raw] of Object.entries(rec)) {
      if (!field.startsWith('attr.')) continue;
      const def = defs.get(field.slice(5));
      if (!def) continue;
      const r = coerceAttribute(def, raw);
      if (r.error) errors.push(r.error);
      else if (r.value !== undefined) attributes[def.key] = r.value;
    }

    let product: RowData['product'] = null;
    if (kind === 'PRODUCT' && (rec.brand || rec.model || rec.gtin)) {
      if (!rec.brand || !rec.model) errors.push({ field: 'brand', code: 'brand_model_required' });
      if (rec.gtin && !/^\d{8,14}$/.test(rec.gtin))
        errors.push({ field: 'gtin', code: 'gtin_invalid' });
      product = { brand: rec.brand ?? '', model: rec.model ?? '', gtin: rec.gtin || null };
    }
    const lodging =
      kind === 'LODGING' && rec.tourismLicenseNo
        ? { tourismLicenseNo: rec.tourismLicenseNo }
        : null;

    const report: StoredRow = {
      row,
      status: errors.length ? 'INVALID' : 'VALID',
      name: name || null,
      errors,
      duplicateOf: null,
      listingId: null,
    };
    if (!errors.length) {
      report.data = {
        name,
        folded: normalizeTr(name).folded,
        shortDescription: rec.shortDescription || null,
        contacts: contacts.success ? (contacts.data as Record<string, string>) : {},
        location,
        priceLevel,
        attributes,
        product,
        lodging,
      };
    }
    return report;
  }

  /** Dosya içi ve veritabanına karşı yinelenen tespiti; ilk geçerli kayıt korunur. */
  private async markDuplicates(rows: StoredRow[], kind: ListingKind): Promise<void> {
    const seen: StoredRow[] = [];
    for (const r of rows) {
      if (r.status !== 'VALID' || !r.data) continue;
      const d = r.data;
      const inFile = seen.find((s) => this.sameEntity(s.data!, d));
      if (inFile) {
        r.status = 'DUPLICATE';
        r.duplicateOf = {
          listingId: null,
          row: inFile.row,
          reason:
            d.product?.gtin && d.product.gtin === inFile.data!.product?.gtin
              ? 'gtin'
              : d.location?.latitude != null
                ? 'name_proximity'
                : 'name_district',
        };
        continue;
      }
      const existing = await this.existingDuplicate(d, kind);
      if (existing) {
        r.status = 'DUPLICATE';
        r.duplicateOf = { listingId: existing.id, row: null, reason: existing.reason };
        continue;
      }
      seen.push(r);
    }
  }

  private sameEntity(a: RowData, b: RowData): boolean {
    if (a.product?.gtin && a.product.gtin === b.product?.gtin) return true;
    if (a.folded !== b.folded) return false;
    const pa = a.location;
    const pb = b.location;
    if (pa?.latitude != null && pb?.latitude != null) {
      return (
        distanceMeters([pa.latitude, pa.longitude!], [pb.latitude, pb.longitude!]) <=
        IMPORT_LIMITS.duplicateRadiusMeters
      );
    }
    return !!pa?.districtId && pa.districtId === pb?.districtId;
  }

  private async existingDuplicate(
    d: RowData,
    kind: ListingKind,
  ): Promise<{ id: string; reason: 'gtin' | 'name_proximity' | 'name_district' } | null> {
    if (d.product?.gtin) {
      const p = await this.prisma.listingProduct.findFirst({
        where: { gtin: d.product.gtin, listing: { deletedAt: null } },
      });
      if (p) return { id: p.listingId, reason: 'gtin' };
    }
    const loc = d.location;
    if (loc?.latitude != null && loc.longitude != null) {
      const near = await this.prisma.$queryRaw<Array<{ id: string; name: string }>>`
        SELECT l.id, l.name FROM listings l JOIN listing_locations ll ON ll.listing_id = l.id
         WHERE l.kind = ${kind}::"ListingKind" AND l.deleted_at IS NULL
           AND ST_DWithin(ll.geo, ST_SetSRID(ST_MakePoint(${loc.longitude}, ${loc.latitude}), 4326)::geography,
                          ${IMPORT_LIMITS.duplicateRadiusMeters})`;
      const hit = near.find((n) => normalizeTr(n.name).folded === d.folded);
      return hit ? { id: hit.id, reason: 'name_proximity' } : null;
    }
    if (loc?.districtId) {
      const same = await this.prisma.listing.findMany({
        where: { kind, deletedAt: null, location: { districtId: loc.districtId } },
        select: { id: true, name: true },
      });
      const hit = same.find((n) => normalizeTr(n.name).folded === d.folded);
      return hit ? { id: hit.id, reason: 'name_district' } : null;
    }
    return null;
  }

  private async freeSlug(tx: Prisma.TransactionClient, name: string): Promise<string> {
    const base = slugifyTr(name) || 'listeleme';
    for (let n = 1; ; n++) {
      const slug = n === 1 ? base : `${base}-${n}`;
      const [taken, history] = await Promise.all([
        tx.listing.findUnique({ where: { slug }, select: { id: true } }),
        tx.slugHistory.findUnique({ where: { entityType_slug: { entityType: 'listing', slug } } }),
      ]);
      if (!taken && !history) return slug;
    }
  }

  private record(
    tx: Prisma.TransactionClient,
    ctx: AuthContext,
    action: string,
    targetId: string,
    meta: RequestMeta,
    summary: Prisma.InputJsonObject,
  ) {
    return this.audit.record(
      {
        actorId: ctx.userId,
        actorRole: ctx.roles.join(','),
        action,
        targetType: 'import_batch',
        targetId,
        summary,
        ipPrefix: meta.ipPrefix,
        traceId: meta.traceId,
      },
      tx,
    );
  }

  private toDto(
    b: Prisma.ImportBatchGetPayload<{ include: { primaryCategory: true } }>,
  ): ImportBatch {
    const { '#unmapped': unmappedRaw, ...mapping } = b.mapping as Record<string, string>;
    return {
      id: b.id,
      kind: b.kind,
      primaryCategory: { id: b.primaryCategory.id, name: b.primaryCategory.name },
      source: b.source,
      fileName: b.fileName,
      status: b.status,
      mapping,
      unmappedHeaders: unmappedRaw ? unmappedRaw.split('\u001f') : [],
      rowCount: b.rowCount,
      validCount: b.validCount,
      createdCount: b.createdCount,
      createdAt: b.createdAt.toISOString(),
      committedAt: b.committedAt?.toISOString() ?? null,
      rolledBackAt: b.rolledBackAt?.toISOString() ?? null,
      rows: (b.rows as unknown as StoredRow[]).map(({ data: _d, ...r }) => r),
    };
  }
}
