# HSP — Hesap, kimlik ve yetki

> Ek A'dan otomatik aktarıldı (`node scripts/import-requirements.mjs`). Durumlar `requirements.json` içindedir.

### REQ-HSP-001
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: Misafir gezinme: listeleme, içerik, arama, harita hiçbir hesap gerektirmez. Giriş yalnızca eylem anında istenir (kaydet, değerlendirme yaz, başvuru). Giriş duvarı (içeriği hesapla kilitleme) YASAK.
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-HSP-002
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: E-posta + parola ile kayıt; e-posta doğrulama (tek kullanımlık, hash'lenmiş token, 24 saat); parola sıfırlama (30 dk, tek kullanım; sıfırlamada tüm oturumlar iptal). Değerlendirme yazma ve başvuru için doğrulanmış e-posta ZORUNLU.
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-HSP-003
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: Parola hash'i Argon2id (parametreler güncel OWASP Password Storage önerisine göre ADR'de; doğrulanmalı). Parola politikası: en az 10 karakter, bilinen sızıntı listesine karşı kontrol (k-anonimlik ile, yalnızca hash öneki gönderilerek; dış servis X-kaydı), maksimum uzunluk ≥ 64.
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-HSP-004
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: Web: sunucu tarafı oturum; çerez `__Host-` önekli, `HttpOnly`, `Secure`, `SameSite=Lax`. JWT/token `localStorage`/`sessionStorage`'a konmaz. Durum değiştiren isteklerde CSRF koruması (SameSite + Origin kontrolü + token). Oturum ömrü (varsayılan): kayan 30 gün, mutlak 90 gün; personel kayan 12 saat. Kullanıcı aktif oturumlarını görüp iptal edebilir.
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-HSP-005
- Düzey: ZORUNLU · Faz: 2 · Kaynak: v2 Ek A
- Gereksinim: Mobil: kısa ömürlü erişim token'ı (10–15 dk, kişisel veri içermez) + opak, hash'lenmiş, **her kullanımda döndürülen** yenileme token'ı; yeniden kullanım tespitinde tüm aile iptal. Token'lar yalnızca güvenli depoda (iOS Keychain / Android Keystore).
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-HSP-006
- Düzey: ZORUNLU · Faz: 2 · Kaynak: v2 Ek A
- Gereksinim: Google ile giriş ve Apple ile giriş; hesap birleştirme yalnızca iki tarafta doğrulanmış e-posta + kullanıcı onayıyla. Apple özel e-posta aktarma adresleri desteklenir. Mağaza giriş kuralının güncel metni doğrulanır (Ek D1, L-kaydı).
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-HSP-007
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: Personel (süper yönetici, yönetici, editör, yazar, moderatör) için TOTP tabanlı 2FA ZORUNLU; 2FA kurulmadan panel işlevleri açılmaz (403 `MFA_REQUIRED`). 10 kurtarma kodu (hash'li). Kritik işlemlerde (rol değişikliği, kampanya tutarı, toplu silme, dışa aktarma, hukuki kapı) son 10 dk içinde yeniden doğrulama (step-up).
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-HSP-008
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: Hız sınırları (varsayılan): giriş IP başına 10/dk ve hesap başına 5/dk (artan bekleme); parola sıfırlama e-posta başına 3/saat; kayıt IP başına 5/saat; değerlendirme gönderme üye başına 5/gün. Aşımda 429 + `Retry-After`. Yanıtlar hesabın var olup olmadığını açığa vurmaz.
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-HSP-009
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: **Rol × izin matrisi** `docs/requirements/HSP.md` içinde tablo olarak yazılır; her hücre bir yetkilendirme testine bağlanır. Varsayılan özet aşağıdadır.
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-HSP-010
- Düzey: ZORUNLU · Faz: 3 · Kaynak: v2 Ek A
- Gereksinim: Kuruluş kapsamlı yetki: İşletme temsilcisi yalnızca kendi kuruluşunun listelemelerini, yanıtlarını ve raporlarını görür/değiştirir; başka kuruluşun kaynağına erişim 404 döner (IDOR testi).
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-HSP-011
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: Hesap silme web'de (Faz 2'de uygulama içinde de) self-servis; onay adımından sonra hesap "silme bekliyor" durumuna geçer ve giriş yapılamaz; 30 günlük geri alma penceresinin (varsayılan, B sınıfı) sonunda REQ-KVK-021 uygulanır (varsayılan: "içeriklerimi de sil"; "anonim kalsın" seçeneği L-kaydı karara bağlanana kadar KAPALI).
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-HSP-012
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: Kullanıcı verilerini makine tarafından okunabilir biçimde (JSON) dışa aktarabilir; talep kaydı ve süre takibi Ek A17'ye bağlıdır.
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-HSP-013
- Düzey: OLMALI · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: Kamuya açık profil: görünen ad (gerçek ad zorunlu değil), avatar (isteğe bağlı), şehir (isteğe bağlı), değerlendirme sayısı, üyelik ayı. E-posta, telefon ve kesin konum asla herkese açık değildir. Profil gizlilik ayarı: herkese açık / yalnızca değerlendirmelerde ad.
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-HSP-014
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: Yaş: hizmet 18 yaş ve üzerine yöneliktir (varsayılan, hukuki doğrulama L-kaydı); kayıtta beyan alınır.
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._
