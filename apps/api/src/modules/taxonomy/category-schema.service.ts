import { HttpStatus, Injectable } from '@nestjs/common';
import {
  type AttributeCreateBody,
  type AttributeDefinition,
  type AttributeOption,
  type AttributeUpdateBody,
  type AttributeValidation,
  type CategorySchema,
  type CriterionCreateBody,
  type CriterionUpdateBody,
  MAX_CRITERIA,
  type ReviewCriterion,
} from '@incelemeler/contracts';
import { slugifyTr } from '@incelemeler/utils';
import { type FieldError, ProblemException } from '../../common/problem.js';
import type { RequestMeta } from '../../common/request-meta.js';
import type {
  AttributeDefinition as AttributeRow,
  Category,
  Prisma,
  ReviewCriterion as CriterionRow,
} from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { AuthContext } from '../identity/auth.context.js';
import { OutboxService } from '../outbox/outbox.service.js';
import { AuditService } from '../platform/audit.service.js';

type Tx = Prisma.TransactionClient;
const CHOICE_TYPES = new Set(['ENUM', 'MULTI_ENUM']);
const NUMERIC_TYPES = new Set(['INT', 'DECIMAL']);

function invalid(errors: FieldError[]): ProblemException {
  return new ProblemException(
    HttpStatus.UNPROCESSABLE_ENTITY,
    'VALIDATION_FAILED',
    'Şema kuralları sağlanmadı',
    undefined,
    errors,
  );
}
const err = (pointer: string, code: string, message: string): FieldError => ({
  pointer,
  code,
  message,
});

/** Tip ile seçenek/birim/doğrulama/filtre alanlarının tutarlılığı. */
function checkDefinition(d: {
  type: string;
  options: AttributeOption[];
  unit: string | null;
  validation: AttributeValidation;
  filterable: boolean;
}): FieldError[] {
  const out: FieldError[] = [];
  if (CHOICE_TYPES.has(d.type)) {
    const values = d.options.map((o) => o.value);
    if (values.length < 2) out.push(err('/options', 'options_required', 'En az 2 seçenek gerekli'));
    if (new Set(values).size !== values.length) {
      out.push(err('/options', 'options_duplicate', 'Seçenek değerleri benzersiz olmalı'));
    }
  } else if (d.options.length) {
    out.push(err('/options', 'options_not_allowed', 'Bu tipte seçenek tanımlanmaz'));
  }
  if (d.unit && !NUMERIC_TYPES.has(d.type)) {
    out.push(err('/unit', 'unit_not_allowed', 'Birim yalnızca sayısal tiplerde'));
  }
  const v = d.validation;
  if ((v.min !== undefined || v.max !== undefined) && !NUMERIC_TYPES.has(d.type)) {
    out.push(err('/validation', 'range_not_allowed', 'Aralık yalnızca sayısal tiplerde'));
  }
  if (v.min !== undefined && v.max !== undefined && v.min > v.max) {
    out.push(err('/validation', 'range_invalid', 'En küçük değer en büyükten büyük olamaz'));
  }
  if (v.maxLength !== undefined && d.type !== 'TEXT') {
    out.push(err('/validation', 'max_length_not_allowed', 'Uzunluk sınırı yalnızca metinde'));
  }
  if (d.filterable && d.type === 'TEXT') {
    out.push(err('/filterable', 'text_not_filterable', 'Serbest metin filtrelenemez'));
  }
  return out;
}

/**
 * Kategori özellik şeması (REQ-VER-003) ve değerlendirme kriterleri (Ek A6.3).
 * Özellikler üst kategorilerden devralınır; anahtar ağaç dalında benzersizdir.
 * Her şema değişikliği kategori ve alt kategorilerinde yeni, değişmez bir sürüm üretir.
 */
