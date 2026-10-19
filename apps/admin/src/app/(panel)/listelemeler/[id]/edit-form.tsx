'use client';

import { useActionState, useState, type ReactNode } from 'react';
import type { AdminArea, AdminListing, AttributeDefinition } from '@incelemeler/contracts';
import { tr } from '@incelemeler/i18n';
import { Alert, SubmitButton } from '../../../../components/ui';
import { errorMessage } from '../../../../lib/errors';
import { type ListingFormState, saveListingAction } from '../actions';
import { listingFieldError } from '../messages';

const L = tr.listings;
const inputClass =
  'block w-full rounded-md border border-border-strong bg-bg-default px-3 py-2 text-base';

function Field(props: {
  id: string;
  label: string;
  error?: string | null;
  hint?: string;
  children?: ReactNode;
  defaultValue?: string | number | null;
  type?: string;
  inputMode?: 'decimal' | 'numeric';
  required?: boolean;
}) {
  return (
    <div className="space-y-1">
      <label htmlFor={props.id} className="block text-sm font-medium">
        {props.label}
      </label>
      {props.children ?? (
        <input
          id={props.id}
          name={props.id}
          type={props.type ?? 'text'}
          inputMode={props.inputMode}
          required={props.required}
          defaultValue={props.defaultValue ?? ''}
          aria-describedby={props.hint ? `${props.id}-ipucu` : undefined}
          className={inputClass}
        />
      )}
      {props.hint ? (
        <p id={`${props.id}-ipucu`} className="text-sm text-text-secondary">
          {props.hint}
        </p>
      ) : null}
      {props.error ? <p className="text-sm text-danger-text">{props.error}</p> : null}
    </div>
  );
}

