import { z } from 'zod';

/** Özellik tipleri (REQ-VER-003). */
export const AttributeType = z.enum([
  'BOOL',
  'ENUM',
  'MULTI_ENUM',
  'INT',
  'DECIMAL',
  'TEXT',
  'DATE',
]);
export type AttributeType = z.infer<typeof AttributeType>;

export const AttributeKey = z.string().regex(/^[a-z][a-zA-Z0-9]{1,39}$/);
export const AttributeOption = z.object({
  value: z
    .string()
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/)
    .max(40),
  label: z.string().trim().min(1).max(60),
});
export type AttributeOption = z.infer<typeof AttributeOption>;

export const AttributeValidation = z
  .object({
    min: z.number().optional(),
    max: z.number().optional(),
    maxLength: z.number().int().min(1).max(2000).optional(),
  })
  .strict();
export type AttributeValidation = z.infer<typeof AttributeValidation>;

export const AttributeDefinition = z
  .object({
    id: z.string(),
    categoryId: z.string(),
    key: z.string(),
    label: z.string(),
    type: AttributeType,
    options: z.array(AttributeOption),
    unit: z.string().nullable(),
    filterable: z.boolean(),
    showOnCard: z.boolean(),
    required: z.boolean(),
    validation: AttributeValidation,
    sortOrder: z.number().int(),
    archived: z.boolean(),
    version: z.number().int(),
  })
  .meta({ id: 'AttributeDefinition' });
export type AttributeDefinition = z.infer<typeof AttributeDefinition>;

const attributeFields = {
  label: z.string().trim().min(1).max(60),
  options: z.array(AttributeOption).max(50),
  unit: z.string().trim().min(1).max(12).nullable(),
  filterable: z.boolean(),
  showOnCard: z.boolean(),
  required: z.boolean(),
  validation: AttributeValidation,
  sortOrder: z.number().int().min(0).max(100_000),
};

export const AttributeCreateBody = z
  .object({
    key: AttributeKey,
    type: AttributeType,
    ...attributeFields,
    options: attributeFields.options.optional(),
    unit: attributeFields.unit.optional(),
    filterable: z.boolean().optional(),
    showOnCard: z.boolean().optional(),
    required: z.boolean().optional(),
    validation: AttributeValidation.optional(),
    sortOrder: attributeFields.sortOrder.optional(),
  })
  .strict()
  .meta({ id: 'AttributeCreateBody' });
export type AttributeCreateBody = z.infer<typeof AttributeCreateBody>;

/** Anahtar ve tip değişmez (mevcut verinin yorumu bozulmasın). */
export const AttributeUpdateBody = z
  .object({ version: z.number().int().min(1), ...attributeFields })
  .partial()
  .required({ version: true })
  .strict()
  .meta({ id: 'AttributeUpdateBody' });
export type AttributeUpdateBody = z.infer<typeof AttributeUpdateBody>;

export const ReviewCriterion = z
  .object({
    id: z.string(),
    categoryId: z.string(),
    key: z.string(),
    name: z.string(),
    description: z.string().nullable(),
    required: z.boolean(),
    sortOrder: z.number().int(),
    version: z.number().int(),
  })
  .meta({ id: 'ReviewCriterion' });
export type ReviewCriterion = z.infer<typeof ReviewCriterion>;

export const CriterionCreateBody = z
  .object({
    name: z.string().trim().min(2).max(40),
    description: z.string().trim().max(200).nullable().optional(),
    required: z.boolean().optional(),
    sortOrder: z.number().int().min(0).max(100_000).optional(),
  })
  .strict()
  .meta({ id: 'CriterionCreateBody' });
export type CriterionCreateBody = z.infer<typeof CriterionCreateBody>;

export const CriterionUpdateBody = z
  .object({
    version: z.number().int().min(1),
    name: z.string().trim().min(2).max(40).optional(),
    description: z.string().trim().max(200).nullable().optional(),
    required: z.boolean().optional(),
    sortOrder: z.number().int().min(0).max(100_000).optional(),
  })
  .strict()
  .meta({ id: 'CriterionUpdateBody' });
export type CriterionUpdateBody = z.infer<typeof CriterionUpdateBody>;

const CategoryRef = z.object({ id: z.string(), name: z.string() });

/** Bir kategorinin geçerli şeması: kendi + üst kategorilerden devralınan özellikler, etkin kriterler. */
export const CategorySchema = z
  .object({
    categoryId: z.string(),
    schemaVersion: z.number().int(),
    attributes: z.array(AttributeDefinition.extend({ inheritedFrom: CategoryRef.nullable() })),
    archivedAttributes: z.array(AttributeDefinition),
    criteria: z.array(ReviewCriterion),
    /** Kategorinin kendi kriteri yoksa en yakın üst kategorininki kullanılır. */
    criteriaInheritedFrom: CategoryRef.nullable(),
  })
  .meta({ id: 'CategorySchema' });
export type CategorySchema = z.infer<typeof CategorySchema>;

/** Kategori başına en fazla 6 etkin kriter (Ek A6.3). */
export const MAX_CRITERIA = 6;

type Def = Pick<AttributeDefinition, 'key' | 'type' | 'options' | 'required' | 'validation'>;

/**
 * Özellik değerlerini şemaya karşı doğrulayan zod şeması üretir (REQ-VER-003): bilinmeyen anahtar,
 * yanlış tip, izinsiz seçenek ve aralık dışı değer reddedilir; zorunlu özellik eksikse hata.
 */
export function attributeValuesSchema(defs: readonly Def[]) {
  const shape: Record<string, z.ZodType> = {};
  for (const d of defs) {
    const v = d.validation;
    let s: z.ZodType;
    switch (d.type) {
      case 'BOOL':
        s = z.boolean();
        break;
      case 'ENUM':
        s = z.enum(d.options.map((o) => o.value) as [string, ...string[]]);
        break;
      case 'MULTI_ENUM': {
        const allowed = z.enum(d.options.map((o) => o.value) as [string, ...string[]]);
        s = z
          .array(allowed)
          .min(1)
          .refine((a) => new Set(a).size === a.length, 'Yinelenen seçenek');
        break;
      }
      case 'INT': {
        let n = z.number().int();
        if (v.min !== undefined) n = n.min(v.min);
        if (v.max !== undefined) n = n.max(v.max);
        s = n;
        break;
      }
      case 'DECIMAL': {
        let n = z.number();
        if (v.min !== undefined) n = n.min(v.min);
        if (v.max !== undefined) n = n.max(v.max);
        s = n;
        break;
      }
      case 'TEXT':
        s = z
          .string()
          .trim()
          .min(1)
          .max(v.maxLength ?? 500);
        break;
      case 'DATE':
        s = z.iso.date();
        break;
    }
    shape[d.key] = d.required ? s : s.optional();
  }
  return z.object(shape).strict();
}
