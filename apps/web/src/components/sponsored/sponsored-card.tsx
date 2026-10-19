import type { SponsoredItem } from '@incelemeler/contracts';
import { tr } from '@incelemeler/i18n';
import { ImpressionTracker } from './impression';
import { CommercialLabel } from './label';

/**
 * Sponsorlu yerleşim kartı (REQ-SPN-002/003/012): etiket başlıktan önce; "Neden bunu görüyorum?" açıklaması
 * her yerleşimde; tıklama ölçüm için `/git/s/` üzerinden.
 */
export function SponsoredCard({ s, as: Tag = 'li' }: { s: SponsoredItem; as?: 'li' | 'div' }) {
  const c = s.item.commercial;
  return (
    <Tag
      className="rounded-lg border border-border-strong p-4"
      data-testid="sponsored-card"
      data-position={s.position}
    >
      <ImpressionTracker token={s.impressionToken}>
        <h3 className="font-semibold">
          <a href={s.clickHref} rel="sponsored nofollow" className="text-brand-default underline">
            <CommercialLabel commercial={c} />
            {s.item.title}
          </a>
        </h3>
        {s.item.subtitle ? <p className="text-sm text-text-secondary">{s.item.subtitle}</p> : null}
        {c.type !== 'NONE' ? (
          <details className="mt-1 text-sm">
            <summary className="min-h-11 cursor-pointer content-center underline">
              {tr.sponsored.whyTitle}
            </summary>
            <p>{c.why}</p>
          </details>
        ) : null}
      </ImpressionTracker>
    </Tag>
  );
}
