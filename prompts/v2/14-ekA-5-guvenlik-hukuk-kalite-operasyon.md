## A16 — Güvenlik (GUV)

**Hedef seviye:** OWASP ASVS (güncel sürüm) Seviye 2 — Faz 1 sonunda kontrol listesi `docs/security/asvs-l2.md` içinde madde madde (Uygulandı / Kısmen / Yok / Uygulanamaz + kanıt). OWASP Top 10 eşlemesi ayrıca tutulur.

| ID | Düzey · Faz | Gereksinim |
|---|---|---|
| REQ-GUV-001 | ZORUNLU · 1 | **Yetkilendirme:** tüm uç noktalarda varsayılan "reddet"; rol + kuruluş kapsamı + sahiplik kontrolleri merkezi policy servisinde; her uç nokta için yetki testi (rol matrisi, REQ-HSP-009); IDOR testleri (başka kullanıcının/kuruluşun kaynağı 404). |
| REQ-GUV-002 | ZORUNLU · 1 | **Girdi doğrulama:** tüm sınır girdileri (gövde, sorgu, başlık, dosya) şema ile doğrulanır; bilinmeyen alanlar reddedilir; uzunluk ve aralık sınırları. |
| REQ-GUV-003 | ZORUNLU · 1 | **Enjeksiyon:** parametreli sorgular; ham SQL yalnızca migration ve incelenmiş sorgu dosyalarında, parametreli; dinamik sıralama/filtre alanları beyaz listeden. |
| REQ-GUV-004 | ZORUNLU · 1 | **XSS:** kullanıcı içeriği düz metin/sınırlı biçim olarak saklanır ve render'da kaçışlanır; zengin metin editör çıktısı şemaya göre (HTML değil, blok JSON); `dangerouslySetInnerHTML` YASAK (yalnızca JSON-LD için güvenli serileştirici, lint istisnası gerekçeli). |
| REQ-GUV-005 | ZORUNLU · 1 | **Güvenlik başlıkları:** sıkı `Content-Security-Policy` (nonce tabanlı script; `frame-ancestors 'none'` panelde), `Strict-Transport-Security` (preload kararı İnsan), `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` (konum yalnızca gerekli sayfada), `Cross-Origin-Opener-Policy`. Başlık testi CI'da. |
| REQ-GUV-006 | ZORUNLU · 1 | **CSRF:** çerez tabanlı oturumda SameSite + Origin kontrolü + token (REQ-HSP-004). |
| REQ-GUV-007 | ZORUNLU · 1 | **SSRF:** sunucunun URL getirdiği her yerde (bağlantı sağlığı, görsel içe aktarma, OG önizleme) yalnızca izinli şemalar (`https`), DNS çözümlemesi sonrası özel/yerel IP aralıkları (IPv4/IPv6, bulut meta veri adresleri) engelli, yönlendirme sayısı sınırlı, zaman aşımı ve boyut sınırı. |
| REQ-GUV-008 | ZORUNLU · 1 | **Dosya yükleme:** imzalı (presigned) yükleme; MIME + sihirli bayt kontrolü; boyut sınırı; görseller yeniden kodlanır (orijinal dosya herkese sunulmaz); EXIF/GPS silinir; SVG kullanıcı yüklemesi YASAK; kötü amaçlı yazılım taraması (X-kaydı; yoksa yalnızca personel yüklemesi + yeniden kodlama); depolama kovası herkese açık listelenemez. |
| REQ-GUV-009 | ZORUNLU · 1 | **Hız sınırları** rota sınıfına göre (kimlik, yazma, arama, yönlendirme, panel) ve kötüye kullanım tespiti; 429 + `Retry-After`. |
| REQ-GUV-010 | ZORUNLU · 1 | **Şifreleme:** iletimde TLS 1.2+; dinlenmede disk/veritabanı şifrelemesi (barındırma sağlayıcısı); hassas alanlar (MFA sırları, doğrulama belgeleri, sağlayıcı kimlik bilgileri) uygulama düzeyinde zarf şifreleme; anahtar rotasyon prosedürü belgeli. |
| REQ-GUV-011 | ZORUNLU · 1 | **Veritabanı rolleri:** uygulama rolü en az yetkili (DDL yok; `audit_log` için yalnızca INSERT); migration rolü ayrı; okuma replikası/raporlama rolü salt okunur. |
| REQ-GUV-012 | ZORUNLU · 1 | **Oturum güvenliği:** parola değişikliği/sıfırlama ve rol değişikliğinde oturum iptali; personel oturumlarında hareketsizlik zaman aşımı; eşzamanlı oturum listesi. |
| REQ-GUV-013 | ZORUNLU · 0 | **Tedarik zinciri:** bağımlılık güvenlik denetimi, sır taraması (gitleaks), SAST (araç ADR), konteyner imajı taraması, lockfile bütünlüğü, lisans denetimi CI'da; Dependabot/Renovate benzeri güncelleme akışı (İnsan onaylı birleştirme). |
| REQ-GUV-014 | ZORUNLU · 1 | **Log güvenliği:** yapılandırılmış JSON log; kişisel veri ve sır maskeleme (§13.1, testli); log enjeksiyonuna karşı kaçışlama; güvenlik olayları (başarısız girişler, yetki reddi, hız sınırı, açık yönlendirme denemesi) ayrı olay türü. |
| REQ-GUV-015 | ZORUNLU · 1 | **Hata yanıtları** iç bilgi sızdırmaz (REQ-MIM-010); üretimde yığın izi yok. |
| REQ-GUV-016 | OLMALI · 1 | `/.well-known/security.txt` ve sorumlu açıklama (responsible disclosure) sayfası taslağı. |
| REQ-GUV-017 | ZORUNLU · 1 | Panel ve API için yönetici işlemlerinde step-up (REQ-HSP-007) ve kritik işlemlerin denetim kaydı (REQ-VER-017). |

