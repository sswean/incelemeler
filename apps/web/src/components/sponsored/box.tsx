'use client';

import { useEffect, useState } from 'react';
import type { SponsoredItem } from '@incelemeler/contracts';
import { sponsored } from '@incelemeler/i18n';
import { ImpressionTracker } from './impression';
import { CommercialLabel } from './label';

// Yalnızca kullanılan ad alanı istemci paketine girer (REQ-PRF-004).
const tr = { sponsored };

/**
 * Listeleme detayı rakip sponsorlu kutu (A8.3: ≤ 1, sayfanın alt yarısında, "Benzer seçenekler" dışında).
 * İstemcide yüklenir: ISR önbelleği bitmiş kampanyayı tutmaz (REQ-SPN-005).
 */
export function SponsoredBox({ listingId }: { listingId: string }) {
  const [item, setItem] = useState<SponsoredItem | null>(null);
  useEffect(() => {
    let alive = true;
    fetch(`/olay/sponsorlu-kutu?ilan=${listingId}`, { cache: 'no-store' })
      .then((r) => (r.ok ? (r.json() as Promise<{ data: SponsoredItem[] }>) : { data: [] }))
      .then((d) => alive && setItem(d.data[0] ?? null))
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [listingId]);
  if (!item || item.item.commercial.type === 'NONE') return null;
  return (
    <aside
      aria-label={tr.sponsored.competitorTitle}
      className="rounded-lg border border-border-strong p-4"
      data-testid="sponsored-box"
    >
      <ImpressionTracker token={item.impressionToken}>
        <p className="font-semibold">
          <a
            href={item.clickHref}
            rel="sponsored nofollow"
            className="text-brand-default underline"
          >
            <CommercialLabel commercial={item.item.commercial} />
            {item.item.title}
          </a>
        </p>
        {item.item.subtitle ? (
          <p className="text-sm text-text-secondary">{item.item.subtitle}</p>
        ) : null}
        <details className="mt-1 text-sm">
          <summary className="min-h-11 cursor-pointer content-center underline">
            {tr.sponsored.whyTitle}
          </summary>
          <p>{item.item.commercial.why}</p>
        </details>
      </ImpressionTracker>
    </aside>
  );
}
