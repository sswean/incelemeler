# Durum (STATUS)

- **Aktif faz: 1** — Çalışan temel platform (Faz 0 tamamlandı: `docs/status-log/FAZ-0-raporu.md`)
- Aktif dilim: Faz 1 dilim 9 — sponsorluk kampanyası + yerleşim (dilim 8 dış yönlendirme: `docs/status-log/F1-D8.md`)
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

## Dilim 5 özeti (içerik editörü + yayın akışı)
- API: `/v1/admin/articles` (taslak, blok gövde, revizyonlar, menfaat beyanı, geçişler, düzeltme, imzalı önizleme, zamanlı yayın worker'da), `/v1/articles/{slug}`, `/v1/preview/article`, `/v1/sitemap/articles`, `/v1/admin/author-profile`, `/v1/authors/{slug}`.
- Panel: `/icerikler` (liste, yeni, blok editörü, önizleme bağlantısı), `/yazar-profili`.
- Web: `/rehber|liste|karsilastir|inceleme|haber|sponsorlu/{slug}` (künye, ticari açıklama, deneyim beyanı, Article JSON-LD), `/onizleme`, `/yazar/{slug}`, metodoloji/politika sayfaları (TASLAK), alt bilgi.

## Dilim 6 özeti (arama + hub'lar)
- API: `/v1/search` (ayrıştırıcı çipleri, filtreler, geri dönüşler, gevşetme), `/v1/search/suggest`, `/v1/search/filters`, `/v1/hubs`, `/v1/sitemap/hubs`, `/v1/admin/settings/thresholds`. `pnpm search:reindex`.
- Web: `/ara` (otomatik tamamlama, filtre alt sayfası, çipler), `/{il}`, `/{il}/{ilce|kategori}`, `/{il}/{ilce}/{kategori}` hub'ları. Panel: `/ayarlar/esikler`.
- Demo: `pnpm seed:demo` 64 kurgusal "(Demo)" listeleme ekler; korpus `docs/requirements/ARA-sorgu-korpusu.json`.

## Dilim 7 özeti (değerlendirme + moderasyon)
- API: `/v1/reviews` (gönder/düzenle/geri çek), `/v1/me/reviews`, `/v1/me/review-drafts/{id}`, `/v1/listings/{id}/reviews|review-form`, `/v1/reports`, `/v1/appeals`, `/v1/admin/moderation/*`; `listing_rating_stats` (Bayes) outbox ile.
- Web: listeleme sayfasında puan özeti + değerlendirmeler + Bildir; `/degerlendir/{id}` (misafir taslağı → giriş → geri yükleme), `/degerlendirmeler/{id}`, `/hesabim/degerlendirmelerim` (itiraz). Panel: `/moderasyon`.

## Dilim 8 özeti (dış yönlendirme + affiliate)
- API: `/v1/outbound/{id}/resolve` (hedef yalnızca kayıttan, izinli alan adı, imzalı bağlam, asenkron tıklama kaydı), `/v1/admin/integration-providers`, `/v1/admin/listings/{id}/outbound-links`, `/v1/admin/outbound-links` (+ `/check`); sağlık denetimi worker'da.
- Web: `/git/{id}` → 302 (no-store, noindex); listeleme CTA'ları kayıtlı bağlantıdan, ticari olanlar `rel="sponsored"` + "Ortaklık bağlantısı" etiketi. Panel: listelemede "Dış bağlantılar", `/entegrasyonlar`.

## Sonraki 3 adım (Faz 1, §9.3 önerilen sıra)
1. Dilim 9 — Sponsorluk kampanyası + yerleşim + olay ölçümü (REQ-ARA-009, REQ-GUN-004 ikinci onay).
2. Dilim 10 — Favoriler, hesap/KVKK talepleri, CMP.
3. Dilim 7 kalanları — değerlendirme fotoğrafları/EXIF, hukuki talepler, yaptırımlar (D13 öncesi).
