import type { Metadata } from 'next';
import Link from 'next/link';
import type { ModerationQueue } from '@incelemeler/contracts';
import { tr } from '@incelemeler/i18n';
import { Alert, PageTitle } from '../../../components/ui';
import { errorMessage } from '../../../lib/errors';
import { api, requireStaff } from '../../../lib/session';
import { decideAction } from './actions';

export const metadata: Metadata = { title: tr.moderation.title };
export const dynamic = 'force-dynamic';

const M = tr.moderation;
const R = tr.reviews;
const QUEUES = ['pending', 'post', 'reports', 'appeals', 'removals'] as const;
type Queue = (typeof QUEUES)[number];
type Item = ModerationQueue['data'][number];

function ReasonSelect({ id, required }: { id: string; required: boolean }) {
  return (
    <label className="block text-sm" htmlFor={id}>
      <span className="font-medium">{M.reason}</span>
      <select
        id={id}
        name="reasonCode"
        required={required}
        defaultValue=""
        className="block min-h-11 w-full rounded-md border border-border-strong bg-bg-default px-2"
      >
        <option value="">—</option>
        {Object.entries(R.reasons).map(([k, v]) => (
          <option key={k} value={k}>
            {v}
          </option>
        ))}
      </select>
    </label>
  );
}

/** Karar formu: her eylem ayrı form (gerekçe kodu ret/kaldırmada tarayıcıda da zorunlu). */
function Decision({ item, queue }: { item: Item; queue: Queue }) {
  const actions: Array<{ value: string; label: string; reason: boolean }> =
    item.kind === 'REVIEW'
      ? queue === 'pending'
        ? [
            { value: 'APPROVE', label: M.approve, reason: false },
            { value: 'REJECT', label: M.reject, reason: true },
            { value: 'REMOVE', label: M.remove, reason: true },
          ]
        : [
            { value: 'APPROVE', label: M.approve, reason: false },
            { value: 'REMOVE', label: M.remove, reason: true },
          ]
      : item.kind === 'REPORT'
        ? [
            { value: 'DISMISS', label: M.dismiss, reason: false },
            { value: 'REMOVE_TARGET', label: M.removeTarget, reason: true },
          ]
        : item.kind === 'REMOVAL'
          ? [
              { value: 'CONFIRM', label: M.confirmRemoval, reason: false },
              { value: 'DECLINE', label: M.declineRemoval, reason: false },
            ]
          : [
              { value: 'UPHELD', label: M.uphold, reason: false },
              {
                value: 'OVERTURNED',
                label: M.overturn,
                reason: item.appeal?.against === 'REPORT_DECISION',
              },
            ];
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {actions.map((a) => (
        <form
          key={a.value}
          action={decideAction}
          className="space-y-2 rounded-md border border-border-default p-3"
          aria-label={`${a.label}: ${item.review.listing.name}`}
        >
          <input type="hidden" name="kind" value={item.kind} />
          <input type="hidden" name="id" value={item.id} />
          <input type="hidden" name="queue" value={queue} />
          <input type="hidden" name="action" value={a.value} />
          <input type="hidden" name="version" value={item.review.version} />
          {a.reason ? <ReasonSelect id={`${item.id}-${a.value}-reason`} required /> : null}
          <label className="block text-sm">
            <span className="font-medium">{M.note}</span>
            <textarea
              name="note"
              rows={2}
              maxLength={1000}
              required={item.kind === 'APPEAL'}
              minLength={item.kind === 'APPEAL' ? 5 : undefined}
              className="block w-full rounded-md border border-border-strong bg-bg-default px-2 py-1"
            />
          </label>
          <button
            type="submit"
            className="min-h-11 rounded-md border border-border-strong px-4 text-sm"
          >
            {a.label}
          </button>
        </form>
      ))}
    </div>
  );
}

