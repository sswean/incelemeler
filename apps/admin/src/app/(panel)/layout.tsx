import type { ReactNode } from 'react';
import Link from 'next/link';
import { tr } from '@incelemeler/i18n';
import { requireStaff } from '../../lib/session';
import { logoutAction } from '../actions';

/** Panel kabuğu: 2FA doğrulanmış personel. Sayfalar da ayrıca `requireStaff` çağırır (yerleşimler gezintide yeniden çizilmez). */
export default async function PanelLayout({ children }: { children: ReactNode }) {
  const { user } = await requireStaff();
  return (
    <div className="space-y-6">
      <div
        className="flex flex-wrap items-center justify-between gap-4 text-sm"
        data-testid="staff-identity"
      >
        <nav aria-label="Panel" className="flex flex-wrap gap-4">
          <Link href="/" className="min-h-11 content-center text-brand-default underline">
            {tr.admin.nav.home}
          </Link>
          <Link
            href="/listelemeler"
            className="min-h-11 content-center text-brand-default underline"
          >
            {tr.admin.nav.listings}
          </Link>
          <Link href="/icerikler" className="min-h-11 content-center text-brand-default underline">
            {tr.admin.nav.content}
          </Link>
          {user.permissions.some((x) =>
            ['content.publish', 'content.draft', 'sponsored.content.write'].includes(x),
          ) ? (
            <Link
              href="/yazar-profili"
              className="min-h-11 content-center text-brand-default underline"
            >
              {tr.admin.nav.authorProfile}
            </Link>
          ) : null}
          {user.permissions.includes('listings.write') ? (
            <Link
              href="/ice-aktarma"
              className="min-h-11 content-center text-brand-default underline"
            >
              {tr.admin.nav.imports}
            </Link>
          ) : null}
          <Link
            href="/kategoriler"
            className="min-h-11 content-center text-brand-default underline"
          >
            {tr.admin.nav.categories}
          </Link>
          {user.permissions.includes('reviews.moderate') ? (
            <Link
              href="/moderasyon"
              className="min-h-11 content-center text-brand-default underline"
            >
              {tr.admin.nav.moderation}
            </Link>
          ) : null}
          {user.permissions.includes('reviews.moderate') ? (
            <Link
              href="/yaptirimlar"
              className="min-h-11 content-center text-brand-default underline"
            >
              {tr.admin.nav.sanctions}
            </Link>
          ) : null}
          {user.permissions.includes('taxonomy.manage') ? (
            <Link
              href="/ayarlar/esikler"
              className="min-h-11 content-center text-brand-default underline"
            >
              {tr.admin.nav.thresholds}
            </Link>
          ) : null}
          {user.permissions.some((x) => x === 'campaigns.manage' || x === 'content.publish') ? (
            <Link
              href="/kampanyalar"
              className="min-h-11 content-center text-brand-default underline"
            >
              {tr.admin.nav.campaigns}
            </Link>
          ) : null}
          {user.permissions.includes('content.publish') ? (
            <Link
              href="/ana-sayfa"
              className="min-h-11 content-center text-brand-default underline"
            >
              {tr.admin.nav.homeEditor}
            </Link>
          ) : null}
          {user.permissions.includes('audit.read') ? (
            <Link href="/analitik" className="min-h-11 content-center text-brand-default underline">
              {tr.admin.nav.analytics}
            </Link>
          ) : null}
          {user.permissions.includes('campaigns.amount') ? (
            <Link
              href="/raporlar/gelir"
              className="min-h-11 content-center text-brand-default underline"
            >
              {tr.admin.nav.revenue}
            </Link>
          ) : null}
          {user.permissions.some((x) => x === 'listings.write' || x === 'campaigns.manage') ? (
            <Link
              href="/basvurular"
              className="min-h-11 content-center text-brand-default underline"
            >
              {tr.admin.nav.applications}
            </Link>
          ) : null}
          {user.permissions.some((x) => x === 'system.settings' || x === 'audit.read') ? (
            <Link
              href="/ayarlar/isletim"
              className="min-h-11 content-center text-brand-default underline"
            >
              {tr.admin.nav.ops}
            </Link>
          ) : null}
          {user.permissions.includes('audit.read') ? (
            <Link
              href="/hukuki-talepler"
              className="min-h-11 content-center text-brand-default underline"
            >
              {tr.admin.nav.takedown}
            </Link>
          ) : null}
          {user.permissions.includes('audit.read') ? (
            <Link
              href="/kvkk-basvurulari"
              className="min-h-11 content-center text-brand-default underline"
            >
              {tr.admin.nav.dataRequests}
            </Link>
          ) : null}
          {user.permissions.includes('campaigns.manage') ? (
            <Link
              href="/ayarlar/yuvalar"
              className="min-h-11 content-center text-brand-default underline"
            >
              {tr.admin.nav.slots}
            </Link>
          ) : null}
          {user.permissions.some((x) => x === 'outbound.add' || x === 'affiliate.manage') ? (
            <Link
              href="/entegrasyonlar"
              className="min-h-11 content-center text-brand-default underline"
            >
              {tr.admin.nav.integrations}
            </Link>
          ) : null}
        </nav>
        <div className="flex flex-wrap items-center gap-4">
          <p>
            {tr.admin.signedInAs}: <strong>{user.displayName}</strong> · {tr.admin.roles}:{' '}
            {user.roles.join(', ')}
          </p>
          <form action={logoutAction}>
            <button type="submit" className="min-h-11 text-brand-default underline">
              {tr.auth.logout}
            </button>
          </form>
        </div>
      </div>
      {children}
    </div>
  );
}
