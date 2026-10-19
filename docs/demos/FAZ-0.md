# Faz 0 gösterim betiği (≈ 10 dakika)

Ön koşul: Node 22, pnpm 10, Docker.

1. **Kurulum:** `pnpm run setup`
   - Beklenen: `.env` oluşur; PostGIS, S3 (SeaweedFS) ve Mailpit konteynerleri ayağa kalkar; migration'lar uygulanır; "77 kategori yüklendi" mesajı görünür.
2. **Doğrulama:** `pnpm verify`
   - Beklenen: format, lint, bağımlılık sınırları, typecheck, birim ve entegrasyon testleri, build, OpenAPI fark kontrolü ve `req:check` yeşil.
3. **Uygulamaları başlat:** `pnpm dev`
   - API: http://localhost:4000/v1/health → `{"status":"ok","database":"up",…}`
   - Kategoriler: http://localhost:4000/v1/categories?limit=5 → 5 kategori ve imzalı `nextCursor`.
   - Hatalı istek: http://localhost:4000/v1/categories?limit=1000 → 422 `application/problem+json`.
   - Web: http://localhost:3000 → "Ne keşfetmek istiyorsun?" altında 9 ana kategori. Sayfada yalnızca yayımlanmış kategoriler var; puan ya da değerlendirme yok.
   - Panel: http://localhost:3001 → "Sistem durumu: API Çalışıyor · Veritabanı Çalışıyor".
4. **Uçtan uca testler:** `pnpm test:e2e`
   - Beklenen: 10 test geçer (390 ve 1280 px).
5. **Tam yerel CI:** `pnpm ci:local`
   - Beklenen: lisans, audit ve gitleaks dahil tüm adımlar yeşil; `.ci-local/last-run.json` → `"passed": true`.
