# ADR-0003: Kimlik doğrulama yaklaşımı
- Durum: Kabul edildi (Faz 1 dilim 1'de uygulandı) · Tarih: 2026-10-19 · İlgili: REQ-HSP-002…008, REQ-GUV-006

## Bağlam
Web için çerez tabanlı oturum, mobil (Faz 2) için döndürülen yenileme token'ı; personel için zorunlu TOTP 2FA gerekir.

## Karar
Kimlik doğrulama API içinde, kendi modülümüzle uygulanır; kriptografi standart kütüphanelerle (Node `crypto`, Argon2id için lisansı izin listesindeki bir paket — eklenmeden önce §13.2 kontrolü):
- Web: sunucu tarafı oturum tablosu (`sessions`), `__Host-sid` çerezi (HttpOnly, Secure, SameSite=Lax), Next sunucu tarafı BFF çağrıları; CSRF: SameSite + Origin kontrolü + çift gönderim token'ı.
- Mobil (Faz 2): 10–15 dk erişim JWT'si + opak, hash'lenmiş, her kullanımda döndürülen yenileme token'ı ve yeniden kullanım tespiti.
- Personel: TOTP (RFC 6238) + 10 hash'li kurtarma kodu; kritik işlemlerde 10 dk step-up.
Hazır üçüncü taraf kimlik hizmeti (SaaS) kullanılmaz: kullanıcı verisi yurt dışına aktarılmaz (L-010) ve maliyet doğmaz.

## Değerlendirilen seçenekler
- Auth.js / Better Auth: web odaklı; mobil token rotasyonu ve personel 2FA için ek iş → Faz 1'de lisans/uygunluk tekrar değerlendirilebilir.
- Harici kimlik SaaS: veri aktarımı + C sınıfı maliyet → reddedildi.

## Sonuçlar
Olumlu: tam kontrol, KVKK uyumu. Olumsuz: güvenlik testi yükü (E2E-011, ASVS L2). Geri alma: Yüksek.

## Uygulama notları (Faz 1 dilim 1)
- Argon2id: `@node-rs/argon2` (MIT), m=19456 KiB, t=2, p=1 (OWASP Password Storage önerisi; sürüm ADR-0001).
- Oturum token'ı 32 bayt rastgele, veritabanında yalnız SHA-256 özeti. API yalnız `Authorization: Bearer` kabul eder; web/panel token'ı HttpOnly çerezde tutar ve sunucu tarafında iletir (BFF). Panel çerezi ayrı ad (`__Host-asid`) ve `SameSite=Strict`.
- Personel oturumu rol kümesi değişince geçersizleşir; rol atama hedefin tüm oturumlarını kapatır.
- TOTP (RFC 6238, SHA-1, 30 sn, ±1 adım) kendi uygulamamız; gizli anahtar AES-256-GCM ile `DATA_ENCRYPTION_KEY` altında şifreli; son kullanılan adım koşullu güncellemeyle saklanır (yeniden oynatma koruması).
- Varsayılan reddet: her rota `@Public()` ya da `@RequireAuth()` taşır; sözleşmedeki (`endpoints.ts`) yetki düzeyiyle birebir eşleşme birim testiyle korunur.
- CSRF: çift gönderim token'ı henüz yok; SameSite + Next Server Actions Origin/Host denetimi ile başlandı (A-010, REQ-GUV-006 KISMİ).
- E-posta: `EmailPort`; yerelde Mailpit HTTP API, testte bellek, üretimde X-004 sağlanana dek devre dışı (gönderim yok, yalnız içeriksiz uyarı).
