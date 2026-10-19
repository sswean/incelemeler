/** Satır içi metin düğümü (content.ts `InlineText` ile aynı biçim). */
export interface Inline {
  text: string;
  bold?: boolean;
  italic?: boolean;
  href?: string;
}

const TOKEN = /\*\*([^*]+)\*\*|\*([^*\s][^*]*)\*|\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;

/**
 * Panel editöründeki hafif işaretlemeyi (**kalın**, *italik*, [metin](https://…)) yapılandırılmış satır içi
 * düğümlere çevirir. Ham HTML desteklenmez; tanınmayan işaretler düz metin kalır (REQ-ICR-001).
 */
export function markupToInline(markup: string): Inline[] {
  const out: Inline[] = [];
  let last = 0;
  for (const m of markup.matchAll(TOKEN)) {
    if (m.index > last) out.push({ text: markup.slice(last, m.index) });
    if (m[1] !== undefined) out.push({ text: m[1], bold: true });
    else if (m[2] !== undefined) out.push({ text: m[2], italic: true });
    else out.push({ text: m[3]!, href: m[4]! });
    last = m.index + m[0].length;
  }
  if (last < markup.length) out.push({ text: markup.slice(last) });
  return out.filter((n) => n.text.length > 0);
}

export function inlineToMarkup(nodes: readonly Inline[]): string {
  return nodes
    .map((n) => {
      if (n.href) return `[${n.text}](${n.href})`;
      if (n.bold) return `**${n.text}**`;
      if (n.italic) return `*${n.text}*`;
      return n.text;
    })
    .join('');
}
