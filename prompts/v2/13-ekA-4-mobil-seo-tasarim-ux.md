## A12 — Mobil uygulama: iOS ve Android (MOB) — Faz 2

Mobil uygulama web sitesinin küçültülmüş kopyası gibi hissettirmez; mobil kullanım alışkanlıklarına göre tasarlanır. Web ile **aynı API'yi**, aynı tasarım token'larını, aynı i18n kataloğunu ve aynı yol tablosunu (`packages/routes`) kullanır.

### A12.1 Bilgi mimarisi

Alt navigasyon (5 sekme):
1. **Keşfet** — kişiselleştirilebilir akış (şehir seçimi, kategori kutucukları, editörün seçtikleri, sezonluk seçkiler, yakınında — izinliyse).
2. **Ara** — tüm türlerde arama; son aramalar (cihazda); filtre bottom sheet'i; liste/harita geçişi.
3. **Harita** — yakındaki listelemeler ve ilgi noktaları; kümelenme; "bu alanda ara"; konum izni yoksa şehir seçerek çalışır.
4. **Kaydedilenler** — favoriler (Faz 2); koleksiyonlar (Faz 4).
5. **Profil** — hesap, değerlendirmelerim (durumlarıyla), bildirim ve gizlilik tercihleri, fırsat/sponsorlu içerik tercihleri, konum izni yönetimi, yasal metinler, hesap silme, uygulama sürümü.

### A12.2 Gereksinimler

