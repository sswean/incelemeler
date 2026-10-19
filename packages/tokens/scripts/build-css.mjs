// Token'lardan CSS değişkenleri ve Tailwind v4 @theme bloğu üretir (Ek A14.4).
import { writeFileSync } from 'node:fs';
import { color, fontSize, radius, space, breakpoints, motion } from '../dist/tokens.js';

const vars = (obj) =>
  Object.entries(obj)
    .map(([k, v]) => `  --ic-${k}: ${v};`)
    .join('\n');

const theme = [
  ...Object.keys(color.light).map((k) => `  --color-${k}: var(--ic-${k});`),
  ...Object.entries(space).map(([k, v]) => `  --spacing-${k}: ${v / 16}rem;`),
  ...Object.entries(radius).map(([k, v]) => `  --radius-${k}: ${v === 9999 ? '9999px' : `${v / 16}rem`};`),
  ...Object.entries(fontSize).map(([k, v]) => `  --text-${k}: ${v / 16}rem;`),
  ...Object.entries(breakpoints).map(([k, v]) => `  --breakpoint-${k}: ${v / 16}rem;`),
  ...Object.entries(motion).map(([k, v]) => `  --duration-${k}: ${v}ms;`),
].join('\n');

const css = `/* ÜRETİLDİ — elle düzenleme. Kaynak: packages/tokens/src/tokens.ts */
:root {
${vars(color.light)}
}
:root[data-theme='dark'] {
${vars(color.dark)}
}
@media (prefers-reduced-motion: reduce) {
  :root { --duration-fast: 0ms; --duration-base: 0ms; --duration-slow: 0ms; }
}
`;
writeFileSync(new URL('../dist/tokens.css', import.meta.url), css);
writeFileSync(
  new URL('../dist/theme.css', import.meta.url),
  `/* ÜRETİLDİ — Tailwind v4 tema eşlemesi */\n@theme inline {\n${theme}\n}\n`,
);
console.log('tokens.css ve theme.css üretildi');
