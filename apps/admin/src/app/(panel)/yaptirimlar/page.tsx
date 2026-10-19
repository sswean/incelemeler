import type { Metadata } from 'next';
import type { AdminSanction, SanctionLevel } from '@incelemeler/contracts';
import { tr } from '@incelemeler/i18n';
import { Alert, Field, PageTitle, SubmitButton } from '../../../components/ui';
import { errorMessage } from '../../../lib/errors';
import { api, requireStaff } from '../../../lib/session';
import { formatIstanbul } from '../kampanyalar/messages';
import {
  decideSanctionAppealAction,
  integrityAction,
  issueSanctionAction,
  revokeSanctionAction,
} from './actions';

const T = tr.sanctions;
export const metadata: Metadata = { title: T.adminTitle };
export const dynamic = 'force-dynamic';

const select =
  'block w-full rounded-md border border-border-strong bg-bg-default px-3 py-2 text-base';
const textarea =
  'block w-full rounded-md border border-border-strong bg-bg-default px-2 py-1 text-base';
const LEVELS = Object.keys(T.levels) as SanctionLevel[];

function Summary({ s }: { s: AdminSanction }) {
  return (
    <p className="text-sm">
      <strong>{s.user.displayName}</strong> ({s.user.email}) · {T.levels[s.level]} ·{' '}
      {T.reasons[s.reasonCode]} ·{' '}
      {s.endsAt ? T.until.replace('{date}', formatIstanbul(s.endsAt)) : T.permanent}
    </p>
  );
}