@Injectable()
export class CategorySchemaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly outbox: OutboxService,
  ) {}

  async getSchema(categoryId: string): Promise<CategorySchema> {
    const category = await this.category(categoryId);
    const chain = await this.chain(category);
    const attrs = await this.prisma.attributeDefinition.findMany({
      where: { categoryId: { in: chain.map((c) => c.id) } },
    });
    const depth = new Map(chain.map((c, i) => [c.id, i]));
    const active = attrs
      .filter((a) => !a.archivedAt)
      .sort(
        (a, b) => depth.get(a.categoryId)! - depth.get(b.categoryId)! || a.sortOrder - b.sortOrder,
      );
    const crit = await this.effectiveCriteria(chain);
    return {
      categoryId,
      schemaVersion: category.attributeSchemaVersion,
      attributes: active.map((a) => {
        const owner = chain.find((c) => c.id === a.categoryId)!;
        return {
          ...toAttribute(a),
          inheritedFrom: owner.id === categoryId ? null : { id: owner.id, name: owner.name },
        };
      }),
      archivedAttributes: attrs
        .filter((a) => a.archivedAt && a.categoryId === categoryId)
        .map(toAttribute),
      criteria: crit.criteria.map(toCriterion),
      criteriaInheritedFrom:
        crit.owner && crit.owner.id !== categoryId
          ? { id: crit.owner.id, name: crit.owner.name }
          : null,
    };
  }

  /** Listeleme yazımı için: kategori zinciri ve etkin (arşivlenmemiş) özellik tanımları. */
  async effective(categoryId: string): Promise<{
    chain: Category[];
    definitions: AttributeDefinition[];
    schemaVersion: number;
  }> {
    const category = await this.category(categoryId);
    const chain = await this.chain(category);
    const rows = await this.prisma.attributeDefinition.findMany({
      where: { categoryId: { in: chain.map((c) => c.id) }, archivedAt: null },
      orderBy: [{ sortOrder: 'asc' }, { key: 'asc' }],
    });
    return {
      chain,
      definitions: rows.map(toAttribute),
      schemaVersion: category.attributeSchemaVersion,
    };
  }

  // ── Özellikler ──

  async createAttribute(
    ctx: AuthContext,
    categoryId: string,
    body: AttributeCreateBody,
    meta: RequestMeta,
  ): Promise<AttributeDefinition> {
    const category = await this.category(categoryId);
    const def = {
      type: body.type,
      options: body.options ?? [],
      unit: body.unit ?? null,
      validation: body.validation ?? {},
      filterable: body.filterable ?? false,
    };
    const errors = checkDefinition(def);
    const branch = [...(await this.chain(category)), ...(await this.descendants(categoryId))];
    const taken = await this.prisma.attributeDefinition.count({
      where: { key: body.key, categoryId: { in: branch.map((c) => c.id) } },
    });
    if (taken) errors.push(err('/key', 'key_taken', 'Bu anahtar bu dalda kullanılıyor'));
    if (body.required && (await this.listingCount(categoryId)) > 0) {
      errors.push(
        err(
          '/required',
          'required_with_listings',
          'Listelemesi olan dalda zorunlu özellik eklenemez',
        ),
      );
    }
    if (errors.length) throw invalid(errors);

    return this.prisma.$transaction(async (tx) => {
      const row = await tx.attributeDefinition.create({
        data: {
          categoryId,
          key: body.key,
          label: body.label,
          type: body.type,
          options: def.options,
          unit: def.unit,
          filterable: def.filterable,
          showOnCard: body.showOnCard ?? false,
          required: body.required ?? false,
          validation: def.validation,
          sortOrder: body.sortOrder ?? 0,
        },
      });
      await this.schemaChanged(tx, ctx, category, 'taxonomy.attribute.create', row.id, meta, {
        after: snapshotAttr(row),
      });
      return toAttribute(row);
    });
  }

  async updateAttribute(
    ctx: AuthContext,
    categoryId: string,
    attributeId: string,
    body: AttributeUpdateBody,
    meta: RequestMeta,
  ): Promise<AttributeDefinition> {
    const category = await this.category(categoryId);
    const current = await this.prisma.attributeDefinition.findFirst({
      where: { id: attributeId, categoryId, archivedAt: null },
    });
    if (!current) throw notFound('Özellik bulunamadı');
    if (current.version !== body.version) throw versionConflict();
    const merged = {
      type: current.type,
      options: body.options ?? (current.options as AttributeOption[]),
      unit: body.unit !== undefined ? body.unit : current.unit,
      validation: body.validation ?? (current.validation as AttributeValidation),
      filterable: body.filterable ?? current.filterable,
    };
    const errors = checkDefinition(merged);
    if (body.options && CHOICE_TYPES.has(current.type)) {
      const kept = new Set(body.options.map((o) => o.value));
      const removed = (current.options as AttributeOption[])
        .map((o) => o.value)
        .filter((v) => !kept.has(v));
      if (removed.length && (await this.optionInUse(categoryId, current.key, removed))) {
        errors.push(
          err('/options', 'option_in_use', 'Kaldırılan seçenek listelemelerde kullanılıyor'),
        );
      }
    }
    if (body.required && !current.required && (await this.listingCount(categoryId)) > 0) {
      errors.push(
        err(
          '/required',
          'required_with_listings',
          'Listelemesi olan dalda özellik zorunlu yapılamaz',
        ),
      );
    }
    if (errors.length) throw invalid(errors);

    return this.prisma.$transaction(async (tx) => {
      const res = await tx.attributeDefinition.updateMany({
        where: { id: attributeId, version: body.version },
        data: {
          ...(body.label !== undefined ? { label: body.label } : {}),
          ...(body.showOnCard !== undefined ? { showOnCard: body.showOnCard } : {}),
          ...(body.required !== undefined ? { required: body.required } : {}),
          ...(body.sortOrder !== undefined ? { sortOrder: body.sortOrder } : {}),
          options: merged.options,
          unit: merged.unit,
          validation: merged.validation,
          filterable: merged.filterable,
          version: { increment: 1 },
        },
      });
      if (res.count === 0) throw versionConflict();
      const row = await tx.attributeDefinition.findUniqueOrThrow({ where: { id: attributeId } });
      await this.schemaChanged(tx, ctx, category, 'taxonomy.attribute.update', row.id, meta, {
        before: snapshotAttr(current),
        after: snapshotAttr(row),
      });
      return toAttribute(row);
    });
  }

  async archiveAttribute(
    ctx: AuthContext,
    categoryId: string,
    attributeId: string,
    meta: RequestMeta,
  ): Promise<void> {
    const category = await this.category(categoryId);
    await this.prisma.$transaction(async (tx) => {
      const res = await tx.attributeDefinition.updateMany({
        where: { id: attributeId, categoryId, archivedAt: null },
        data: { archivedAt: new Date(), version: { increment: 1 } },
      });
      if (res.count === 0) throw notFound('Özellik bulunamadı');
      await this.schemaChanged(tx, ctx, category, 'taxonomy.attribute.archive', attributeId, meta);
    });
  }

  // ── Değerlendirme kriterleri ──

  async createCriterion(
    ctx: AuthContext,
    categoryId: string,
    body: CriterionCreateBody,
    meta: RequestMeta,
  ): Promise<ReviewCriterion> {
    await this.category(categoryId);
    const key = slugifyTr(body.name);
    const [activeCount, taken] = await Promise.all([
      this.prisma.reviewCriterion.count({ where: { categoryId, archivedAt: null } }),
      this.prisma.reviewCriterion.findUnique({ where: { categoryId_key: { categoryId, key } } }),
    ]);
    const errors: FieldError[] = [];
    if (activeCount >= MAX_CRITERIA) {
      errors.push(
        err('/name', 'criteria_limit', `Bir kategoride en fazla ${MAX_CRITERIA} kriter olur`),
      );
    }
    if (taken) errors.push(err('/name', 'criterion_taken', 'Bu adla bir kriter zaten var'));
    if (errors.length) throw invalid(errors);
    return this.prisma.$transaction(async (tx) => {
      const row = await tx.reviewCriterion.create({
        data: {
          categoryId,
          key,
          name: body.name,
          description: body.description ?? null,
          required: body.required ?? false,
          sortOrder: body.sortOrder ?? (activeCount + 1) * 10,
        },
      });
      await this.record(tx, ctx, 'taxonomy.criterion.create', row.id, meta, { after: row.name });
      await this.outbox.enqueue(tx, {
        type: 'taxonomy.criteria.changed',
        aggregateType: 'category',
        aggregateId: categoryId,
      });
      return toCriterion(row);
    });
  }

  async updateCriterion(
    ctx: AuthContext,
    categoryId: string,
    criterionId: string,
    body: CriterionUpdateBody,
    meta: RequestMeta,
  ): Promise<ReviewCriterion> {
    return this.prisma.$transaction(async (tx) => {
      const current = await tx.reviewCriterion.findFirst({
        where: { id: criterionId, categoryId, archivedAt: null },
      });
      if (!current) throw notFound('Kriter bulunamadı');
      const res = await tx.reviewCriterion.updateMany({
        where: { id: criterionId, version: body.version },
        data: {
          ...(body.name !== undefined ? { name: body.name } : {}),
          ...(body.description !== undefined ? { description: body.description } : {}),
          ...(body.required !== undefined ? { required: body.required } : {}),
          ...(body.sortOrder !== undefined ? { sortOrder: body.sortOrder } : {}),
          version: { increment: 1 },
        },
      });
      if (res.count === 0) throw versionConflict();
      const row = await tx.reviewCriterion.findUniqueOrThrow({ where: { id: criterionId } });
      await this.record(tx, ctx, 'taxonomy.criterion.update', row.id, meta, {
        before: current.name,
        after: row.name,
      });
      await this.outbox.enqueue(tx, {
        type: 'taxonomy.criteria.changed',
        aggregateType: 'category',
        aggregateId: categoryId,
      });
      return toCriterion(row);
    });
  }

  async archiveCriterion(
    ctx: AuthContext,
    categoryId: string,
    criterionId: string,
    meta: RequestMeta,
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const res = await tx.reviewCriterion.updateMany({
        where: { id: criterionId, categoryId, archivedAt: null },
        data: { archivedAt: new Date(), version: { increment: 1 } },
      });
      if (res.count === 0) throw notFound('Kriter bulunamadı');
      await this.record(tx, ctx, 'taxonomy.criterion.archive', criterionId, meta);
      await this.outbox.enqueue(tx, {
        type: 'taxonomy.criteria.changed',
        aggregateType: 'category',
        aggregateId: categoryId,
      });
    });
  }

  // ── Yardımcılar ──

  /** Kategori ve tüm alt kategorileri için yeni şema sürümü + denetim kaydı + outbox olayı. */
  private async schemaChanged(
    tx: Tx,
    ctx: AuthContext,
    category: Category,
    action: string,
    targetId: string,
    meta: RequestMeta,
    summary?: Prisma.InputJsonObject,
  ): Promise<void> {
    const affected = [category, ...(await this.descendants(category.id, tx))];
    for (const c of affected) {
      const chainIds = (await this.chain(c, tx)).map((x) => x.id);
      const defs = await tx.attributeDefinition.findMany({
        where: { categoryId: { in: chainIds }, archivedAt: null },
        orderBy: [{ sortOrder: 'asc' }, { key: 'asc' }],
      });
      const updated = await tx.category.update({
        where: { id: c.id },
        data: { attributeSchemaVersion: { increment: 1 } },
      });
      await tx.categorySchemaVersion.create({
        data: {
          categoryId: c.id,
          version: updated.attributeSchemaVersion,
          definitions: defs.map(snapshotAttr),
          createdBy: ctx.userId,
        },
      });
    }
    await this.record(tx, ctx, action, targetId, meta, {
      categoryId: category.id,
      ...(summary ?? {}),
    });
    await this.outbox.enqueue(tx, {
      type: 'taxonomy.schema.changed',
      aggregateType: 'category',
      aggregateId: category.id,
      payload: { affected: affected.map((c) => c.id) },
    });
  }

  private record(
    tx: Tx,
    ctx: AuthContext,
    action: string,
    targetId: string,
    meta: RequestMeta,
    summary?: Prisma.InputJsonValue,
  ) {
    return this.audit.record(
      {
        actorId: ctx.userId,
        actorRole: ctx.roles.join(','),
        action,
        targetType: action.split('.')[1] ?? 'taxonomy',
        targetId,
        summary,
        ipPrefix: meta.ipPrefix,
        traceId: meta.traceId,
      },
      tx,
    );
  }

  private async category(id: string): Promise<Category> {
    const c = await this.prisma.category.findUnique({ where: { id } });
    if (!c) throw notFound('Kategori bulunamadı');
    return c;
  }

  /** Kökten kategoriye kadar zincir (en fazla 3). */
  private async chain(c: Category, tx: Tx = this.prisma): Promise<Category[]> {
    const out = [c];
    let parentId = c.parentId;
    while (parentId) {
      const p = await tx.category.findUniqueOrThrow({ where: { id: parentId } });
      out.unshift(p);
      parentId = p.parentId;
    }
    return out;
  }

  private async descendants(id: string, tx: Tx = this.prisma): Promise<Category[]> {
    const children = await tx.category.findMany({ where: { parentId: id } });
    const grandchildren = children.length
      ? await tx.category.findMany({ where: { parentId: { in: children.map((c) => c.id) } } })
      : [];
    return [...children, ...grandchildren];
  }

  private async listingCount(categoryId: string): Promise<number> {
    const ids = [categoryId, ...(await this.descendants(categoryId)).map((c) => c.id)];
    return this.prisma.listing.count({ where: { primaryCategoryId: { in: ids } } });
  }

  private async optionInUse(categoryId: string, key: string, values: string[]): Promise<boolean> {
    const ids = [categoryId, ...(await this.descendants(categoryId)).map((c) => c.id)];
    const rows = await this.prisma.$queryRaw<Array<{ n: bigint }>>`
      SELECT count(*) AS n FROM listings
       WHERE primary_category_id = ANY(${ids}::uuid[])
         AND (attributes->>${key} = ANY(${values}::text[])
              OR (jsonb_typeof(attributes->${key}) = 'array' AND attributes->${key} ?| ${values}::text[]))`;
    return Number(rows[0]?.n ?? 0) > 0;
  }

  private async effectiveCriteria(
    chain: Category[],
  ): Promise<{ owner: Category | null; criteria: CriterionRow[] }> {
    const rows = await this.prisma.reviewCriterion.findMany({
      where: { categoryId: { in: chain.map((c) => c.id) }, archivedAt: null },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
    for (const c of [...chain].reverse()) {
      const own = rows.filter((r) => r.categoryId === c.id);
      if (own.length) return { owner: c, criteria: own };
    }
    return { owner: null, criteria: [] };
  }
}

function toAttribute(a: AttributeRow): AttributeDefinition {
  return {
    id: a.id,
    categoryId: a.categoryId,
    key: a.key,
    label: a.label,
    type: a.type,
    options: a.options as AttributeOption[],
    unit: a.unit,
    filterable: a.filterable,
    showOnCard: a.showOnCard,
    required: a.required,
    validation: a.validation as AttributeValidation,
    sortOrder: a.sortOrder,
    archived: a.archivedAt !== null,
    version: a.version,
  };
}

export function snapshotAttr(a: AttributeRow): Prisma.InputJsonObject {
  return {
    id: a.id,
    categoryId: a.categoryId,
    key: a.key,
    label: a.label,
    type: a.type,
    options: a.options as Prisma.InputJsonArray,
    unit: a.unit,
    filterable: a.filterable,
    showOnCard: a.showOnCard,
    required: a.required,
    validation: a.validation as Prisma.InputJsonObject,
  };
}

function toCriterion(c: CriterionRow): ReviewCriterion {
  return {
    id: c.id,
    categoryId: c.categoryId,
    key: c.key,
    name: c.name,
    description: c.description,
    required: c.required,
    sortOrder: c.sortOrder,
    version: c.version,
  };
}

function notFound(title: string): ProblemException {
  return new ProblemException(HttpStatus.NOT_FOUND, 'NOT_FOUND', title);
}

function versionConflict(): ProblemException {
  return new ProblemException(
    HttpStatus.PRECONDITION_FAILED,
    'PRECONDITION_FAILED',
    'Kayıt başka biri tarafından değiştirildi; sayfayı yenileyip yeniden dene',
  );
}