function AttributeInput({ def, value }: { def: AttributeDefinition; value: unknown }) {
  const id = `attr.${def.key}`;
  const label = `${def.label}${def.unit ? ` (${def.unit})` : ''}${def.required ? ' *' : ''}`;
  switch (def.type) {
    case 'BOOL':
      return (
        <Field id={id} label={label}>
          <select
            id={id}
            name={id}
            defaultValue={value === true ? 'true' : value === false ? 'false' : ''}
            className={inputClass}
          >
            <option value="">{L.notSpecified}</option>
            <option value="true">{L.yes}</option>
            <option value="false">{L.no}</option>
          </select>
        </Field>
      );
    case 'ENUM':
      return (
        <Field id={id} label={label}>
          <select id={id} name={id} defaultValue={String(value ?? '')} className={inputClass}>
            <option value="">{L.notSpecified}</option>
            {def.options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </Field>
      );
    case 'MULTI_ENUM':
      return (
        <fieldset className="space-y-1">
          <legend className="text-sm font-medium">{label}</legend>
          {def.options.map((o) => (
            <label key={o.value} className="flex min-h-11 items-center gap-2 text-sm">
              <input
                type="checkbox"
                name={id}
                value={o.value}
                defaultChecked={Array.isArray(value) && value.includes(o.value)}
                className="h-5 w-5"
              />
              {o.label}
            </label>
          ))}
        </fieldset>
      );
    case 'INT':
    case 'DECIMAL':
      return (
        <Field
          id={id}
          label={label}
          inputMode={def.type === 'INT' ? 'numeric' : 'decimal'}
          defaultValue={typeof value === 'number' ? value : null}
        />
      );
    case 'DATE':
      return <Field id={id} label={label} type="date" defaultValue={String(value ?? '')} />;
    default:
      return <Field id={id} label={label} defaultValue={String(value ?? '')} />;
  }
}

export function ListingEditForm({
  listing,
  attributes,
  provinces,
  districts,
}: {
  listing: AdminListing;
  attributes: AttributeDefinition[];
  provinces: AdminArea[];
  districts: AdminArea[];
}) {
  const [state, action] = useActionState<ListingFormState, FormData>(saveListingAction, {});
  const [provinceId, setProvinceId] = useState(listing.location?.provinceId ?? '');
  const fe = state.fieldErrors ?? {};
  const err = (path: string) => listingFieldError(fe[path]);
  const loc = listing.location;
  const d = listing.details;
  const description = (listing.description ?? []).map((b) => b.text).join('\n\n');

  return (
    <form action={action} className="space-y-8" aria-label={L.title}>
      {state.error ? (
        <Alert kind="error">
          {Object.keys(fe).length ? tr.errors.VALIDATION_FAILED : errorMessage(state.error)}
        </Alert>
      ) : null}
      <input type="hidden" name="id" value={listing.id} />
      <input type="hidden" name="version" value={listing.version} />
      <input type="hidden" name="kind" value={listing.kind} />
      <input type="hidden" name="primaryCategoryId" value={listing.primaryCategory.id} />

      <section className="space-y-4">
        <Field id="name" label={L.name} required defaultValue={listing.name} error={err('name')} />
        <Field id="slug" label={L.slug} defaultValue={listing.slug} error={err('slug')} />
        <Field
          id="shortDescription"
          label={L.shortDescription}
          defaultValue={listing.shortDescription}
        />
        <Field id="description" label={L.description} hint={L.descriptionHint}>
          <textarea
            id="description"
            name="description"
            rows={6}
            defaultValue={description}
            aria-describedby="description-ipucu"
            className={inputClass}
          />
        </Field>
        <Field id="priceLevel" label={L.priceLevel}>
          <select
            id="priceLevel"
            name="priceLevel"
            defaultValue={listing.priceLevel ?? ''}
            className={inputClass}
          >
            <option value="">{L.priceUnknown}</option>
            {[1, 2, 3, 4].map((n) => (
              <option key={n} value={n}>
                {'₺'.repeat(n)}
              </option>
            ))}
          </select>
        </Field>
      </section>

      <fieldset className="space-y-4">
        <legend className="text-lg font-semibold">{L.contactsTitle}</legend>
        {err('contacts') ? <p className="text-sm text-danger-text">{err('contacts')}</p> : null}
        <div className="grid gap-4 sm:grid-cols-2">
          {(['phone', 'website', 'email', 'reservationUrl'] as const).map((k) => (
            <Field
              key={k}
              id={`contact.${k}`}
              label={L[k]}
              type={k === 'email' ? 'email' : k === 'phone' ? 'tel' : 'url'}
              defaultValue={listing.contacts[k]}
              error={err(`contacts/${k}`)}
            />
          ))}
        </div>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="text-lg font-semibold">{L.locationTitle}</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="provinceId" label={L.province} error={err('location/provinceId')}>
            <select
              id="provinceId"
              name="provinceId"
              value={provinceId}
              onChange={(e) => setProvinceId(e.target.value)}
              className={inputClass}
            >
              <option value="">{L.noLocation}</option>
              {provinces.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </Field>
          <Field id="districtId" label={L.district} error={err('location/districtId')}>
            <select
              id="districtId"
              name="districtId"
              defaultValue={loc?.districtId ?? ''}
              key={provinceId}
              className={inputClass}
            >
              <option value="">{L.noDistrict}</option>
              {districts
                .filter((x) => x.parentId === provinceId)
                .map((x) => (
                  <option key={x.id} value={x.id}>
                    {x.name}
                  </option>
                ))}
            </select>
          </Field>
          <Field id="neighborhood" label={L.neighborhood} defaultValue={loc?.neighborhood} />
          <Field
            id="postalCode"
            label={L.postalCode}
            inputMode="numeric"
            defaultValue={loc?.postalCode}
          />
        </div>
        <Field id="addressLine" label={L.addressLine} defaultValue={loc?.addressLine} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            id="latitude"
            label={L.latitude}
            inputMode="decimal"
            defaultValue={loc?.latitude}
            error={err('location/latitude')}
          />
          <Field
            id="longitude"
            label={L.longitude}
            inputMode="decimal"
            defaultValue={loc?.longitude}
          />
        </div>
      </fieldset>

      {attributes.length ? (
        <fieldset className="space-y-4" data-testid="listing-attributes">
          <legend className="text-lg font-semibold">{L.attributesTitle}</legend>
          <div className="grid gap-4 sm:grid-cols-2">
            {attributes.map((a) => (
              <div key={a.key}>
                <AttributeInput def={a} value={listing.attributes[a.key]} />
                {err(`attributes/${a.key}`) ? (
                  <p className="text-sm text-danger-text">{err(`attributes/${a.key}`)}</p>
                ) : null}
              </div>
            ))}
          </div>
        </fieldset>
      ) : null}

      {listing.kind === 'LODGING' ||
      listing.kind === 'PRODUCT' ||
      listing.kind === 'EXPERIENCE' ||
      listing.kind === 'EVENT' ||
      listing.kind === 'GUIDE_PERSON' ? (
        <fieldset className="space-y-4">
          <legend className="text-lg font-semibold">{L.detailsTitle}</legend>
          <div className="grid gap-4 sm:grid-cols-2">
            {listing.kind === 'LODGING' ? (
              <>
                <Field
                  id="d.tourismLicenseNo"
                  label={L.tourismLicenseNo}
                  defaultValue={d.lodging?.tourismLicenseNo}
                />
                <Field
                  id="d.checkInTime"
                  label={L.checkInTime}
                  type="time"
                  defaultValue={d.lodging?.checkInTime}
                />
                <Field
                  id="d.checkOutTime"
                  label={L.checkOutTime}
                  type="time"
                  defaultValue={d.lodging?.checkOutTime}
                />
              </>
            ) : null}
            {listing.kind === 'PRODUCT' ? (
              <>
                <Field id="d.brand" label={L.brand} defaultValue={d.product?.brand} />
                <Field id="d.model" label={L.model} defaultValue={d.product?.model} />
                <Field
                  id="d.gtin"
                  label={L.gtin}
                  inputMode="numeric"
                  defaultValue={d.product?.gtin}
                />
                <Field
                  id="d.releaseDate"
                  label={L.releaseDate}
                  type="date"
                  defaultValue={d.product?.releaseDate}
                />
              </>
            ) : null}
            {listing.kind === 'EXPERIENCE' ? (
              <>
                <Field
                  id="d.durationMinutes"
                  label={L.durationMinutes}
                  inputMode="numeric"
                  defaultValue={d.experience?.durationMinutes}
                />
                <Field
                  id="d.startPoint"
                  label={L.startPoint}
                  defaultValue={d.experience?.startPoint}
                />
              </>
            ) : null}
            {listing.kind === 'EVENT' ? (
              <>
                <Field
                  id="d.startsAt"
                  label={L.startsAt}
                  type="datetime-local"
                  defaultValue={d.event?.startsAt?.slice(0, 16)}
                />
                <Field
                  id="d.endsAt"
                  label={L.endsAt}
                  type="datetime-local"
                  defaultValue={d.event?.endsAt?.slice(0, 16)}
                />
              </>
            ) : null}
            {listing.kind === 'GUIDE_PERSON' ? (
              <Field
                id="d.languages"
                label={L.languages}
                defaultValue={d.guide?.languages?.join(', ')}
              />
            ) : null}
          </div>
        </fieldset>
      ) : null}

      <section className="space-y-4">
        <Field
          id="source"
          label={L.source}
          hint={L.sourceHint}
          required
          defaultValue={listing.source}
          error={err('source')}
        />
        <Field
          id="sourceVerifiedAt"
          label={L.sourceVerifiedAt}
          type="date"
          defaultValue={listing.sourceVerifiedAt?.slice(0, 10)}
        />
      </section>

      <SubmitButton>{tr.admin.save}</SubmitButton>
    </form>
  );
}
