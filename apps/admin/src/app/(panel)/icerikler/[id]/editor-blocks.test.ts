import { describe, expect, it } from 'vitest';
import { ArticleBody, type Block } from '@incelemeler/contracts';
import { toBlock, toEditor } from './editor-blocks';

const blocks: Block[] = [
  { type: 'heading', level: 2, text: 'Sabah rotası' },
  {
    type: 'paragraph',
    content: [{ text: 'Önce ' }, { text: 'iskele', bold: true }, { text: '.' }],
  },
  { type: 'list', ordered: true, items: [[{ text: 'Vapur' }], [{ text: 'Çarşı', italic: true }]] },
  { type: 'table', header: ['Durak', 'Süre'], rows: [['İskele', '10 dk']] },
  { type: 'prosCons', pros: ['Ucuz'], cons: ['Kalabalık'] },
  {
    type: 'faq',
    items: [{ question: 'Kaçta açılır?', answer: [{ text: '08.00' }] }],
  },
  { type: 'quote', content: [{ text: 'Harika bir gün' }], attribution: 'Okur' },
  { type: 'infoBox', tone: 'warning', content: [{ text: 'Hafta sonu kalabalık' }] },
];

describe('[REQ-ICR-001] panel blok editörü dönüşümleri', () => {
  it('API blokları editör durumuna ve geri birebir dönüşür', () => {
    const roundTrip = blocks.map((b) => toBlock(toEditor(b)));
    expect(roundTrip).toEqual(blocks);
    expect(ArticleBody.safeParse(roundTrip).success).toBe(true);
  });
});
