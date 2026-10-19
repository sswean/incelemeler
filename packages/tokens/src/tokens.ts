/**
 * Tasarım token'ları — tek kaynak (Ek A14.2–A14.4). Web (Tailwind) ve mobil (RN) bu dosyadan üretilir.
 * Renk değerleri ve kontrast oranları v2 Ek A14.2 tablosuyla aynıdır; CI'da kontrast testi çalışır.
 */

export const color = {
  light: {
    'bg-default': '#FFFFFF',
    'bg-subtle': '#F6F7F9',
    'text-primary': '#17191D',
    'text-secondary': '#686F7A',
    'brand-default': '#315EFB',
    'brand-hover': '#2449D8',
    'accent-decorative': '#FF8A45',
    'accent-text': '#A8471A',
    'border-default': '#E7E9EE',
    'border-strong': '#868D98',
    'focus-ring': '#315EFB',
    'success-text': '#18794E',
    'warning-text': '#8A5A00',
    'danger-text': '#B42318',
    'sponsored-bg': '#FFF3E0',
    'sponsored-text': '#5B3A00',
    'on-brand': '#FFFFFF',
  },
  dark: {
    'bg-default': '#121417',
    'bg-subtle': '#1B1E23',
    'text-primary': '#E8EAED',
    'text-secondary': '#A3AAB5',
    'brand-default': '#7C9BFF',
    'brand-hover': '#9DB4FF',
    'accent-decorative': '#FF8A45',
    'accent-text': '#FFB085',
    'border-default': '#2A2F36',
    'border-strong': '#7D8591',
    'focus-ring': '#7C9BFF',
    'success-text': '#5CD69A',
    'warning-text': '#F5C451',
    'danger-text': '#FF8A80',
    'sponsored-bg': '#3A2A12',
    'sponsored-text': '#FFE2B8',
    'on-brand': '#0B1020',
  },
} as const;

export type ColorToken = keyof (typeof color)['light'];

/** 4 px tabanlı aralık ölçeği (px). */
export const space = { 0: 0, 1: 4, 2: 8, 3: 12, 4: 16, 6: 24, 8: 32, 12: 48, 16: 64 } as const;
export const radius = { sm: 4, md: 8, lg: 12, xl: 16, full: 9999 } as const;
/** Tip ölçeği (px) — gövde 16. */
export const fontSize = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,
  '5xl': 48,
} as const;
export const lineHeight = { tight: 1.25, normal: 1.5 } as const;
export const breakpoints = { sm: 640, md: 768, lg: 1024, xl: 1280, '2xl': 1536 } as const;
export const motion = { fast: 100, base: 200, slow: 300 } as const;

/** Kontrast gereksinimleri: [ön plan, arka plan, asgari oran]. CI'da her tema için doğrulanır. */
export const contrastPairs: Array<[ColorToken, ColorToken, number]> = [
  ['text-primary', 'bg-default', 4.5],
  ['text-primary', 'bg-subtle', 4.5],
  ['text-secondary', 'bg-default', 4.5],
  ['text-secondary', 'bg-subtle', 4.5],
  ['brand-default', 'bg-default', 4.5],
  ['on-brand', 'brand-default', 4.5],
  ['on-brand', 'brand-hover', 4.5],
  ['accent-text', 'bg-default', 4.5],
  ['accent-text', 'bg-subtle', 4.5],
  ['success-text', 'bg-default', 4.5],
  ['warning-text', 'bg-default', 4.5],
  ['danger-text', 'bg-default', 4.5],
  ['sponsored-text', 'sponsored-bg', 4.5],
  ['border-strong', 'bg-default', 3],
  ['border-strong', 'bg-subtle', 3],
  ['focus-ring', 'bg-default', 3],
];
