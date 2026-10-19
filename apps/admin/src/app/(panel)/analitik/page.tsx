import type { Metadata } from 'next';
import { tr } from '@incelemeler/i18n';
import { Alert, PageTitle } from '../../../components/ui';
import { api, requireStaff } from '../../../lib/session';
import { formatIstanbul, percent } from '../kampanyalar/messages';

const T = tr.analyticsAdmin;
const N = tr.admin.noData;
export const metadata: Metadata = { title: T.title };
export const dynamic = 'force-dynamic';

const PERIODS = ['7', '30', '90'] as const;
const v = (x: number | null) => (x === null ? N : x.toLocaleString('tr-TR'));

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-md border border-border-default p-3">
      <dt className="text-sm text-text-secondary">{label}</dt>
      <dd className="text-lg font-semibold">{value}</dd>
      {hint ? <dd className="text-xs text-text-secondary">{hint}</dd> : null}
    </div>
  );
}

function Rows({ rows }: { rows: Array<{ label: string; count: number }> }) {
  return rows.length ? (
    <ul className="text-sm">
      {rows.map((r) => (
        <li key={r.label} className="flex justify-between border-b border-border-default py-1">
          <span>{r.label}</span>
          <span>{r.count.toLocaleString('tr-TR')}</span>
        </li>
      ))}
    </ul>
  ) : (
    <p className="text-sm">{N}</p>
  );
}

