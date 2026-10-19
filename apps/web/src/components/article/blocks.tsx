import Image from 'next/image';
import Link from 'next/link';
import type { Block, PublicArticle } from '@incelemeler/contracts';
import { tr } from '@incelemeler/i18n';
import { listingPath, type ListingKind } from '@incelemeler/routes';

const A = tr.article;
type Inline = Extract<Block, { type: 'paragraph' }>['content'];

/** Satır içi metin: yapılandırılmış düğümler; ham HTML yok (REQ-ICR-001). */
function Rich({ nodes }: { nodes: Inline }) {
  return (
    <>
      {nodes.map((n, i) => {
        let el: React.ReactNode = n.text;
        if (n.bold) el = <strong>{el}</strong>;
        if (n.italic) el = <em>{el}</em>;
        if (n.href) {
          el = (
            <a
              href={n.href}
              rel="nofollow noopener noreferrer"
              className="text-brand-default underline"
            >
              {el}
            </a>
          );
        }
        return <span key={i}>{el}</span>;
      })}
    </>
  );
}

function Figure({ m, caption }: { m: PublicArticle['media'][string]; caption?: string }) {
  return (
    <figure className="space-y-1">
      <Image
        src={`/medya/${m.id}`}
        alt={m.altText}
        width={m.width}
        height={m.height}
        sizes="(max-width: 768px) 100vw, 768px"
        className="h-auto w-full rounded-lg"
      />
      <figcaption className="text-xs text-text-secondary">
        {caption ? `${caption} · ` : ''}
        {m.credit}
      </figcaption>
    </figure>
  );
}

function ListingCard({ card, note }: { card: PublicArticle['listings'][string]; note?: string }) {
  if (!card.visible) return null;
  const closed = card.status === 'CLOSED_PERMANENTLY' || card.status === 'CLOSED_TEMPORARILY';
  return (
    <aside className="rounded-lg border border-border-default p-4" data-testid="listing-card">
      <p className="font-semibold">
        <Link
          href={listingPath({
            kind: card.kind as ListingKind,
            slug: card.slug,
            carRental: card.carRental,
          })}
          className="text-brand-default underline"
        >
          {card.name}
        </Link>
      </p>
      <p className="text-sm text-text-secondary">
        {card.categoryName}
        {card.place ? ` · ${card.place}` : ''}
        {card.priceLevel ? ` · ${'₺'.repeat(card.priceLevel)}` : ''}
      </p>
      {closed ? (
        <p className="text-sm font-medium">
          {card.status === 'CLOSED_PERMANENTLY' ? A.closedCard : A.closedTemporarilyCard}
        </p>
      ) : (
        <p className="text-sm">{A.noReviews}</p>
      )}
      {note ? <p className="mt-2 text-sm">{note}</p> : null}
    </aside>
  );
}

/** İçerik blokları; web ve mobil aynı şemayı kullanır (REQ-ICR-001/002/003). */
export function Blocks({ article }: { article: PublicArticle }) {
  return (
    <div className="space-y-5">
      {article.body.map((b, i) => {
        switch (b.type) {
          case 'heading':
            return b.level === 2 ? (
              <h2 key={i} className="text-xl font-semibold">
                {b.text}
              </h2>
            ) : (
              <h3 key={i} className="text-lg font-semibold">
                {b.text}
              </h3>
            );
          case 'paragraph':
            return (
              <p key={i}>
                <Rich nodes={b.content} />
              </p>
            );
          case 'list': {
            const Tag = b.ordered ? 'ol' : 'ul';
            return (
              <Tag key={i} className={`space-y-1 pl-6 ${b.ordered ? 'list-decimal' : 'list-disc'}`}>
                {b.items.map((it, j) => (
                  <li key={j}>
                    <Rich nodes={it} />
                  </li>
                ))}
              </Tag>
            );
          }
          case 'image': {
            const m = article.media[b.mediaId];
            return m ? <Figure key={i} m={m} caption={b.caption} /> : null;
          }
          case 'gallery': {
            const items = b.mediaIds.map((id) => article.media[id]).filter((m) => !!m);
            return items.length ? (
              <div key={i} className="grid grid-cols-2 gap-3">
                {items.map((m) => (
                  <Figure key={m.id} m={m} />
                ))}
              </div>
            ) : null;
          }
          case 'table':
            return (
              <div key={i} className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  {b.caption ? (
                    <caption className="mb-2 text-left text-text-secondary">{b.caption}</caption>
                  ) : null}
                  <thead>
                    <tr className="border-b border-border-strong">
                      {b.header.map((h, j) => (
                        <th key={j} scope="col" className="px-3 py-2">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {b.rows.map((r, j) => (
                      <tr key={j} className="border-b border-border-default">
                        {r.map((c, k) => (
                          <td key={k} className="px-3 py-2">
                            {c}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          case 'listingCard': {
            const card = article.listings[b.listingId];
            return card ? <ListingCard key={i} card={card} note={b.note} /> : null;
          }
          case 'infoBox':
            return (
              <aside
                key={i}
                className="rounded-md border border-border-strong bg-bg-subtle px-4 py-3"
                role="note"
              >
                <strong>{b.tone === 'tip' ? A.tip : A.warning}: </strong>
                <Rich nodes={b.content} />
              </aside>
            );
          case 'prosCons':
            return (
              <div key={i} className="grid gap-4 sm:grid-cols-2">
                <div>
                  <h3 className="font-semibold">{A.pros}</h3>
                  <ul className="list-disc pl-6">
                    {b.pros.map((p, j) => (
                      <li key={j}>{p}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold">{A.cons}</h3>
                  <ul className="list-disc pl-6">
                    {b.cons.map((c, j) => (
                      <li key={j}>{c}</li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          case 'faq':
            return (
              <section key={i} className="space-y-2">
                <h2 className="text-xl font-semibold">{A.faq}</h2>
                {b.items.map((q, j) => (
                  <details key={j} className="rounded-md border border-border-default px-4 py-2">
                    <summary className="min-h-11 cursor-pointer content-center font-medium">
                      {q.question}
                    </summary>
                    <p>
                      <Rich nodes={q.answer} />
                    </p>
                  </details>
                ))}
              </section>
            );
          case 'quote':
            return (
              <blockquote key={i} className="border-l-4 border-border-strong pl-4 italic">
                <Rich nodes={b.content} />
                {b.attribution ? (
                  <footer className="not-italic text-sm">— {b.attribution}</footer>
                ) : null}
              </blockquote>
            );
        }
      })}
    </div>
  );
}
