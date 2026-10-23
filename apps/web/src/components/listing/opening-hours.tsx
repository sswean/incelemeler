import type { OpeningHours } from '@incelemeler/contracts';
import { tr } from '@incelemeler/i18n';
import { DEFAULT_TIMEZONE, formatLongDate } from '@incelemeler/utils';

const T = tr.listingPage;
const DAYS = [1, 2, 3, 4, 5, 6, 7] as const;

/**
 * Çalışma saatleri (REQ-VER-010): durum metinle (yalnızca renkle değil — REQ-ERS-005), haftalık tablo, yaklaşan
 * özel günler ve doğrulama tarihi. "Şu an açık" sunucuda hesaplanır; saat yoksa bölüm hiç gösterilmez.
 */
export function OpeningHoursView({ hours }: { hours: OpeningHours }) {
  const status =
    hours.openNow === null ? T.hoursUnknownNow : hours.openNow ? T.openNow : T.closedNow;
  const today = new Date().toISOString().slice(0, 10);
  const upcoming = hours.exceptions.filter((e) => e.date >= today).slice(0, 10);
  return (
    <section aria-labelledby="calisma-saatleri" className="space-y-2" data-testid="opening-hours">
      <h2 id="calisma-saatleri" className="text-lg font-semibold">
        {T.hoursTitle}
      </h2>
      <p className="font-medium" data-testid="open-status">
        {status}
      </p>
      <table className="text-sm">
        <tbody>
          {DAYS.map((d) => {
            const ranges = hours.weekly.filter((w) => w.day === d);
            return (
              <tr key={d}>
                <th scope="row" className="pr-4 text-left font-normal">
                  {T.weekdays[d]}
                </th>
                <td>
                  {ranges.length
                    ? ranges.map((r) => `${r.opens}–${r.closes}`).join(', ')
                    : T.closedDay}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {upcoming.length ? (
        <div className="text-sm">
          <p className="font-medium">{T.hoursExceptions}</p>
          <ul>
            {upcoming.map((e) => (
              <li key={e.date}>
                {formatLongDate(new Date(`${e.date}T12:00:00Z`))}:{' '}
                {e.closed ? T.closedDay : `${e.opens}–${e.closes}`}
                {e.note ? ` (${e.note})` : ''}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      <p className="text-sm text-text-secondary">
        {hours.verifiedAt
          ? T.hoursVerified.replace('{date}', formatLongDate(new Date(hours.verifiedAt)))
          : T.hoursNotVerified}
        {hours.timezone !== DEFAULT_TIMEZONE
          ? ` ${T.hoursTimezone.replace('{tz}', hours.timezone)}`
          : ''}
      </p>
    </section>
  );
}