---

## A17 — KVKK, hukuki uyum ve mağaza politikaları (KVK)

> Bu bölüm **teknik altyapıyı** tanımlar. Hangi yükümlülüğün hangi biçimde uygulanacağına hukuk danışmanı/İnsan karar verir (Ç-6). Mevzuata ilişkin süre, eşik ve metinler `compliance_config` içinde, kaynak ve doğrulama tarihiyle tutulur (§13.3). Doğrulanması gereken mevzuat listesi Ek D1'dedir.

### A17.1 Roller ve envanterler

- **Rol haritası** (`docs/legal/rol-haritasi.md`): platformun veri sorumlusu olarak rolü; kullanıcı içerikleri bakımından yer sağlayıcı/içerik sağlayıcı ayrımı; sponsorlu içerikte reklam yayıncısı rolü; işletme başvurularında karşı taraf.
- **İşleme envanteri** (`docs/legal/isleme-envanteri.md`): her işleme faaliyeti için veri kategorileri, amaç, **önerilen hukuki sebep (doğrulanacak)**, saklama süresi, alıcılar/aktarımlar. Başlangıç satırları: üyelik ve oturum; güvenlik ve trafik logları; değerlendirme yayını; doğrulama kanıtı; bülten/pazarlama; kişiselleştirme ve hedefli yerleşim; analitik; konum ("yakınımda"); işletme başvurusu ve doğrulama; hukuki talep ve şikâyet kayıtları; teklif talebi (Faz 3).
- **Aktarım envanteri** (`processor_inventory`): her dış hizmet (barındırma, CDN, e-posta, analitik, hata izleme, push, harita, CAPTCHA) için sağlayıcı, veri kategorileri, ülke/bölge, aktarım dayanağı (doğrulanacak), sözleşme durumu. **Yurt dışına kişisel veri aktaran bir hizmet, envanterde aktarım dayanağı "onaylandı" olmadan üretimde etkinleştirilmez** (hukuki kapı; barındırma bölgesi seçimi C sınıfı karar).

### A17.2 Aydınlatma ve açık rıza

| ID | Düzey · Faz | Gereksinim |
|---|---|---|
| REQ-KVK-001 | ZORUNLU · 1 | Aydınlatma metni ve açık rıza metni **ayrı belgeler ve ayrı arayüz eylemleridir**; aydınlatma "okudum" beyanı/bağlantıyla; açık rıza her amaç için ayrı, önceden işaretlenmemiş onay kutusu. |
| REQ-KVK-002 | ZORUNLU · 1 | Açık rıza yalnızca başka hukuki sebebin bulunmadığı işlemelerde istenir ve üyelik, değerlendirme yazma ya da temel hizmet şartına **bağlanmaz**; rıza vermeyen kullanıcı temel hizmeti aynen kullanır (E2E). |
| REQ-KVK-003 | ZORUNLU · 1 | `consent_records`: kullanıcı ya da anonim kimlik, amaç, metin sürümü, kanal (web/iOS/Android), durum (verildi/geri alındı), zaman, IP karması. Rıza verildiği kadar kolay geri alınır (ayarlarda tek eylem). |
| REQ-KVK-004 | ZORUNLU · 1 | `legal_document_versions` (tür, sürüm, yürürlük tarihi, içerik özeti/hash, onaylayan hukukçu, onay tarihi) ve `legal_acceptances`; esaslı değişiklikte bir sonraki girişte yeniden kabul; onaylayan hukukçu alanı boş metin üretimde yayımlanırsa sayfada "TASLAK" uyarısı görünür ve dağıtım kontrol listesinde kırmızı madde olur. |

