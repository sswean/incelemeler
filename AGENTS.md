# AGENTS.md — İncelemeler

Bu dosya, depoda çalışan her kodlama ajanının her oturumda okuduğu özettir. Tek yetkili talimat:
`docs/prompt/PROMPT-v2.md` (SALT OKUNUR). Çelişkide o belge geçerlidir.

## Oturum başlangıcı (§9.2)
1. `pwd && git status && git log --oneline -20`
2. Oku: bu dosya, `docs/STATUS.md`, `docs/OPEN-QUESTIONS.md`, `docs/requirements/requirements.json` (aktif faz), gerekirse `docs/requirements/<ALAN>.md`.
3. `pnpm test:smoke` (ya da `pnpm verify`). Kırmızıysa önce düzelt.
4. STATUS'taki "Sonraki adımlar"dan devam et.

## Altın kurallar (özet — tam metin §2)
- AK-01 Kanıtsız iddia yok: yalnızca bu oturumda çalıştırılan komut çıktısına dayan.
- AK-02 Üründe sahte veri yok (puan, değerlendirme, metrik, fiyat, müsaitlik, "doğrulanmış" rozeti).
- AK-03 Demo veri kurgusal, "(Demo)" ekli, `dataOrigin=DEMO`; üretime/sitemap'e/JSON-LD'ye/raporlara girmez.
- AK-04 Sponsorluk/affiliate; puanları, organik sıralamayı ve moderasyonu etkilemez.
- AK-05 Etiketsiz ticari yerleşim yok (kart, detay, mobil, OG, bildirim).
- AK-06 Sahte entegrasyon yok: doğrulanmamış sağlayıcı = port + `MOCK` adaptör (üretimde yasak).
- AK-07 Scraping yok; lisansı belirsiz görsel yok; gerçek yeri temsil eden yapay görsel yok.
- AK-08 Depo/log/istemci paketi/sohbette sır yok. AK-09 Geri alınamaz/dışa dönük işlem = İnsan onayı.
- AK-10 Aktif faz dışında iş yok → `docs/PARKING-LOT.md`. AK-11 Test silinmez/atlanmaz/zayıflatılmaz.
- AK-12 Hukuki metinler TASLAK; yasa/madde uydurma. AK-13 WordPress & site kurucular yasak.
- AK-14 Promptu değiştirme → `PROMPT-CR`. AK-15 Karanlık örüntü yok.

## Durma koşulları (§11)
A: karar ver + ADR/A kaydı · B: Q kaydı + varsayılanla devam · C: dur, onay bekle (üretim dağıtımı, para, hesap açma, gerçek kişiye ileti, mağaza gönderimi, TASLAK kaldırma, geri alınamaz veri işlemi, force-push, yığın/kural/faz değişikliği, izin listesi dışı lisans, faz geçişi) · D: yapma.

## Kanonik komutlar (§9.5)
| Komut | İşlev |
|---|---|
| `pnpm run setup` | Temiz klondan kurulum: .env, Docker servisleri, migration, seed (idempotent). **`run` zorunlu** (pnpm'in yerleşik `setup` komutuyla çakışır). |
| `pnpm dev` | API (4000), web (3000), admin (3001) |
| `pnpm verify` | format + lint + deps + typecheck + unit + integration + build + openapi + req:check |
| `pnpm test:smoke` / `pnpm test:e2e` | Playwright (izole `incelemeler_e2e` DB'si; API 4100, web 3100, admin 3101) |
| `pnpm ci:local` | CI adımlarının tamamı + lisans + audit + gitleaks + e2e → `.ci-local/last-run.json` |
| `pnpm db:migrate` / `pnpm db:reset:local` | Migration uygula / yalnızca yerel DB'yi sıfırla |
| `pnpm seed:demo` | Başlangıç verisi (üretimde reddeder) |
| `pnpm openapi:generate` | `docs/api/openapi.json` + `packages/api-client/src/schema.d.ts` |
| `pnpm req:check` | REQ ↔ test izlenebilirliği |

## Dizin haritası
- `apps/api` NestJS 12 (ESM) + Prisma 7 (`prisma/schema.prisma`, `prisma.config.ts`); testler: `src/**/*.test.ts` (unit), `test/*.int.test.ts` (Testcontainers PostGIS).
- `apps/web`, `apps/admin` Next.js 16 (App Router), Tailwind 4. Veritabanına erişmez; `@incelemeler/api-client` kullanır.
- `packages/contracts` zod şemaları + uç nokta listesi (OpenAPI'nin tek kaynağı) · `api-client` (üretilir) · `tokens` (tasarım token'ları) · `i18n` (tr-TR metinleri) · `utils` (Türkçe metin, biçim, puan).
- `tests/e2e` Playwright · `infra/docker-compose.yml` PostGIS (54320), SeaweedFS S3 (8333), Mailpit (1025/8025).
- `docs/` hafıza dosyaları (§10), `docs/DECISIONS/` ADR'ler, `docs/requirements/` REQ'ler.

## Kurallar ve tuzaklar
- Türkçe dönüşümler yalnızca `@incelemeler/utils` (`lowerTr`, `slugifyTr`, `normalizeTr`); `toLowerCase()` kullanma.
- Arayüz metni yalnızca `@incelemeler/i18n` anahtarlarıyla; renk/aralık yalnızca token'lardan.
- API hataları RFC 9457 (`ProblemException`); bilinmeyen sorgu parametresi 400, geçersiz değer 422.
- Yeni uç nokta: önce `packages/contracts/src/endpoints.ts`, sonra denetleyici, sonra `pnpm openapi:generate`.
- Nest DI decorator meta verisi gerektirir: derleme `tsc`, testler SWC (`unplugin-swc`); `tsx`/esbuild ile çalıştırma.
- Prisma 7: `.env` otomatik yüklenmez (`prisma.config.ts` kök `.env`'i okur); istemci `src/generated/prisma` (git dışı, `prisma:generate`).
- Test adı REQ kimliği içerir: `it('[REQ-XXX-NNN] …')`. Commit: Conventional Commits + `Refs: REQ-…`.
- Süreç öldürürken `pkill -f <desen>` kullanma (kendi kabuğunu öldürür); portla bul: `ss -ltnp`.
