import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CAMPAIGN_TRANSITIONS, type CampaignAction } from '@incelemeler/contracts';
import { tr } from '@incelemeler/i18n';
import { Alert, Field, PageTitle, SubmitButton } from '../../../../components/ui';
import { errorMessage } from '../../../../lib/errors';
import { api, requireStaff } from '../../../../lib/session';
import {
  addCreativeAction,
  addPlacementAction,
  removePlacementAction,
  reviewCreativeAction,
  transitionCampaignAction,
} from '../actions';
import { fieldMessage, formatIstanbul, formatKurus, percent } from '../messages';

const T = tr.campaigns;
const S = tr.slotsAdmin;
export const metadata: Metadata = { title: T.title };
export const dynamic = 'force-dynamic';

const button = 'min-h-11 rounded-md border border-border-strong px-4 text-sm';
const select =
  'block w-full rounded-md border border-border-strong bg-bg-default px-3 py-2 text-base';

/** Kampanya ayrıntısı (Ek A8.4, REQ-SPN-001/011/013): yaşam döngüsü, yerleşimler, kreatifler, rapor. */
export default async function CampaignPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ durum?: string; hata?: string; alan?: string }>;
}) {
  const { token, user } = await requireStaff();
  const { id } = await params;
  const sp = await searchParams;
  const client = await api(token);
  const { data: c } = await client.GET('/v1/admin/campaigns/{id}', { params: { path: { id } } });
  if (!c) notFound();
  const sales = user.permissions.includes('campaigns.manage');
  const editorial = user.permissions.includes('content.publish');
  const [slots, report] = await Promise.all([
    sales ? client.GET('/v1/admin/placement-slots') : Promise.resolve({ data: undefined }),
    sales
      ? client.GET('/v1/admin/campaigns/{id}/report', { params: { path: { id } } })
      : Promise.resolve({ data: undefined }),
  ]);
  const actions = (Object.keys(CAMPAIGN_TRANSITIONS) as CampaignAction[]).filter((a) => {
    if (!CAMPAIGN_TRANSITIONS[a].from.includes(c.status)) return false;
    if (a === 'approve_editorial') return editorial && !c.editorialApprovedAt;
    if (a === 'approve_sales') return sales && !c.salesApprovedAt;
    return sales;
  });
  const draft = c.status === 'DRAFT';
  const r = report.data;

  return (
    <div className="max-w-4xl space-y-8 rounded-lg border border-border-default bg-bg-default p-6">
      <div className="space-y-1">
        <PageTitle>{c.name}</PageTitle>
        <p className="text-sm text-text-secondary" data-testid="campaign-meta">
          {c.sponsor.name} · {T.status}:{' '}
          <span data-testid="campaign-status">{T.statuses[c.status]}</span> · {T.period}:{' '}
          {formatIstanbul(c.startsAt)} – {formatIstanbul(c.endsAt)}
          {c.dataOrigin === 'DEMO' ? ` · ${T.demo}` : ''}
        </p>
        <p className="text-sm">
          {T.salesApproved}: {c.salesApprovedAt ? formatIstanbul(c.salesApprovedAt) : T.notYet} ·{' '}
          {T.editorialApproved}:{' '}
          {c.editorialApprovedAt ? formatIstanbul(c.editorialApprovedAt) : T.notYet}
          {c.budgetKurus !== null ? ` · ${T.budget}: ${formatKurus(c.budgetKurus)}` : ''}
          {c.contractRef ? ` · ${T.contractRef}: ${c.contractRef}` : ''}
        </p>
      </div>
      {sp.durum === 'kaydedildi' ? <Alert kind="success">{T.saved}</Alert> : null}
      {sp.durum === 'olusturuldu' ? <Alert kind="success">{T.created}</Alert> : null}
      {sp.hata ? (
        <Alert kind="error">{fieldMessage(sp.alan) ?? errorMessage(sp.hata)}</Alert>
      ) : null}

      {actions.length ? (
        <div className="flex flex-wrap gap-3">
          {actions.map((a) => (
            <form key={a} action={transitionCampaignAction}>
              <input type="hidden" name="id" value={c.id} />
              <input type="hidden" name="version" value={c.version} />
              <input type="hidden" name="action" value={a} />
              <button type="submit" className={button}>
                {T.actions[a]}
              </button>
            </form>
          ))}
        </div>
      ) : null}

      <section aria-labelledby="yerlesimler" className="space-y-3">
        <h2 id="yerlesimler" className="text-lg font-semibold">
          {T.placements}
        </h2>
        {c.placements.length === 0 ? (
          <p className="text-sm">{T.noPlacements}</p>
        ) : (
          <ul className="space-y-2" data-testid="placements">
            {c.placements.map((p) => (
              <li
                key={p.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border-default p-3 text-sm"
              >
                <span>
                  {S.surfaces[p.slot.surface]} · <strong>{p.listing.name}</strong>
                  {p.targetCategory ? ` · ${p.targetCategory.name}` : ''}
                  {p.targetArea ? ` · ${p.targetArea.name}` : ''} · {T.priority}: {p.priority} ·{' '}
                  {T.weight}: {p.weight}
                </span>
                {draft && sales ? (
                  <form action={removePlacementAction}>
                    <input type="hidden" name="id" value={c.id} />
                    <input type="hidden" name="placementId" value={p.id} />
                    <button type="submit" className={button}>
                      {T.remove}
                    </button>
                  </form>
                ) : null}
              </li>
            ))}
          </ul>
        )}
        {draft && sales && slots.data ? (
          <form
            action={addPlacementAction}
            aria-label={T.addPlacement}
            className="space-y-3 rounded-md border border-border-default p-4"
          >
            <input type="hidden" name="id" value={c.id} />
            <div className="space-y-1">
              <label htmlFor="slotId" className="block text-sm font-medium">
                {T.slot}
              </label>
              <select id="slotId" name="slotId" className={select}>
                {slots.data.data
                  .filter((s) => s.enabled)
                  .map((s) => (
                    <option key={s.id} value={s.id}>
                      {S.surfaces[s.surface]}
                    </option>
                  ))}
              </select>
            </div>
            <Field id="listingSlug" label={T.listingSlug} required maxLength={160} />
            <Field id="targetCategorySlug" label={T.targetCategory} maxLength={120} />
            <Field id="targetProvinceSlug" label={T.targetProvince} maxLength={120} />
            <Field id="priority" type="number" label={T.priority} defaultValue="0" />
            <Field id="weight" type="number" label={T.weight} defaultValue="1" />
            <SubmitButton>{T.addPlacement}</SubmitButton>
          </form>
        ) : null}
      </section>

      <section aria-labelledby="kreatifler" className="space-y-3">
        <h2 id="kreatifler" className="text-lg font-semibold">
          {T.creatives}
        </h2>
        {c.creatives.length === 0 ? (
          <p className="text-sm">{T.noCreatives}</p>
        ) : (
          <ul className="space-y-2">
            {c.creatives.map((x) => (
              <li
                key={x.id}
                className="space-y-2 rounded-md border border-border-default p-3 text-sm"
              >
                <p>
                  <strong>{x.title}</strong>
                  {x.body ? ` — ${x.body}` : ''} · {T.approvals[x.approval]}
                </p>
                {editorial && x.approval === 'PENDING' ? (
                  <div className="flex gap-3">
                    {(['APPROVED', 'REJECTED'] as const).map((d) => (
                      <form key={d} action={reviewCreativeAction}>
                        <input type="hidden" name="id" value={c.id} />
                        <input type="hidden" name="creativeId" value={x.id} />
                        <input type="hidden" name="version" value={x.version} />
                        <input type="hidden" name="decision" value={d} />
                        <button type="submit" className={button}>
                          {d === 'APPROVED' ? T.approve : T.reject}
                        </button>
                      </form>
                    ))}
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        )}
        {draft && sales ? (
          <form
            action={addCreativeAction}
            aria-label={T.addCreative}
            className="space-y-3 rounded-md border border-border-default p-4"
          >
            <input type="hidden" name="id" value={c.id} />
            <Field id="title" label={T.creativeTitle} required maxLength={80} />
            <Field id="body" label={T.creativeBody} maxLength={200} />
            <SubmitButton>{T.addCreative}</SubmitButton>
          </form>
        ) : null}
      </section>

      {r ? (
        <section aria-labelledby="rapor" className="space-y-3" data-testid="campaign-report">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 id="rapor" className="text-lg font-semibold">
              {T.report}
            </h2>
            <a
              href={`/kampanyalar/${c.id}/rapor.csv`}
              className="min-h-11 content-center underline"
            >
              {T.csv}
            </a>
          </div>
          <p className="text-sm text-text-secondary">{T.definitions}</p>
          <p className="text-sm" data-testid="report-freshness">
            {T.lastUpdated.replace('{date}', formatIstanbul(r.generatedAt))}
            {r.lastEventAt
              ? ` · ${T.lastEvent.replace('{date}', formatIstanbul(r.lastEventAt))}`
              : ''}
          </p>
          <dl className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4" data-testid="report-totals">
            <div>
              <dt className="text-text-secondary">{T.served}</dt>
              <dd>{r.totals.served}</dd>
            </div>
            <div>
              <dt className="text-text-secondary">{T.viewed}</dt>
              <dd>{r.totals.viewed}</dd>
            </div>
            <div>
              <dt className="text-text-secondary">{T.clicks}</dt>
              <dd>{r.totals.clicks}</dd>
            </div>
            <div>
              <dt className="text-text-secondary">{T.ctr}</dt>
              <dd>{percent(r.totals.ctr)}</dd>
            </div>
          </dl>
          <p className="text-sm font-medium" data-testid="report-conversions">
            {T.noConversions}
          </p>
          {r.daily.length === 0 ? (
            <p className="text-sm">{T.noEvents}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr>
                    <th scope="col">{T.date}</th>
                    <th scope="col">{T.served}</th>
                    <th scope="col">{T.viewed}</th>
                    <th scope="col">{T.clicks}</th>
                    <th scope="col">{T.ctr}</th>
                  </tr>
                </thead>
                <tbody>
                  {r.daily.map((d) => (
                    <tr key={d.date}>
                      <td>{d.date}</td>
                      <td>{d.served}</td>
                      <td>{d.viewed}</td>
                      <td>{d.clicks}</td>
                      <td>{percent(d.ctr)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {r.bySlot.length ? (
            <>
              <h3 className="font-semibold">{T.bySlot}</h3>
              <ul className="text-sm">
                {r.bySlot.map((b) => (
                  <li key={b.slot}>
                    {S.surfaces[b.surface]}: {T.viewed} {b.viewed} · {T.clicks} {b.clicks} · {T.ctr}{' '}
                    {percent(b.ctr)}
                  </li>
                ))}
              </ul>
            </>
          ) : null}
          {r.share.length ? (
            <ul className="text-sm">
              {r.share.map((s) => (
                <li key={s.slot}>
                  {T.share} ({s.slot}): {percent(s.servedShare)}
                </li>
              ))}
            </ul>
          ) : null}
          <p className="text-xs text-text-secondary">
            {T.excluded.replace('{n}', String(r.excluded))}
          </p>
        </section>
      ) : null}
    </div>
  );
}
