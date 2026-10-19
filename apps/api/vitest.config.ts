import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

// NestJS DI için decorator meta verisi gerekir; esbuild üretmediğinden SWC kullanılır.
const swcPlugin = swc.vite({ module: { type: 'es6' } });

export default defineConfig({
  test: {
    // Kapsam eşikleri (REQ-TST-002, A-032): genel ≥ %70 satır; kritik modüller bugünkü değerlerinde mandal
    // (düşürülemez) — hedef ≥ %85 dal (reviews, sponsorship=ads, outbound=commerce, access, privacy+legal=compliance).
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: [
        'src/generated/**',
        'src/**/*.test.ts',
        'src/main.ts',
        'src/worker.ts',
        'src/cli/**',
      ],
      reporter: ['text-summary', 'json-summary'],
      thresholds: {
        lines: 70,
        'src/modules/reviews/**': { branches: 73 },
        'src/modules/sponsorship/**': { branches: 69 },
        'src/modules/outbound/**': { branches: 67 },
        'src/modules/access/**': { lines: 100 },
        'src/modules/privacy/**': { branches: 81 },
        'src/modules/legal/**': { branches: 84 },
      },
    },
    projects: [
      {
        plugins: [swcPlugin],
        test: {
          name: 'unit',
          include: ['src/**/*.test.ts'],
          exclude: ['src/**/*.int.test.ts'],
        },
      },
      {
        plugins: [swcPlugin],
        test: {
          name: 'integration',
          include: ['test/**/*.int.test.ts'],
          testTimeout: 120_000,
          hookTimeout: 180_000,
          fileParallelism: false,
        },
      },
    ],
  },
});
