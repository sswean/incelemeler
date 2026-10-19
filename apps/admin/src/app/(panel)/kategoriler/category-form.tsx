'use client';

import Link from 'next/link';
import { useActionState, useState } from 'react';
import type { AdminCategory } from '@incelemeler/contracts';
import { tr } from '@incelemeler/i18n';
import { Alert, SubmitButton } from '../../../components/ui';
import { errorMessage } from '../../../lib/errors';
import { type CategoryFormState, saveCategoryAction } from './actions';
import { fieldErrorMessage } from './field-errors';

const KINDS = Object.keys(tr.taxonomy.kindLabels) as Array<keyof typeof tr.taxonomy.kindLabels>;
const FLAGS = [
  'ymyl',
  'requiresExpertReview',
  'ugcEnabled',
  'sponsorshipAllowed',
  'requiresLicense',
] as const;
type FlagKey = (typeof FLAGS)[number];

const inputClass =
  'block w-full rounded-md border border-border-strong bg-bg-default px-3 py-2 text-base';

export function CategoryForm({
  category,
  parents,
}: {
  category?: AdminCategory;
  /** Yalnızca oluşturma: seçilebilir üst kategoriler (derinlik ≤ 2). */
  parents: AdminCategory[];
}) {
  const [state, action] = useActionState<CategoryFormState, FormData>(saveCategoryAction, {});
  const defaults: Record<FlagKey, boolean> = category ?? {
    ymyl: false,
    requiresExpertReview: false,
    ugcEnabled: true,
    sponsorshipAllowed: true,
    requiresLicense: false,
  };
  const [flags, setFlags] = useState(defaults);
  const [parentId, setParentId] = useState(category?.parentId ?? '');
  const fe = state.fieldErrors ?? {};
  const err = (key: string) => {
    const msg = fieldErrorMessage(fe[key]);
    return msg ? (
      <p id={`${key}-hata`} className="text-sm text-danger-text">
        {msg}
      </p>
    ) : null;
  };

  return (
    <form action={action} className="space-y-6" noValidate={false}>
      {state.error ? (
        <Alert kind="error">
          {Object.keys(fe).length ? tr.errors.VALIDATION_FAILED : errorMessage(state.error)}
        </Alert>
      ) : null}
      {category ? <input type="hidden" name="id" value={category.id} /> : null}
      {category ? <input type="hidden" name="version" value={category.version} /> : null}

      <div className="space-y-1">
        <label htmlFor="name" className="block text-sm font-medium">
          {tr.taxonomy.name}
        </label>
        <input
          id="name"
          name="name"
          required
          minLength={2}
          maxLength={80}
          defaultValue={category?.name}
          className={inputClass}
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="slug" className="block text-sm font-medium">
          {tr.taxonomy.slug}
        </label>
        <input
          id="slug"
          name="slug"
          pattern="[a-z0-9]+(-[a-z0-9]+)*"
          maxLength={80}
          defaultValue={category?.slug}
          readOnly={Boolean(category?.firstPublishedAt)}
          aria-describedby="slug-ipucu"
          className={inputClass}
        />
        <p id="slug-ipucu" className="text-sm text-text-secondary">
          {tr.taxonomy.slugHint}
        </p>
        {err('slug')}
      </div>

      {category ? null : (
        <div className="space-y-1">
          <label htmlFor="parentId" className="block text-sm font-medium">
            {tr.taxonomy.parent}
          </label>
          <select
            id="parentId"
            name="parentId"
            value={parentId}
            onChange={(e) => {
              setParentId(e.target.value);
              const p = parents.find((x) => x.id === e.target.value);
              if (p) setFlags({ ...p });
            }}
            className={inputClass}
          >
            <option value="">{tr.taxonomy.noParent}</option>
            {parents.map((p) => (
              <option key={p.id} value={p.id}>
                {'— '.repeat(p.depth - 1)}
                {p.name}
              </option>
            ))}
          </select>
          {err('parentId')}
        </div>
      )}

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">{tr.taxonomy.kinds}</legend>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {KINDS.map((k) => (
            <label key={k} className="flex min-h-11 items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="allowedKinds"
                value={k}
                defaultChecked={category?.allowedKinds.includes(k)}
                className="h-5 w-5"
              />
              {tr.taxonomy.kindLabels[k]}
            </label>
          ))}
        </div>
        {err('allowedKinds')}
      </fieldset>

      {category ? (
        <div className="space-y-1">
          <label htmlFor="status" className="block text-sm font-medium">
            {tr.taxonomy.status}
          </label>
          <select id="status" name="status" defaultValue={category.status} className={inputClass}>
            {(['DRAFT', 'HIDDEN', 'PUBLISHED'] as const).map((s) => (
              <option key={s} value={s}>
                {tr.taxonomy.statuses[s]}
              </option>
            ))}
          </select>
          {err('status')}
        </div>
      ) : null}

      <div className="space-y-1">
        <label htmlFor="sortOrder" className="block text-sm font-medium">
          {tr.taxonomy.sortOrder}
        </label>
        <input
          id="sortOrder"
          name="sortOrder"
          type="number"
          min={0}
          max={100000}
          defaultValue={category?.sortOrder ?? 0}
          className={inputClass}
        />
      </div>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">{tr.taxonomy.flags}</legend>
        <p className="text-sm text-text-secondary">{tr.taxonomy.flagsHint}</p>
        {FLAGS.map((f) => (
          <div key={f}>
            <label className="flex min-h-11 items-center gap-2 text-sm">
              <input
                type="checkbox"
                name={f}
                value="1"
                checked={flags[f]}
                onChange={(e) => setFlags({ ...flags, [f]: e.target.checked })}
                className="h-5 w-5"
              />
              {tr.taxonomy[f]}
            </label>
            {err(f)}
          </div>
        ))}
      </fieldset>

      <div className="flex flex-wrap items-center gap-4">
        <SubmitButton>{tr.admin.save}</SubmitButton>
        <Link href="/kategoriler" className="min-h-11 content-center text-brand-default underline">
          {tr.admin.cancel}
        </Link>
      </div>
    </form>
  );
}
