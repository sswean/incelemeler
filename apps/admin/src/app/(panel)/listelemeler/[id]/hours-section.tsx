import type { OpeningHours } from '@incelemeler/contracts';
import { tr } from '@incelemeler/i18n';
import { formatDate } from '@incelemeler/utils';
import { Alert, Field, SubmitButton } from '../../../../components/ui';
import { saveOpeningHoursAction } from '../hours-actions';
import { DAYS, exceptionsToText, fieldName, RANGES_PER_DAY } from './hours-form';

const T = tr.listings.hours;
const CLOCK_PATTERN = '([01][0-9]|2[0-3]):[0-5][0-9]|24:00';
const input = 'w-24 rounded-md border border-border-strong bg-bg-default px-3 py-2 text-base';

function errorText(code: string | undefined): string | null {
  if (!code) return null;
  return code in T.errors ? T.errors[code as keyof typeof T.errors] : T.errors.invalid;
}

/** Haftalık saatler, özel günler ve doğrulama işareti (REQ-VER-010). */
export function HoursSection(props: {
  listingId: string;
  hours: OpeningHours;
  saved: boolean;
  error?: string;
}) {
  const ranges = (day: number) => props.hours.weekly.filter((r) => r.day === day);
  const err = errorText(props.error);
  return (
    <section aria-labelledby="calisma-saatleri" className="space-y-4" id="calisma-saatleri-bolumu">
      <div className="space-y-1">
        <h2 id="calisma-saatleri" className="text-lg font-semibold">
          {T.title}
        </h2>
        <p className="text-sm text-text-secondary">{T.intro}</p>
      </div>
      {props.saved ? <Alert kind="success">{T.saved}</Alert> : null}
      {err ? <Alert kind="error">{err}</Alert> : null}
      <form
        action={saveOpeningHoursAction}
        aria-label={T.title}
        className="space-y-4 rounded-md border border-border-default p-4"
      >
        <input type="hidden" name="listingId" value={props.listingId} />
        <Field id="saatDilimi" label={T.timezone} defaultValue={props.hours.timezone} required />
        <table className="text-sm">
          <tbody>
            {DAYS.map((day) => (
              <tr key={day}>
                <th scope="row" className="py-1 pr-4 text-left font-medium">
                  {tr.listingPage.weekdays[day]}
                </th>
                {Array.from({ length: RANGES_PER_DAY }, (_, i) => {
                  const r = ranges(day)[i];
                  const label = `${tr.listingPage.weekdays[day]} ${T.range} ${i + 1}`;
                  return (
                    <td key={i} className="py-1 pr-4">
                      <span className="flex items-center gap-1">
                        <input
                          name={fieldName(day, i, 'o')}
                          aria-label={`${label} ${T.opens}`}
                          defaultValue={r?.opens ?? ''}
                          placeholder={T.clockHint}
                          pattern={CLOCK_PATTERN}
                          inputMode="numeric"
                          className={input}
                        />
                        –
                        <input
                          name={fieldName(day, i, 'c')}
                          aria-label={`${label} ${T.closes}`}
                          defaultValue={r?.closes ?? ''}
                          placeholder={T.clockHint}
                          pattern={CLOCK_PATTERN}
                          inputMode="numeric"
                          className={input}
                        />
                      </span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
        <div className="space-y-1">
          <label htmlFor="istisnalar" className="block text-sm font-medium">
            {T.exceptions}
          </label>
          <p id="istisnalar-ipucu" className="text-sm text-text-secondary">
            {T.exceptionsHint}
          </p>
          <textarea
            id="istisnalar"
            name="istisnalar"
            rows={4}
            aria-describedby="istisnalar-ipucu"
            defaultValue={exceptionsToText(props.hours)}
            className="block w-full rounded-md border border-border-strong bg-bg-default px-3 py-2 text-base"
          />
        </div>
        <label className="flex min-h-11 items-center gap-2 text-sm">
          <input type="checkbox" name="dogrulandi" className="h-5 w-5" />
          {T.verified}
        </label>
        <p className="text-sm text-text-secondary" data-testid="hours-verified">
          {T.lastVerified}:{' '}
          {props.hours.verifiedAt ? formatDate(new Date(props.hours.verifiedAt)) : T.notVerified}
        </p>
        <SubmitButton>{T.save}</SubmitButton>
      </form>
    </section>
  );
}
