# Durum (STATUS)

- **Aktif faz: 1** — Çalışan temel platform (Faz 0 tamamlandı: `docs/status-log/FAZ-0-raporu.md`)
- Aktif dilim: Faz 1 dilim 2b — özellik şeması + değerlendirme kriterleri (2a: kategori yönetimi + outbox tamamlandı)
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

## Sonraki 3 adım (Faz 1, §9.3 önerilen sıra)
1. Dilim 2b — Özellik şeması (`attribute_definitions`, sürümlü; REQ-VER-003) ve değerlendirme kriterleri (A6.3) yönetimi + panel ekranları.
3. Dilim 3 — Listeleme CRUD + tür uzantıları + medya hattı + toplu içe aktarma (REQ-LST-*, REQ-VER-002…014).
4. (Dilim 2 ile) Panelde personel/rol yönetimi ekranı ve 2FA kurulumunda QR kodu.
