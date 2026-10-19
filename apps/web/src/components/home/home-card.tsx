import Link from 'next/link';
import type { HomeCard } from '@incelemeler/contracts';
import { tr } from '@incelemeler/i18n';
import { ImpressionTracker } from '../sponsored/impression';
import { CommercialLabel } from '../sponsored/label';

/** Ana sayfa kartı: ticari ilişki varsa etiket başlıktan önce, "Neden bunu görüyorum?" ile (A8.2). */
export function HomeCardView({ card }: { card: HomeCard }) {
  const c = card.commercial;
  if (card.sponsored && c.type !== 'NONE') {
    return (
      <li className="rounded-lg border border-border-strong p-4" data-testid="sponsored-card">
        <ImpressionTracker token={card.sponsored.impressionToken}>
          <a
            href={card.sponsored.clickHref}
            rel="sponsored nofollow"
            className="font-semibold text-brand-default underline"
          >
            <CommercialLabel commercial={c} />
            {card.title}
          </a>
          {card.subtitle ? <p className="text-sm text-text-secondary">{card.subtitle}</p> : null}
          <details className="mt-1 text-sm">
            <summary className="min-h-11 cursor-pointer content-center underline">
              {tr.sponsored.whyTitle}
            </summary>
            <p>{c.why}</p>
          </details>
        </ImpressionTracker>
      </li>
    );
  }
  return (
    <li className="rounded-lg border border-border-default p-4">
      <Link href={card.path} className="font-semibold text-brand-default underline">
        <CommercialLabel commercial={c} />
        {card.title}
      </Link>
      {card.subtitle ? <p className="text-sm text-text-secondary">{card.subtitle}</p> : null}
    </li>
  );
}
