import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { connection } from 'next/server';
import { tr } from '@incelemeler/i18n';
import './globals.css';

export const metadata: Metadata = {
  title: `${tr.admin.title} · ${tr.brand.name}`,
  robots: { index: false, follow: false },
};

/** Tüm panel sayfaları dinamik: nonce'lu CSP statik ön işlenmiş sayfaya uygulanamaz. */
export default async function AdminLayout({ children }: { children: ReactNode }) {
  await connection();
  return (
    <html lang="tr">
      <body className="min-h-screen bg-bg-subtle text-text-primary antialiased">
        <header className="border-b border-border-default bg-bg-default">
          <div className="mx-auto max-w-6xl px-4 py-4 text-lg font-semibold">
            {tr.brand.name} · {tr.admin.title}
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
