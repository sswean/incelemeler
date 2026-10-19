# Runbook: Sır ve anahtar rotasyonu (REQ-GUV-010, AK-08) — TASLAK

Sırlar depoda, logda ve sohbette bulunmaz; ortamın sır yöneticisinden okunur (barındırma kararı Q-005).

| Sır | Etki | Rotasyon |
|---|---|---|
| `CURSOR_SECRET` | İmzalı bağlantılar (doğrulama, itiraz, önizleme), cursor'lar | Yeni değer → dağıt; eski bağlantılar geçersizleşir (kullanıcı yeniden ister). Planlı: yılda bir. |
| `DATA_ENCRYPTION_KEY` | MFA sırları (AES-256-GCM, `v1.` öneki) | **Anahtar kimliği/çoklu anahtar desteği henüz yok** (REQ-GUV-010 KISMİ): rotasyon personelin 2FA'yı yeniden kurmasını gerektirir. Önce çoklu anahtar desteği eklenmeli. |
| Veritabanı rol parolaları | Uygulama/salt okunur bağlantı | `APP_DB_PASSWORD=… READONLY_DB_PASSWORD=… pnpm --filter @incelemeler/api db:roles` → `DATABASE_URL` güncelle → yuvarlanarak yeniden başlat. |
| S3 erişim anahtarları | Medya | Sağlayıcıda yeni anahtar → ortam → yeniden başlat → eskisini iptal et. |
| E-posta sağlayıcı anahtarı | İşlemsel e-posta (X-004) | Aynı yöntem. |

## Sızıntı şüphesinde
1. İlgili sırrı hemen döndür; eskisini iptal et.
2. `gitleaks` ile depo ve geçmişi tara (`pnpm ci:local` adımı).
3. Etkiyi değerlendir; kişisel veri riski varsa [veri-ihlali.md](veri-ihlali.md).
