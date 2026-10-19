import Link from 'next/link';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { tr } from '@incelemeler/i18n';
import { formatDate, formatTime } from '@incelemeler/utils';
import { Alert, PageTitle } from '../../components/ui';
import { api, getSessionToken } from '../../lib/session';
import { logoutAction, revokeSessionAction } from '../auth-actions';

export const metadata: Metadata = { title: tr.auth.accountTitle, robots: { index: false } };
export const dynamic = 'force-dynamic';

export default async function AccountPage() {
  const token = await getSessionToken();
  if (!token) redirect('/giris');
  const client = await api(token);
  const [{ data: me }, { data: sessions }] = await Promise.all([
    client.GET('/v1/me'),
    client.GET('/v1/me/sessions'),
  ]);
  if (!me) redirect('/giris');
  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <PageTitle>{tr.auth.accountTitle}</PageTitle>
      <ul className="flex flex-wrap gap-x-6 gap-y-2">
        <li>
          <Link href="/hesabim/degerlendirmelerim" className="text-brand-default underline">
            {tr.reviews.mine}
          </Link>
        </li>
        <li>
          <Link href="/hesabim/kaydedilenler" className="text-brand-default underline">
            {tr.account.saved}
          </Link>
        </li>
      </ul>
      <section className="space-y-1" data-testid="account-summary">
        <p className="font-medium">{me.displayName}</p>
        <p className="text-text-secondary">{me.email}</p>
        {!me.emailVerified ? <Alert kind="info">{tr.auth.emailUnverified}</Alert> : null}
      </section>
      <section aria-labelledby="oturumlar" className="space-y-3">
        <h2 id="oturumlar" className="text-lg font-semibold">
          {tr.auth.sessionsTitle}
        </h2>
        <ul className="divide-y divide-border-default rounded-md border border-border-default">
          {(sessions?.data ?? []).map((s) => (
            <li key={s.id} className="flex items-center justify-between gap-4 px-4 py-3 text-sm">
              <span>
                {s.current ? <strong>{tr.auth.thisDevice} · </strong> : null}
                {s.userAgent ?? '—'}
                <br />
                <span className="text-text-secondary">
                  {tr.auth.lastSeen}: {formatDate(new Date(s.lastSeenAt))}{' '}
                  {formatTime(new Date(s.lastSeenAt))}
                </span>
              </span>
              {!s.current ? (
                <form action={revokeSessionAction}>
                  <input type="hidden" name="id" value={s.id} />
                  <button type="submit" className="min-h-11 text-brand-default underline">
                    {tr.auth.endSession}
                  </button>
                </form>
              ) : null}
            </li>
          ))}
        </ul>
      </section>
      <section aria-labelledby="verilerim" className="space-y-2">
        <h2 id="verilerim" className="text-lg font-semibold">
          {tr.account.export}
        </h2>
        <p className="text-sm text-text-secondary">{tr.account.exportHint}</p>
        <p>
          <a href="/hesabim/verilerim" download className="text-brand-default underline">
            {tr.account.export}
          </a>
        </p>
        <p>
          <Link href="/hesabim/hesabi-sil" className="text-brand-default underline">
            {tr.account.deleteAccount}
          </Link>
        </p>
      </section>
      <form action={logoutAction}>
        <button type="submit" className="min-h-11 text-brand-default underline">
          {tr.auth.logout}
        </button>
      </form>
    </div>
  );
}
