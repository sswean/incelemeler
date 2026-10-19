import { type Block, inlineToMarkup, markupToInline } from '@incelemeler/contracts';

/** Editör arayüzü durumu: zengin metinler hafif işaretleme, çok satırlılar düz metin olarak tutulur. */
export type EditorBlock =
  | { k: 'heading'; level: 2 | 3; text: string }
  | { k: 'paragraph'; markup: string }
  | { k: 'list'; ordered: boolean; lines: string }
  | { k: 'image'; mediaId: string; caption: string }
  | { k: 'gallery'; ids: string }
  | { k: 'table'; text: string; caption: string }
  | { k: 'listingCard'; listingId: string; label: string; note: string }
  | { k: 'infoBox'; tone: 'tip' | 'warning'; markup: string }
  | { k: 'prosCons'; pros: string; cons: string }
  | { k: 'faq'; text: string }
  | { k: 'quote'; markup: string; attribution: string };

export const BLOCK_KINDS: EditorBlock['k'][] = [
  'heading',
  'paragraph',
  'list',
  'image',
  'gallery',
  'table',
  'listingCard',
  'infoBox',
  'prosCons',
  'faq',
  'quote',
];

export function emptyBlock(k: EditorBlock['k']): EditorBlock {
  switch (k) {
    case 'heading':
      return { k, level: 2, text: '' };
    case 'list':
      return { k, ordered: false, lines: '' };
    case 'image':
      return { k, mediaId: '', caption: '' };
    case 'gallery':
      return { k, ids: '' };
    case 'table':
      return { k, text: '', caption: '' };
    case 'listingCard':
      return { k, listingId: '', label: '', note: '' };
    case 'infoBox':
      return { k, tone: 'tip', markup: '' };
    case 'prosCons':
      return { k, pros: '', cons: '' };
    case 'faq':
      return { k, text: '' };
    case 'quote':
      return { k, markup: '', attribution: '' };
    default:
      return { k: 'paragraph', markup: '' };
  }
}

const lines = (s: string) =>
  s
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

export function toEditor(b: Block): EditorBlock {
  switch (b.type) {
    case 'heading':
      return { k: 'heading', level: b.level, text: b.text };
    case 'paragraph':
      return { k: 'paragraph', markup: inlineToMarkup(b.content) };
    case 'list':
      return { k: 'list', ordered: b.ordered, lines: b.items.map(inlineToMarkup).join('\n') };
    case 'image':
      return { k: 'image', mediaId: b.mediaId, caption: b.caption ?? '' };
    case 'gallery':
      return { k: 'gallery', ids: b.mediaIds.join('\n') };
    case 'table':
      return {
        k: 'table',
        text: [b.header, ...b.rows].map((r) => r.join(' | ')).join('\n'),
        caption: b.caption ?? '',
      };
    case 'listingCard':
      return { k: 'listingCard', listingId: b.listingId, label: '', note: b.note ?? '' };
    case 'infoBox':
      return { k: 'infoBox', tone: b.tone, markup: inlineToMarkup(b.content) };
    case 'prosCons':
      return { k: 'prosCons', pros: b.pros.join('\n'), cons: b.cons.join('\n') };
    case 'faq':
      return {
        k: 'faq',
        text: b.items.map((i) => `S: ${i.question}\nC: ${inlineToMarkup(i.answer)}`).join('\n\n'),
      };
    case 'quote':
      return { k: 'quote', markup: inlineToMarkup(b.content), attribution: b.attribution ?? '' };
  }
}

/** Editör durumunu API bloğuna çevirir; boş zorunlu alanlar API doğrulamasında raporlanır. */
export function toBlock(e: EditorBlock): Block {
  switch (e.k) {
    case 'heading':
      return { type: 'heading', level: e.level, text: e.text.trim() };
    case 'paragraph':
      return { type: 'paragraph', content: markupToInline(e.markup.trim()) };
    case 'list':
      return { type: 'list', ordered: e.ordered, items: lines(e.lines).map(markupToInline) };
    case 'image':
      return {
        type: 'image',
        mediaId: e.mediaId.trim(),
        ...(e.caption.trim() ? { caption: e.caption.trim() } : {}),
      };
    case 'gallery':
      return { type: 'gallery', mediaIds: lines(e.ids.replace(/,/g, '\n')) };
    case 'table': {
      const [header = [], ...rows] = lines(e.text).map((l) => l.split('|').map((c) => c.trim()));
      return {
        type: 'table',
        header,
        rows,
        ...(e.caption.trim() ? { caption: e.caption.trim() } : {}),
      };
    }
    case 'listingCard':
      return {
        type: 'listingCard',
        listingId: e.listingId,
        ...(e.note.trim() ? { note: e.note.trim() } : {}),
      };
    case 'infoBox':
      return { type: 'infoBox', tone: e.tone, content: markupToInline(e.markup.trim()) };
    case 'prosCons':
      return { type: 'prosCons', pros: lines(e.pros), cons: lines(e.cons) };
    case 'faq': {
      const items = e.text
        .split(/\n\s*\n/)
        .map((chunk) => {
          const q = /^S:\s*(.+)$/m.exec(chunk)?.[1]?.trim() ?? '';
          const a = /^C:\s*([\s\S]+)$/m.exec(chunk)?.[1]?.trim() ?? '';
          return { question: q, answer: markupToInline(a) };
        })
        .filter((i) => i.question || i.answer.length);
      return { type: 'faq', items };
    }
    case 'quote':
      return {
        type: 'quote',
        content: markupToInline(e.markup.trim()),
        ...(e.attribution.trim() ? { attribution: e.attribution.trim() } : {}),
      };
  }
}
