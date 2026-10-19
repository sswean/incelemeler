# ADR-0001: Teknoloji yığını ve sürümler
- Durum: Kabul edildi · Tarih: 2026-10-19 · Karar veren: Ajan · İlgili: §14.1–§14.3, A-005

## Bağlam
§14.1 yığını ZORUNLU kılar; §14.3 sürümlerin registry'den okunmasını ister. Sürümler 2026-10-19'da `npm view` ile okundu.

## Karar
Aşağıdaki sürümler sabitlenir (lockfile commit edilir; faz ortasında major yükseltme yok):

| Bileşen | Sürüm | Not |
|---|---|---|
| Node.js | 22.x (`.nvmrc`, `engines >=22.12 <23`) | Ortamdaki 22.22.0 |
| pnpm | 10.28.0 (`packageManager`) | |
| Turborepo | 2.11.9 | |
| TypeScript | **6.0.3** | En güncel 7.0.2; typescript-eslint 8.71 `<6.1` destekliyor |
| Next.js / React | 16.4.2 / 19.3.1 | App Router |
| Tailwind CSS | 4.3.3 (`@tailwindcss/postcss`) | |
| NestJS | 12.1.3 | **Yalnızca ESM** |
| Prisma | **7.10.1** | `latest` etiketi 8.0.0-rc.23 (RC) → en güncel kararlı 7.10.1 seçildi |
| PostgreSQL / PostGIS | 16 / 3.4 (`postgis/postgis:16-3.4`) | |
| zod | 4.6.7 | |
| Vitest | 5.0.5 | |
| Playwright | 1.56.1 | Önceden kurulu chromium-1194 ile uyumlu |
| ESLint / typescript-eslint | 10.13.0 / 8.71.2 | |

## Değerlendirilen seçenekler
- TypeScript 7.0.2: lint zinciri desteklemiyor → reddedildi.
- Prisma 8 RC: kararlı değil → reddedildi.

## Sonuçlar
Olumlu: güncel kararlı sürümler. Olumsuz: NestJS ESM + decorator meta verisi için SWC/tsc gerekir (ADR-0008). Geri alma maliyeti: Orta.

## Doğrulama kaynakları
`npm view <paket> version` / `versions` / `dist-tags` (2026-10-19).
