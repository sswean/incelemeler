import Link from 'next/link';
import type { RatingSummary } from '@incelemeler/contracts';
import { tr } from '@incelemeler/i18n';
import { STATIC_PATHS } from '@incelemeler/routes';
import { formatRating } from '@incelemeler/utils';

const R = tr.reviews;
const fill = (t: string, v: Record<string, string | number>) =>
  Object.entries(v).reduce((acc, [k, x]) => acc.replace(`{${k}}`, String(x)), t);

/** Yarım yıldız hassasiyetinde görsel; anlamı metin taşır (renk/ikon tek başına yetmez). */
export function Stars({ value }: { value: number }) {
  const halves = Math.round(value * 2);
  return (
    <span aria-hidden="true" className="relative inline-block whitespace-nowrap leading-none">
      <span className="text-border-strong">☆☆☆☆☆</span>
      <span
        className="absolute inset-y-0 left-0 overflow-hidden text-brand-default"
        style={{ width: `${halves * 10}%` }}
      >
        ★★★★★
      </span>
    </span>
  );
}

/**
 * Kullanıcı puanı özeti (Ek A6.1–A6.2): n = 0 boş durum, n < 3 ortalama yok, n ≥ 5 dağılım ve kriterler.
 * "Kullanıcılar" etiketi her zaman görünür; editör puanıyla birleştirilmez (REQ-VER-004).
 */
export function RatingSummaryView({
  summary,
  writeHref,
  compact = false,
}: {
  summary: RatingSummary;
  writeHref: string;
  compact?: boolean;
}) {
  if (summary.display === 'none') {
    return (
      <p data-testid="rating-summary">
        {R.none}
        {compact ? null : (
          <>
            {' · '}
            <Link href={writeHref} className="text-brand-default underline">
              {R.beFirst}
            </Link>
          </>
        )}
      </p>
    );
  }
  if (summary.display === 'insufficient' || summary.average === null) {
    return <p data-testid="rating-summary">{fill(R.insufficient, { n: summary.count })}</p>;
  }
  const avg = formatRating(summary.average);
  return (
    <div className="space-y-3" data-testid="rating-summary">
      <p>
        <span className="mr-2 rounded-md border border-border-strong px-2 py-0.5 text-sm font-medium">
          {R.userLabel}
        </span>
        {/* Ekran okuyucu metni ayrı (aria-label düz span'de güvenilir okunmaz — REQ-ERS-006). */}
        <span className="sr-only" data-testid="rating-text">
          {fill(R.average, { avg, n: summary.count })}
        </span>
        <span aria-hidden="true">
          <Stars value={summary.average} /> <strong>{avg}</strong>{' '}
          <span>({fill(R.count, { n: summary.count })})</span>
        </span>{' '}
        <Link href={STATIC_PATHS.methodology} className="text-sm underline">
          {R.howCalculated}
        </Link>
      </p>
      {summary.last12 ? (
        <p className="text-sm text-text-secondary">
          {fill(R.last12, { avg: formatRating(summary.last12.average), n: summary.last12.count })}
        </p>
      ) : null}
      {!compact && summary.distribution ? (
        <div className="space-y-1">
          <p className="text-sm font-medium">{R.distribution}</p>
          <ul className="space-y-1 text-sm">
            {[5, 4, 3, 2, 1].map((star) => {
              const n = summary.distribution![star - 1]!;
              const pct = Math.round((n / summary.count) * 100);
              return (
                <li key={star} className="flex items-center gap-2">
                  <span className="w-16">{fill(R.starsOf, { n: star })}</span>
                  <span className="h-2 flex-1 rounded bg-bg-subtle" aria-hidden="true">
                    <span
                      className="block h-2 rounded bg-brand-default"
                      style={{ width: `${pct}%` }}
                    />
                  </span>
                  <span className="w-10 text-right">{n}</span>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
      {!compact && summary.criteria?.length ? (
        <div className="space-y-1">
          <p className="text-sm font-medium">{R.criteria}</p>
          <ul className="grid gap-1 text-sm sm:grid-cols-2">
            {summary.criteria.map((c) => (
              <li key={c.name}>
                {c.name}: {formatRating(c.average)}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
