import type { CategorySchema } from '@incelemeler/contracts';
import { tr } from '@incelemeler/i18n';
import { archiveAttributeAction, archiveCriterionAction } from './schema-actions';
import { AttributeForm, CriterionForm } from './schema-forms';

/** Kategori düzenleme sayfasında özellik şeması ve kriterler (REQ-VER-003, Ek A6.3). */
export function SchemaSection({
  schema,
  canManage,
}: {
  schema: CategorySchema;
  canManage: boolean;
}) {
  const id = schema.categoryId;
  return (
    <>
      <section aria-labelledby="ozellikler" className="space-y-4">
        <h2 id="ozellikler" className="text-lg font-semibold">
          {tr.taxonomy.attributesTitle}
        </h2>
        <p className="text-sm text-text-secondary">
          {tr.taxonomy.attributesIntro} {tr.taxonomy.schemaVersion}: {schema.schemaVersion}
        </p>
        {schema.attributes.length === 0 ? (
          <p className="text-sm">{tr.taxonomy.noAttributes}</p>
        ) : (
          <ul
            className="divide-y divide-border-default rounded-md border border-border-default"
            data-testid="attribute-list"
          >
            {schema.attributes.map((a) => (
              <li
                key={a.id}
                className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm"
              >
                <span>
                  <strong>{a.label}</strong> <code className="text-xs">{a.key}</code> ·{' '}
                  {tr.taxonomy.types[a.type]}
                  {a.unit ? ` (${a.unit})` : ''}
                  {a.options.length ? ` · ${a.options.map((o) => o.label).join(', ')}` : ''}
                  <span className="block text-text-secondary">
                    {[
                      a.filterable ? tr.taxonomy.filterable : null,
                      a.showOnCard ? tr.taxonomy.showOnCard : null,
                      a.required ? tr.taxonomy.required : null,
                      a.inheritedFrom
                        ? `${tr.taxonomy.inheritedFrom}: ${a.inheritedFrom.name}`
                        : null,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </span>
                </span>
                {canManage && !a.inheritedFrom ? (
                  <form action={archiveAttributeAction}>
                    <input type="hidden" name="categoryId" value={id} />
                    <input type="hidden" name="attributeId" value={a.id} />
                    <button
                      type="submit"
                      className="min-h-11 text-brand-default underline"
                      aria-label={`${tr.taxonomy.archive}: ${a.label}`}
                    >
                      {tr.taxonomy.archive}
                    </button>
                  </form>
                ) : null}
              </li>
            ))}
          </ul>
        )}
        {canManage ? <AttributeForm categoryId={id} /> : null}
      </section>

      <section aria-labelledby="kriterler" className="space-y-4">
        <h2 id="kriterler" className="text-lg font-semibold">
          {tr.taxonomy.criteriaTitle}
        </h2>
        <p className="text-sm text-text-secondary">{tr.taxonomy.criteriaIntro}</p>
        {schema.criteriaInheritedFrom ? (
          <p className="text-sm">
            {tr.taxonomy.criteriaInherited} <strong>{schema.criteriaInheritedFrom.name}</strong>
          </p>
        ) : null}
        {schema.criteria.length === 0 ? (
          <p className="text-sm">{tr.taxonomy.noCriteria}</p>
        ) : (
          <ol
            className="divide-y divide-border-default rounded-md border border-border-default"
            data-testid="criteria-list"
          >
            {schema.criteria.map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-2 px-4 py-2 text-sm">
                <span>{c.name}</span>
                {canManage && !schema.criteriaInheritedFrom ? (
                  <form action={archiveCriterionAction}>
                    <input type="hidden" name="categoryId" value={id} />
                    <input type="hidden" name="criterionId" value={c.id} />
                    <button
                      type="submit"
                      className="min-h-11 text-brand-default underline"
                      aria-label={`${tr.taxonomy.archive}: ${c.name}`}
                    >
                      {tr.taxonomy.archive}
                    </button>
                  </form>
                ) : null}
              </li>
            ))}
          </ol>
        )}
        {canManage ? <CriterionForm categoryId={id} /> : null}
      </section>
    </>
  );
}
