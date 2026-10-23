import { defineConfig } from 'vitest/config';

// Kapsam eşiği (REQ-TST-002): Türkçe metin, biçimlendirme ve puan hesapları ≥ %95 satır; düşürülemez.
export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      include: [
        'src/turkish.ts',
        'src/format.ts',
        'src/rating.ts',
        'src/suffix.ts',
        'src/opening-hours.ts',
      ],
      thresholds: { lines: 95 },
      reporter: ['text-summary'],
    },
  },
});
