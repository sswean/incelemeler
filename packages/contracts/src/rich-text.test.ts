import { describe, expect, it } from 'vitest';
import { inlineToMarkup, markupToInline } from './rich-text.js';

describe('[REQ-ICR-001] zengin metin işaretlemesi', () => {
  it('kalın, italik ve bağlantı; gidiş-dönüş', () => {
    const markup =
      'Sabah **erken** gelin, *sıra* olur. Ayrıntı: [belediye](https://ornek.example/a).';
    const nodes = markupToInline(markup);
    expect(nodes).toEqual([
      { text: 'Sabah ' },
      { text: 'erken', bold: true },
      { text: ' gelin, ' },
      { text: 'sıra', italic: true },
      { text: ' olur. Ayrıntı: ' },
      { text: 'belediye', href: 'https://ornek.example/a' },
      { text: '.' },
    ]);
    expect(inlineToMarkup(nodes)).toBe(markup);
  });

  it('ham HTML ve güvensiz bağlantı düz metin kalır', () => {
    expect(markupToInline('<script>x</script> [a](javascript:alert(1))')).toEqual([
      { text: '<script>x</script> [a](javascript:alert(1))' },
    ]);
  });

  it('tek yıldız ve çarpma işareti metni bozmaz', () => {
    expect(markupToInline('3 * 4 = 12')).toEqual([{ text: '3 * 4 = 12' }]);
  });
});
