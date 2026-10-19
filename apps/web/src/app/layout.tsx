import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { tr } from '@incelemeler/i18n';
import { robots } from '../lib/seo';
import { getSessionToken } from '../lib/session';
import './globals.css';

export const metadata: Metadata = {
  title: { default: `${tr.brand.name} — ${tr.brand.slogan}`, template: `%s · ${tr.brand.name}` },
  description: tr.brand.slogan,
  // Arama motorlarına yalnızca SITE_INDEXING=on iken açık (A-008; canlıya geçiş C sınıfıdır).
  robots: robots(true),
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const signedIn = Boolean(await getSessionToken());
  return (
    <html lang="tr">
      <body className="min-h-screen bg-bg-default text-text-primary antialiased">
        <a
          href="#icerik"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:rounded-md focus:bg-bg-default focus:px-4 focus:py-2"
        >
          {tr.common.skipToContent}
        </a>
        <header className="border-b border-border-default">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
            <Link href="/" className="text-xl font-semibold tracking-tight">
              {tr.brand.name}
            </Link>
            <nav aria-label="Hesap" className="text-sm">
              {signedIn ? (
                <Link href="/hesabim" className="text-brand-default underline">
                  {tr.auth.accountTitle}
                </Link>
              ) : (
                <Link href="/giris" className="text-brand-default underline">
                  {tr.auth.loginTitle}
                </Link>
              )}
            </nav>
          </div>
        </header>
        <main id="icerik" className="mx-auto max-w-6xl px-4 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
