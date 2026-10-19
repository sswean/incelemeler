# ADR-0009: Sayfa türü başına render ve önbellek stratejisi
- Durum: Kabul edildi (taslak tablo; Faz 1 dilimlerinde güncellenir) · Tarih: 2026-10-19 · İlgili: REQ-MIM-013/014, REQ-PRF-006

| Sayfa türü | Render | Önbellek / geçersiz kılma | İndeks |
|---|---|---|---|
| Ana sayfa | SSR (Faz 0: `force-dynamic`) → Faz 1: ISR (60 sn) + olay tabanlı yeniden doğrulama | Kampanya başlangıç/bitişinde yeniden doğrulama (≤ 60 sn) | Canlıya kadar `noindex` |
| Listeleme detay | ISR + `revalidateTag(listing:<id>)` | Listeleme/değerlendirme/kampanya olaylarında | evet (eşik) |
| İçerik (rehber, liste…) | ISR + `revalidateTag(article:<id>)` | Yayın/güncelleme olaylarında | evet |
| Hub (il × kategori) | ISR (5 dk) + etiket | Eşik değişiminde | eşik sağlanırsa |
| Arama | SSR, `no-store` | — | `noindex` |
| Hesap sayfaları | Dinamik, `private, no-store` | — | `noindex` |
| Panel | Dinamik, `no-store` | — | `noindex` |
| API genel GET | `Cache-Control: public, max-age=60` + ETag (Faz 1) | — | — |
| API sağlık | `no-store` | — | — |

## Uygulama notları (Faz 1 dilim 4)
- Listeleme detay: `revalidate = 60` (ISR); etiket tabanlı geçersiz kılma outbox tüketicisiyle (D13) eklenecek.
- `src/proxy.ts` (Next 16): yol normalleştirme (büyük harf, sondaki eğik çizgi → 301), listeleme slug çözümü (taşınmış/yanlış önek → 301, zincirsiz; kaldırılmış → 410). Next'in 308 yönlendirmesi `skipTrailingSlashRedirect` ile kapatıldı.
- Site haritası ve robots.txt çalışma zamanında (`force-dynamic`) üretilir; `Cache-Control: public, max-age=3600`.
- İndeksleme yalnızca `SITE_INDEXING=on` iken açılır (A-008); kapalıyken robots.txt tamamen `Disallow` ve sayfalar `noindex, follow`.
