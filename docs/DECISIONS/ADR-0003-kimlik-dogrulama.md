# ADR-0003: Kimlik doğrulama yaklaşımı
- Durum: Önerildi (Faz 1 dilim 1'de uygulanacak) · Tarih: 2026-10-19 · İlgili: REQ-HSP-002…008, REQ-GUV-006

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
