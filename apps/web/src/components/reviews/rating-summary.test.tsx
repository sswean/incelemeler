import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { RatingSummaryView } from './rating-summary';

/** aria-hidden alt ağaçları çıkarılmış düz metin (ekran okuyucunun okuyacağı içerik, yaklaşık). */
function accessibleText(html: string): string {
  let hidden = 0;
  let text = '';
  for (const part of html.split(/(<[^>]+>)/)) {
    if (part.startsWith('</')) {
      if (hidden) hidden--;
    } else if (part.startsWith('<')) {
      const selfClosing = part.endsWith('/>');
      if (hidden) {
        if (!selfClosing) hidden++;
      } else if (/aria-hidden="true"/.test(part) && !selfClosing) {
        hidden = 1;
      }
    } else if (!hidden) {
      text += part;
    }
  }
  return text.replace(/\s+/g, ' ').trim();
}

describe('puan özeti erişilebilirliği', () => {
  it('[REQ-ERS-006] yıldızlar aria-hidden; anlamı ekran okuyucu metni taşır', () => {
    const html = renderToStaticMarkup(
      <RatingSummaryView
        writeHref="/degerlendir/x"
        summary={{
          display: 'average',
          count: 128,
          average: 4.3,
          last12: null,
          distribution: null,
          criteria: null,
        }}
      />,
    );
    const read = accessibleText(html);
    expect(read).toContain('5 üzerinden 4,3 puan, 128 değerlendirme');
    expect(read).not.toMatch(/[★☆]/);
    expect(html).toMatch(/[★☆]/);
    expect(html).not.toContain('aria-label=');
  });
});
