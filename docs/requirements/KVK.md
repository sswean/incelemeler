# KVK — Kişisel veri ve hukuk

> Ek A'dan otomatik aktarıldı (`node scripts/import-requirements.mjs`). Durumlar `requirements.json` içindedir.

### REQ-KVK-001
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: Aydınlatma metni ve açık rıza metni **ayrı belgeler ve ayrı arayüz eylemleridir**; aydınlatma "okudum" beyanı/bağlantıyla; açık rıza her amaç için ayrı, önceden işaretlenmemiş onay kutusu.
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-KVK-002
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: Açık rıza yalnızca başka hukuki sebebin bulunmadığı işlemelerde istenir ve üyelik, değerlendirme yazma ya da temel hizmet şartına **bağlanmaz**; rıza vermeyen kullanıcı temel hizmeti aynen kullanır (E2E).
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-KVK-003
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: `consent_records`: kullanıcı ya da anonim kimlik, amaç, metin sürümü, kanal (web/iOS/Android), durum (verildi/geri alındı), zaman, IP karması. Rıza verildiği kadar kolay geri alınır (ayarlarda tek eylem).
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-KVK-004
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: `legal_document_versions` (tür, sürüm, yürürlük tarihi, içerik özeti/hash, onaylayan hukukçu, onay tarihi) ve `legal_acceptances`; esaslı değişiklikte bir sonraki girişte yeniden kabul; onaylayan hukukçu alanı boş metin üretimde yayımlanırsa sayfada "TASLAK" uyarısı görünür ve dağıtım kontrol listesinde kırmızı madde olur.
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-KVK-010
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: Kategoriler: zorunlu (oturum, CSRF, yük dengeleme, onay tercihinin kendisi), işlevsel, analitik, pazarlama/kişiselleştirme. Yalnızca zorunlu olanlar onaysız yüklenir.
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-KVK-011
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: İlk ziyaret bandında **"Tümünü kabul et"**, **"Tümünü reddet"**, **"Tercihleri yönet"** aynı boyut, stil ve katmanda; kategoriler önceden işaretli değil; içeriği engelleyen çerez duvarı YASAK.
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-KVK-012
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: Onay alınana kadar hiçbir analitik/pazarlama script'i, pikseli ya da SDK'sı **yüklenmez** ("yükle ama gönderme" modu yeterli değildir). Onay geri alındığında ilgili çerezler silinir. Tercih merkezine footer'dan ve uygulama ayarlarından tek tıkla ulaşılır.
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-KVK-013
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: Sponsorluk ve dış yönlendirme sayımları için birinci taraf, sunucu tarafı, çerezsiz ve kişisel veri içermeyen sayaç (A8, A9); kullanıcı düzeyinde atıf/yeniden hedefleme yalnızca pazarlama onayıyla.
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-KVK-014
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: **Kabul testleri (E2E-016):** (a) temiz profilde ilk yüklemede yalnızca zorunlu çerezler ve üçüncü taraf analitik isteği yok; (b) "Tümünü reddet" sonrası 3 sayfa gezinmede aynı; (c) yalnızca "Analitik" kabulünde yalnızca analitik istekleri başlar; (d) geri almada çerezler silinir.
- Kabul kriterleri: (a) temiz profilde ilk yüklemede yalnızca zorunlu çerezler ve üçüncü taraf analitik isteği yok; (b) "Tümünü reddet" sonrası 3 sayfa gezinmede aynı; (c) yalnızca "Analitik" kabulünde yalnızca analitik istekleri başlar; (d) geri almada çerezler silinir.

### REQ-KVK-020
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: Hesap silme yolları: Profil → Hesap → "Hesabımı sil" (≤ 3 adım) ve herkese açık `/hesap-silme` sayfası (girişsiz talep, e-posta doğrulamalı; mağaza formlarında bu URL kullanılır). "E-posta atın" tipi akış kabul edilmez.
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-KVK-021
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: Silme sonucu: hesap, profil, favoriler, koleksiyonlar, tercihler, push token'ları, pazarlama verileri silinir; değerlendirmeler/fotoğraflar için seçenek ("içeriklerimi de sil" varsayılan / "anonim kalsın" — L-kaydı karara bağlanana kadar KAPALI); yasal saklama gerektiren kayıtlar erişimi kısıtlı arşive ayrılır ve süre sonunda imha edilir; kullanıcıya silinen/saklanan veri türleri ve süreler gösterilir. Tamamlanma süresi `compliance_config.accountDeletionDays` (varsayılan 30).
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-KVK-022
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: `data_subject_requests`: web formu (`/kvkk-basvuru`), uygulama içi form ve diğer kanallardan gelen başvuruların manuel kaydı; türler: bilgi, erişim/kopya, düzeltme, silme, itiraz, zarar giderimi; kimlik doğrulaması oturum ya da kayıtlı e-postayla (gereksiz kimlik verisi istenmez); yanıt süresi sayacı `compliance_config`'ten (doğrulanacak; varsayılan 30 gün) ve 20./27. gün uyarıları; gerekçeli ret şablonu; panel raporunda süresi geçen başvuru 0 değilse kırmızı alarm.
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-KVK-023
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: **Saklama ve imha politikası:** her veri kategorisi için azami süre ve imha yöntemi (silme/anonimleştirme); periyodik imha işi (aralığı mevzuattaki üst sınırı aşmaz — doğrulanacak), imha kaydı; yedeklerde imha planı.
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-KVK-024
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: **Veri ihlali müdahale planı** (`docs/legal/ihlal-mudahale-plani.md`, TASLAK): tespit → sınırlama → etki analizi → bildirim kararı (süre `compliance_config`'ten; doğrulanacak) → ilgili kişilere bildirim → kök neden; `breach_incidents` kaydı; yılda bir masa başı tatbikatı.
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-KVK-025
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: **Veri minimizasyonu:** ham IP en fazla güvenlik/hukuki yükümlülük süresince ve erişim kısıtlı; analitikte karma/kısaltma; kesin konum sunucuda saklanmaz; doğrulama belgeleri doğrulamadan sonra silinir; kullanıcı profillerinde gereksiz alan yok.
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-KVK-026
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: **Yaş:** 18 yaş altına yönelik değil (varsayılan; L-kaydı); kayıtta beyan.
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._
