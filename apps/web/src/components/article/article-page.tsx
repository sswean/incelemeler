import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound, permanentRedirect } from 'next/navigation';
import type { ArticleType, PublicArticle } from '@incelemeler/contracts';
import { tr } from '@incelemeler/i18n';
import { articlePath } from '@incelemeler/routes';
import { formatLongDate } from '@incelemeler/utils';
import { serverApi } from '../../lib/api';
import { canonical, jsonLdScript, robots } from '../../lib/seo';
import { breadcrumbJsonLd } from '../listing/json-ld';
import { Blocks } from './blocks';

const A = tr.article;
type Props = { params: Promise<{ slug: string }> };

async function load(slug: string): Promise<PublicArticle | null> {
  const { data } = await serverApi().GET('/v1/articles/{slug}', { params: { path: { slug } } });
  return data ?? null;
}

export async function articleMetadata(props: Props): Promise<Metadata> {
  const { slug } = await props.params;
  const a = await load(slug);
  if (!a) return { title: tr.common.notFound, robots: { index: false, follow: true } };
  const path = articlePath({ type: a.type, slug: a.slug });
  const title = a.title.slice(0, 60);
  const description = (a.summary ?? a.title).slice(0, 155);
  return {
    title,
    description,
    alternates: { canonical: canonical(path) },
    robots: robots(a.dataOrigin !== 'DEMO'),
    openGraph: {
      type: 'article',
      locale: 'tr_TR',
      siteName: tr.brand.name,
      title,
      description,
      url: canonical(path),
      ...(a.publishedAt ? { publishedTime: a.publishedAt } : {}),
      ...(a.hero
        ? { images: [{ url: canonical(`/medya/${a.hero.id}`), alt: a.hero.altText }] }
        : {}),
    },
  };
}

/** Article JSON-LD (REQ-SEO-008): yazar, tarih, yayıncı; puan/inceleme işaretlemesi yok. */
function articleJsonLd(a: PublicArticle, url: string) {
  if (a.dataOrigin === 'DEMO') return null;
  return {
    '@context': 'https://schema.org',
    '@type': a.type === 'NEWS' ? 'NewsArticle' : 'Article',
    headline: a.title,
    url,
    ...(a.summary ? { description: a.summary } : {}),
    ...(a.publishedAt ? { datePublished: a.publishedAt } : {}),
    dateModified: a.lastSignificantUpdateAt ?? a.publishedAt ?? undefined,
    author: {
      '@type': 'Person',
      name: a.author.displayName,
      ...(a.author.slug ? { url: canonical(`/yazar/${a.author.slug}`) } : {}),
    },
    publisher: { '@type': 'Organization', name: tr.brand.name, url: canonical('/') },
    ...(a.hero ? { image: [canonical(`/medya/${a.hero.id}`)] } : {}),
  };
}