/** Panolar (REQ-ANL-004): yalnızca gerçek kayıtlar; veri yoksa "Veri yok"; tazelik zaman damgası. */
export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ gun?: string }>;
}) {
  const { token, user } = await requireStaff();
  const { gun } = await searchParams;
  if (!user.permissions.includes('audit.read')) {
    return (
      <div className="max-w-2xl space-y-4">
        <PageTitle>{T.title}</PageTitle>
        <Alert kind="info">{tr.admin.noPermission}</Alert>
      </div>
    );
  }
  const days = PERIODS.includes(gun as (typeof PERIODS)[number]) ? Number(gun) : 7;
  const { data: o } = await (
    await api(token)
  ).GET('/v1/admin/analytics/overview', { params: { query: { days } } });
  return (
    <div className="max-w-5xl space-y-8 rounded-lg border border-border-default bg-bg-default p-6">
      <div className="space-y-1">
        <PageTitle>{T.title}</PageTitle>
        <p className="text-sm text-text-secondary">{T.intro}</p>
      </div>
      <form className="flex flex-wrap items-end gap-3" aria-label={T.period}>
        <label className="space-y-1">
          <span className="block text-sm font-medium">{T.period}</span>
          <select
            name="gun"
            defaultValue={String(days)}
            className="block min-h-11 rounded-md border border-border-strong bg-bg-default px-3"
          >
            {PERIODS.map((p) => (
              <option key={p} value={p}>
                {T.periods[p]}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" className="min-h-11 rounded-md border border-border-strong px-4">
          {T.show}
        </button>
      </form>
      {!o ? (
        <Alert kind="error">{tr.errors.UNKNOWN}</Alert>
      ) : (
        <>
          <p className="text-sm" data-testid="analytics-freshness">
            {tr.admin.updatedAt.replace('{date}', formatIstanbul(o.generatedAt))}
          </p>
          <section className="space-y-3" aria-labelledby="kitle">
            <h2 id="kitle" className="text-lg font-semibold">
              {T.audience}
            </h2>
            <dl className="grid gap-3 sm:grid-cols-3" data-testid="analytics-audience">
              <Stat label={T.activeVisitors} value={v(o.activeVisitors)} />
              <Stat
                label={T.qualifiedSessions}
                value={v(o.qualifiedSessions)}
                hint={T.qualifiedHint}
              />
            </dl>
            <h3 className="font-semibold">{T.landings}</h3>
            <Rows
              rows={o.landings.map((l) => ({
                label: T.sources[l.source as keyof typeof T.sources] ?? l.source,
                count: l.count,
              }))}
            />
          </section>
          <section className="space-y-3" aria-labelledby="aramalar">
            <h2 id="aramalar" className="text-lg font-semibold">
              {T.searches}
            </h2>
            <dl className="grid gap-3 sm:grid-cols-3">
              <Stat label={T.searchTotal} value={v(o.searches.total)} />
              <Stat
                label={T.zeroRate}
                value={o.searches.zeroRate === null ? N : percent(o.searches.zeroRate)}
              />
            </dl>
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <h3 className="font-semibold">{T.topQueries}</h3>
                <Rows rows={o.searches.top.map((q) => ({ label: q.query, count: q.count }))} />
              </div>
              <div>
                <h3 className="font-semibold">{T.topZero}</h3>
                <Rows rows={o.searches.topZero.map((q) => ({ label: q.query, count: q.count }))} />
              </div>
            </div>
          </section>
          <section className="space-y-3" aria-labelledby="ticari">
            <h2 id="ticari" className="text-lg font-semibold">
              {T.outbound} · {T.sponsored}
            </h2>
            <dl className="grid gap-3 sm:grid-cols-4">
              <Stat label={T.outbound} value={v(o.outbound.total)} />
              <Stat label={`${T.sponsored}: ${T.served}`} value={v(o.sponsored.served)} />
              <Stat label={`${T.sponsored}: ${T.viewed}`} value={v(o.sponsored.viewed)} />
              <Stat label={`${T.sponsored}: ${T.clicks}`} value={v(o.sponsored.clicks)} />
            </dl>
            <Rows rows={o.outbound.byKind.map((k) => ({ label: k.kind, count: k.count }))} />
          </section>
          <section className="space-y-3" aria-labelledby="icerik">
            <h2 id="icerik" className="text-lg font-semibold">
              {T.content}
            </h2>
            <dl className="grid gap-3 sm:grid-cols-3">
              <Stat label={T.publishedArticles} value={v(o.content.publishedArticles)} />
              <Stat label={T.staleListings} value={v(o.content.staleListings)} />
              <Stat label={T.favorites} value={v(o.favoritesAdded)} />
            </dl>
            <h3 className="font-semibold">{T.byCategory}</h3>
            <Rows
              rows={o.content.publishedListings.map((c) => ({ label: c.category, count: c.count }))}
            />
          </section>
          <section className="space-y-3" aria-labelledby="moderasyon">
            <h2 id="moderasyon" className="text-lg font-semibold">
              {T.reviews}
            </h2>
            <dl className="grid gap-3 sm:grid-cols-5">
              <Stat label={T.submitted} value={v(o.reviews.submitted)} />
              <Stat label={T.published} value={v(o.reviews.published)} />
              <Stat label={T.removed} value={v(o.reviews.removed)} />
              <Stat label={T.pendingModeration} value={v(o.moderation.pending)} />
              <Stat label={T.medianWait} value={v(o.moderation.medianWaitHours)} />
            </dl>
            <h3 className="font-semibold">{T.removalReasons}</h3>
            <Rows
              rows={o.reviews.removalReasons.map((r) => ({
                label: tr.reviews.reasons[r.reason as keyof typeof tr.reviews.reasons] ?? r.reason,
                count: r.count,
              }))}
            />
          </section>
          <section className="space-y-3" aria-labelledby="sinirlar">
            <h2 id="sinirlar" className="text-lg font-semibold">
              {T.guardrails}
            </h2>
            <dl className="grid gap-3 sm:grid-cols-3">
              <Stat
                label={T.sponsoredPerSearch}
                value={
                  o.guardrails.sponsoredPerSearch === null
                    ? N
                    : String(o.guardrails.sponsoredPerSearch)
                }
              />
              <Stat
                label={T.removalRate}
                value={
                  o.guardrails.reviewRemovalRate === null
                    ? N
                    : percent(o.guardrails.reviewRemovalRate)
                }
              />
              <Stat label={T.applications} value={N} />
            </dl>
          </section>
        </>
      )}
    </div>
  );
}
