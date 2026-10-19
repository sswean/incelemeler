# GUV — Güvenlik

> Ek A'dan otomatik aktarıldı (`node scripts/import-requirements.mjs`). Durumlar `requirements.json` içindedir.

### REQ-GUV-001
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: **Yetkilendirme:** tüm uç noktalarda varsayılan "reddet"; rol + kuruluş kapsamı + sahiplik kontrolleri merkezi policy servisinde; her uç nokta için yetki testi (rol matrisi, REQ-HSP-009); IDOR testleri (başka kullanıcının/kuruluşun kaynağı 404).
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-GUV-002
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: **Girdi doğrulama:** tüm sınır girdileri (gövde, sorgu, başlık, dosya) şema ile doğrulanır; bilinmeyen alanlar reddedilir; uzunluk ve aralık sınırları.
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-GUV-003
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: **Enjeksiyon:** parametreli sorgular; ham SQL yalnızca migration ve incelenmiş sorgu dosyalarında, parametreli; dinamik sıralama/filtre alanları beyaz listeden.
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-GUV-004
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: **XSS:** kullanıcı içeriği düz metin/sınırlı biçim olarak saklanır ve render'da kaçışlanır; zengin metin editör çıktısı şemaya göre (HTML değil, blok JSON); `dangerouslySetInnerHTML` YASAK (yalnızca JSON-LD için güvenli serileştirici, lint istisnası gerekçeli).
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-GUV-005
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: **Güvenlik başlıkları:** sıkı `Content-Security-Policy` (nonce tabanlı script; `frame-ancestors 'none'` panelde), `Strict-Transport-Security` (preload kararı İnsan), `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` (konum yalnızca gerekli sayfada), `Cross-Origin-Opener-Policy`. Başlık testi CI'da.
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-GUV-006
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: **CSRF:** çerez tabanlı oturumda SameSite + Origin kontrolü + token (REQ-HSP-004).
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-GUV-007
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: **SSRF:** sunucunun URL getirdiği her yerde (bağlantı sağlığı, görsel içe aktarma, OG önizleme) yalnızca izinli şemalar (`https`), DNS çözümlemesi sonrası özel/yerel IP aralıkları (IPv4/IPv6, bulut meta veri adresleri) engelli, yönlendirme sayısı sınırlı, zaman aşımı ve boyut sınırı.
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-GUV-008
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: **Dosya yükleme:** imzalı (presigned) yükleme; MIME + sihirli bayt kontrolü; boyut sınırı; görseller yeniden kodlanır (orijinal dosya herkese sunulmaz); EXIF/GPS silinir; SVG kullanıcı yüklemesi YASAK; kötü amaçlı yazılım taraması (X-kaydı; yoksa yalnızca personel yüklemesi + yeniden kodlama); depolama kovası herkese açık listelenemez.
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-GUV-009
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: **Hız sınırları** rota sınıfına göre (kimlik, yazma, arama, yönlendirme, panel) ve kötüye kullanım tespiti; 429 + `Retry-After`.
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-GUV-010
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: **Şifreleme:** iletimde TLS 1.2+; dinlenmede disk/veritabanı şifrelemesi (barındırma sağlayıcısı); hassas alanlar (MFA sırları, doğrulama belgeleri, sağlayıcı kimlik bilgileri) uygulama düzeyinde zarf şifreleme; anahtar rotasyon prosedürü belgeli.
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-GUV-011
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: **Veritabanı rolleri:** uygulama rolü en az yetkili (DDL yok; `audit_log` için yalnızca INSERT); migration rolü ayrı; okuma replikası/raporlama rolü salt okunur.
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-GUV-012
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: **Oturum güvenliği:** parola değişikliği/sıfırlama ve rol değişikliğinde oturum iptali; personel oturumlarında hareketsizlik zaman aşımı; eşzamanlı oturum listesi.
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-GUV-013
- Düzey: ZORUNLU · Faz: 0 · Kaynak: v2 Ek A
- Gereksinim: **Tedarik zinciri:** bağımlılık güvenlik denetimi, sır taraması (gitleaks), SAST (araç ADR), konteyner imajı taraması, lockfile bütünlüğü, lisans denetimi CI'da; Dependabot/Renovate benzeri güncelleme akışı (İnsan onaylı birleştirme).
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-GUV-014
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: **Log güvenliği:** yapılandırılmış JSON log; kişisel veri ve sır maskeleme (§13.1, testli); log enjeksiyonuna karşı kaçışlama; güvenlik olayları (başarısız girişler, yetki reddi, hız sınırı, açık yönlendirme denemesi) ayrı olay türü.
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-GUV-015
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: **Hata yanıtları** iç bilgi sızdırmaz (REQ-MIM-010); üretimde yığın izi yok.
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-GUV-016
- Düzey: OLMALI · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: `/.well-known/security.txt` ve sorumlu açıklama (responsible disclosure) sayfası taslağı.
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-GUV-017
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: Panel ve API için yönetici işlemlerinde step-up (REQ-HSP-007) ve kritik işlemlerin denetim kaydı (REQ-VER-017).
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._
