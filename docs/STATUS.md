# Durum (STATUS)

- **Aktif faz: 1** — Çalışan temel platform (Faz 0 tamamlandı: `docs/status-log/FAZ-0-raporu.md`)
- Aktif dilim: Faz 1 dilim 3 — listeleme CRUD + tür uzantıları + medya + içe aktarma (dilim 2 taksonomi tamamlandı)
- Son yeşil `ci:local`: bkz. `.ci-local/last-run.json` (yerel; git dışı)
- Dal: `claude/pensive-hopper-oftszn` (A-001)

## Açık engeller
- Q-003 (C): izin listesi dışı dolaylı lisanslar — İnsan onayı.
- Q-005 (C): barındırma/veri yerleşimi — staging/üretim yok.
- X-031: gerçek CI çalıştırıcısı doğrulanmadı → `pnpm ci:local`.

## Dilim 1 özeti (kimlik + roller + denetim kaydı)
- API: kayıt/e-posta doğrulama/giriş/çıkış/parola sıfırlama, oturum listesi ve iptali, personel TOTP 2FA + kurtarma kodları, step-up, rol atama (denetim kaydı), varsayılan reddet koruması.
- Web: `/kayit`, `/giris`, `/eposta-dogrula`, `/parola-sifirla`, `/hesabim`, TASLAK hukuki metinler. Panel: `/giris`, `/iki-adim/kurulum`, `/iki-adim`, korumalı ana sayfa.
- İlk süper yönetici: `ADMIN_EMAIL=… ADMIN_PASSWORD=… pnpm --filter @incelemeler/api admin:create-super-admin` (değerler ortamdan; sohbete yazılmaz).
- Açık kalanlar: CSRF çift gönderim token'ı (A-010), sızıntı listesi API'si (X-011), artan giriş beklemesi, oturum içi parola değiştirme, 2FA kurulumunda QR kodu, rol yönetimi arayüzü (API hazır).

## Dilim 2a özeti (kategori yönetimi + outbox)
- API `/v1/admin/categories` (liste/oluştur/ayrıntı/güncelle; 412 sürüm çakışması), bayrak kuralları (A-011), outbox + worker.
- Panel `/kategoriler` (ağaç tablosu, oluştur, düzenle, yayımla); `CurrentUser.permissions` ile yetkiye göre arayüz.

## Dilim 3c/3d özeti (medya + içe aktarma)
- Medya: `/v1/admin/media` (yükleme, EXIF/GPS silme, blurhash, lisans alanları), listeleme görselleri, panelde lisans düzenleme.
- İçe aktarma: `/v1/admin/imports` (CSV önizleme → onay → geri alma), panel `/ice-aktarma`. XLSX henüz yok (izin listesinde uygun kütüphane seçimi — PARKING-LOT P-003).

## Sonraki 3 adım (Faz 1, §9.3 önerilen sıra)
1. Dilim 4 — Pilot listeleme detay sayfaları (Mekan, Konaklama, Ürün) + SEO temeli: URL şeması, slug 301, JSON-LD, sitemap/robots, görsel varyantları (Next Image), yer tutucu sistemi.
2. Dilim 5 — İçerik editörü + yayın akışı (blok şemaları, revizyonlar).
3. Dilim 6 — Arama + filtreler (attr.* filtrelenebilir özellikler) + hub sayfaları ve yayın eşikleri.
