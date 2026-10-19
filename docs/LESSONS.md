# Öğrenilen dersler (LESSONS)

Bir ders bir madde; ilk satır tek cümlelik özet. Yanlış çıkan ders silinir.

- **NestJS 12 yalnızca ESM; decorator meta verisi esbuild/tsx ile üretilmez.** Derleme `tsc`, testler `unplugin-swc` ile yapılır; `tsx` ile API çalıştırılmaz.
- **Prisma 7 `prisma-client` üreteci varsayılan olarak `.ts` uzantılı import üretir.** `importFileExtension = "js"` ve `moduleFormat = "esm"` ayarlanmalı; `.env` otomatik yüklenmez.
- **Playwright `webServer`'ları `globalSetup`'tan önce başlatır.** Veritabanı hazırlığı ayrı bir adımda (`prepare-db.mjs`) çalışır.
- **`pkill -f` / `pgrep -f` deseni kendi bash komut satırıyla eşleşip kabuğu öldürür.** Süreçleri portla bul (`ss -ltnp`) ve PID ile durdur.
- **Zod 4 `.meta({id})` şemaları tekil `toJSONSchema` çağrısında `$defs` üretir; OpenAPI için kayıt defteri (`globalRegistry`) üzerinden `components/schemas` + `$ref` kullanılır.**
- **Tailwind v4 `@theme inline` içinde değişken kendine referans veremez.** Ham token'lar `--ic-*`, tema eşlemesi `--color-*`.
- **`minio/minio` imajı bu ortamda çekilemiyor.** Yerel S3 için SeaweedFS.
- **dependency-cruiser, çözümlenemeyen paketleri yol kuralıyla yakalamaz.** `couldNotResolve` kuralı ve çıplak paket adını da kapsayan desen gerekir.
- **req:check (a) faz içinde yalnızca çalışılmaya başlanan ZORUNLU REQ'leri denetler; faz kapısında `node scripts/req-check.mjs --gate` tüm ZORUNLU REQ'leri denetler.** Aksi hâlde faz başında CI hep kırmızı olurdu.
- **Zod 4 girdi (`io: input`) şemaları kimlikliyse tekil dönüşüm `#/definitions/...` üretir ve openapi-typescript çözemez.** Girdi şemaları boş bir kayıt defteriyle (`metadata: z.registry()`) satır içi üretilir.
- **Next.js yol duyurucusu (`#__next-route-announcer__`) da `role="alert"` taşır.** Playwright'ta `getByRole('main').getByRole('alert')` gibi kapsamlı seçici kullan.
- **E2E'de tüm tarayıcı istekleri 127.0.0.1'den gelir; IP hız sınırları testleri birbirine bağlar.** Her teste ayrı `X-Forwarded-For` veren otomatik fixture (`tests/e2e/support/fixtures.ts`).
- **Next.js App Router yerleşimleri (layout) istemci gezintisinde yeniden çizilmez.** Yetki denetimi yalnız yerleşimde yapılırsa sayfalar korunmaz; her panel sayfası `requireStaff()` çağırır (asıl yetki API'de).
- **Tohum (seed) verisi domain kurallarını atlayabilir.** Kural hem servis hem veritabanı CHECK kısıtıyla korunur; tohum `update: {}` ile panel değişikliklerini ezmez.
