# Ortam (ENVIRONMENT)

Son güncelleme: 2026-10-19 · Faz 0 ortam keşfi (§8.1/1)

## Araç sürümleri (bu oturumda ölçüldü)

| Araç | Sürüm | Komut |
|---|---|---|
| Node.js | v22.22.0 | `node -v` |
| pnpm | 10.28.0 | `pnpm -v` |
| npm | 10.9.4 | `npm -v` |
| Docker | 29.8.2 | `docker --version` |
| Docker Compose | v5.6.0 | `docker compose version` |
| psql (yerel istemci) | 16.15 | `psql --version` |
| Playwright tarayıcısı | chromium-1194 (önceden kurulu, `/opt/pw-browsers`) | `ls /opt/pw-browsers` |

## Erişim durumu

- npm registry: **erişilebilir** (`npm view next version` → 16.4.2).
- Docker Hub: `postgis/postgis:16-3.4`, `axllent/mailpit`, `chrislusf/seaweedfs` çekilebildi.
- `minio/minio`: **çekilemedi** ("pull access denied") → yerel S3 için SeaweedFS seçildi (ADR-0007).
- Docker daemon oturum başında çalışmıyordu; `dockerd` elle başlatıldı (bulut konteyneri). `scripts/init.sh` daemon yoksa başlatmayı dener.
- Resmî doküman siteleri: Faz 0'da doğrudan erişim test edilmedi; dış olgular §13.3'e göre DOĞRULANMADI işaretlenir.
- Uzak Git deposu: `origin` (GitHub) mevcut; **CI çalıştırıcısı doğrulanmadı** (X-031) → `pnpm ci:local` kullanılır.

## Kısıtlar

- Bulut konteyneri geçicidir; yeniden başlatmada Docker daemon ve konteynerler kaybolabilir.
- Gerçek cihaz/simülatör, push teslimi, gerçek alan adı yoktur → ilgili kontroller `MANUAL-QA`.
