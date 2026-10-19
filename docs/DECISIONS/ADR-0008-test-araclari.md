# ADR-0008: Test araçları
- Durum: Kabul edildi · Tarih: 2026-10-19 · İlgili: REQ-TST-001, §12.2

## Karar
| Katman | Araç | Not |
|---|---|---|
| Birim | Vitest 5 | API'de `unplugin-swc` (Nest decorator meta verisi) |
| API entegrasyon | Vitest + Testcontainers (`postgis/postgis:16-3.4`) + Supertest | Her koşuda migration sıfırdan uygulanır |
| Sözleşme | zod şemalarıyla yanıt doğrulama + OpenAPI üretim testleri | |
| E2E | Playwright 1.56.1 (390×844 ve 1280×800 projeleri) | İzole `incelemeler_e2e` veritabanı |
| Erişilebilirlik | `@axe-core/playwright` | Ciddi/kritik ihlal = 0 |
| Kontrast | Token kontrast testleri (Vitest) | |
| Görsel regresyon | Storybook + ekran görüntüsü (Faz 1, P-002) | |
| Performans | Lighthouse CI (Faz 1), yük testi aracı (Faz 1 sonu) | |
| Mobil E2E | Faz 2'de Maestro/Detox ADR'si | |

Odaklanmış/atlanmış test ESLint ile yasak (`vitest/no-focused-tests`, `no-disabled-tests`, `playwright/no-skipped-test`).
