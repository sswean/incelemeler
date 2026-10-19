# incelemeler

**İncelemeler — "Keşfet. Karşılaştır. Karar ver."**

incelemeler.com.tr web platformu, özel yönetim paneli, API ve (Faz 2) iOS/Android uygulaması.

- Talimat (master prompt): [`docs/prompt/PROMPT-v2.md`](docs/prompt/PROMPT-v2.md) · kaynak parçalar: [`prompts/`](prompts/README.md)
- Ajan özeti ve kanonik komutlar: [`AGENTS.md`](AGENTS.md) · durum: [`docs/STATUS.md`](docs/STATUS.md)

## Hızlı başlangıç

Gereksinimler: Node.js 22 (`.nvmrc`), pnpm 10, Docker.

```bash
pnpm run setup   # .env, yerel servisler (PostGIS, S3, Mailpit), migration, başlangıç verisi
pnpm dev         # API :4000 · web :3000 · panel :3001
pnpm verify      # format + lint + sınırlar + typecheck + testler + build + OpenAPI + REQ izlenebilirliği
```

`pnpm setup` değil, `pnpm run setup` yazın (pnpm'in yerleşik `setup` komutuyla çakışır).

Panel için ilk süper yönetici (değerler ortam değişkenlerinden okunur; ilk girişte 2FA kurulumu zorunludur):

```bash
ADMIN_EMAIL=... ADMIN_PASSWORD=... pnpm --filter @incelemeler/api admin:create-super-admin
```

Yerelde gönderilen e-postalar (doğrulama, parola sıfırlama) Mailpit arayüzünde görünür: http://localhost:8025

| Komut | İşlev |
|---|---|
| `pnpm test:e2e` | Playwright uçtan uca testleri (izole veritabanı) |
| `pnpm ci:local` | CI adımlarının tamamı + lisans + audit + gitleaks + e2e |
| `pnpm db:migrate` / `pnpm db:reset:local` | Migration / yalnızca yerel veritabanını sıfırla |
| `pnpm openapi:generate` | `docs/api/openapi.json` ve tipli istemciyi üret |

## Yapı

`apps/{api,web,admin}` · `packages/{contracts,api-client,tokens,i18n,utils}` · `tests/e2e` · `infra/` · `docs/`
