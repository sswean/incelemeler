# ADR-0002: Monorepo yerleşimi ve yönetim panelinin konumu
- Durum: Kabul edildi · Tarih: 2026-10-19 · Karar veren: Ajan · İlgili: REQ-MIM-001/002, Ek A1.1

## Bağlam
Web, panel, API ve (Faz 2) mobil ortak sözleşme ve token'ları paylaşmalı; veritabanına yalnızca API erişmeli.

## Karar
pnpm workspaces + Turborepo. `apps/{web,admin,api}` (+ Faz 2'de `apps/mobile`), `packages/{contracts,api-client,tokens,i18n,utils}`, `tests/e2e`, `infra/`. Yönetim paneli **ayrı Next.js uygulamasıdır** (ayrı alt alan adı, `noindex`, `frame-ancestors 'none'`). Sınırlar dependency-cruiser ile CI'da zorlanır (`.dependency-cruiser.cjs`). Paylaşılan paketler `tsc` ile `dist/`'e derlenir ve uygulamalar derlenmiş çıktıyı tüketir.

## Değerlendirilen seçenekler
- Panel web içinde korumalı rota: saldırı yüzeyi ve paket boyutu paylaşımı → reddedildi.
- Nx: ek karmaşıklık → reddedildi.

## Sonuçlar
Olumlu: net sınırlar, ayrı dağıtım. Olumsuz: iki Next uygulaması bakım maliyeti. Geri alma: Orta.