/** Moderasyon kuyruğu (REQ-GUN-001…004): öncelik ve SLA yaşı; karar başına gerekçe kodu; denetim kaydı. */
export default async function ModerationPage({
  searchParams,
}: {
  searchParams: Promise<{ kuyruk?: string; durum?: string; hata?: string }>;
}) {
  const { token, user } = await requireStaff();
  const sp = await searchParams;
  const queue: Queue = QUEUES.includes(sp.kuyruk as Queue) ? (sp.kuyruk as Queue) : 'pending';
  if (!user.permissions.includes('reviews.moderate')) {
    return (
      <div className="space-y-4">
        <PageTitle>{M.title}</PageTitle>
        <Alert kind="info">{tr.admin.noPermission}</Alert>
      </div>
    );
  }
  const { data } = await (
    await api(token)
  ).GET('/v1/admin/moderation/queue', { params: { query: { queue } } });
  return (
    <div className="space-y-6">
      <PageTitle>{M.title}</PageTitle>
      {sp.durum === 'karar' ? <Alert kind="success">{M.decided}</Alert> : null}
      {sp.durum === 'ikinci-onay' ? <Alert kind="info">{M.secondApproval}</Alert> : null}
      {sp.hata ? <Alert kind="error">{errorMessage(sp.hata)}</Alert> : null}
      <nav aria-label={M.title} className="flex flex-wrap gap-2">
        {QUEUES.map((q) => (
          <Link
            key={q}
            href={`/moderasyon?kuyruk=${q}`}
            aria-current={q === queue ? 'page' : undefined}
            className={`inline-flex min-h-11 items-center rounded-md border px-3 text-sm ${
              q === queue ? 'border-brand-default font-semibold' : 'border-border-strong'
            }`}
          >
            {M.queues[q]} ({data?.counts[q] ?? 0})
          </Link>
        ))}
      </nav>
      {!data?.data.length ? (
        <p className="text-text-secondary">{M.empty}</p>
      ) : (
        <ol className="space-y-4" data-testid="moderation-queue">
          {data.data.map((item) => (
            <li
              key={`${item.kind}-${item.id}`}
              className="space-y-3 rounded-lg border border-border-default p-4"
            >
              <div className="flex flex-wrap justify-between gap-2 text-sm text-text-secondary">
                <span>
                  {M.listing}: <strong>{item.review.listing.name}</strong> · {M.author}:{' '}
                  {item.review.author.displayName}
                </span>
                <span>{M.age.replace('{saat}', item.ageHours.toLocaleString('tr-TR'))}</span>
              </div>
              <p>
                <strong>{item.review.rating}/5</strong>
                {item.review.title ? ` · ${item.review.title}` : ''}
              </p>
              <p className="whitespace-pre-line">{item.review.body}</p>
              <p className="text-sm">
                {M.risk}: {item.review.riskScore}
                {item.review.signals.length
                  ? ` · ${M.signals}: ${item.review.signals.map((s) => s.code).join(', ')}`
                  : ''}
                {item.review.incentivized ? ` · ${M.incentivized}` : ''}
              </p>
              {item.report ? (
                <p className="text-sm">
                  {R.reportReasons[item.report.reason]} ·{' '}
                  {M.reportCount.replace('{n}', String(item.report.count))}
                  {item.report.description ? ` — ${item.report.description}` : ''}
                </p>
              ) : null}
              {item.removal ? (
                <p className="text-sm" data-testid="removal-request">
                  {M.removalRequested}: {R.reasons[item.removal.reasonCode]}
                  {item.removal.note ? ` — ${item.removal.note}` : ''}
                </p>
              ) : null}
              {item.appeal ? (
                <p className="text-sm">
                  {M.appealStatement}: {item.appeal.statement}
                  {item.review.reasonCode
                    ? ` · ${R.reasonLabel}: ${R.reasons[item.review.reasonCode]}`
                    : ''}
                </p>
              ) : null}
              <Decision item={item} queue={queue} />
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
