# GUN — Güven ve moderasyon

> Ek A'dan otomatik aktarıldı (`node scripts/import-requirements.mjs`). Durumlar `requirements.json` içindedir.

### REQ-GUN-001
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: **Moderasyon kuyruğu:** öncelik (risk skoru, bildirim sayısı, hukuki talep), SLA sayaçları (varsayılan: ön moderasyon medyan ≤ 24 saat; hukuki talepler ≤ 24 saat ilk inceleme), hazır gerekçe şablonları (makrolar), toplu işlem, karar başına zorunlu gerekçe kodu, tam denetim kaydı.
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-GUN-002
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: **Bildir (şikâyet) akışı:** her değerlendirme, fotoğraf, soru-cevap, işletme yanıtı ve içerik için "Bildir": neden (sabit liste) + açıklama + (hukuki taleplerde) talep sahibi bilgileri; misafir de bildirebilir (hız sınırlı); bildirim sahibine durum bildirimi (Faz 1: e-posta).
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-GUN-003
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: **İtiraz:** kaldırılan içeriğin sahibi ve bildirimi reddedilen taraf 14 gün içinde bir kez itiraz edebilir; itiraz ilk kararı veren moderatörden **farklı** bir moderatör tarafından incelenir.
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-GUN-004
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: **Sponsor/işletme talebiyle olumsuz değerlendirme silinmez.** Kaldırma yalnızca içerik politikası ihlali, hukuki talep/karar, kullanıcının kendi talebi gerekçeleriyle yapılır; her kaldırmanın gerekçe kodu ve denetim kaydı tutulur; "işletme beğenmedi" bir gerekçe kodu değildir. Sponsor kuruluşa bağlı değerlendirmelerde kaldırma kararı ikinci bir moderatör onayı gerektirir.
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-GUN-005
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: **Hukuki talepler ve bildirim-kaldırma:** `takedown_requests` (talep eden, dayanak, hedef içerik, belge, durum, karar, süreler); mahkeme/idari kararlar ve kişilik hakkı ihlali iddiaları ayrı akış; yanıt süreleri `compliance_config`'ten (5651 ve ilgili mevzuat — Ek D1, doğrulanacak).
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-GUN-006
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: **Fotoğraf moderasyonu:** yüzler (özellikle çocuklar) ve araç plakaları için uyarı/bulanıklaştırma aracı; telif şüphesi; uygunsuz içerik; kullanıcı fotoğraf lisans beyanı (Ek A14.6).
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-GUN-007
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: **Hesap yaptırım basamakları:** uyarı → değerlendirme hakkının geçici kısıtlanması → askıya alma → kalıcı kapatma; her adım gerekçeli ve itiraz edilebilir; toplu sahte değerlendirme tespitinde ilgili değerlendirmeler ortalamadan çıkarılır ve listelemede "Bu sayfada olağan dışı değerlendirme etkinliği tespit edildi; şüpheli değerlendirmeler kaldırıldı" bildirimi (tarihli) gösterilebilir.
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-GUN-008
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: **Bot/spam koruması:** gizlilik dostu CAPTCHA (yalnızca risk sinyalinde; sağlayıcı ve veri aktarımı Ek D1/X-kaydı), hız sınırları, tek kullanımlık e-posta alan adı listesi.
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-GUN-009
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: **Moderatör çıkar çatışması:** moderatör kendi değerlendirmesini, yakını olduğu işletmeyi ya da sponsor ilişkisinde görev aldığı listelemeyi modere edemez (beyan + sistem kontrolü).
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-GUN-010
- Düzey: OLMALI · Faz: 3 · Kaynak: v2 Ek A
- Gereksinim: **Şeffaflık raporu** (yarı yıllık): yayımlanan/kaldırılan değerlendirme sayıları, gerekçe dağılımı, hukuki talep sayıları, itiraz sonuçları — yalnızca gerçek verilerden.
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-GUN-011
- Düzey: ZORUNLU · Faz: 3 · Kaynak: v2 Ek A
- Gereksinim: **İşletme doğrulama ve sahiplenme:** yöntemler (kurumsal e-posta alan adı, işletme telefonuna kod, vergi levhası/ticaret sicil belgesi, sektörel belge — turizm işletme belgesi, rehber ruhsatı); belgeler yalnızca doğrulama personeline görünür, şifreli saklanır, saklama süresi `compliance_config`; "Doğrulanmış işletme" rozeti yalnızca sahiplik doğrulandığında ve anlamı rozet açıklamasında yazılı ("Bu işletmenin temsilcisi kimliğini doğruladı; bu, kalite onayı değildir"). İşletme tarafından gönderilen bilgi/içerik doğrulama ve editoryal onaydan geçmeden yayımlanmaz (v1 §9).
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-GUN-012
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: **Editoryal bağımsızlık güvenlik duvarı:** satış/sponsorluk personeli editör değerlendirmelerini göremez/düzenleyemez (yayından önce); sponsor yayından önce bağımsız incelemeyi onaylayamaz; sponsorlu içerikte sponsorun yayından önce içeriği görüp görmediği açıklamada belirtilir.
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._