### A17.3 Çerez ve izleme onayı (web + mobil SDK'lar)

| ID | Düzey · Faz | Gereksinim |
|---|---|---|
| REQ-KVK-010 | ZORUNLU · 1 | Kategoriler: zorunlu (oturum, CSRF, yük dengeleme, onay tercihinin kendisi), işlevsel, analitik, pazarlama/kişiselleştirme. Yalnızca zorunlu olanlar onaysız yüklenir. |
| REQ-KVK-011 | ZORUNLU · 1 | İlk ziyaret bandında **"Tümünü kabul et"**, **"Tümünü reddet"**, **"Tercihleri yönet"** aynı boyut, stil ve katmanda; kategoriler önceden işaretli değil; içeriği engelleyen çerez duvarı YASAK. |
| REQ-KVK-012 | ZORUNLU · 1 | Onay alınana kadar hiçbir analitik/pazarlama script'i, pikseli ya da SDK'sı **yüklenmez** ("yükle ama gönderme" modu yeterli değildir). Onay geri alındığında ilgili çerezler silinir. Tercih merkezine footer'dan ve uygulama ayarlarından tek tıkla ulaşılır. |
| REQ-KVK-013 | ZORUNLU · 1 | Sponsorluk ve dış yönlendirme sayımları için birinci taraf, sunucu tarafı, çerezsiz ve kişisel veri içermeyen sayaç (A8, A9); kullanıcı düzeyinde atıf/yeniden hedefleme yalnızca pazarlama onayıyla. |
| REQ-KVK-014 | ZORUNLU · 1 | **Kabul testleri (E2E-016):** (a) temiz profilde ilk yüklemede yalnızca zorunlu çerezler ve üçüncü taraf analitik isteği yok; (b) "Tümünü reddet" sonrası 3 sayfa gezinmede aynı; (c) yalnızca "Analitik" kabulünde yalnızca analitik istekleri başlar; (d) geri almada çerezler silinir. |

### A17.4 Hesap silme, ilgili kişi başvuruları, saklama ve imha