/** İçerik şablonu (REQ-ICR-004/006/007/008/009): sunucuda render. */
export function ArticleView({ a, preview = false }: { a: PublicArticle; preview?: boolean }) {
  const path = articlePath({ type: a.type, slug: a.slug });
  const ld = preview ? null : articleJsonLd(a, canonical(path));
  const crumbs = [
    { name: A.home, url: canonical('/') },
    { name: a.title, url: canonical(path) },
  ];
  return (
    <article className="mx-auto max-w-3xl space-y-6" data-testid="article-page">
      {ld ? (
        <>
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: jsonLdScript(ld) }}
          />
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: jsonLdScript(breadcrumbJsonLd(crumbs)) }}
          />
        </>
      ) : null}
      {preview ? (
        <p
          role="note"
          className="rounded-md border border-border-strong bg-bg-subtle px-4 py-2 text-sm"
        >
          {A.previewBanner}
        </p>
      ) : null}
      <nav aria-label={A.breadcrumb} className="text-sm text-text-secondary">
        <ol className="flex flex-wrap gap-1">
          <li>
            <Link href="/" className="underline">
              {A.home}
            </Link>{' '}
            ›
          </li>
          <li>{A.typePlural[a.type as ArticleType]} ›</li>
          <li aria-current="page">{a.title}</li>
        </ol>
      </nav>
      {a.commercialRelation !== 'NONE' ? (
        <p
          className="rounded-md border border-border-strong px-4 py-2 text-sm font-medium"
          data-testid="commercial-disclosure"
        >
          {A.disclosure[a.commercialRelation]}
        </p>
      ) : null}
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold">{a.title}</h1>
        {a.summary ? <p className="text-lg text-text-secondary">{a.summary}</p> : null}
        <p className="text-sm text-text-secondary" data-testid="article-byline">
          {A.by}:{' '}
          {a.author.slug ? (
            <Link href={`/yazar/${a.author.slug}`} className="underline">
              {a.author.displayName}
            </Link>
          ) : (
            a.author.displayName
          )}
          {a.editor ? ` · ${A.editor}: ${a.editor.displayName}` : ''}
          {a.publishedAt ? ` · ${A.published}: ${formatLongDate(new Date(a.publishedAt))}` : ''}
          {a.lastSignificantUpdateAt
            ? ` · ${A.updated}: ${formatLongDate(new Date(a.lastSignificantUpdateAt))}`
            : ''}
        </p>
        {a.experienceType ? (
          <p className="text-sm" data-testid="experience-declaration">
            <strong>{A.experience}:</strong> {tr.content.experienceTypes[a.experienceType]}
            {a.experienceNote ? ` (${a.experienceNote})` : ''}
          </p>
        ) : null}
      </header>
      {a.hero ? (
        <figure className="space-y-1">
          <Image
            src={`/medya/${a.hero.id}`}
            alt={a.hero.altText}
            width={a.hero.width}
            height={a.hero.height}
            priority
            sizes="(max-width: 768px) 100vw, 768px"
            className="h-auto w-full rounded-lg"
          />
          <figcaption className="text-xs text-text-secondary">{a.hero.credit}</figcaption>
        </figure>
      ) : null}
      {a.type === 'LIST' && a.selectionMethod ? (
        <aside
          className="rounded-md border border-border-default px-4 py-3"
          data-testid="selection-method"
        >
          <h2 className="font-semibold">{A.selectionMethod}</h2>
          <p>{a.selectionMethod}</p>
        </aside>
      ) : null}
      {a.corrections.map((c) => (
        <p
          key={c.date}
          role="note"
          className="rounded-md border border-border-strong px-4 py-2 text-sm"
        >
          <strong>
            {A.correction}: {formatLongDate(new Date(c.date))}
          </strong>{' '}
          — {c.note}
        </p>
      ))}
      <Blocks article={a} />
      {a.sources.length ? (
        <section
          aria-labelledby="kaynaklar"
          className="space-y-2 border-t border-border-default pt-4"
        >
          <h2 id="kaynaklar" className="text-lg font-semibold">
            {A.sources}
          </h2>
          <ul className="list-disc space-y-1 pl-6 text-sm">
            {a.sources.map((s, i) => (
              <li key={i}>
                {s.url ? (
                  <a href={s.url} rel="nofollow noopener noreferrer" className="underline">
                    {s.title}
                  </a>
                ) : (
                  s.title
                )}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      {a.updateNotes.length ? (
        <section aria-labelledby="guncellemeler" className="space-y-2 text-sm">
          <h2 id="guncellemeler" className="text-lg font-semibold">
            {A.updateNotes}
          </h2>
          <ul className="space-y-1">
            {a.updateNotes.map((n) => (
              <li key={n.date}>
                {formatLongDate(new Date(n.date))} — {n.note}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </article>
  );
}

export async function ArticleRoute(props: Props, type: ArticleType) {
  const { slug } = await props.params;
  const a = await load(slug);
  if (!a) notFound();
  if (a.type !== type) permanentRedirect(articlePath({ type: a.type, slug: a.slug }));
  return <ArticleView a={a} />;
}
