import type { PublicReview, ReviewList } from '@incelemeler/contracts';
import { tr } from '@incelemeler/i18n';
import { formatLongDate } from '@incelemeler/utils';
import { ReportButton } from './report-button';
import { Stars } from './rating-summary';

const R = tr.reviews;
const fill = (t: string, v: Record<string, string | number>) =>
  Object.entries(v).reduce((acc, [k, x]) => acc.replace(`{${k}}`, String(x)), t);
const monthText = (m: string) => {
  const [y, mo] = m.split('-').map(Number);
  return new Date(Date.UTC(y!, mo! - 1, 1)).toLocaleDateString('tr-TR', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
};

function ReviewCard({ r, signedIn }: { r: PublicReview; signedIn: boolean }) {
  const documented = r.verification !== 'SELF_DECLARED';
  return (
    <li className="space-y-2 rounded-lg border border-border-default p-4" data-testid="review">
      <p
        aria-label={fill(R.reviewRatingAria, {
          n: r.rating,
          label: R.ratingLabels[r.rating as 1 | 2 | 3 | 4 | 5],
        })}
      >
        <Stars value={r.rating} />{' '}
        <span aria-hidden="true">{R.ratingLabels[r.rating as 1 | 2 | 3 | 4 | 5]}</span>
      </p>
      {r.title ? <h3 className="font-semibold">{r.title}</h3> : null}
      <p className="whitespace-pre-line">{r.body}</p>
      {r.criteriaRatings.length ? (
        <p className="text-sm text-text-secondary">
          {r.criteriaRatings.map((c) => `${c.name}: ${c.rating}/5`).join(' · ')}
        </p>
      ) : null}
      <p className="text-sm text-text-secondary">
        {[
          r.author.displayName,
          formatLongDate(new Date(r.publishedAt)),
          r.experienceMonth ? fill(R.experienced, { ay: monthText(r.experienceMonth) }) : null,
          r.usageDuration ? R.usageDurations[r.usageDuration] : null,
          r.visitContext ? R.visitContexts[r.visitContext] : null,
          r.editedAt ? fill(R.edited, { tarih: formatLongDate(new Date(r.editedAt)) }) : null,
        ]
          .filter(Boolean)
          .join(' · ')}
      </p>
      <p className="flex flex-wrap gap-2 text-xs">
        <span className="rounded border border-border-default px-2 py-0.5">
          {documented ? R.documented : R.selfDeclared}
        </span>
        {r.incentivized ? (
          <span
            className="rounded border border-border-strong px-2 py-0.5 font-medium"
            data-testid="incentivized-label"
          >
            {R.incentivizedLabel}
          </span>
        ) : null}
      </p>
      <ReportButton reviewId={r.id} signedIn={signedIn} />
    </li>
  );
}

/** Değerlendirme listesi (REQ-DEG-002/003): sıralama kullanıcı seçimi; olumsuzlar gizlenmez. */
export function ReviewListView({ list, signedIn }: { list: ReviewList; signedIn: boolean }) {
  return (
    <ol className="space-y-3">
      {list.data.map((r) => (
        <ReviewCard key={r.id} r={r} signedIn={signedIn} />
      ))}
    </ol>
  );
}
