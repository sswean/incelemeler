import { type AdminVerdictState, ExperienceType } from '@incelemeler/contracts';
import { tr } from '@incelemeler/i18n';
import { formatDate } from '@incelemeler/utils';
import { Alert, Field, SubmitButton } from '../../../../components/ui';
import { publishVerdictAction, saveVerdictAction } from '../verdict-actions';
import { criteriaToText } from './verdict-form';

const T = tr.listings.verdict;
const box = 'block w-full rounded-md border border-border-strong bg-bg-default px-3 py-2 text-base';

function errorText(code: string | undefined): string | null {
  if (!code) return null;
  return code in T.errors ? T.errors[code as keyof typeof T.errors] : T.errors.invalid;
}

function Area(props: { id: string; label: string; hint?: string; value: string; rows?: number }) {
  return (
    <div className="space-y-1">
      <label htmlFor={props.id} className="block text-sm font-medium">
        {props.label}
      </label>
      {props.hint ? (
        <p id={`${props.id}-ipucu`} className="text-sm text-text-secondary">
          {props.hint}
        </p>
      ) : null}
      <textarea
        id={props.id}
        name={props.id}
        rows={props.rows ?? 3}
        defaultValue={props.value}
        {...(props.hint ? { 'aria-describedby': `${props.id}-ipucu` } : {})}
        className={box}
      />
    </div>
  );
}

/**
 * Editör değerlendirmesi (REQ-VER-005): yalnızca `editorial.verdict.write` iznine sahip personel görür
 * (REQ-GUN-012). Her kayıt yeni sürümdür; yayın ayrı adımdır.
 */
export function VerdictSection(props: {
  listingId: string;
  state: AdminVerdictState;
  notice?: string;
  error?: string;
}) {
  const c = props.state.current;
  const err = errorText(props.error);
  const notice =
    props.notice === 'degerlendirme-kaydedildi'
      ? T.saved
      : props.notice === 'degerlendirme-yayimlandi'
        ? T.published
        : null;
  return (
    <section aria-labelledby="editor-degerlendirmesi" className="space-y-4">
      <div className="space-y-1">
        <h2 id="editor-degerlendirmesi" className="text-lg font-semibold">
          {T.title}
        </h2>
        <p className="text-sm text-text-secondary">{T.intro}</p>
      </div>
      {notice ? <Alert kind="success">{notice}</Alert> : null}
      {err ? <Alert kind="error">{err}</Alert> : null}
      <dl
        className="grid grid-cols-1 gap-x-4 text-sm sm:grid-cols-2"
        data-testid="verdict-versions"
      >
        <div>
          <dt className="inline text-text-secondary">{T.current}: </dt>
          <dd className="inline">{c ? c.version : T.none}</dd>
        </div>
        <div>
          <dt className="inline text-text-secondary">{T.live}: </dt>
          <dd className="inline">{props.state.published?.version ?? T.none}</dd>
        </div>
      </dl>
      {c && !c.publishedAt ? (
        <form action={publishVerdictAction}>
          <input type="hidden" name="listingId" value={props.listingId} />
          <input type="hidden" name="version" value={c.version} />
          <SubmitButton>{T.publish.replace('{n}', String(c.version))}</SubmitButton>
        </form>
      ) : null}
      <form
        action={saveVerdictAction}
        aria-label={T.title}
        className="space-y-3 rounded-md border border-border-default p-4"
      >
        <input type="hidden" name="listingId" value={props.listingId} />
        <input type="hidden" name="baseVersion" value={c?.version ?? 0} />
        <div className="space-y-1">
          <label htmlFor="deneyim" className="block text-sm font-medium">
            {T.experience}
          </label>
          <select
            id="deneyim"
            name="deneyim"
            defaultValue={c?.experienceType ?? ''}
            className={box}
          >
            <option value="" disabled>
              —
            </option>
            {ExperienceType.options.map((e) => (
              <option key={e} value={e}>
                {tr.content.experienceTypes[e]}
              </option>
            ))}
          </select>
        </div>
        <Field
          id="deneyimNotu"
          label={T.experienceNote}
          maxLength={200}
          defaultValue={c?.experienceNote ?? ''}
        />
        <Field id="testTarihi" type="date" label={T.testedAt} defaultValue={c?.testedAt ?? ''} />
        <Field
          id="puan"
          label={T.score}
          hint={T.scoreHint}
          defaultValue={c?.score === null || !c ? '' : String(c.score).replace('.', ',')}
        />
        <Area
          id="olcutler"
          label={T.criteria}
          hint={T.criteriaHint}
          value={criteriaToText(c?.criteria ?? [])}
        />
        <Area id="artilar" label={T.pros} value={(c?.pros ?? []).join('\n')} />
        <Area id="eksiler" label={T.cons} value={(c?.cons ?? []).join('\n')} />
        <Area id="ozet" label={T.summary} value={c?.summary ?? ''} rows={5} />
        <SubmitButton>{T.save}</SubmitButton>
      </form>
      {props.state.history.length ? (
        <div className="space-y-1 text-sm">
          <h3 className="font-medium">{T.history}</h3>
          <ul data-testid="verdict-history">
            {props.state.history.map((h) => (
              <li key={h.version}>
                {T.historyRow
                  .replace('{n}', String(h.version))
                  .replace('{author}', h.authorName)
                  .replace('{date}', formatDate(new Date(h.createdAt)))}
                {h.publishedAt ? '' : ` · ${T.unpublished}`}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
