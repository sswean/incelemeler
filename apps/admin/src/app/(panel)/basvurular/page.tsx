import type { Metadata } from 'next';
import Link from 'next/link';
import type { AdminApplication, ApplicationStatus, ApplicationType } from '@incelemeler/contracts';
import { tr } from '@incelemeler/i18n';
import { Alert, PageTitle, SubmitButton } from '../../../components/ui';
import { errorMessage } from '../../../lib/errors';
import { api, requireStaff } from '../../../lib/session';
import { formatIstanbul } from '../kampanyalar/messages';
import { decideApplicationAction } from './actions';

const T = tr.applications;
export const metadata: Metadata = { title: T.adminTitle };
export const dynamic = 'force-dynamic';

const select =
  'block w-full rounded-md border border-border-strong bg-bg-default px-3 py-2 text-base';
const STATUSES = Object.keys(T.statusLabels) as ApplicationStatus[];
const TYPES = Object.keys(T.kinds) as ApplicationType[];

function Details({ a }: { a: AdminApplication }) {
  const b = a.business;
  const ad = a.advertising;
  return (
    <dl className="grid gap-x-4 gap-y-1 text-sm sm:grid-cols-[12rem_1fr]">
      <dt className="font-medium">{T.contactName}</dt>
      <dd>
        {a.contactName}
        {a.contactRole ? ` · ${a.contactRole}` : ''}
      </dd>
      <dt className="font-medium">{T.email}</dt>
      <dd>
        {a.email}
        {a.freeEmailDomain ? (
          <span className="ml-2 font-semibold" data-testid="free-email">
            {T.freeEmail}
          </span>
        ) : null}
      </dd>
      {a.phone ? (
        <>
          <dt className="font-medium">{T.phone}</dt>
          <dd>{a.phone}</dd>
        </>
      ) : null}
      {b ? (
        <>
          <dt className="font-medium">{T.kind}</dt>
          <dd>{T.businessKinds[b.kind]}</dd>
          <dt className="font-medium">{T.category}</dt>
          <dd>{b.category?.name ?? '—'}</dd>
          <dt className="font-medium">{T.province}</dt>
          <dd>{[b.district?.name, b.province?.name].filter(Boolean).join(', ') || '—'}</dd>
          {b.address ? (
            <>
              <dt className="font-medium">{T.address}</dt>
              <dd>{b.address}</dd>
            </>
          ) : null}
          {b.serviceArea ? (
            <>
              <dt className="font-medium">{T.serviceArea}</dt>
              <dd>{b.serviceArea}</dd>
            </>
          ) : null}
          {b.website ? (
            <>
              <dt className="font-medium">{T.website}</dt>
              <dd className="break-all">{b.website}</dd>
            </>
          ) : null}
        </>
      ) : null}
      {ad ? (
        <>
          <dt className="font-medium">{T.products}</dt>
          <dd>{ad.products.map((p) => T.productLabels[p]).join(', ')}</dd>
          {ad.provinces.length ? (
            <>
              <dt className="font-medium">{T.province}</dt>
              <dd>{ad.provinces.map((p) => p.name).join(', ')}</dd>
            </>
          ) : null}
          {ad.categories.length ? (
            <>
              <dt className="font-medium">{T.category}</dt>
              <dd>{ad.categories.map((c) => c.name).join(', ')}</dd>
            </>
          ) : null}
          <dt className="font-medium">{T.budget}</dt>
          <dd>{ad.budgetRange ? T.budgetLabels[ad.budgetRange] : T.budgetNone}</dd>
          <dt className="font-medium">{T.message}</dt>
          <dd className="whitespace-pre-line">{ad.message}</dd>
          <dt className="sr-only">{T.marketingYes}</dt>
          <dd>{ad.marketingConsent ? T.marketingYes : T.marketingNo}</dd>
        </>
      ) : null}
    </dl>
  );
}

