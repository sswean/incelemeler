# Runbook: Dağıtım (REQ-OPS-004) — TASLAK

**Tetikleyici:** `main`'e birleştirilmiş, CI yeşil sürüm. Üretim dağıtımı C sınıfıdır (İnsan onayı).

## Ön koşullar
- [dagitim-kontrol-listesi.md](dagitim-kontrol-listesi.md) tamam; `pnpm ci:local` (ya da CI) son commit'te yeşil.
- Yeni migration'lar `pnpm migration:check`'ten geçti (yıkıcı DDL yok; gerekiyorsa genişlet/daralt — [geri-alma.md](geri-alma.md)).

## Adımlar (sıfır kesinti)
1. İmajları derle ve etiketle (commit kısa karması). Önceki sürüm etiketi not edilir (geri alma için).
2. **Migration önce:** `MIGRATION_DATABASE_URL=… pnpm --filter @incelemeler/api db:migrate` (şema sahibi rolüyle).
   Migration'lar geriye uyumlu olduğundan çalışan eski sürüm etkilenmez.
3. Gerekirse roller: `pnpm --filter @incelemeler/api db:roles` (idempotent; yeni tablolar varsayılan yetkilerle gelir).
4. API ve işçiyi yuvarlanarak güncelle: yeni örnek `/v1/health` (veritabanı `up`) yanıtı verene dek eski örnek trafikte kalır.
5. Web ve paneli güncelle (aynı yöntem).
6. Duman testi: ana sayfa, bir listeleme, arama, panel girişi; `GET /v1/ops/status` bakım kapalı.

## Doğrulama
- Hata oranı ve gecikme panoları (REQ-OPS-006, kurulum Q-005 sonrası) 15 dakika izlenir.
- Sorun → [geri-alma.md](geri-alma.md).
