import type { ReactNode } from 'react';
import {
  CTA_RULES,
  type ListingKind,
  type OutboundLink,
  type Provider,
} from '@incelemeler/contracts';
import { tr } from '@incelemeler/i18n';
import { formatDate } from '@incelemeler/utils';
import { Alert, Field, SubmitButton } from '../../../../components/ui';
import {
  checkOutboundLinkAction,
  createOutboundLinkAction,
  setOutboundStatusAction,
} from '../outbound-actions';

const T = tr.outboundAdmin;
/** Sayfada dış bağlantıyla karşılanan eylemler (yol tarifi/arama gibi yerel eylemler hariç). */
const LINKABLE = new Set([
  'WEBSITE',
  'OFFICIAL_SITE',
  'RESERVATION',
  'PROVIDER_PRICES',
  'PROVIDER_DATES',
  'SELLER',
  'TICKETS',
  'APPOINTMENT',
  'CAR_RENTAL',
  'BUY',
  'WATCH',
]);
const COMMERCIAL_KINDS = ['AFFILIATE', 'BOOKING', 'PURCHASE'] as const;
const select =
  'block w-full rounded-md border border-border-strong bg-bg-default px-3 py-2 text-base';

function Select(props: { id: string; label: string; children: ReactNode }) {
  return (
    <div className="space-y-1">
      <label htmlFor={props.id} className="block text-sm font-medium">
        {props.label}
      </label>
      <select id={props.id} name={props.id} className={select}>
        {props.children}
      </select>
    </div>
  );
}

function fieldError(code: string | undefined): string | null {
  if (!code) return null;
  return code in T.fieldErrors
    ? T.fieldErrors[code as keyof typeof T.fieldErrors]
    : T.fieldErrors.invalid;
}

/** Listelemenin dış bağlantıları (REQ-AFF-001/002/007): liste, ekleme, kapatma, sağlık denetimi. */
export function OutboundSection(props: {
  listingId: string;
  kind: ListingKind;
  links: OutboundLink[];
  providers: Provider[];
  canCommercial: boolean;
  notice?: string;
  linkError?: string;
}) {
  const ctas = CTA_RULES[props.kind].allowed.filter((c) => LINKABLE.has(c));
  const kinds = Object.keys(T.kinds).filter(
    (k) => props.canCommercial || !(COMMERCIAL_KINDS as readonly string[]).includes(k),
  ) as Array<keyof typeof T.kinds>;
  const relations = (Object.keys(T.relations) as Array<keyof typeof T.relations>).filter(
    (r) => props.canCommercial || r === 'NONE',
  );
  const notice =
    props.notice === 'baglanti-eklendi'
      ? T.added
      : props.notice === 'baglanti-guncellendi'
        ? T.updated
        : props.notice === 'baglanti-denetlendi'
          ? T.checked
          : null;
  const err = fieldError(props.linkError);
  return (
    <section aria-labelledby="dis-baglantilar" className="space-y-4" id="dis-baglantilar-bolumu">
      <div className="space-y-1">
        <h2 id="dis-baglantilar" className="text-lg font-semibold">
          {T.title}
        </h2>
        <p className="text-sm text-text-secondary">{T.intro}</p>
      </div>
      {notice ? <Alert kind="success">{notice}</Alert> : null}
      {err ? <Alert kind="error">{err}</Alert> : null}
      {props.links.length === 0 ? (
        <p className="text-sm">{T.empty}</p>
      ) : (
        <ul className="space-y-3" data-testid="outbound-links">
          {props.links.map((l) => (
            <li
              key={l.id}
              className="space-y-2 rounded-md border border-border-default p-3 text-sm"
              data-testid="outbound-link"
            >
              <p className="font-medium">
                {tr.listingPage.cta[l.ctaType as keyof typeof tr.listingPage.cta] ?? l.ctaType} ·{' '}
                {T.kinds[l.kind]}
                {l.provider ? ` · ${l.provider.name}` : ''}
              </p>
              <dl className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
                <div>
                  <dt className="inline text-text-secondary">{T.status}: </dt>
                  <dd className="inline" data-testid="outbound-status">
                    {T.statuses[l.status]}
                  </dd>
                </div>
                <div>
                  <dt className="inline text-text-secondary">{T.relation}: </dt>
                  <dd className="inline">{T.relations[l.commercialRelation]}</dd>
                </div>
                <div>
                  <dt className="inline text-text-secondary">{T.domain}: </dt>
                  <dd className="inline break-all">{l.allowedDomain ?? l.provider?.name ?? '—'}</dd>
                </div>
                <div>
                  <dt className="inline text-text-secondary">{T.source}: </dt>
                  <dd className="inline">{T.sources[l.source]}</dd>
                </div>
                <div>
                  <dt className="inline text-text-secondary">{T.lastCheck}: </dt>
                  <dd className="inline">
                    {l.lastCheckedAt
                      ? `${formatDate(new Date(l.lastCheckedAt))} (${l.lastCheckStatus ?? '—'})`
                      : T.never}
                  </dd>
                </div>
                <div>
                  <dt className="inline text-text-secondary">{T.clicks30d}: </dt>
                  <dd className="inline">{l.clicks30d}</dd>
                </div>
              </dl>
              <div className="flex flex-wrap gap-3">
                <form action={setOutboundStatusAction}>
                  <input type="hidden" name="listingId" value={props.listingId} />
                  <input type="hidden" name="id" value={l.id} />
                  <input type="hidden" name="version" value={l.version} />
                  <input
                    type="hidden"
                    name="status"
                    value={l.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE'}
                  />
                  <button
                    type="submit"
                    className="min-h-11 rounded-md border border-border-strong px-4"
                  >
                    {l.status === 'ACTIVE' ? T.disable : T.enable}
                  </button>
                </form>
                <form action={checkOutboundLinkAction}>
                  <input type="hidden" name="listingId" value={props.listingId} />
                  <input type="hidden" name="id" value={l.id} />
                  <button
                    type="submit"
                    className="min-h-11 rounded-md border border-border-strong px-4"
                  >
                    {T.check}
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
      {ctas.length ? (
        <form
          action={createOutboundLinkAction}
          aria-label={T.add}
          className="space-y-3 rounded-md border border-border-default p-4"
        >
          <input type="hidden" name="listingId" value={props.listingId} />
          <Select id="ctaType" label={T.ctaType}>
            {ctas.map((c) => (
              <option key={c} value={c}>
                {tr.listingPage.cta[c as keyof typeof tr.listingPage.cta] ?? c}
              </option>
            ))}
          </Select>
          <Select id="kind" label={T.kind}>
            {kinds.map((k) => (
              <option key={k} value={k}>
                {T.kinds[k]}
              </option>
            ))}
          </Select>
          <Select id="providerId" label={T.provider}>
            <option value="">{T.noProvider}</option>
            {props.providers
              .filter((p) => p.integrationStatus !== 'DISABLED')
              .map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
          </Select>
          <Select id="commercialRelation" label={T.relation}>
            {relations.map((r) => (
              <option key={r} value={r}>
                {T.relations[r]}
              </option>
            ))}
          </Select>
          <Field id="urlTemplate" type="url" label={T.urlTemplate} hint={T.urlHint} required />
          <Field id="label" label={T.label} maxLength={80} />
          <Field id="validUntil" type="date" label={T.validUntil} />
          <SubmitButton>{T.add}</SubmitButton>
        </form>
      ) : null}
    </section>
  );
}