/** Hesapsız başvuru kuyruğu (REQ-ISL-001/002, E2E-007). */
export default async function ApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<{ tur?: string; durum?: string; sonuc?: string; hata?: string }>;
}) {
  const { token } = await requireStaff();
  const sp = await searchParams;
  const type = TYPES.includes(sp.tur as ApplicationType) ? (sp.tur as ApplicationType) : undefined;
  const status = STATUSES.includes(sp.durum as ApplicationStatus)
    ? (sp.durum as ApplicationStatus)
    : 'PENDING';
  const back = `/basvurular?${new URLSearchParams({ ...(type ? { tur: type } : {}), durum: status })}`;
  const { data, error } = await (
    await api(token)
  ).GET('/v1/admin/applications', {
    params: { query: { ...(type ? { type } : {}), status } },
  });
  return (
    <div className="max-w-4xl space-y-6 rounded-lg border border-border-default bg-bg-default p-6">
      <div className="space-y-1">
        <PageTitle>{T.adminTitle}</PageTitle>
        <p className="text-sm text-text-secondary">{T.adminIntro}</p>
      </div>
      {sp.sonuc === 'karar' ? <Alert kind="success">{T.decided}</Alert> : null}
      {sp.hata || error ? <Alert kind="error">{errorMessage(sp.hata ?? null)}</Alert> : null}
      <form method="get" className="flex flex-wrap items-end gap-3" aria-label={T.filter}>
        <label className="space-y-1">
          <span className="block text-sm font-medium">{T.filterType}</span>
          <select name="tur" defaultValue={type ?? ''} className={select}>
            <option value="">{T.allTypes}</option>
            {TYPES.map((t) => (
              <option key={t} value={t}>
                {T.kinds[t]}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1">
          <span className="block text-sm font-medium">{T.filterStatus}</span>
          <select name="durum" defaultValue={status} className={select}>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {T.statusLabels[s]}
              </option>
            ))}
          </select>
        </label>
        <SubmitButton>{T.filter}</SubmitButton>
      </form>
      {!data?.data.length ? (
        <p>{T.empty}</p>
      ) : (
        <ul className="space-y-4" data-testid="applications">
          {data.data.map((a) => (
            <li
              key={a.id}
              className="space-y-3 rounded-md border border-border-default p-4"
              data-testid="application"
            >
              <h2 className="flex flex-wrap justify-between gap-2 text-lg font-semibold">
                <span>{a.name}</span>
                <span className="text-sm font-normal text-text-secondary">
                  {T.kinds[a.type]} · {T.statusLabels[a.status]} · {T.received}{' '}
                  {formatIstanbul(a.createdAt)}
                </span>
              </h2>
              <Details a={a} />
              {a.rejectionReason ? (
                <p className="text-sm">
                  {T.rejectionReason}: {T.rejections[a.rejectionReason]}
                  {a.decisionNote ? ` — ${a.decisionNote}` : ''}
                </p>
              ) : null}
              {a.listingId ? (
                <Link
                  href={`/listelemeler/${a.listingId}`}
                  className="inline-block min-h-11 content-center text-brand-default underline"
                >
                  {T.openDraft}
                </Link>
              ) : null}
              {a.status === 'PENDING' ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  <form action={decideApplicationAction} aria-label={`${T.approve}: ${a.name}`}>
                    <input type="hidden" name="id" value={a.id} />
                    <input type="hidden" name="version" value={a.version} />
                    <input type="hidden" name="decision" value="APPROVE" />
                    <input type="hidden" name="back" value={back} />
                    <SubmitButton>{T.approve}</SubmitButton>
                  </form>
                  <form
                    action={decideApplicationAction}
                    className="space-y-2"
                    aria-label={`${T.reject}: ${a.name}`}
                  >
                    <input type="hidden" name="id" value={a.id} />
                    <input type="hidden" name="version" value={a.version} />
                    <input type="hidden" name="decision" value="REJECT" />
                    <input type="hidden" name="back" value={back} />
                    <label className="block space-y-1">
                      <span className="block text-sm font-medium">{T.rejectionReason}</span>
                      <select name="reason" required defaultValue="" className={select}>
                        <option value="" />
                        {Object.entries(T.rejections).map(([k, v]) => (
                          <option key={k} value={k}>
                            {v}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="block space-y-1">
                      <span className="block text-sm font-medium">{T.decisionNote}</span>
                      <textarea
                        name="note"
                        rows={2}
                        maxLength={1000}
                        className="block w-full rounded-md border border-border-strong bg-bg-default px-2 py-1"
                      />
                    </label>
                    <SubmitButton>{T.reject}</SubmitButton>
                  </form>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
