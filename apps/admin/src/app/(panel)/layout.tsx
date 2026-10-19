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
            href="/kategoriler"
            className="min-h-11 content-center text-brand-default underline"
          >
            {tr.admin.nav.categories}
          </Link>
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
