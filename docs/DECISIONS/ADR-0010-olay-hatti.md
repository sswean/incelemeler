# ADR-0010: Olay hattı (outbox ve analitik)
- Durum: Önerildi (Faz 1 dilim 2'de uygulanacak) · Tarih: 2026-10-19 · İlgili: REQ-MIM-015/016, REQ-ANL-001

## Karar
Domain değişiklikleri aynı işlemde `outbox_events` tablosuna yazılır; API'nin `worker` giriş noktası `SELECT … FOR UPDATE SKIP LOCKED` ile olayları işler (arama indeksi, `rating_stats`, önbellek geçersiz kılma, bildirimler). İşleyiciler idempotenttir; yeniden deneme sayısı ve ölü mektup durumu tutulur. Analitik ve reklam olayları ayrı, aylık bölümlü tablolara yazılır; ham IP saklanmaz (günlük tuzlu karma). Redis/BullMQ yalnızca §14.4 tetikleyicisi ölçülürse eklenir.
