import Link from 'next/link';
import type { PublicVerdict } from '@incelemeler/contracts';
import { tr } from '@incelemeler/i18n';
import { formatEditorialScore, formatLongDate, formatMonthYear } from '@incelemeler/utils';

const T = tr.listingPage.verdict;

/** Deneyim beyanı her zaman görünür (REQ-ICR-007): "Bizzat test edildi (2 hafta, …)", "Yerinde ziyaret edildi (Ekim 2026)". */
export function experienceStatement(
  v: Pick<PublicVerdict, 'experienceType' | 'experienceNote' | 'testedAt'>,
) {
  const label = tr.content.experienceTypes[v.experienceType];
  const details = [
    v.experienceNote,
    v.testedAt ? formatMonthYear(new Date(`${v.testedAt}T12:00:00Z`)) : null,
  ].filter(Boolean);
  return details.length ? `${label} (${details.join(', ')})` : label;
}

/**
 * Editörün değerlendirmesi (REQ-VER-005): kullanıcı puanından ayrı bölüm ve "Editör" etiketi (REQ-VER-004);
 * kaynaklardan derlenen değerlendirmede puan yoktur.
 */
export function EditorialVerdictView({ verdict }: { verdict: PublicVerdict }) {
  return (
    <section
      aria-labelledby="editor-degerlendirmesi"
      className="space-y-3"
      data-testid="editorial-verdict"
    >
      <h2 id="editor-degerlendirmesi" className="text-lg font-semibold">
        {T.title}
      </h2>
      <p className="text-sm font-medium" data-testid="experience-statement">
        {experienceStatement(verdict)}
      </p>
      {verdict.score !== null ? (
        <p data-testid="editor-score">
          <span className="font-medium">{T.editorLabel}:</span>{' '}
          <span className="text-xl font-semibold">{formatEditorialScore(verdict.score)}</span>
        </p>
      ) : (
        <p className="text-sm text-text-secondary">{T.noScore}</p>
      )}
      <p>{verdict.summary}</p>
      {verdict.criteria.length ? (
        <table className="text-sm">
          <caption className="text-left font-medium">{T.criteria}</caption>
          <tbody>
            {verdict.criteria.map((c) => (
              <tr key={c.name}>
                <th scope="row" className="pr-4 text-left font-normal">
                  {c.name}
                </th>
                <td className="pr-4">{formatEditorialScore(c.score)}</td>
                <td className="text-text-secondary">{T.weight.replace('{n}', String(c.weight))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2">
        {verdict.pros.length ? (
          <div>
            <h3 className="font-medium">{T.pros}</h3>
            <ul className="list-disc pl-6 text-sm">
              {verdict.pros.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          </div>
        ) : null}
        {verdict.cons.length ? (
          <div>
            <h3 className="font-medium">{T.cons}</h3>
            <ul className="list-disc pl-6 text-sm">
              {verdict.cons.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
      <p className="text-sm text-text-secondary">
        {verdict.author.slug ? (
          <Link href={`/yazar/${verdict.author.slug}`} className="underline">
            {verdict.author.displayName}
          </Link>
        ) : (
          verdict.author.displayName
        )}
        {verdict.publishedAt
          ? ` · ${T.published.replace('{date}', formatLongDate(new Date(verdict.publishedAt)))}`
          : ''}
        {verdict.version > 1 ? ` · ${T.version.replace('{n}', String(verdict.version))}` : ''}
      </p>
      <p className="text-sm">
        <Link href="/nasil-degerlendiriyoruz" className="underline">
          {T.methodology}
        </Link>
      </p>
    </section>
  );
}
