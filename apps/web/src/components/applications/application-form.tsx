'use client';

import Link from 'next/link';
import { type ReactNode, useActionState, useState } from 'react';
import { applications, errors } from '@incelemeler/i18n';
import { STATIC_PATHS } from '@incelemeler/routes';
import { type ApplicationFormState, submitApplicationAction } from '../../app/applications-actions';

// Yalnızca kullanılan ad alanları istemci paketine girer (REQ-PRF-004).
const tr = { applications, errors };
const T = tr.applications;

export type Option = { id: string; name: string };
export type CategoryOption = Option & { allowedKinds: string[] };

const INITIAL: ApplicationFormState = {
  status: 'idle',
  code: null,
  fields: {},
  values: {},
  attempt: 0,
};
const INPUT =
  'block w-full rounded-md border border-border-strong bg-bg-default px-3 py-2 text-base aria-[invalid=true]:border-danger-text';

function fieldError(code: string | undefined): string | null {
  if (!code) return null;
  const known = T.fieldErrors as Record<string, string>;
  if (code in known) return known[code]!;
  return /TOO_SMALL|INVALID_VALUE|REQUIRED/.test(code)
    ? T.fieldErrors.required
    : T.fieldErrors.invalid;
}

/** Etiket + alan + ipucu + hata; hata alanla aria-describedby ile ilişkilendirilir (REQ-ERS-004). */
function Row({
  id,
  label,
  hint,
  error,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  error: string | null;
  children: (aria: { 'aria-describedby'?: string; 'aria-invalid'?: boolean }) => ReactNode;
}) {
  const ids = [hint ? `${id}-ipucu` : null, error ? `${id}-hata` : null].filter(Boolean);
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="block text-sm font-medium">
        {label}
      </label>
      {children({
        ...(ids.length ? { 'aria-describedby': ids.join(' ') } : {}),
        ...(error ? { 'aria-invalid': true } : {}),
      })}
      {hint ? (
        <p id={`${id}-ipucu`} className="text-sm text-text-secondary">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${id}-hata`} className="text-sm text-danger-text">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function useForm() {
  const [state, action] = useActionState(submitApplicationAction, INITIAL);
  const val = (k: string) =>
    typeof state.values[k] === 'string' ? (state.values[k] as string) : '';
  const vals = (k: string) => (Array.isArray(state.values[k]) ? (state.values[k] as string[]) : []);
  const err = (k: string) => fieldError(state.fields[k]);
  return { state, action, val, vals, err };
}

function Text({
  id,
  label,
  form,
  required,
  type = 'text',
  hint,
  autoComplete,
  maxLength,
}: {
  id: string;
  label: string;
  form: ReturnType<typeof useForm>;
  required?: boolean;
  type?: string;
  hint?: string;
  autoComplete?: string;
  maxLength?: number;
}) {
  return (
    <Row id={id} label={label} hint={hint} error={form.err(id)}>
      {(aria) => (
        <input
          id={id}
          name={id}
          type={type}
          required={required}
          autoComplete={autoComplete}
          maxLength={maxLength}
          defaultValue={form.val(id)}
          className={INPUT}
          {...aria}
        />
      )}
    </Row>
  );
}

function Ack({
  id,
  label,
  form,
  required,
}: {
  id: string;
  label: ReactNode;
  form: ReturnType<typeof useForm>;
  required?: boolean;
}) {
  return (
    <div className="flex items-start gap-2">
      <input
        id={id}
        name={id}
        type="checkbox"
        value="1"
        required={required}
        defaultChecked={form.val(id) === '1'}
        className="mt-1 h-5 w-5 rounded border-border-strong"
      />
      <label htmlFor={id} className="text-sm">
        {label}
      </label>
    </div>
  );
}

function Outcome({ form }: { form: ReturnType<typeof useForm> }) {
  if (form.state.status === 'error') {
    const known = tr.errors as Record<string, string>;
    return (
      <div
        role="alert"
        className="rounded-md border border-border-default bg-bg-subtle px-4 py-3 text-sm text-danger-text"
      >
        {known[form.state.code ?? ''] ?? tr.errors.UNKNOWN}
      </div>
    );
  }
  return null;
}

function Sent() {
  return (
    <div
      role="status"
      className="rounded-md border border-border-default bg-bg-subtle px-4 py-3 text-sm text-success-text"
    >
      {T.sent}
    </div>
  );
}

const SUBMIT =
  'inline-flex min-h-11 items-center rounded-md bg-brand-default px-5 py-2 font-medium text-on-brand hover:bg-brand-hover';

/** İşletme başvurusu (REQ-ISL-001). */
export function BusinessApplicationForm({
  categories,
  provinces,
}: {
  categories: CategoryOption[];
  provinces: Option[];
}) {
  const form = useForm();
  const kinds = Object.keys(T.businessKinds) as Array<keyof typeof T.businessKinds>;
  const [kind, setKind] = useState<string>(form.val('kind') || 'PLACE');
  if (form.state.status === 'sent') return <Sent />;
  const options = categories.filter((c) => c.allowedKinds.includes(kind));
  return (
    <form
      action={form.action}
      key={form.state.attempt}
      className="space-y-6"
      aria-label={T.businessTitle}
    >
      <Outcome form={form} />
      <input type="hidden" name="type" value="BUSINESS" />
      <fieldset className="space-y-4">
        <legend className="text-lg font-semibold">{T.businessSection}</legend>
        <Text
          id="businessName"
          label={T.businessName}
          form={form}
          required
          maxLength={120}
          autoComplete="organization"
        />
        <Row id="kind" label={T.kind} error={form.err('kind')}>
          {(aria) => (
            <select
              id="kind"
              name="kind"
              value={kind}
              onChange={(e) => setKind(e.target.value)}
              className={INPUT}
              {...aria}
            >
              {kinds.map((k) => (
                <option key={k} value={k}>
                  {T.businessKinds[k]}
                </option>
              ))}
            </select>
          )}
        </Row>
        <Row id="categoryId" label={T.category} error={form.err('categoryId')}>
          {(aria) => (
            <select
              id="categoryId"
              name="categoryId"
              required
              defaultValue={form.val('categoryId')}
              className={INPUT}
              {...aria}
            >
              <option value="" />
              {options.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          )}
        </Row>
        <Row id="provinceId" label={T.province} error={form.err('provinceId')}>
          {(aria) => (
            <select
              id="provinceId"
              name="provinceId"
              required
              defaultValue={form.val('provinceId')}
              className={INPUT}
              {...aria}
            >
              <option value="" />
              {provinces.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          )}
        </Row>
        <Text
          id="address"
          label={T.address}
          hint={T.addressHint}
          form={form}
          maxLength={300}
          autoComplete="street-address"
        />
        <Text id="serviceArea" label={T.serviceArea} form={form} maxLength={300} />
        <Text id="phone" label={T.phone} type="tel" form={form} autoComplete="tel" />
        <Text
          id="website"
          label={T.website}
          type="url"
          form={form}
          autoComplete="url"
          maxLength={300}
        />
      </fieldset>
      <fieldset className="space-y-4">
        <legend className="text-lg font-semibold">{T.contactSection}</legend>
        <Text
          id="contactName"
          label={T.contactName}
          form={form}
          required
          autoComplete="name"
          maxLength={100}
        />
        <Text
          id="contactRole"
          label={T.contactRole}
          form={form}
          required
          autoComplete="organization-title"
          maxLength={100}
        />
        <Text
          id="email"
          label={T.email}
          type="email"
          hint={T.emailHint}
          form={form}
          required
          autoComplete="email"
        />
      </fieldset>
      <p className="text-sm text-text-secondary">{T.documentsNote}</p>
      <div className="space-y-3">
        <Ack
          id="privacyNoticeAck"
          required
          form={form}
          label={
            <>
              <Link href={STATIC_PATHS.privacy} className="underline">
                {T.privacyNoticeLink}
              </Link>
              {' — '}
              {T.privacyNoticeAck}
            </>
          }
        />
        <Ack id="authorityAck" required form={form} label={T.authorityAck} />
      </div>
      <button type="submit" className={SUBMIT}>
        {T.submit}
      </button>
    </form>
  );
}

/** Reklam ve sponsorluk başvurusu (REQ-ISL-002): ticari ileti izni ayrı, isteğe bağlı, işaretsiz. */
export function AdvertisingApplicationForm({
  categories,
  provinces,
}: {
  categories: Option[];
  provinces: Option[];
}) {
  const form = useForm();
  if (form.state.status === 'sent') return <Sent />;
  const products = Object.keys(T.productLabels) as Array<keyof typeof T.productLabels>;
  const budgets = Object.keys(T.budgetLabels) as Array<keyof typeof T.budgetLabels>;
  const chosen = new Set(form.vals('products'));
  return (
    <form
      action={form.action}
      key={form.state.attempt}
      className="space-y-6"
      aria-label={T.adTitle}
    >
      <Outcome form={form} />
      <input type="hidden" name="type" value="ADVERTISING" />
      <fieldset className="space-y-4">
        <legend className="text-lg font-semibold">{T.contactSection}</legend>
        <Text
          id="organizationName"
          label={T.organizationName}
          form={form}
          required
          maxLength={120}
          autoComplete="organization"
        />
        <Text
          id="contactName"
          label={T.contactName}
          form={form}
          required
          autoComplete="name"
          maxLength={100}
        />
        <Text
          id="contactRole"
          label={T.contactRoleOptional}
          form={form}
          autoComplete="organization-title"
          maxLength={100}
        />
        <Text
          id="email"
          label={T.email}
          type="email"
          hint={T.emailHint}
          form={form}
          required
          autoComplete="email"
        />
        <Text id="phone" label={T.phone} type="tel" form={form} autoComplete="tel" />
      </fieldset>
      <fieldset
        className="space-y-2"
        aria-describedby={form.err('products') ? 'products-hata' : undefined}
      >
        <legend className="text-lg font-semibold">{T.products}</legend>
        {products.map((p) => (
          <div key={p} className="flex items-center gap-2">
            <input
              id={`product-${p}`}
              name="products"
              type="checkbox"
              value={p}
              defaultChecked={chosen.has(p)}
              className="h-5 w-5 rounded border-border-strong"
            />
            <label htmlFor={`product-${p}`}>{T.productLabels[p]}</label>
          </div>
        ))}
        {form.err('products') ? (
          <p id="products-hata" className="text-sm text-danger-text">
            {form.err('products')}
          </p>
        ) : null}
      </fieldset>
      <Row
        id="provinceIds"
        label={T.targetProvinces}
        hint={T.multiHint}
        error={form.err('provinceIds')}
      >
        {(aria) => (
          <select
            id="provinceIds"
            name="provinceIds"
            multiple
            size={6}
            defaultValue={form.vals('provinceIds')}
            className={INPUT}
            {...aria}
          >
            {provinces.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        )}
      </Row>
      <Row
        id="categoryIds"
        label={T.targetCategories}
        hint={T.multiHint}
        error={form.err('categoryIds')}
      >
        {(aria) => (
          <select
            id="categoryIds"
            name="categoryIds"
            multiple
            size={6}
            defaultValue={form.vals('categoryIds')}
            className={INPUT}
            {...aria}
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        )}
      </Row>
      <Row id="budgetRange" label={T.budget} error={form.err('budgetRange')}>
        {(aria) => (
          <select
            id="budgetRange"
            name="budgetRange"
            defaultValue={form.val('budgetRange')}
            className={INPUT}
            {...aria}
          >
            <option value="">{T.budgetNone}</option>
            {budgets.map((b) => (
              <option key={b} value={b}>
                {T.budgetLabels[b]}
              </option>
            ))}
          </select>
        )}
      </Row>
      <Row id="message" label={T.message} error={form.err('message')}>
        {(aria) => (
          <textarea
            id="message"
            name="message"
            required
            minLength={10}
            maxLength={2000}
            rows={5}
            defaultValue={form.val('message')}
            className={INPUT}
            {...aria}
          />
        )}
      </Row>
      <div className="space-y-3">
        <Ack
          id="privacyNoticeAck"
          required
          form={form}
          label={
            <>
              <Link href={STATIC_PATHS.privacy} className="underline">
                {T.privacyNoticeLink}
              </Link>
              {' — '}
              {T.privacyNoticeAck}
            </>
          }
        />
        <Ack id="marketingConsent" form={form} label={T.marketingConsent} />
      </div>
      <button type="submit" className={SUBMIT}>
        {T.submit}
      </button>
    </form>
  );
}
