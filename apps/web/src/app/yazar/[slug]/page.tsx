import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { PublicAuthor } from '@incelemeler/contracts';
import { tr } from '@incelemeler/i18n';
import { articlePath, authorPath } from '@incelemeler/routes';
import { formatLongDate } from '@incelemeler/utils';
import { PageTitle } from '../../../components/ui';
import { serverApi } from '../../../lib/api';
import { canonical, jsonLdScript, robots } from '../../../lib/seo';

export const revalidate = 60;
type Props = { params: Promise<{ slug: string }> };
const A = tr.author;

async function load(slug: string): Promise<PublicAuthor | null> {
  const { data } = await serverApi().GET('/v1/authors/{slug}', { params: { path: { slug } } });
  return data ?? null;
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { slug } = await props.params;
  const p = await load(slug);
  if (!p) return { title: tr.common.notFound, robots: { index: false, follow: true } };
  const description = (p.bio ?? p.title ?? p.displayName).slice(0, 155);
  return {
    title: p.displayName.slice(0, 60),
    description,
    alternates: { canonical: canonical(authorPath(p.slug)) },
    robots: robots(true),
    openGraph: { type: 'profile', locale: 'tr_TR', siteName: tr.brand.name, title: p.displayName },
  };
}

/** Yazar/editör profili (REQ-ICR-011): ad, unvan, uzmanlık, biyografi, bağlantılar, etik beyanı. */
export default async function AuthorPage(props: Props) {
  const { slug } = await props.params;
  const p = await load(slug);
  if (!p) notFound();
  const ld = {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    mainEntity: {
      '@type': 'Person',
      name: p.displayName,
      url: canonical(authorPath(p.slug)),
      ...(p.title ? { jobTitle: p.title } : {}),
      ...(p.expertise.length ? { knowsAbout: p.expertise } : {}),
      ...(p.links.length ? { sameAs: p.links.map((l) => l.url) } : {}),
    },
  };
  return (
    <article className="mx-auto max-w-3xl space-y-6" data-testid="author-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(ld) }} />
      <header className="space-y-1">
        <PageTitle>{p.displayName}</PageTitle>
        {p.title ? <p className="text-lg text-text-secondary">{p.title}</p> : null}
      </header>
      {p.bio ? <p>{p.bio}</p> : null}
      {p.expertise.length ? (
        <section aria-labelledby="uzmanlik" className="space-y-2">
          <h2 id="uzmanlik" className="text-lg font-semibold">
            {A.expertise}
          </h2>
          <ul className="flex flex-wrap gap-2">
            {p.expertise.map((e) => (
              <li key={e} className="rounded-md border border-border-default px-2 py-1 text-sm">
                {e}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      {p.ethics ? (
        <section aria-labelledby="etik" className="space-y-2">
          <h2 id="etik" className="text-lg font-semibold">
            {A.ethics}
          </h2>
          <p>{p.ethics}</p>
        </section>
      ) : null}
      {p.links.length ? (
        <section aria-labelledby="baglantilar" className="space-y-2">
          <h2 id="baglantilar" className="text-lg font-semibold">
            {A.links}
          </h2>
          <ul className="space-y-1">
            {p.links.map((l) => (
              <li key={l.url}>
                <a
                  href={l.url}
                  rel="me nofollow noopener noreferrer"
                  className="text-brand-default underline"
                >
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      <section aria-labelledby="icerikler" className="space-y-2">
        <h2 id="icerikler" className="text-lg font-semibold">
          {A.articles}
        </h2>
        {p.articles.length === 0 ? (
          <p className="text-text-secondary">{A.noArticles}</p>
        ) : (
          <ul className="space-y-3">
            {p.articles.map((a) => (
              <li key={a.slug}>
                <Link href={articlePath(a)} className="font-medium text-brand-default underline">
                  {a.title}
                </Link>
                <p className="text-sm text-text-secondary">
                  {tr.article.typePlural[a.type]}
                  {a.publishedAt ? ` · ${formatLongDate(new Date(a.publishedAt))}` : ''}
                </p>
                {a.summary ? <p className="text-sm">{a.summary}</p> : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </article>
  );
}
