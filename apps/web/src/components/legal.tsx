import type { ReactNode } from 'react';
import { tr } from '@incelemeler/i18n';
import { PageTitle } from './ui';

/** Hukuki metin kabuğu: TASLAK etiketi kaldırılamaz (AK-12; kaldırma C sınıfıdır). */
export function LegalDraft({ title, children }: { title: string; children: ReactNode }) {
  return (
    <article className="mx-auto max-w-2xl space-y-4">
      <p
        className="inline-block rounded-md border border-border-strong px-2 py-1 text-xs font-semibold"
        data-testid="legal-draft"
      >
        {tr.legal.draftBadge}
      </p>
      <PageTitle>{title}</PageTitle>
      <p role="note" className="text-sm text-text-secondary">
        {tr.legal.draftNotice}
      </p>
      <div className="space-y-3">{children}</div>
    </article>
  );
}
