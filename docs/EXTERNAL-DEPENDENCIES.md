# Dış bağımlılıklar (EXTERNAL-DEPENDENCIES)

> §10 / Ek D2. Kayıt biçimi: Ek C-6. Hiçbiri henüz sağlanmadı; her biri İnsan eylemi gerektirir (C sınıfı).
> Sırların DEĞERLERİ asla buraya yazılmaz; yalnızca ortam değişkeni ADLARI.

## Başlangıç listesi (prompt v2 Ek D2) — durum: hepsi BEKLİYOR

Hiçbiri henüz sağlanmamıştır. Her biri için İnsan'dan beklenen eylem C sınıfıdır; sen yalnızca seçenek karşılaştırması (resmî kaynaklı) ve gerekli ortam değişkeni ADLARINI hazırlarsın.

| X | Bağımlılık | Gerektiği faz | Erişim yokken davranış |
|---|---|---|---|
| X-001 | Alan adı `incelemeler.com.tr` DNS yönetimi ve TLS | Canlıya geçiş | Yerel/staging alan adları |
| X-002 | Barındırma (uygulama + yönetilen PostgreSQL + S3 uyumlu depolama) — **veri yerleşimi kararı** | Canlıya geçiş | Docker Compose |
| X-003 | CDN / WAF | Canlıya geçiş | — · Not: uç vekil `X-Forwarded-For`'a gözlediği istemci IP'sini EKLEMELİ (A-009) |
| X-004 | İşlemsel e-posta gönderim hizmeti | 1 | Yerel e-posta yakalayıcı (Mailpit HTTP API); üretimde `EMAIL_ADAPTER=disabled` — gönderim yok. Gerekecek ortam değişkeni adları sağlayıcı seçilince eklenecek |
| X-005 | Harita kütüphanesi/karo sağlayıcısı + coğrafi kodlama (lisans ve kullanım şartları) | 1 (İSTEĞE BAĞLI) | Harita KAPALI; adres + "Yol tarifi" dış bağlantısı |
| X-006 | Türkiye idari bölge verisi (il/ilçe/mahalle; lisansı uygun kaynak) | 0–1 | İl/ilçe listesi elle (kaynaklı) |
| X-007 | Hata izleme ve log/izleme hizmetleri | 1 | Yerel loglar |
| X-008 | Analitik aracı (birinci taraf yeterliyse gerekmez) | 1 | Birinci taraf olay hattı |
| X-009 | Gizlilik dostu CAPTCHA | 1 | Hız sınırları + bal küpü alanı |
| X-010 | Kötü amaçlı dosya taraması | 1 | Yalnızca personel yüklemesi + yeniden kodlama |
| X-011 | Sızdırılmış parola kontrolü (k-anonimlik API) | 1 | Yerel yaygın parola listesi (`apps/api/src/modules/identity/common-passwords.ts`); REQ-HSP-003 KISMİ |
| X-012 | Google Search Console, Bing Webmaster, Yandex Webmaster | Canlıya geçiş | — |
| X-013 | Apple Developer Program + App Store Connect | 2 | Simülatör/yerel derleme |
| X-014 | Google Play Console | 2 | Emülatör/yerel derleme |
| X-015 | Apple ile giriş / Google ile giriş yapılandırması | 2 | Yalnızca e-posta girişi |
| X-016 | Push (APNs, FCM; Expo push hizmeti) | 2 | Yalnızca uygulama içi bildirim |
| X-017 | EAS (Expo Application Services) hesabı | 2 | Yerel derleme |
| X-018 | Ertelenmiş derin bağlantı sağlayıcısı (isteğe bağlı) | 2 | Yok |
| X-019 | Affiliate ağları/programları (ürün satıcıları, otel, araç kiralama, tur) — **aday sağlayıcılar resmî kaynaklarla doğrulanacak; kabul ve sözleşme İnsan'da** | 1 (bağlantı) / 3 (dönüşüm) | `LINK_ONLY` ya da bağlantısız |
| X-020 | Otel/konaklama fiyat-müsaitlik API'si | 3 | MOCK + "Sağlayıcıda gör" |
| X-021 | Araç kiralama fiyat-müsaitlik API'si | 3 | MOCK + yönlendirme |
| X-022 | Tur/aktivite sağlayıcı API'si | 3 | MOCK + yönlendirme |
| X-023 | Restoran rezervasyon sistemi | 3 | İşletmenin rezervasyon bağlantısı |
| X-024 | İYS entegratörü/marka kodu | 2+ (bülten gönderimi) | Gönderim yok |
| X-025 | Ödeme kuruluşu ve e-Fatura/e-Arşiv entegratörü | Kapsam dışı | Manuel süreç |
| X-026 | Hukuk danışmanı (KVKK, reklam, turizm, bilişim) ve mali müşavir | 0'dan itibaren | Metinler TASLAK; legalGate'ler KAPALI |
| X-027 | Font ve ikon lisansları (açık lisans doğrulaması) | 0 | Sistem fontu |
| X-028 | Stok görsel lisansı (isteğe bağlı) ve fotoğraf çekimi | 1 | Placeholder sistemi |
| X-029 | Eser meta veri kaynağı (film/kitap/oyun; lisanslı) | 4 | Tür kapalı |
| X-030 | Marka tescili ve logo tasarımı | 1 | Geçici kelime işareti |
| X-031 | Git uzak deposu + CI çalıştırıcısı (dal koruması dahil) | 0 | Yerel `pnpm ci:local` |

## Faz 0 notları

- **X-031 (Git uzak deposu + CI):** `origin` GitHub deposu mevcut ve push çalışıyor. `.github/workflows/ci.yml` yazıldı; GitHub Actions'ın bu depoda etkin olup olmadığı **doğrulanmadı** → "CI'da yeşil" ölçütleri `pnpm ci:local` ile kanıtlanıyor ve `DOĞRULANAMADI (CI yok)` olarak raporlanıyor. Dal koruması (main) İnsan tarafından ayarlanmalı.
- **X-002 (barındırma):** Veri yerleşimi kararı (Türkiye/AB) bekleniyor; staging/üretim yok.
- **S3 yerel:** `minio/minio` imajı çekilemedi; yerelde SeaweedFS (Apache-2.0) kullanılıyor (ADR-0007). Üretim nesne depolaması X-002 ile seçilecek.
