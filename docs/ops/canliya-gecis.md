# Üretime geçiş kontrol listesi (REQ-OPS-010) — TASLAK

> Geçiş **C sınıfıdır**: her madde kanıtla işaretlenir ve İnsan yazılı onay verir. Kırmızı madde varken geçiş yapılmaz.

| # | Madde | Doğrulama | Durum |
|---|---|---|---|
| 1 | Hukuki metinler onaylı (TASLAK kaldırma C) | `legal_document_versions.approved_by` dolu; sayfalarda TASLAK yok | 🔴 |
| 2 | `legalGate` durumları gözden geçirildi | Kategori hukuki onay kayıtları (`legal_approvals`) ve FEATURE_FLAGS | — |
| 3 | Aktarım ve alt işleyen envanteri (barındırma, CDN, e-posta) | ADR-0014 kararı, envanter kaydı (REQ-VER-020) | 🔴 (Q-005) |
| 4 | DNS ve TLS (1.2+), HSTS (preload kararı Q-007) | Alan adı, sertifika, `Strict-Transport-Security` | — |
| 5 | Güvenlik başlıkları | E2E `hardening.spec` üretim adresine karşı | — |
| 6 | Yedek + geri yükleme testi | Staging tatbikatı (MQA-005), RPO/RTO kaydı | — |
| 7 | İzleme ve uyarılar | Log, metrik, uptime, hata izleme (REQ-OPS-006) | 🔴 |
| 8 | Arama motoru araçları | Doğrulama meta/dosyaları (REQ-SEO-015), `SITE_INDEXING=on` yalnızca bu onayla | — |
| 9 | robots ve site haritası | `/robots.txt`, `/sitemap.xml` üretim adresinde | — |
| 10 | Analitik rıza testi | E2E `consent.spec` (E2E-016) üretim benzeri ortamda | — |
| 11 | Demo veri yok | `SELECT count(*) FROM listings WHERE data_origin='DEMO'` = 0; seed üretimde reddeder | — |
| 12 | MOCK yok | Ortam doğrulaması üretimde MOCK/bellek adaptörünü reddeder; FEATURE_FLAGS MOCK yok | — |
| 13 | Performans bütçeleri | Lighthouse/JS bütçesi (REQ-PRF-002), API p95 (REQ-PRF-005) | 🔴 |
| 14 | Erişilebilirlik raporu | axe sıfır ciddi/kritik + ekran okuyucu MQA-004 sonucu | 🔴 |
| 15 | Destek ve iletişim kanalları | Güvenlik iletişim adresi (Q-007), hukuki talep ve KVKK kanalları, künye | 🔴 |
| 16 | Roller ve sınırlar | [dagitim-kontrol-listesi.md](dagitim-kontrol-listesi.md) madde 7–8 | — |