/** Hesap yaptırımları ve toplu sahte değerlendirme temizliği (REQ-GUN-007). */
export default async function SanctionsPage({
  searchParams,
}: {
  searchParams: Promise<{ durum?: string; hata?: string; oneri?: string; n?: string }>;
}) {
  const { token, user } = await requireStaff();
  const sp = await searchParams;
  if (!user.permissions.includes('reviews.moderate')) {
    return (
      <div className="max-w-2xl space-y-4">
        <PageTitle>{T.adminTitle}</PageTitle>
        <Alert kind="info">{tr.admin.noPermission}</Alert>
      </div>
    );
  }
  const { data } = await (await api(token)).GET('/v1/admin/sanctions');
  return (
    <div className="max-w-4xl space-y-8 rounded-lg border border-border-default bg-bg-default p-6">
      <div className="space-y-1">
        <PageTitle>{T.adminTitle}</PageTitle>
        <p className="text-sm text-text-secondary">{T.adminIntro}</p>
      </div>
      {sp.durum === 'uygulandi' ? (
        <Alert kind="success">
          {T.issued.replace('{level}', T.levels[(sp.oneri as SanctionLevel) ?? 'WARNING'] ?? '')}
        </Alert>
      ) : null}
      {sp.durum === 'kaydedildi' ? <Alert kind="success">{T.saved}</Alert> : null}
      {sp.durum === 'temizlendi' ? (
        <Alert kind="success">{T.integrityDone.replace('{n}', sp.n ?? '0')}</Alert>
      ) : null}
      {sp.hata ? <Alert kind="error">{errorMessage(sp.hata)}</Alert> : null}

      <form
        action={issueSanctionAction}
        aria-label={T.issueTitle}
        className="space-y-3 rounded-md border border-border-default p-4"
      >
        <h2 className="text-lg font-semibold">{T.issueTitle}</h2>
        <Field id="sanction-email" name="email" type="email" label={T.email} required />
        <label className="block space-y-1">
          <span className="block text-sm font-medium">{T.level}</span>
          <select name="level" className={select}>
            {LEVELS.map((l) => (
              <option key={l} value={l}>
                {T.levels[l]}
              </option>
            ))}
          </select>
        </label>
        <label className="block space-y-1">
          <span className="block text-sm font-medium">{T.reason}</span>
          <select name="reasonCode" className={select}>
            {Object.entries(T.reasons).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </label>
        <Field id="sanction-days" name="durationDays" type="number" label={T.duration} />
        <label className="block space-y-1">
          <span className="block text-sm font-medium">{T.note}</span>
          <textarea
            name="note"
            required
            minLength={5}
            maxLength={1000}
            rows={2}
            className={textarea}
          />
        </label>
        <div className="flex items-start gap-2">
          <input
            id="skipLevel"
            name="skipLevel"
            type="checkbox"
            value="1"
            className="mt-1 h-5 w-5"
          />
          <label htmlFor="skipLevel" className="text-sm">
            {T.skipLevel}
          </label>
        </div>
        <SubmitButton>{T.issue}</SubmitButton>
      </form>

      <section aria-labelledby="appeals" className="space-y-3">
        <h2 id="appeals" className="text-lg font-semibold">
          {T.appealsTitle}
        </h2>
        {!data?.appeals.length ? (
          <p>{T.noAppeals}</p>
        ) : (
          <ul className="space-y-3">
            {data.appeals.map((s) => (
              <li
                key={s.id}
                className="space-y-2 rounded-md border border-border-default p-4"
                data-testid="sanction-appeal"
              >
                <Summary s={s} />
                <p className="whitespace-pre-line text-sm">{s.appeal?.statement}</p>
                <form
                  action={decideSanctionAppealAction}
                  className="space-y-2"
                  aria-label={`${T.appealsTitle}: ${s.user.email}`}
                >
                  <input type="hidden" name="id" value={s.id} />
                  <input type="hidden" name="version" value={s.version} />
                  <label className="block space-y-1">
                    <span className="block text-sm font-medium">{T.decisionNote}</span>
                    <textarea
                      name="note"
                      required
                      minLength={5}
                      maxLength={1000}
                      rows={2}
                      className={textarea}
                    />
                  </label>
                  <div className="flex flex-wrap gap-3">
                    <button
                      type="submit"
                      name="outcome"
                      value="OVERTURNED"
                      className="min-h-11 rounded-md border border-border-strong px-4"
                    >
                      {T.overturn}
                    </button>
                    <button
                      type="submit"
                      name="outcome"
                      value="UPHELD"
                      className="min-h-11 rounded-md border border-border-strong px-4"
                    >
                      {T.uphold}
                    </button>
                  </div>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="active" className="space-y-3">
        <h2 id="active" className="text-lg font-semibold">
          {T.activeTitle}
        </h2>
        {!data?.active.length ? (
          <p>{T.noActive}</p>
        ) : (
          <ul className="space-y-3">
            {data.active.map((s) => (
              <li
                key={s.id}
                className="space-y-2 rounded-md border border-border-default p-4"
                data-testid="sanction"
              >
                <Summary s={s} />
                <form
                  action={revokeSanctionAction}
                  className="flex flex-wrap items-end gap-3"
                  aria-label={`${T.revoke}: ${s.user.email}`}
                >
                  <input type="hidden" name="id" value={s.id} />
                  <input type="hidden" name="version" value={s.version} />
                  <label className="space-y-1">
                    <span className="block text-sm font-medium">{T.revokeNote}</span>
                    <input name="note" required minLength={5} maxLength={1000} className={select} />
                  </label>
                  <SubmitButton>{T.revoke}</SubmitButton>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>

      <form
        action={integrityAction}
        aria-label={T.integrityTitle}
        className="space-y-3 rounded-md border border-border-default p-4"
      >
        <h2 className="text-lg font-semibold">{T.integrityTitle}</h2>
        <p className="text-sm text-text-secondary">{T.integrityIntro}</p>
        <Field id="integrity-slug" name="slug" label={T.integrityListing} required />
        <label className="block space-y-1">
          <span className="block text-sm font-medium">{T.integrityReviewIds}</span>
          <textarea name="reviewIds" required rows={4} className={textarea} />
        </label>
        <label className="block space-y-1">
          <span className="block text-sm font-medium">{T.note}</span>
          <textarea
            name="note"
            required
            minLength={5}
            maxLength={1000}
            rows={2}
            className={textarea}
          />
        </label>
        <SubmitButton>{T.integrityApply}</SubmitButton>
      </form>
    </div>
  );
}