| ID | Düzey · Faz | Gereksinim |
|---|---|---|
| REQ-MOB-001 | ZORUNLU · 2 | Expo + React Native + Expo Router; `apps/mobile` monorepo içinde; ortak paketler (`contracts`, `api-client`, `tokens`, `i18n`, `routes`, `utils`) paylaşılır; web bileşenleri RN'ye zorlanmaz (`ui-native` ayrı). Expo SDK sürümü Faz 2 başında registry'den doğrulanır (ADR). |
| REQ-MOB-002 | ZORUNLU · 2 | **Misafir modu:** uygulama açılışında hesap zorunlu değildir; keşif, arama, harita, listeleme ve içerik okuma misafirle çalışır. Giriş yalnızca eylemde istenir. Açılışta zorunlu onboarding duvarı YASAK; isteğe bağlı 2–3 ekranlık tanıtım + şehir/ilgi alanı seçimi atlanabilir. |
| REQ-MOB-003 | ZORUNLU · 2 | Giriş: e-posta, Google, Apple (REQ-HSP-005/006). Token'lar yalnızca güvenli depoda. |
| REQ-MOB-004 | ZORUNLU · 2 | **Derin bağlantılar:** iOS Universal Links ve Android App Links; `apple-app-site-association` ve `assetlinks.json` web uygulaması tarafından sunulur; web URL'leri ile uygulama ekranları birebir eşlenir (`packages/routes`); uygulama yüklü değilse web sayfası açılır. Ertelenmiş derin bağlantı yalnızca gerçek bir sağlayıcı seçilirse (X-kaydı). Gerçek alan adıyla ilişkilendirme doğrulaması `M` yöntemlidir. |
| REQ-MOB-005 | ZORUNLU · 2 | **Paylaşım:** listeleme/içerik/arama sonuçları sistem paylaşım sayfasıyla paylaşılır; paylaşılan bağlantı web URL'sidir; sponsorlu içerik paylaşımında etiket önizlemede de görünür. |
| REQ-MOB-006 | ZORUNLU · 2 | **Push bildirimleri:** izin sistem diyaloğundan **önce** bağlamsal ön açıklama ekranı (ör. ilk favori ya da değerlendirme gönderiminden sonra; açılışta değil); konu bazlı tercihler (değerlendirme durumu, işletme yanıtı, kaydedilen listelemedeki değişiklik, editoryal öneriler, fırsat/sponsorlu); sessiz saatler (varsayılan 22:00–09:00); frekans sınırı (varsayılan pazarlama push'u ≤ 2/hafta); **ticari/pazarlama içerikli push yalnızca ayrı ticari ileti izniyle** ve "Sponsorlu" ibaresiyle (Ek D1). Gerçek kişilere gönderim C sınıfı. |
| REQ-MOB-007 | ZORUNLU · 2 | **Konum:** yalnızca ön planda ("uygulamayı kullanırken"); arka plan konumu YASAK; izin istemeden önce amaç açıklaması (Türkçe izin metinleri `Info.plist` / Android izin açıklamaları); "yaklaşık konum" desteklenir; izin reddedilirse şehir seçimiyle tam işlev; kesin konum sunucuya gönderilirse yuvarlanır (≈ 1 km) ve saklanmaz (KVKK minimizasyonu). |
| REQ-MOB-008 | ZORUNLU · 2 | **Harita:** kütüphane ve sağlayıcı ADR'de (lisans + API anahtarı X-kaydı; anahtar uygulama paketinde ise platform/paket kısıtlı ve ADR'de "herkese açık anahtar" olarak kayıtlı); kümelenme; liste/harita geçişi; erişilebilir alternatif (harita içeriği liste olarak da erişilebilir). |
| REQ-MOB-009 | ZORUNLU · 2 | **Veri katmanı:** web ile aynı veri getirme kütüphanesi ÖNERİLİR; okuma önbelleği cihazda kalıcı (son görüntülenenler çevrimdışı okunabilir); favori ekleme iyimser güncellemeli; çevrimdışı yazma işlemleri kuyruğa alınır ve bağlantı gelince gönderilir. |
| REQ-MOB-010 | ZORUNLU · 2 | **Durum tasarımları:** yükleniyor (iskelet), boş, az veri, hata (yeniden dene), çevrimdışı (afiş + önbellekten okuma), yetkisiz, bakım/zorunlu güncelleme ekranı (minimum sürüm API'den). |
| REQ-MOB-011 | ZORUNLU · 2 | **Hesap silme uygulama içinden** başlatılabilir (Profil > Hesap > Hesabımı sil) ve web'deki silme sayfasının bağlantısı mağaza listesinde verilir; veri dışa aktarma talebi uygulamadan yapılabilir (Apple ve Google kurallarının güncel metni doğrulanır — Ek D1). |
| REQ-MOB-012 | ZORUNLU · 2 | **UGC gereksinimleri (mağaza):** içerik bildirme, kötüye kullanan kullanıcıyı engelleme, filtreleme/moderasyon ve yayımlanmış iletişim bilgisi uygulamada mevcuttur. |
| REQ-MOB-013 | ZORUNLU · 2 | **Gizlilik beyanları:** Apple gizlilik etiketi ve gizlilik manifesti (gerekli API kullanım gerekçeleri), Google Play Veri güvenliği formu — gerçek veri akışlarından (`processor_inventory`, analitik olay listesi) türetilerek **taslak** hazırlanır; uygulamalar arası izleme yapılmaz (dolayısıyla izleme izni istemi gerekmez; yapılacaksa ayrı ADR + İnsan onayı). |
| REQ-MOB-014 | ZORUNLU · 2 | **Erişilebilirlik:** sistem yazı boyutu ölçeklemesi (Dynamic Type / font scale) en az %200'e kadar düzen bozulmadan; VoiceOver/TalkBack etiketleri, rolleri ve sıraları; dokunma hedefleri ≥ 44×44 pt (iOS) / 48×48 dp (Android); hareket azaltma tercihine uyum; renk dışında ikinci gösterge. |
| REQ-MOB-015 | ZORUNLU · 2 | **Performans:** uzun listelerde sanallaştırılmış liste (ör. FlashList — ADR); görseller önbellekli bileşenle (ör. `expo-image`) ve CDN varyantlarıyla; soğuk açılış hedefi orta segment Android cihazda < 2,5 sn (laboratuvar; ölçüm koşulları raporlanır); JS paket boyutu bütçesi ADR'de. |
| REQ-MOB-016 | ZORUNLU · 2 | **Dağıtım:** EAS Build/Submit/Update (ADR); kanallar: development / preview / production; OTA güncellemeleri yalnızca JS/varlık düzeltmeleri için — yerel kod/izin değişikliği mağaza sürümü gerektirir; sürümleme (semver + build numarası); minimum OS sürümleri ADR'de; tablet desteği kararı ADR'de (varsayılan: telefon öncelikli, tablette ölçeklenmiş). Mağaza gönderimi C sınıfı. |
| REQ-MOB-017 | ZORUNLU · 2 | **Hata izleme:** çökme raporlama (kaynak haritaları yüklenmiş), kişisel veri maskelenmiş; analitik yalnızca rızayla. |
| REQ-MOB-018 | ZORUNLU · 2 | **Mobil testler:** birim + bileşen testleri; E2E (Maestro ya da Detox — ADR) duman senaryoları: misafir keşif, arama + filtre, listeleme açma, giriş, favori ekleme, değerlendirme gönderme, derin bağlantı açma, hesap silme başlatma; cihaz matrisi `MANUAL-QA` içinde. |
| REQ-MOB-019 | ZORUNLU · 2 | **Mağaza varlıkları taslakları:** Türkçe uygulama adı, alt başlık, açıklama, anahtar kelimeler, ekran görüntüsü senaryoları (demo veriyle, "Demo" ibaresi olmadan gerçek görünmeyecek biçimde — gerçek işletme verisi yoksa mağaza görselleri İnsan onayıyla), destek URL'si, gizlilik politikası URL'si. |
| REQ-MOB-020 | OLMALI · 2 | Sponsorlu içerik ve fırsat tercihleri: kullanıcı fırsat/sponsorlu **bildirimlerini** kapatabilir; akıştaki sponsorlu yerleşimler etiketli kalır (kapatma seçeneği gelir modeline göre B sınıfı karar). |

---

## A13 — SEO ve organik büyüme (SEO)

> Arama motoru politikalarına ilişkin aşağıdaki kurallar genel en iyi uygulamalardır; **Google Search Central ve Yandex Webmaster'ın güncel metinleri** Faz 1 başında §13.3 ile doğrulanır ve ADR'ye yazılır.

### A13.1 Teknik SEO

| ID | Düzey · Faz | Gereksinim |
|---|---|---|
| REQ-SEO-001 | ZORUNLU · 1 | Tüm herkese açık içerik sayfaları sunucu tarafında render edilmiş HTML ile birincil içeriği döndürür (JS kapalıyken başlık, metin, puan özeti, iç bağlantılar görünür). |
| REQ-SEO-002 | ZORUNLU · 1 | Her sayfa için benzersiz `<title>` (≤ 60 karakter hedef) ve meta açıklama (≤ 155 karakter hedef); şablonlar türe göre; Türkçe ek uyumu yardımcıları kullanılır (A15.2). Yinelenen başlık/açıklama CI raporunda listelenir. |
| REQ-SEO-003 | ZORUNLU · 1 | **URL şeması** A15.1'deki tablodur; küçük harf, tire ayracı, sonda eğik çizgi yok (aykırı biçim 301 ile normalleştirilir); slug'da yıl/fiyat gibi bayatlayan bilgi yok; slug değişikliği 301 (REQ-VER-013). |
| REQ-SEO-004 | ZORUNLU · 1 | **Canonical:** her indekslenebilir sayfada kendine referans veren canonical; filtre/sıralama parametreli varyantlar ana hub'a canonical verir ya da `noindex,follow`; yalnızca **izin listesindeki** yüzeyler (ör. il × kategori, il × kategori × tek bir öne çıkan özellik — eşik sağlanırsa) temiz URL ile indekslenir. |
| REQ-SEO-005 | ZORUNLU · 1 | **Tarama kontrolü:** arama sonuçları (`/ara`), karşılaştırma aracı, hesap sayfaları, `/git/`, önizleme, panel `noindex` ve gerekirse robots.txt'de `Disallow`; sınırsız filtre kombinasyonu taranabilir bağlantı üretmez (filtre bağlantıları izin listesi dışında `nofollow` ya da form/JS ile). |
| REQ-SEO-006 | ZORUNLU · 1 | **XML site haritaları:** dizin + türe göre bölümlü (listelemeler, içerikler, hub'lar, destinasyonlar, görseller); her dosya ≤ 50.000 URL; `lastmod` yalnızca anlamlı değişiklikte güncellenir; `noindex`, eşiğin altı, demo, kapalı ve yönlendirilen URL'ler site haritasında yer almaz (test). |
| REQ-SEO-007 | ZORUNLU · 1 | `robots.txt` ortama göre (staging/preview tamamen `Disallow` + HTTP temel kimlik doğrulama; üretimde site haritası dizini bildirimi). |
| REQ-SEO-008 | ZORUNLU · 1 | **Yapılandırılmış veri (JSON-LD):** içeriğin gerçek türüyle eşleşen tipler (Ek A2.2 tablosu + `Article`, `BreadcrumbList`, `ItemList`, `Person` yazarlar için, `Organization` site için, `WebSite` + arama kutusu uygunluğu doğrulanarak). **Kurallar:** (a) `Review`/`AggregateRating` yalnızca sayfada görünen gerçek değerlendirmelerden; n < 3 ise `AggregateRating` yok; (b) Google'ın işletmelerin kendi sitelerindeki "kendine hizmet eden" değerlendirmelere ilişkin kısıtları doğrulanır ve uygulanır; (c) sponsorlu içerikte editör `Review` işaretlemesi yok; (d) demo veride JSON-LD yok; (e) fiyat işaretlemesi yalnızca güncel ve kaynaklı fiyatta. Rich Results test doğrulaması CI'da şema doğrulayıcıyla (çevrimdışı) + `M` (canlı test aracı). |
| REQ-SEO-009 | ZORUNLU · 1 | **Open Graph ve paylaşım görselleri:** her sayfa için OG başlık/açıklama/görsel (1200×630); dinamik OG görselleri (listeleme adı, puan özeti — yalnızca gerçek veri, sponsorluysa etiket görselde). |
| REQ-SEO-010 | ZORUNLU · 1 | **Breadcrumb** (görünür + JSON-LD): Ana sayfa › İl › Kategori › Listeleme; içeriklerde Ana sayfa › Rehberler › Konu. |
| REQ-SEO-011 | ZORUNLU · 1 | **İç bağlantı sistemi:** şehir hub'ı ↔ kategori hub'ları ↔ listelemeler ↔ rehberler/listeler/karşılaştırmalar; listeleme sayfasında "Bu listelemenin geçtiği rehberler", "Yakındaki benzerler"; içeriklerde gömülü listeleme kartları; yetim sayfa raporu (hiç iç bağlantı almayan indekslenebilir sayfa) panelde. |
| REQ-SEO-012 | ZORUNLU · 1 | **Durum kodları:** bulunamayan 404 (yararlı öneri sayfası), kalıcı silinen 410, taşınan 301 (zincirsiz), kapalı işletme 200 + "Kalıcı olarak kapandı" (değerlendirmeler değerli olduğu sürece); bitmiş etkinlik 200 + 30 gün sonra `noindex`; süresi dolmuş fırsat `noindex`. |
| REQ-SEO-013 | ZORUNLU · 1 | **Çok dile hazır mimari:** `lang="tr"`, `hreflang` altyapısı (yalnızca tek dil yayımlanırken hreflang üretilmez), yerelleştirilebilir slug alanı. |
| REQ-SEO-014 | ZORUNLU · 1 | **Görsel SEO:** anlamlı Türkçe `alt` metinleri (dekoratif görselde boş alt), açıklayıcı dosya adları, `width/height`, modern formatlar, görsel site haritası. |
| REQ-SEO-015 | ZORUNLU · 1 | **Arama motoru araçları:** Google Search Console, Bing Webmaster Tools ve Yandex Webmaster doğrulama hazırlığı (meta/DNS — İnsan yapar, X-kaydı); IndexNow desteği (destekleyen motorlar için, doğrulanarak). |
| REQ-SEO-016 | ZORUNLU · 1 | **SEO test paketi (CI):** her sayfa türü için title/description/canonical/robots/JSON-LD şema doğrulaması, site haritası içerik testleri, yönlendirme testleri, `noindex` kuralları. |

### A13.2 Programatik SEO ve kalite kapıları

- Şehir × kategori × özellik kombinasyon sayfaları **yalnızca** yayın eşiğini (§7.2) sağlıyorsa indekslenir; her birinde benzersiz editoryal giriş metni (≥ 80 kelime, insan yazımı ya da insan onaylı) ZORUNLU; eşik altı sayfa üretilmez ya da `noindex`.
- Boş ya da birbirini tekrar eden yüzlerce sayfa üretmek YASAK; sayfa gerçek değer taşımalı, yeterli veriye sahip olmalı ve kullanıcıya anlamlı sonuç sunmalıdır.
- **Sponsorlu içerik ve site itibarı:** Üçüncü taraf/sponsorlu içeriklerin arama motorlarının "site itibarının kötüye kullanımı" türü politikalarıyla çelişmemesi için: sponsorlu içerik platformun ana konularıyla ilgili olmalı, editoryal denetimden geçmeli, açıkça etiketlenmeli; dış bağlantıları `rel="sponsored"`. Politikanın güncel metni doğrulanır (L/X-kaydı).

### A13.3 İçerik SEO'su ve E-E-A-T

- Örnek içerik planı (v1'den): "Antalya'da Gezilecek Yerler: Ayrıntılı Gezi Rehberi", "Kapadokya'da Nerede Kalınır?", "İstanbul'un Öne Çıkan Kahvaltı Mekanları", "Araç Kiralarken Nelere Dikkat Edilmeli?", "Otel Seçerken Hangi Özellikler Önemli?", "Ürün A ve Ürün B Karşılaştırması", "Bir Şehre İlk Kez Gidecekler İçin Rehber", "Bütçeye Göre Tatil Planlama Rehberi".
- İçerik anahtar kelime doldurmak için yazılmaz; kullanıcının kararını kolaylaştıran bilgi, kaynak, güncellik ve özgün değerlendirme esastır.
- Deneyim ve uzmanlık sinyalleri: yazar sayfaları, deneyim beyanı, test yöntemi, kaynaklar, güncelleme notları, metodoloji ve bağımsızlık sayfaları (REQ-ICR-006/007/011/012).
- **İçerik tazelik SLA'sı** (varsayılan): fiyat/saat içeren rehberler 90 günde bir gözden geçirilir; "En iyi" listeleri 180 günde; ürün karşılaştırmaları yeni model çıkışında; tazelik kuyruğu panelde.

### A13.4 Büyüme döngüleri

- Değerlendirme → listeleme sayfası zenginleşir → organik trafik → yeni değerlendirme.
- Paylaşılabilir listeler ve karşılaştırmalar (Faz 4'te kullanıcı listeleri).
- Bülten (rızaya bağlı; Faz 2+ gönderim).
- Uygulama tanıtımı: web'de **müdahaleci olmayan** akıllı afiş (tam ekran araya giren reklam/geçiş sayfası YASAK).

---

## A14 — Tasarım sistemi, marka kimliği ve görseller (TSR)

### A14.1 Tasarım ilkeleri (İlke — test edilmez, ölçülebilir alt kurallarla desteklenir)

Premium ve minimal · içerik odaklı · görsel açıdan güçlü ama gereksiz efektlerden uzak · güven veren, profesyonel ve modern · seyahat, mekan keşfi, tüketici teknolojisi ve günlük yaşam içeriklerine eşit derecede uygun · mobil öncelikli · reklamlarla dolu, karmaşık, eski haber sitesi görünümünden uzak · büyük ve kaliteli görseller · tutarlı kartlar · ince kenarlıklar ve kontrollü gölgeler · dengeli beyaz alan · net filtreler, arama alanları ve kategori navigasyonu.

**Ölçülebilir alt kurallar:** renk, aralık, yarıçap, gölge ve tipografi **yalnızca** token'lardan gelir (token dışı değer lint ile yakalanır); tek tipografi ölçeği; tek ikon seti; sayfa başına en fazla 1 birincil (dolu) buton grubu; animasyon süreleri token'lı ve `prefers-reduced-motion` ile kapanır.

### A14.2 Renk sistemi ve erişilebilirlik düzeltmeleri

v1 paletinin WCAG 2.x kontrast ölçümü (bu belge hazırlanırken hesaplandı):

| Çift | Oran | Sonuç |
|---|---|---|
| Metin `#17191D` / `#FFFFFF` | 17,60 | ✔ |
| İkincil metin `#686F7A` / `#FFFFFF` · / `#F6F7F9` | 5,07 · 4,73 | ✔ AA (normal metin) |
| Marka `#315EFB` / `#FFFFFF` (beyaz metin marka üstünde de 5,09) | 5,09 | ✔ AA |
| **Vurgu `#FF8A45` / `#FFFFFF`** (beyaz metin vurgu üstünde de 2,34) | **2,34** | ✘ **Metin ve beyaz yazılı buton için kullanılamaz** |
| `#17191D` metin / vurgu `#FF8A45` zemin | 7,52 | ✔ |
| **Kenarlık `#E7E9EE` / `#FFFFFF`** | **1,21** | ✘ Form alanının tek görsel sınırı olarak yetersiz (bileşen kontrastı ≥ 3:1) |

**Token tablosu (primitif → anlamsal; açık tema):**

| Anlamsal token | Değer | Kullanım |
|---|---|---|
| `color.bg.default` | `#FFFFFF` | Ana arka plan |
| `color.bg.subtle` | `#F6F7F9` | İkincil arka plan, bölümler |
| `color.text.primary` | `#17191D` | Ana metin |
| `color.text.secondary` | `#686F7A` | İkincil metin (beyaz ve `bg.subtle` üzerinde AA) |
| `color.brand.default` | `#315EFB` | Birincil buton zemini (beyaz metin 5,09), bağlantılar |
| `color.brand.hover` | `#2449D8` | Hover/pressed (beyaz metin 6,95) |
| `color.accent.decorative` | `#FF8A45` | **Yalnızca** dekoratif öğeler, ikon dolguları, illüstrasyon, koyu metinli rozet zemini |
| `color.accent.text` | `#A8471A` | Vurgu rengi gereken metin/bağlantı (beyazda 5,86) |
| `color.border.default` | `#E7E9EE` | Kart ve ayraç kenarlıkları (dekoratif) |
| `color.border.strong` | `#868D98` | Form alanları, seçim kutuları, odak dışı kontrol sınırları (beyazda 3,35; `bg.subtle`'da 3,12) |
| `color.focus.ring` | `#315EFB` (2 px + 2 px ofset) | Klavye odağı |
| `color.success.text` | `#18794E` | Olumlu durum metni (5,41) |
| `color.warning.text` | `#8A5A00` | Uyarı metni (5,93) |
| `color.danger.text` | `#B42318` | Hata metni (6,57) |
| `color.sponsored.bg` / `color.sponsored.text` | `#FFF3E0` / `#5B3A00` | **"Sponsorlu" etiketi** (9,34) — tüm ticari etiketlerde tek ve tutarlı |
| `color.score.editor.*` | marka tonunda ayrı rozet | Editör puanı (10 üzerinden) |
| `color.score.user.*` | nötr + yıldız | Kullanıcı puanı (5 yıldız) — editör puanından görsel olarak ayrışır |

- Her renk için 50–900 ölçekleri üretilir; anlamsal token'lar ölçeklere işaret eder.
- **Karanlık tema** token eşlemesi Faz 0'da tanımlanır (ör. `bg #121417`, metin `#E8EAED` → 15,31; marka `#7C9BFF` → 7,02; ikincil metin `#A3AAB5` → 7,89), Faz 2'de İSTEĞE BAĞLI yayımlanır.
- **Kontrast testi CI'da:** token çiftleri için otomatik kontrast denetimi (metin ≥ 4,5:1; büyük metin ve UI bileşenleri ≥ 3:1).
- Renk tek başına bilgi taşımaz (açık/kapalı, sponsorlu, doğrulanmış durumları metin/ikonla da ifade edilir).

### A14.3 Tipografi

- Türkçe glifleri tam destekleyen (ç ğ ı İ ö ş ü, `İ` büyük harf dönüşümü), açık lisanslı (SIL OFL) bir yazı ailesi; varsayılan öneri: değişken bir sans-serif (ör. Inter ya da eşdeğeri — lisans ve Türkçe glif kapsamı doğrulanarak ADR). Kendi sunucundan (self-host) servis edilir; `font-display: swap`; yalnızca kullanılan ağırlıklar ve `latin` + `latin-ext` alt kümeleri.
- Tip ölçeği (öneri): 12 / 14 / 16 (gövde) / 18 / 20 / 24 / 30 / 36 / 48; satır yüksekliği gövdede 1,5; fiyat ve puanlarda eşit genişlikli rakamlar (`tabular-nums`).
- Metin satır uzunluğu makale gövdesinde 60–75 karakter.

### A14.4 Diğer token'lar

Aralık ölçeği 4 px tabanlı (4, 8, 12, 16, 24, 32, 48, 64); yarıçaplar (4, 8, 12, 16, tam); gölgeler (0, 1, 2 — kontrollü); kırılım noktaları (360, 640, 768, 1024, 1280, 1536); hareket süreleri (100/200/300 ms) ve eğriler; z-index katmanları. Tek kaynak: `packages/tokens` (JSON) → Tailwind preset + React Native tema (üretim betiği).

### A14.5 Bileşen envanteri (Storybook'ta her biri durumlarıyla ve erişilebilirlik notlarıyla)

Button (birincil/ikincil/metin/tehlike; yükleniyor/devre dışı) · Input / Textarea / Select / Combobox (hata, yardım metni) · Checkbox / Radio / Switch · Chip/Filtre çipi · SearchBar + öneriler · **Card** (türe göre varyantlar: Mekan, Konaklama, Ürün, Hizmet, Tur, Etkinlik, İçerik) · **SponsoredLabel** (tek bileşen; zorunlu prop) · **AffiliateDisclosure** · **RatingDisplay.User** (5 yıldız + n) · **RatingDisplay.Editor** (10 üzerinden rozet) · ScoreBreakdown · ProsCons · **PriceTag** (kaynak + zaman damgası zorunlu prop; "STALE"/"UNAVAILABLE" durumları) · OpeningHours (şu an açık/kapalı, özel gün) · Badge (Doğrulanmış işletme / Belgeli deneyim / Demo / Mock) · Map + MapPin (organik/sponsorlu) · Gallery + Lightbox · Breadcrumb · Tabs · BottomSheet · Modal/Dialog · Toast · Skeleton · EmptyState · ErrorState · OfflineBanner · Pagination / "Daha fazla yükle" · ComparisonTable · CTA grubu (türe göre izinli CTA'lar) · CookieBanner + Tercih merkezi · Consent dialogları · ReportDialog (Bildir) · ReviewForm adımları · Header / MegaMenu / Footer · Avatar · Tooltip (yalnızca ek bilgi; zorunlu bilgi tooltip'te olmaz).

**Görsel regresyon:** Storybook hikâyeleri için ekran görüntüsü karşılaştırma testleri (araç ADR'de) ve E2E'de kritik sayfa görüntüleri.

### A14.6 Görseller, fotoğraf lisansı ve placeholder sistemi

- **Kaynaklar (izinli):** (1) kendi çekimimiz (editör), (2) işletmenin sağladığı ve **yazılı lisans/izin beyanı** olan görseller, (3) kullanıcı fotoğrafları (yükleme sırasında lisans beyanı: "Bu fotoğrafı ben çektim; İncelemeler'in platformda ve tanıtımında kullanmasına izin veriyorum" — metin hukuki incelemeye tabi), (4) lisanslı stok görseller (lisans kaydı saklanarak; stok lisanslarının marka/kişi/mülk izinlerini kapsamadığı durumlar ayrıca değerlendirilir). **Hotlink YASAK**; dış sitelerden görsel indirme YASAK (AK-07).
- **`MediaAsset` lisans alanları (ZORUNLU):** kaynak türü, hak sahibi/atıf metni, lisans türü, izin belgesi (dosya/URL), geçerlilik bitişi (varsa), model/mülk izni (gerekiyorsa), yükleyen, yükleme tarihi. Lisans alanı eksik görsel yayımlanamaz; süresi dolan görsel otomatik yayından kalkar ve placeholder'a döner.
- **Eşleştirme:** Görsel ilgili listeleme/içerikle eşleşmelidir; başka bir mekanın görseli "temsili" olarak kullanılamaz.
- **Yapay zekâ görselleri:** gerçek bir mekan/ürün/kişiyi temsil eder biçimde YASAK; illüstratif kullanımda "Yapay zekâ ile üretilmiş görsel" etiketi.
- **Placeholder sistemi:** kategoriye özgü, markaya uygun illüstrasyon/desen + ikon + listeleme adının baş harfi; "Görsel henüz eklenmedi" erişilebilir metni; sahte mekan fotoğrafı YASAK. Gerçek görsellerde blurhash/LQIP ile yükleme; en-boy oranları bağlama göre sabit (kart 4:3, kahraman 16:9, ürün 1:1) ve odak noktasıyla kırpma.
- **Görsel işleme hattı:** yüklemede tür/boyut doğrulaması, kötü amaçlı içerik taraması (X-kaydı), EXIF/GPS silme, varyant üretimi (AVIF/WebP + yedek), `srcset`/`sizes`.

### A14.7 Logo ve marka brifi

- Faz 0–1'de yalnızca **geçici** SVG kelime işareti ("İncelemeler", Türkçe büyük `İ` noktasıyla doğru) ve geçici uygulama ikonu (`temp` adlı) üretilir (Ç-4).
- `docs/brand/logo-brifi.md`: en az 3 konsept yönü (ör. büyüteç + yön/rota, "İ" harfinin noktasını büyüteç/konum işaretine dönüştüren işaret, karar/onay çizgisi); **sıradan bir yıldız simgesini marka kimliğinin yerine koyma**; belirli bir sektöre aşırı bağlı kalma; hem web hem uygulama ikonu olarak çalışabilmeli; yapım ızgarası, boşluk alanı, minimum boyutlar (favicon 16 px dahil), tek renk/ters kullanım, iOS ikon ve Android uyarlanabilir ikon ızgaraları, kullanım kuralları (yapılmaması gerekenler).
- Nihai logo, marka tescil araştırması ve tescil İnsan kararıdır (L-kaydı).

---

## A15 — Bilgi mimarisi, sayfalar, yerelleştirme ve UX durumları (YRL)

### A15.1 URL şeması (tek kaynak: `packages/routes`; web ve mobil derin bağlantılar ortak)

| Sayfa | Kalıp | Örnek | İndeks |
|---|---|---|---|
| Ana sayfa | `/` | | evet |
| Destinasyon (il) | `/{il}` | `/istanbul` | eşik sağlanırsa |
| İlçe/bölge | `/{il}/{ilce}` | `/istanbul/kadikoy` | eşik sağlanırsa |
| İl × keşif kategorisi | `/{il}/{kategori}` | `/istanbul/kahvalti` | eşik sağlanırsa |
| İlçe × keşif kategorisi | `/{il}/{ilce}/{kategori}` | `/istanbul/kadikoy/kahvalti` | eşik sağlanırsa |
| Mekan | `/mekan/{slug}` | `/mekan/ornek-kahvalti-evi-cihangir` | evet |
| Konaklama (tüm türler) | `/konaklama/{slug}` | `/konaklama/ornek-butik-otel-goreme` | evet |
| Hizmet işletmesi | `/isletme/{slug}` | | evet |
| Araç kiralama firması | `/arac-kiralama/{slug}` | | evet |
| Turist rehberi (kişi) | `/tur-rehberi/{slug}` | | kişinin rızası + ruhsat doğrulaması varsa |
| Tur / aktivite | `/tur/{slug}` | | evet |
| İlgi noktası | `/yer/{slug}` | `/yer/kaputas-plaji` | evet |
| Etkinlik | `/etkinlik/{slug}` (yıllık tekrarlarda `-{yyyy}`) | | bitişten 30 gün sonra noindex |
| Ürün | `/urun/{marka}-{model}` | | evet |
| Ürün kategorisi | `/urunler/{kategori}/{alt}` | `/urunler/teknoloji/kablosuz-kulaklik` | eşik sağlanırsa |
| Kuruluş/marka | `/marka/{slug}` | | evet |
| Rehber (yazı) | `/rehber/{slug}` | `/rehber/kapadokya-gezi-rehberi` | evet |
| Liste (en iyiler) | `/liste/{slug}` | | evet |
| İnceleme (uzun test) | `/inceleme/{slug}` | | evet |
| Karşılaştırma (editoryal) | `/karsilastir/{a}-vs-{b}` (alfabetik; ters sıra 301) | | evet |
| Karşılaştırma aracı | `/karsilastir?ogeler=a,b,c` | | noindex |
| Koleksiyon sayfası | `/kesfet/{slug}` | `/kesfet/balayi-otelleri` | eşik sağlanırsa |
| Fırsatlar | `/firsatlar`, `/firsatlar/{slug}` | | süre bitince noindex |
| Yazar/editör | `/yazar/{slug}` | | evet |
| Kullanıcı profili | `/kullanici/{kullanici-adi}` | | profil ayarına göre |
| Arama | `/ara?q=…` | | noindex |
| Hesap ve kişisel | `/hesabim/…`, `/kaydedilenler`, `/bildirimler` (F2), `/gecmis` (F2) | | noindex |
| İşletme akışları | `/isletmeni-ekle`, `/isletmeni-sahiplen/{slug}` (F3), `/isletme-paneli/…` (F3) | | noindex (panel) |
| Reklam/sponsorluk başvurusu | `/reklam-ve-sponsorluk` | | evet |
| Güven ve politika | `/hakkimizda`, `/iletisim`, `/sss`, `/nasil-degerlendiriyoruz`, `/editoryal-bagimsizlik`, `/icerik-politikasi`, `/topluluk-kurallari`, `/sponsorlu-icerik-politikasi`, `/duzeltme-politikasi`, `/gizlilik`, `/kvkk-aydinlatma-metni`, `/cerez-tercihleri`, `/kullanim-kosullari`, `/bildir` (şikâyet ve içerik bildirimi), `/kvkk-basvuru`, `/kunye`, `/erisilebilirlik` | | evet |

**Kurallar:** Listeleme URL önekini kararlı tür belirler (alt kategori/özellik URL'ye girmez — pansiyonun "butik otel"e taşınması URL'yi değiştirmez). Ayrılmış kelimeler listesi kodda tutulur; hiçbir il/ilçe/kategori slug'ı bu listeye giremez; aynı il altındaki ilçe ve kategori slug'ları çakışamaz (kayıtta doğrulanır). Ürün varyantları ayrı URL değildir. Sponsorlu içerik kendi içerik türünün yolunu kullanır; ayırt edicilik etiketle sağlanır.

### A15.2 Türkçe yerelleştirme ve metin standardı

| ID | Düzey · Faz | Gereksinim |
|---|---|---|
| REQ-YRL-001 | ZORUNLU · 1 | `slugifyTr`: Türkçe küçük harf → transliterasyon (ç→c, ğ→g, ı→i, İ→i, ö→o, ş→s, ü→u) → kesme işaretleri silinir → alfasayısal dışı → tire → çoklu tire tekilleşir; test seti (ör. "İzmir'in Çeşme'si" → `izmirin-cesmesi`, "IĞDIR" → `igdir`). |
| REQ-YRL-002 | ZORUNLU · 1 | **Ek uyumu yardımcıları:** programatik başlıklarda bulunma/yönelme/ilgi ekleri ünlü uyumu, ünsüz yumuşaması/sertleşmesi ve kesme işaretiyle doğru üretilir ("İzmir'de", "Kars'ta", "Antalya'ya", "Muğla'nın"); kısaltma ve sayılarla biten adlar için test seti; çözülemeyen durumlarda ek gerektirmeyen başlık kalıbına düşülür ("Kahvaltı mekanları · İzmir"). |
| REQ-YRL-003 | ZORUNLU · 1 | Biçimler `Intl` ile ve `tr-TR`: para `1.234,56 ₺`, tarih `18.10.2026`, uzun tarih `18 Ekim 2026`, saat `14:30`, yüzde `%25`, puan `4,3`, mesafe `350 m` / `1,2 km`; göreli zaman ("3 gün önce") ve mutlak tarih birlikte (tooltip değil, erişilebilir metin). Telefon numaraları `+90 5XX XXX XX XX` biçiminde ve `tel:` bağlantılı. |
| REQ-YRL-004 | ZORUNLU · 1 | Adres biçimi Türkiye'ye uygun: mahalle, cadde/sokak, no, ilçe, il, posta kodu. |
| REQ-YRL-005 | ZORUNLU · 1 | **Mikro metin rehberi** (`docs/ux/metin-rehberi.md`): "sen" hitabı, kısa ve net cümleler, eylem odaklı buton metinleri ("Değerlendirme yaz", "Fiyatları gör"), suçlayıcı olmayan hata mesajları, terimler sözlükle tutarlı ("Rehber" yalnızca yazı; "Turist rehberi" kişi). |
| REQ-YRL-006 | ZORUNLU · 1 | **Yasak karanlık örüntüler** (AK-15): sahte aciliyet/kıtlık, önceden işaretli izinler, "Hayır, tasarruf etmek istemiyorum" tarzı utandırıcı reddetme, gizlenmiş abonelikten çıkma, reddet seçeneği kabul et kadar görünür olmayan çerez banner'ı, giriş duvarı. |

### A15.3 UX durum tasarımı (her ekran ve bileşen için ZORUNLU)

| Durum | Davranış |
|---|---|
| Yükleniyor | İskelet (skeleton) — içerik düzeniyle aynı; 300 ms altındaki yüklemelerde gösterilmez |
| Boş | Neden boş olduğunu ve ne yapılabileceğini söyleyen metin + eylem |
| Az veri | Mevcut veriyi göster; eşik altı öğeleri (ör. puan ortalaması) açıkla; sahte doldurma YOK |
| Bayat veri | Son doğrulama tarihi belirgin; "Bilgi hatalı mı?" bağlantısı |
| Kapalı/satıştan kalktı | Durum bandı; CTA'lar kaldırılır; benzerler öne çıkar |
| Hata | Anlaşılır mesaj + yeniden dene; `traceId` destek için kopyalanabilir |
| Çevrimdışı | Afiş + önbellekten okuma; yazma işlemleri kuyruğa alındı bilgisi |
| Yetkisiz | Giriş yap / yetki yok açıklaması; içerik varlığını sızdırmaz |

### A15.4 Ana sayfa modül sistemi

Ana sayfa son yazıları kronolojik sıralayan klasik bir blog **değildir**. Her modül bir kayıttır: `tip`, `veriKaynagi` (editoryal seçim / kural / kişisel / sponsorlu), `minOge` (varsayılan 4), `maxOge`, `kisisellestirilebilir`, `sponsorluMu`, `gorunurlukKurali` (tarih aralığı, şehir, platform). Öğe sayısı `minOge` altındaki modül otomatik gizlenir.

**Modül kataloğu (v1 §5'in 18 modülü):** 1 Modern üst navigasyon · 2 Büyük arama alanı + şehir seçici · 3 "Ne keşfetmek istiyorsun?" kategori kısayolları · 4 Yakınındaki mekanlar (konum izni isteğe bağlı; izin yoksa "Şehrini seç" kartı, izin istemi yok) · 5 Öne çıkan sponsorlu içerikler (etiketli, sınırlı) · 6 Editörün seçtikleri (sponsorlu içeremez) · 7 Popüler oteller ve tatil bölgeleri · 8 Öne çıkan restoranlar ve kafeler · 9 Araç kiralama ve ulaşım rehberleri · 10 Turlar, turist rehberleri ve deneyimler · 11 Popüler ürün incelemeleri · 12 Karşılaştırma rehberleri · 13 Yeni yayınlanan içerikler · 14 Sezonluk öneriler ve fırsatlar (tarih kuralıyla) · 15 Kaydedilebilir içerikler (kaydet butonlu kartlar) · 16 Bülten üyeliği · 17 Güven ve şeffaflık bağlantıları · 18 Kapsamlı ama sade footer.

**Varsayılan mobil sıra:** arama + şehir → kategori kısayolları → yakınında/şehrini seç → editörün seçtikleri → şehre göre popüler → sezonluk seçki → yeni rehberler → sponsorlu modül (≤ 1) → karşılaştırmalar → bülten → güven bağlantıları + footer. Sıra panelden değiştirilir; sponsorlu sınırları (A8.3) kodla zorlanır.

**Kişiselleştirme:** İzinli girdiler: açıkça seçilen ilgi alanları, seçilen şehir, platform içi son görüntülemeler ve kaydedilenler (rızaya bağlı; misafirde yalnızca cihazda). Yasak: hassas kategori çıkarımı (sağlık, din, siyasi görüş vb.), platform dışı izleme verisi, kesin konum geçmişi. Kişiselleştirilmiş modülde "Neden bunu görüyorum?" ve profil ayarlarında "Kişiselleştirmeyi kapat". Rıza yoksa editoryal + popüler varsayılan sıralama.

### A15.5 Web sayfa envanteri (v1 §5'in tamamı; faz §7.1'e göre)

Ana sayfa · Kategori keşif sayfaları · Kategori alt sayfaları · Arama sonuçları · Filtrelenmiş liste sayfaları · Ürün sayfası · Ürün inceleme (uzun test) sayfası · İşletme/kuruluş sayfası · Restoran ve mekan sayfası · Otel ve konaklama sayfası · Araç kiralama firması sayfası · Tur ve turist rehberi profili · Seyahat rehberi · İçerik yazısı (liste/haber) · Sponsorlu içerik detay sayfası · Karşılaştırma sayfası · Kampanya ve fırsat sayfası · Destinasyon sayfası · Koleksiyon sayfası · Editör/yazar profili · Kullanıcı profili · Favoriler (Kaydedilenler) · Okuma geçmişi (F2) · Değerlendirmelerim · Bildirimler (F2) · Hesap ve gizlilik ayarları · İşletme başvuru sayfası · İşletme paneli (F3) · Reklam ve sponsorluk başvuru sayfası · Hakkımızda · İletişim · SSS · İçerik politikası · Topluluk/değerlendirme kuralları · Sponsorlu içerik politikası · Editoryal bağımsızlık · Nasıl değerlendiriyoruz · Düzeltme politikası · Gizlilik politikası ve KVKK aydınlatma metinleri · Çerez tercih merkezi · Kullanım koşulları · Şikâyet ve içerik bildirim sayfası · KVKK başvuru formu · Künye · Erişilebilirlik beyanı · 404/410/500 sayfaları · Bakım sayfası.

**Teslimat:** `docs/ux/ekranlar/` altında her P0 sayfa için kısa ekran tanımı (amaç, persona, veri, bileşenler, durumlar, CTA'lar, SEO, erişilebilirlik notları) ve düşük çözünürlüklü wireframe (mermaid/ASCII ya da görsel); Faz 1'de pilot şablonlar için yüksek çözünürlüklü uygulama (kod) Storybook'ta.

### A15.6 Kullanıcı yolculukları (E2E'ye bağlı)

| Kod | Yolculuk | E2E |
|---|---|---|
| Y1 | Misafir → arama ("İzmir'de kahvaltı") → filtre → listeleme → yol tarifi/ara | E2E-002 |
| Y2 | Tatil planlayan → destinasyon sayfası → rehber → konaklama → "Fiyatları gör" (sağlayıcı yönlendirmesi) | E2E-013 |
| Y3 | Ürün alıcısı → kategori → karşılaştırma → ürün sayfası → affiliate bağlantısı (etiketli) | E2E-014 |
| Y4 | Kayıt → e-posta doğrulama → favori ekleme → Kaydedilenler | E2E-003 |
| Y5 | Değerlendirme yazma (misafir başlar, girişte taslak korunur) → moderasyon → yayın → bildirim | E2E-004 / E2E-012 |
| Y6 | Bildir → moderatör kararı → itiraz → farklı moderatör kararı | E2E-015 |
| Y7 | İşletme başvurusu → yönetici incelemesi | E2E-007 |
| Y8 | Editör → kategori + özellik şeması → listeleme → rehber → yayın → sitede görünür | E2E-001 |
| Y9 | Yönetici → kampanya + yerleşim → etiketli görünür → tıklama kaydı → bitişte kaybolur | E2E-005 / E2E-006 |
| Y10 | Çerez reddi → analitik yüklenmez; tercih değişikliği | E2E-016 |
| Y11 | Hesap silme + veri dışa aktarma | E2E-017 |
| Y12 | Sağlayıcı hatası → fiyat/müsaitlik gösterilmez | E2E-008 |