| ID | Düzey · Faz | Gereksinim |
|---|---|---|
| REQ-KVK-020 | ZORUNLU · 1 | Hesap silme yolları: Profil → Ayarlar → "Hesabımı sil" (≤ 3 adım) ve herkese açık `/hesap-silme` sayfası (girişsiz talep, e-posta doğrulamalı; mağaza formlarında bu URL kullanılır). "E-posta atın" tipi akış kabul edilmez. |
| REQ-KVK-021 | ZORUNLU · 1 | Silme sonucu: hesap, profil, favoriler, koleksiyonlar, tercihler, push token'ları, pazarlama verileri silinir; değerlendirmeler/fotoğraflar için seçenek ("içeriklerimi de sil" varsayılan / "anonim kalsın") — ikinci seçenek hukuki karara bağlı; yasal saklama gerektiren kayıtlar erişimi kısıtlı arşive ayrılır ve süre sonunda imha edilir; kullanıcıya silinen/saklanan veri türleri ve süreler gösterilir. Tamamlanma süresi `compliance_config.accountDeletionDays` (varsayılan 30). |
| REQ-KVK-022 | ZORUNLU · 1 | `data_subject_requests`: web formu (`/kvkk-basvuru`), uygulama içi form ve diğer kanallardan gelen başvuruların manuel kaydı; türler: bilgi, erişim/kopya, düzeltme, silme, itiraz, zarar giderimi; kimlik doğrulaması oturum ya da kayıtlı e-postayla (gereksiz kimlik verisi istenmez); yanıt süresi sayacı `compliance_config`'ten (doğrulanacak; varsayılan 30 gün) ve 20./27. gün uyarıları; gerekçeli ret şablonu; panel raporunda süresi geçen başvuru 0 değilse kırmızı alarm. |
| REQ-KVK-023 | ZORUNLU · 1 | **Saklama ve imha politikası:** her veri kategorisi için azami süre ve imha yöntemi (silme/anonimleştirme); periyodik imha işi (aralığı mevzuattaki üst sınırı aşmaz — doğrulanacak), imha kaydı; yedeklerde imha planı. |
| REQ-KVK-024 | ZORUNLU · 1 | **Veri ihlali müdahale planı** (`docs/legal/ihlal-mudahale-plani.md`, TASLAK): tespit → sınırlama → etki analizi → bildirim kararı (süre `compliance_config`'ten; doğrulanacak) → ilgili kişilere bildirim → kök neden; `breach_incidents` kaydı; yılda bir masa başı tatbikatı. |
| REQ-KVK-025 | ZORUNLU · 1 | **Veri minimizasyonu:** ham IP en fazla güvenlik/hukuki yükümlülük süresince ve erişim kısıtlı; analitikte karma/kısaltma; kesin konum sunucuda saklanmaz; doğrulama belgeleri doğrulamadan sonra silinir; kullanıcı profillerinde gereksiz alan yok. |
| REQ-KVK-026 | ZORUNLU · 1 | **Yaş:** 18 yaş altına yönelik değil (varsayılan; L-kaydı); kayıtta beyan. |

### A17.5 Ticari elektronik ileti

| Tür | Örnek | Onay | Merkezi izin sistemi (İYS) | Ret |
|---|---|---|---|---|
| İşlemsel/hizmet | doğrulama, parola sıfırlama, değerlendirme durumu, hesap silme teyidi | gerekmez | hayır | — |
| Editoryal bildirim (ticari öğe yok) | takip edilen şehirde yeni rehber | uygulama içi tercih | hukuki teyit | tercih ekranı |
| Ticari (bireysel alıcı) | bülten, fırsat, sponsorlu içerik, kampanya push'u | **önceden açık onay** | e-posta/SMS için evet (doğrulanacak; push için doğrulanacak) | her iletide tek tık ret |
| Ticari (tacir/esnaf alıcı) | işletmelere sponsorluk teklifi | hukuki teyit | kayıt + ret kontrolü (doğrulanacak) | her iletide ret |

- İşlemsel iletiye sponsorlu/kampanya içeriği eklenmez (eklenirse ileti ticari sayılır).
- Bülten kaydında çift aşamalı onay; onay kaydı: kanal, adres, metin sürümü, kaynak, zaman, IP karması.
- İzin sistemi entegrasyonu `ConsentSyncPort` arkasında; hesap yoksa MOCK + X-kaydı; ret senkronizasyon süresi `compliance_config`'te (doğrulanacak).
- **Push:** işletim sistemi bildirim izni ≠ ticari ileti onayı. Ayrı anahtarlar: "Hizmet bildirimleri" (varsayılan açık) ve "Fırsatlar ve sponsorlu öneriler" (varsayılan **kapalı**, açık onay metniyle).

### A17.6 Kullanıcı içeriği, kaldırma ve fikri mülkiyet

- UGC için bildirim-kaldırma iş akışı (REQ-GUN-005), trafik/log saklama yükümlülükleri (süre `compliance_config`, doğrulanacak), hakaret/kişilik hakkı risklerine karşı topluluk kuralları ve moderasyon.
- Kullanıcı fotoğrafları için lisans beyanı (A14.6); telif bildirimi formu; marka adlarının karşılaştırmalı içerikte kullanımı (logo kullanımı için izin; nominatif kullanım kuralları hukuki incelemede).

### A17.7 Sektörel lisans ve kısıtlar (hukuki kapılar)

- **Konaklama:** belge numarası alanı ve gösterimi; belgesi doğrulanmamış konaklama listelemesinin yayımlanmaması (varsayılan, L-kaydı ile kesinleşir); kaldırma talebine hızlı yanıt.
- **Turist rehberi:** ruhsat doğrulaması olmadan "rehberlik hizmeti" sunan profil yayımlanmaz.
- **Tur/paket satışı, platform içi rezervasyon ve ödeme:** kapsam dışı; yalnızca dış yönlendirme.
- **Kısıtlı reklam kategorileri:** sağlık/ilaç/takviye, alkol, tütün, bahis/şans oyunları, finansal ürünler — sponsorluk varsayılan kapalı.
- **Sağlık beyanı içeren değerlendirmeler** moderasyona düşer (REQ-GUN-001).

### A17.8 Mağaza politikaları (Faz 2 çıkış kapısı)

Uygulama içi hesap silme; üçüncü taraf girişle birlikte gizlilik odaklı eşdeğer giriş seçeneği (Apple ile giriş); UGC gereksinimleri (bildir, engelle, filtrele, iletişim bilgisi); gizlilik etiketleri/manifest ve Veri güvenliği formu; **mobil uygulama içinde sponsorluk/reklam paketi satışı yapılmaz** (dijital mal/uygulama içi satın alma kuralları riskini önlemek için; satış yalnızca web/sözleşme üzerinden, L-kaydı). Güncel madde numaraları ve metinler Faz 2 başında birincil kaynaktan doğrulanır.

### A17.9 `docs/legal/` çıktıları (her biri "TASLAK — Hukukçu onayı olmadan yayına alınamaz" damgalı ve sürümlü)

1 Gizlilik politikası · 2 Aydınlatma metinleri (işleme faaliyeti başına) · 3 Açık rıza metinleri (amaç başına) · 4 Çerez politikası · 5 Kullanım koşulları · 6 Topluluk ve değerlendirme kuralları · 7 Sponsorlu içerik ve affiliate açıklama politikası · 8 Editoryal bağımsızlık ve düzeltme politikası · 9 İşletme koşulları · 10 Reklamveren koşulları · 11 Saklama ve imha politikası · 12 İhlal müdahale planı · 13 İlgili kişi başvuru prosedürü · 14 Bildirim-kaldırma prosedürü · 15 Künye/hizmet sağlayıcı bilgileri · 16 Erişilebilirlik beyanı · 17 İşleme envanteri · 18 Aktarım envanteri · 19 Rol haritası.

---

## A18 — Erişilebilirlik ve performans (ERS / PRF)

### A18.1 Erişilebilirlik

| ID | Düzey · Faz | Gereksinim |
|---|---|---|
| REQ-ERS-001 | ZORUNLU · 1 | Hedef: **WCAG 2.2 AA** (web + panel); Türkiye'deki güncel erişilebilirlik düzenlemeleri doğrulanır (Ek D1). |
| REQ-ERS-002 | ZORUNLU · 1 | Otomatik denetim (axe-core) her E2E sayfa ziyaretinde; **ciddi/kritik ihlal sayısı 0** (CI kırmızı). |
| REQ-ERS-003 | ZORUNLU · 1 | Klavye ile tam kullanım: görünür odak halkası (token), mantıklı odak sırası, "İçeriğe atla" bağlantısı, modal/bottom sheet'te odak tuzağı ve Esc ile kapanma, menü ve combobox ARIA kalıpları. |
| REQ-ERS-004 | ZORUNLU · 1 | Anlamlı HTML: tek `h1`, başlık hiyerarşisi, landmark'lar, liste/tablo semantiği, form etiketleri, hata mesajlarının alanla ilişkilendirilmesi (`aria-describedby`) ve canlı bölgeyle duyurulması. |
| REQ-ERS-005 | ZORUNLU · 1 | Renk kontrastı token düzeyinde testli (A14.2); bilgi yalnızca renkle verilmez. |
| REQ-ERS-006 | ZORUNLU · 1 | **Puan bileşenleri:** görsel yıldızlar `aria-hidden`; metin alternatifi "5 üzerinden 4,3 puan, 128 değerlendirme"; puan girişi radyo grubu olarak klavye ve ekran okuyucuyla kullanılabilir. |
| REQ-ERS-007 | ZORUNLU · 1 | **Harita:** harita içeriğinin eşdeğeri liste olarak erişilebilir; harita kontrolleri klavyeyle kullanılabilir ya da atlanabilir. **Karusel:** otomatik oynatma yok; önceki/sonraki butonları etiketli. |
| REQ-ERS-008 | ZORUNLU · 1 | Dokunma hedefleri ≥ 24×24 CSS px (WCAG 2.2 asgari) ve birincil eylemlerde ≥ 44×44; 320 px genişlikte ve %200 yakınlaştırmada yatay kaydırma yok; `prefers-reduced-motion` desteği. |
| REQ-ERS-009 | ZORUNLU · 1 | Görsellerde anlamlı Türkçe alt metin (yönetim panelinde ZORUNLU alan); dekoratif görselde boş alt. |
| REQ-ERS-010 | ZORUNLU · 1 | Ekran okuyucuyla (VoiceOver, TalkBack, NVDA) kritik akışların uçtan uca kontrolü `M` yöntemli, `MANUAL-QA` içinde. |

### A18.2 Performans

| ID | Düzey · Faz | Gereksinim |
|---|---|---|
| REQ-PRF-001 | ZORUNLU · 1 | **Core Web Vitals hedefleri** (saha, 75. yüzdelik; eşikler doğrulanır): LCP ≤ 2,5 sn, INP ≤ 200 ms, CLS ≤ 0,1. Saha ölçümü yalnızca üretimde ve `M`/`A` yöntemli. |
| REQ-PRF-002 | ZORUNLU · 1 | **Laboratuvar bütçeleri (Lighthouse CI, mobil profil, pilot şablonlar: ana sayfa, hub, listeleme detay, içerik, arama):** Performans ≥ 85, Erişilebilirlik ≥ 95, SEO ≥ 95, En iyi uygulamalar ≥ 95; ilk yükleme JS (gzip) ≤ 170 KB sayfa başına (ana sayfa hariç kritik şablonlar); LCP görseli öncelikli yüklenir. Araç ve koşullar raporlanır. |
| REQ-PRF-003 | ZORUNLU · 1 | Görsel optimizasyonu: responsive `srcset`/`sizes`, modern formatlar, `width/height`, ekran dışı görsellerde lazy loading, CDN önbelleği. |
| REQ-PRF-004 | ZORUNLU · 1 | Gereksiz JavaScript azaltılır: sunucu bileşenleri varsayılan; istemci bileşenleri yalnızca etkileşimde; üçüncü taraf script'ler rızaya bağlı ve ertelenmiş; paket analizi CI'da raporlanır. |
| REQ-PRF-005 | ZORUNLU · 1 | **API bütçeleri** (laboratuvar; 50.000 listeleme + 5.000 içerik + 200.000 değerlendirme tohum verisi): okuma uç noktaları p95 < 200 ms, arama p95 < 300 ms, yazma p95 < 400 ms, `/git/` p95 < 50 ms; yük testi senaryosu (araç ADR) Faz 1 sonunda; N+1 sorgu tespiti testlerde. |
| REQ-PRF-006 | ZORUNLU · 1 | Önbellekleme stratejisi ADR-0009'da: CDN (statik + ISR), uygulama düzeyi (gerekirse), HTTP önbellek başlıkları; geçersiz kılma REQ-MIM-014. |
| REQ-PRF-007 | ZORUNLU · 1 | Uzun listelerde cursor sayfalama ve "Daha fazla yükle" (SEO için bağlantılı sayfalar da üretilir); sonsuz kaydırmada footer'a erişim engellenmez. |
| REQ-PRF-008 | ZORUNLU · 1 | Gereksiz animasyon, pahalı görsel efekt ve onlarca bağımsız kütüphane YASAK (§13.2). |

---

## A19 — Analitik ve ölçüm (ANL)

| ID | Düzey · Faz | Gereksinim |
|---|---|---|
| REQ-ANL-001 | ZORUNLU · 1 | **Birinci taraf olay hattı** (`analytics_events`, aylık bölümlü) + rızaya bağlı istemci olayları; üçüncü taraf analitik aracı kullanılacaksa rızaya bağlı yüklenir ve aktarım envanterine girer (ADR + L-kaydı). |
| REQ-ANL-002 | ZORUNLU · 1 | **Olay sözlüğü** (`docs/analytics/olay-sozlugu.md`): ad, tetiklenme anı, özellikler, kişisel veri içerip içermediği, rıza gereksinimi, saklama süresi. Başlangıç olayları (v1 §18): `search_performed`, `category_viewed`, `listing_viewed`, `content_viewed`, `sponsored_impression` (görüntülenen tanımıyla), `sponsored_click`, `affiliate_click`, `outbound_click` (telefon/web/yol tarifi/mesaj/rezervasyon), `favorite_added`, `review_submitted`, `review_published`, `business_application_created`, `ad_application_created`, `provider_redirected`, `newsletter_subscribed`, `consent_changed`, `zero_result_search`. |
| REQ-ANL-003 | ZORUNLU · 1 | Sponsorluk/yönlendirme sayımları (A8, A9) rızadan bağımsız, çerezsiz, toplulaştırılmış ve kişisel veri içermez; davranışsal analitik rızaya bağlıdır. |
| REQ-ANL-004 | ZORUNLU · 1 | **Panolar (yönetim paneli, yalnızca gerçek veri; veri yoksa "Veri yok"):** aktif kullanıcılar (rızalı ölçüm), organik trafik (arama motoru araçlarından içe aktarma ya da giriş sayfası referansı), kategori bazında içerik performansı, sponsorlu gösterim ve tıklamalar, affiliate/dış yönlendirmeler, en çok aranan ve sonuçsuz aramalar, içerik tazelik durumu, işletme ve reklamveren başvuruları, moderasyon SLA'ları, kuzey yıldızı ve sınır metrikleri (§6.3). Her panoda veri tazeliği zaman damgası. |
| REQ-ANL-005 | ZORUNLU · 1 | Bot ve personel trafiği ayıklanır; demo/sentetik olaylar raporlara girmez. |
| REQ-ANL-006 | ZORUNLU · 1 | Kişisel veriler gereksiz yere toplanmaz; kullanıcı düzeyi olay verisi saklama süresi `compliance_config` (varsayılan ≤ 14 ay), sonra toplulaştırılıp silinir. |

---

## A20 — Altyapı, dağıtım ve operasyon (OPS)

| ID | Düzey · Faz | Gereksinim |
|---|---|---|
| REQ-OPS-001 | ZORUNLU · 0 | **Ortamlar:** yerel (Docker Compose), CI, PR önizleme (İSTEĞE BAĞLI), staging (üretime benzer, `noindex`, temel kimlik doğrulamalı), üretim. Ortam başına ayrı veritabanı, depolama, sırlar. |
| REQ-OPS-002 | ZORUNLU · 0 | **CI aşamaları:** kurulum (önbellekli) → lint + format → typecheck → birim → entegrasyon (gerçek PostgreSQL konteyneri) → build → OpenAPI fark kontrolü → E2E (web/admin) → erişilebilirlik → Lighthouse CI (Faz 1) → sır/lisans/bağımlılık/SAST taramaları → `req:check`. PR'larda zorunlu kontroller. |
| REQ-OPS-003 | ZORUNLU · 1 | **Barındırma önerisi** ADR'de seçenek karşılaştırmasıyla (yönetilen PostgreSQL + konteyner/uygulama platformu + S3 uyumlu depolama + CDN/WAF); **veri yerleşimi (Türkiye içi / AB) KVKK aktarım kuralları nedeniyle C sınıfı İnsan kararıdır**; karar verilene kadar dağıtım yapılmaz. Altyapı kodu (IaC) taslağı İSTEĞE BAĞLI Faz 1. |
| REQ-OPS-004 | ZORUNLU · 1 | **Sıfır kesintili dağıtım** ve migration güvenliği (REQ-VER-022); geri alma planı (önceki imaj + geriye uyumlu şema). |
| REQ-OPS-005 | ZORUNLU · 1 | **Yedekleme:** yönetilen veritabanı otomatik yedek + zaman noktasına geri dönüş; hedefler (varsayılan, B sınıfı): **RPO ≤ 15 dk, RTO ≤ 4 saat**; nesne depolama sürümleme; **geri yükleme tatbikatı** her faz kapısında staging'de (komut ve süre raporlanır); yedekler şifreli ve ayrı hesap/bölgede (aktarım kuralları dikkate alınarak). |
| REQ-OPS-006 | ZORUNLU · 1 | **Gözlemlenebilirlik:** yapılandırılmış loglar (merkezi), dağıtık izleme (OpenTelemetry), hata izleme (web/API/mobil; kaynak haritaları), metrikler (istek oranı, hata oranı, gecikme, kuyruk derinliği, outbox gecikmesi), uptime kontrolleri; uyarılar (hata oranı > %2 / 5 dk, p95 bütçe aşımı / 10 dk, outbox gecikmesi > 5 dk, sertifika süresi < 14 gün, disk > %80). Sağlayıcılar aktarım envanterine girer. |
| REQ-OPS-007 | OLMALI · 1 | **SLO'lar** (varsayılan): herkese açık site kullanılabilirliği aylık %99,5; `/git/` yönlendirme %99,9; hata bütçesi politikası. |
| REQ-OPS-008 | ZORUNLU · 1 | **Runbook'lar** (`docs/ops/`): dağıtım, geri alma, veritabanı geri yükleme, sır rotasyonu, olay müdahalesi, veri ihlali (REQ-KVK-024), kampanya acil durdurma ("tüm sponsorlu yerleşimleri kapat" anahtarı), moderasyon yığılması. |
| REQ-OPS-009 | ZORUNLU · 1 | **Bakım ve özellik anahtarları:** bakım modu sayfası; sponsorlu yerleşimler, değerlendirme gönderimi, kayıt ve dış entegrasyonlar için acil kapatma anahtarları (panelden, denetim kayıtlı). |
| REQ-OPS-010 | ZORUNLU · 1 | **Üretime geçiş kontrol listesi** (`docs/ops/canliya-gecis.md`): hukuki metin onayları, `legalGate` durumları, aktarım envanteri, DNS/TLS, güvenlik başlıkları, yedek + geri yükleme testi, izleme/uyarılar, arama motoru araçları, robots/sitemap, analitik rıza testi, demo verinin yokluğu, MOCK'ların yokluğu, performans bütçeleri, erişilebilirlik raporu, destek/iletişim kanalları. Geçiş C sınıfıdır. |

---

## A21 — Test stratejisi (TST)

| ID | Düzey · Faz | Gereksinim |
|---|---|---|
| REQ-TST-001 | ZORUNLU · 0 | **Test piramidi ve araçlar** ADR-0008'de: birim (ör. Vitest/Jest), API entegrasyon (gerçek PostgreSQL konteyneriyle, ör. Testcontainers), sözleşme testleri (OpenAPI şemasına karşı; sağlayıcı adaptörleri için), E2E (Playwright — web + panel), erişilebilirlik (axe), görsel regresyon (Storybook), Lighthouse CI, yük testi, mobil E2E (Faz 2; Maestro/Detox). |
| REQ-TST-002 | ZORUNLU · 1 | **Kapsam eşikleri** (anlamlı modüllerde; düşürülemez): `utils` (normalizeTr, slugifyTr, para/tarih, Bayes) ≥ %95 satır; `reviews`, `ads`, `commerce`, `access`, `compliance` modülleri ≥ %85 dal; genel ≥ %70. |
| REQ-TST-003 | ZORUNLU · 1 | **Kritik test kategorileri (v1 §20'nin tamamı):** birim, API entegrasyon, kritik akış E2E, rol ve izin testleri, ticari etiket görünürlük testleri, dış yönlendirme güvenlik testleri, arama ve filtre testleri (korpus), mobil ekran uyumluluğu (görünüm alanları: 360×800, 390×844, 768×1024, 1280×800, 1920×1080; yatay kaydırma yok), form doğrulama testleri, boş veri ve hata durumu testleri, SEO meta testleri, migration testleri (boş veritabanı + önceki sürümden yükseltme), performans kontrolleri. |
| REQ-TST-004 | ZORUNLU · 1 | **Deterministik test verisi:** testler kendi fabrikalarıyla veri üretir; seed'e bağımlı E2E'ler izole veritabanında; zaman, rastgelelik ve saat dilimi testlerde sabitlenir (`Europe/Istanbul` sınır durumları: gece yarısını aşan saatler, bayram istisnaları). |
| REQ-TST-005 | ZORUNLU · 1 | Ek B'deki E2E senaryoları REQ kimlikleriyle eşlenir ve CI'da çalışır; faz kapısında art arda 3 yeşil koşu. |
| REQ-TST-006 | ZORUNLU · 1 | Test ortamında kullanılan örnek veriler demo olarak işaretlidir (§12.4); gerçekte yapılmamış testler için başarılı rapor üretilmez (AK-01). |

---

## A22 — Gelir modeli ve ticari sıralama (GLR → SPN/AFF/ISL REQ'leriyle izlenir)

Platformun iş modeli yalnızca reklama dayanmaz. Her gelir modelinin uygulanabilirliği ilgili sağlayıcının ticari şartlarına, sözleşmelere ve mevzuata bağlıdır; desteklenmeyen bir model tamamlanmış özellik gibi gösterilmez.

| # | Gelir kaynağı (v1 §15) | Yazılım karşılığı | Faz | Ön koşul |
|---|---|---|---|---|
| 1 | Sponsorlu içerikler | A8 sponsorlu içerik + kampanya kaydı (yönetici) | 1 | Sözleşme ve fatura süreçleri İnsan'da (manuel) |
| 2 | Sponsorlu listeleme/yerleşim | A8 yuva + yerleşim + ölçüm | 1 | Etiket metinleri hukuki onayı |
| 3 | Affiliate gelirleri | A9 dış yönlendirme + alt kimlik + (varsa) dönüşüm içe aktarma | 1 (bağlantı), 3 (dönüşüm) | Program başvurusu ve kabulü (C sınıfı), program şartlarının doğrulanması |
| 4 | İşletme paketleri | A11 paket tanımları + işletme portalı | 3 | Paket içeriğinin AK-04 ile uyumu; ödeme kapsam dışı (manuel fatura) |
| 5 | Rezervasyon ve talep yönlendirme | A9 parametreli yönlendirme; teklif talebi (Faz 3) | 1 / 3 | Ortaklık sözleşmesi; lead aktarımı için KVKK dayanağı |
| 6 | Marka kampanyaları (şehir, sezon, kategori) | A8 kampanya + koleksiyon sayfaları + sponsorlu içerik serisi | 1 | — |
| 7 | Reklam alanları (reklam ağı) | — | Kapsam dışı | Ayrı İnsan kararı; rıza ve performans etkisi değerlendirmesi |

- İşletme paketleri, fiyatlandırma (alanlar; fiyat değerlerini İnsan girer) ve kampanya performansı yönetim panelinden idare edilir.
- **Ticari sıralama ilkesi:** Ücret yalnızca açıkça etiketli **yuvalara** erişim sağlar; organik sonuçlarda, puanlarda, değerlendirme görünürlüğünde ve editoryal listelerde hiçbir etkisi yoktur (AK-04; REQ-ARA-009, REQ-SPN-002, REQ-DEG-002 testleri).
- Fatura (e-Fatura/e-Arşiv) ve tahsilat kapsam dışıdır; yalnızca `InvoicingPort`/`PaymentPort` arayüzleri tanımlanır (ödeme kuruluşu ve mali müşavir seçimi İnsan kararı, Ek D2).
