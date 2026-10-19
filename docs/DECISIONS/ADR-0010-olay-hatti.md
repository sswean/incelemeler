# ADR-0010: Olay hattı (outbox ve analitik)
- Durum: Kabul edildi (outbox Faz 1 dilim 2'de uygulandı; analitik tabloları D9/D12) · Tarih: 2026-10-19 · İlgili: REQ-MIM-015/016, REQ-ANL-001

## Karar
Domain değişiklikleri aynı işlemde `outbox_events` tablosuna yazılır; API'nin `worker` giriş noktası `SELECT … FOR UPDATE SKIP LOCKED` ile olayları işler (arama indeksi, `rating_stats`, önbellek geçersiz kılma, bildirimler). İşleyiciler idempotenttir; yeniden deneme sayısı ve ölü mektup durumu tutulur. Analitik ve reklam olayları ayrı, aylık bölümlü tablolara yazılır; ham IP saklanmaz (günlük tuzlu karma). Redis/BullMQ yalnızca §14.4 tetikleyicisi ölçülürse eklenir.

## Uygulama notları (Faz 1 dilim 2)
- `outbox_events`: kiralama `UPDATE … WHERE id IN (SELECT … FOR UPDATE SKIP LOCKED) RETURNING`; `available_at` hem bekleme hem kiralama süresi (60 sn) olarak kullanılır — çöken işleyicinin olayı süre dolunca yeniden alınır.
- Yeniden deneme: 5 sn × 2^(n−1), en çok 1 saat; 10 denemeden sonra `dead_at` (ölü mektup). Hata metni 500 karakterle kırpılır; yük kişisel veri içermez.
- Teslim "en az bir kez"dir; işleyiciler olay kimliğiyle idempotent yazılır. Abonesi olmayan olay işlenmiş sayılır.
- Giriş noktası: `apps/api/dist/worker.js` (`pnpm --filter @incelemeler/api worker`; `pnpm dev` ile birlikte başlar).
