## A7 — Arama ve filtreleme (ARA)

Arama platformun en önemli parçalarından biridir. Temel arama **yapay zekâ olmadan** güvenilir çalışmalıdır (Ç-8).

### A7.1 Desteklenmesi gereken sorgu örnekleri (v1'den aynen + test korpusuna girer)

- "Antalya'da denize yakın uygun fiyatlı oteller"
- "İstanbul'da iyi kahvaltı mekanları"
- "Kapadokya'da rehberli balon ve çevre turları"
- "İzmir'de günlük araç kiralama"
- "İstanbul'da özel gün için restoranlar"
- "Bütçeye uygun kablosuz kulaklıklar"
- "Çocuklarla gidilebilecek tatil yerleri"
- "Hafta sonu gidilebilecek doğal güzellikler"

Bu sorgular düz tam metin aramayla karşılanamaz; Faz 1'de **kural ve sözlük tabanlı sorgu ayrıştırıcı** ile yapılandırılmış filtreye çevrilir:
- **Yer adı sözlüğü (gazetteer):** il, ilçe, destinasyon ve takma adlar ("Kapadokya", "Bodrum", "Sultanahmet") → coğrafi filtre.
- **Niyet/özellik eşleme tablosu** (panelden yönetilir): "denize yakın/denize sıfır" → `attr.beachDistance ≤ X` / `attr.beachfront=true`; "uygun fiyatlı/bütçe dostu/bütçeye uygun" → `priceLevel ≤ 2`; "çocuklarla/aile" → `attr.familyFriendly=true`; "özel gün" → `attr.specialOccasion=true`; "hafta sonu" → koleksiyon/etiket; "günlük" (araç kiralama) → kiralama süresi; "rehberli" → `EXPERIENCE` + rehberli özellik.
- **Eş anlamlılar** (panelden): "kahvaltıcı ⇄ kahvaltı mekanı", "araba kiralama ⇄ araç kiralama", "kulaklık ⇄ kulaklik ⇄ headphone".
- Ayrıştırılan filtreler arayüzde **çip olarak gösterilir** ve kullanıcı kaldırabilir ("Antalya ✕ · Konaklama ✕ · Denize yakın ✕ · ₺–₺₺ ✕").

### A7.2 Gereksinimler

| ID | Düzey · Faz | Gereksinim |
|---|---|---|
| REQ-ARA-001 | ZORUNLU · 1 | Arama, uygulama kodunun yalnızca gördüğü bir **arama motoru arayüzü** arkasındadır: `upsert`, `delete`, `query`, `suggest`. İlk uygulama PostgreSQL; Meilisearch/Typesense geçişi yalnızca yeni adaptör yazmayı gerektirir. |
| REQ-ARA-002 | ZORUNLU · 1 | Okuma modeli `search_documents` (listeleme, içerik, kategori, destinasyon) outbox olaylarıyla güncellenir; tam yeniden indeksleme komutu vardır; `dataOrigin=DEMO` belgeler üretimde indekslenmez. |
| REQ-ARA-003 | ZORUNLU · 1 | **Türkçe normalizasyon** (`normalizeTr`, uygulamada ve SQL'de birebir aynı kurallar): (1) Türkçe kurallarla küçük harf (İ→i, I→ı); (2) kesme işaretinden sonraki eki at ("Antalya'da" → "antalya"; ’ ' ` varyantları); (3) aksan katlanmış ikinci varyant (ç→c, ğ→g, ı→i, ö→o, ş→s, ü→u) — "kahvalti", "sisli", "uskudar" eşleşir. "İSTANBUL", "Istanbul", "istanbul" aynı sonucu verir. |
| REQ-ARA-004 | ZORUNLU · 1 | PostgreSQL `turkish` metin arama yapılandırmasının kullanılan sürümde varlığı doğrulanır (ADR); özel yapılandırma + `unaccent` (IMMUTABLE sarmalayıcıyla); ağırlıklar (başlık A, kategori/yer B, alt başlık C, gövde D); GIN indeks. Kök bulucunun sınırlılığına karşı "simple" vektörle birleştirme test korpusuyla değerlendirilir. |
| REQ-ARA-005 | ZORUNLU · 1 | Yazım hatası toleransı: `pg_trgm` ile normalize ad ve yer adları üzerinde trigram indeks; tam metin sonucu az olduğunda (< 5) benzerlik geri dönüşü; eşik test korpusuyla ayarlanır. "Bunu mu demek istediniz?" önerisi. |
| REQ-ARA-006 | ZORUNLU · 1 | **Sorgu korpusu:** `docs/requirements/ARA-sorgu-korpusu.json` içinde ≥ 50 sorgu (A7.1 örnekleri, Türkçe karakter varyantları, büyük/küçük harf, yazım hataları — "kapadoyka", eş anlamlılar, ekli yer adları) ve her biri için beklenen ilk 5 sonuç (demo veride). **Kabul:** recall@5 ≥ %90; sıfır sonuç yalnızca beklenen sorgularda. CI'da çalışır. |
| REQ-ARA-007 | ZORUNLU · 1 | **Ortak filtreler:** konum (il/ilçe/yakınımda + yarıçap), kategori, listeleme türü/içerik türü, fiyat seviyesi/bütçe, kullanıcı puanı (≥ 3,5 / ≥ 4 / ≥ 4,5), özellikler (kategori şemasından `filterable`), açık şimdi (saatleri bilinenler), tarih (etkinlik; konaklama/araç kiralama için sağlayıcı yönlendirmesine parametre olarak), sıralama. Her içerik türü için uygun filtre seti şablonla tanımlanır. |
| REQ-ARA-008 | ZORUNLU · 1 | **Sıralama seçenekleri:** Önerilen (alaka + Bayes puanı + tazelik + mesafe; **ticari sinyal içermez**), Puana göre (Bayes), En çok değerlendirilen, En yakın (konum varsa), En yeni (içerik). "Önerilen" formülünün bileşenleri `/nasil-degerlendiriyoruz` sayfasında açıklanır. |
| REQ-ARA-009 | ZORUNLU · 1 | **Organik sıralama değişmezliği testi:** aynı tohum veride arama ve kategori listesi sorgusu tüm kampanyalar aktifken ve hepsi silinmişken çalıştırılır; organik `data` dizisi iki durumda birebir aynıdır (AK-04). |
| REQ-ARA-010 | ZORUNLU · 1 | Otomatik tamamlama: yer adları, kategoriler, listelemeler ve içerikler gruplu; klavye ile gezilebilir (ARIA combobox); son aramalar yalnızca cihazda (misafir) ya da rızayla hesapta. |
| REQ-ARA-011 | ZORUNLU · 1 | Liste görünümü ZORUNLU. **Harita görünümü İSTEĞE BAĞLI · 1** (harita sağlayıcısı X-005'e bağlı; Faz 2'de mobilde ZORUNLU); sağlayıcı yoksa harita KAPALI, liste + adres gösterilir. Harita "bu alanda ara" eylemi; kümelenme; sponsorlu pinler farklı stil + etiket ve organik pinleri gizlemez. |
| REQ-ARA-012 | ZORUNLU · 1 | Mobil web'de filtreler **bottom sheet** içinde; uygulanan filtre sayısı rozetli; "Temizle" ve "Sonuçları göster (N)" butonları; URL filtre durumunu yansıtır (paylaşılabilir, geri tuşu çalışır). |
| REQ-ARA-013 | ZORUNLU · 1 | Sıfır sonuç durumu: hangi filtrelerin sonucu sıfırladığını gösterir, tek tıkla gevşetme önerir, yakın şehir/kategori önerir; boş sayfa bırakılmaz. |
| REQ-ARA-014 | ZORUNLU · 1 | `search_events`: normalize sorgu, filtre özeti, sonuç sayısı, tıklanan sonuç sırası, oturum karması (kişisel veri yok; rızaya bağlı). "En çok aranan" ve "sonuçsuz aramalar" raporları buradan. |
| REQ-ARA-015 | ZORUNLU · 1 | Arama p95 < 300 ms (50.000 listeleme + 5.000 içerik tohum verisiyle, laboratuvar ölçümü; Ek A18). |
| REQ-ARA-016 | ÖNERİLİR · 4 | Veri büyüdüğünde (ör. > 500.000 belge ya da p95 hedefi aşılırsa) harici arama motoru; geçişte korpus gerilemesi olmamalı. |

---

## A8 — Sponsorlu içerik, sponsorlu yerleşim ve reklam sistemi (SPN)

Sponsorlu içerik ve işletme tanıtımları önemli bir gelir kaynağıdır; bu nedenle yalnızca sabit reklam alanları değil, **yönetilebilir bir ticari kampanya sistemi** kurulur — ancak organik içerik ve güven her zaman önceliklidir.

### A8.1 Ticari ürün taksonomisi

| Ürün | Tanım | Etiket türü | MVP |
|---|---|---|---|
| Sponsorlu içerik | Ücret/menfaat karşılığı hazırlanmış makale, tanıtım, rehber, şehir/destinasyon rehberi, markaya özel içerik serisi | Sponsorlu içerik | Faz 1 (yönetici) |
| Sponsorlu tanıtım (v1: "sponsorlu ürün incelemesi", "sponsorlu mekan/restoran/otel/tur/araç kiralama tanıtımı") | Bir listelemenin sponsorlu anlatımı; **puanlama şablonu kullanılamaz** | Sponsorlu içerik | Faz 1 |
| Sponsorlu yerleşim | Var olan listeleme/içeriğin yuvada öne çıkarılması: ana sayfa, kategori üstü, arama sonucu, benzer seçenekler, şehir rehberi ortağı | Sponsorlu | Faz 1 |
| Sponsorlu marka sayfası | Kuruluş sayfasının zenginleştirilmiş sürümü | Sponsorlu | Faz 3 |
| Sezonluk kampanya / fırsat | Sponsorun sunduğu `Deal` (koşullu, tarihli) | Sponsorlu + fırsat koşulları | Faz 1 (yönetici) |
| Display reklam (reklam ağı) | Gösterim bazlı banner | Reklam | Kapsam dışı |
| Affiliate bağlantısı | Ek A9 | Ortaklık bağlantısı | Faz 1 |
| Teklif talebi (lead) | Ek A9 | — | Faz 3 |

### A8.2 Ticari ilişki açıklama sistemi (kod düzeyinde ZORUNLU)

- Her içerik, yerleşim, kreatif ve dış bağlantıda `commercialRelation` alanı ZORUNLU ve null olamaz: `NONE | SPONSORED | AFFILIATE | GIFTED | OWNER_PROVIDED`.
- Değer `NONE` dışındaysa etiket **otomatik** basılır; editör etiketi kaldıramaz, gizleyemez, rengini/boyutunu değiştiremez. Etiket metinleri admin'den serbest girilmez; sabit sözlükten gelir ve `compliance_config` üzerinden (hukuki onayla) güncellenir.

| Durum | Kart etiketi (varsayılan) | Detay sayfası açıklaması (varsayılan, TASLAK) |
|---|---|---|
| Sponsorlu içerik | **Sponsorlu içerik** | "Bu içerik {Sponsor} ile ücretli iş birliği kapsamında hazırlanmıştır. {Sponsor} yayından önce içeriği gördü / görmedi." |
| Sponsorlu yerleşim | **Sponsorlu** | "Neden bunu görüyorum?" → "{İşletme} bu alanda görünmek için ödeme yaptı. Sponsorluk puanları ve organik sıralamayı etkilemez." |
| Ücretsiz ürün/konaklama/davet | **İş birliği** (hukuki incelemeyle "Reklam" olabilir) | "Bu inceleme için ürün/konaklama {Firma} tarafından ücretsiz sağlanmıştır." |
| Affiliate | **Ortaklık bağlantısı** (CTA'nın hemen yanında) | "Bu bağlantı üzerinden yapılan alışverişlerden komisyon alabiliriz; bu, değerlendirmemizi etkilemez." ("Fiyat senin için değişmez" ifadesi yalnızca sağlayıcı sözleşmesiyle teyit edildiyse.) |
| Display reklam (gelecek) | **Reklam** | — |

> **Hukuki not (L-kaydı):** Türk reklam mevzuatındaki güncel düzenlemeler sponsorlu içerikte belirli bir ibarenin ("Reklam" gibi) zorunlu kullanılmasını gerektirebilir. Etiket sözlüğü hukuk incelemesiyle kesinleşene kadar yukarıdaki varsayılanlar kullanılır; değişiklik yalnızca yapılandırma güncellemesidir (Ek D1).

**Görsel kurallar:** Etiket **metin olarak** yazılır (yalnızca ikon/renk yetmez); kartın sol üstünde ya da başlıktan hemen önce; gövde metninin en az %85'i boyutunda ve ≥ 12 px; kontrast ≥ 4.5:1; hover gerektirmez; kapatılamaz; "devamını oku" arkasına, dipnota ya da yalnızca tooltip'e konamaz. Ekran okuyucu önce etiketi okur ("Sponsorlu: {ad}"). Aynı etiket web, mobil, bülten, push ve Open Graph başlığı/görselinde bulunur.

### A8.3 Yerleşim sınırları (yönetim panelinden **düşürülebilir, yükseltilemez**)

| Yüzey | Üst sınır | Konum ve alaka kuralı |
|---|---|---|
| Ana sayfa | ≤ 2 sponsorlu modül; tüm kartların ≤ %20'si | Arama kutusunun üstünde sponsorlu öğe yok; 390×844 ilk ekranda ≤ 1 sponsorlu kart; "Editörün seçtikleri" modülü sponsorlu öğe içeremez |
| Kategori/keşif listesi | Her 10 kartta ≤ 2; ardışık iki sponsorlu yok | Varsayılan yuvalar 3. ve 8. sıra; organik sıra numarası sponsoru saymaz; aktif filtreleri karşılamayan sponsorlu öğe gösterilmez |
| Arama sonuçları | Sayfa başına ≤ 2; ilk 10 içinde ≤ 1 | Sorgunun konum/kategori/filtresiyle eşleşmeyen sponsorlu sonuç **asla** gösterilmez |
| Harita | Görünür alanda ≤ 1 sponsorlu pin | Farklı pin stili + etiket |
| Rehber/Haber içerik gövdesi (sponsorlu yuva bloğu, ör. "şehir rehberi ortağı") | ≤ 1 | Bölümler arasında, etiketli; Liste, Karşılaştırma ve İnceleme içeriklerinde 0 |
| Listeleme detay sayfası | ≤ 1 rakip sponsorlu kutu | Sayfanın alt yarısında, "Benzer seçenekler" listesinin dışında |
| Editoryal Liste ("En iyiler") ve karşılaştırma tablosu | **0** | Listenin/tablonun içinde sponsorlu öğe yok |
| Değerlendirme alanı/formu, hesap sayfaları, moderasyon akışları | **0** | — |
| Push / e-posta | Yalnızca ilgili ticari ileti izni olanlara | Metnin başında etiket; bildirim sıklık sınırına dahil |

### A8.4 Kampanya yaşam döngüsü ve yönetim

**Durumlar:** `TASLAK → ONAY_BEKLİYOR → ONAYLANDI → PLANLANDI → YAYINDA → DURAKLATILDI → TAMAMLANDI → ARŞİV` (+ `İPTAL`). Onay adımları: satış (ticari bilgiler) → editoryal (içerik, etiket, kategori uygunluğu, `sponsorshipAllowed`) → gerekiyorsa hukuk kontrol listesi.

**Kampanya alanları (v1 §9'un tamamı):** sponsor kuruluş, kampanya adı, hedef kategori(ler), hedef şehir/lokasyon, gösterim alanları (yuvalar), başlangıç–bitiş tarihi, durum, görsel ve içerik (kreatifler), hedef URL (dış yönlendirme servisine bağlı), bütçe/anlaşma tutarı (kuruş + para birimi; yalnızca yönetici görür), sözleşme referansı, gösterim sayısı, tıklama sayısı, tıklama oranı, başarılı yönlendirme ölçümü (yalnızca sağlayıcı dönüşüm verisi varsa), kampanya raporu.

| ID | Düzey · Faz | Gereksinim |
|---|---|---|
| REQ-SPN-001 | ZORUNLU · 1 | Yerleşim modeli: `placement_slots` (anahtar, yüzey, sayfa türü, pozisyonlar, izin verilen türler, maks. öğe), `campaigns`, `campaign_placements` (yuva, hedef kategori/bölge, hedef listeleme/içerik, öncelik, ağırlık), `creatives` (başlık, metin, görsel, hedef dış bağlantı, etiket türü, onay durumu). Yuva kataloğu panelden yönetilir; render noktaları kodda sabittir. |
| REQ-SPN-002 | ZORUNLU · 1 | Sponsorlu yerleşimler organik listeye **eklenmez**; API ayrı dizi döner: `{ data: [...organik], sponsored: [{ position, item, disclosure }] }`. Aynı listeleme hem organik hem sponsorlu görünebilir; organik pozisyonu değişmez. |
| REQ-SPN-003 | ZORUNLU · 1 | Kart DTO'larında `commercial` alanı ZORUNLU ve null olamaz; web/mobil kart bileşeni `commercial.type !== 'NONE'` iken etiket render etmeden derlenmez (zorunlu prop). **Kabul:** her yüzey için E2E'de etiket görünür ve erişilebilir adla okunur. |
| REQ-SPN-004 | ZORUNLU · 1 | A8.3 sınırları ve alaka kuralları sunucuda zorlanır; panelden aşılamaz (birim + E2E). |
| REQ-SPN-005 | ZORUNLU · 1 | Yalnızca `status=YAYINDA` ve `startsAt ≤ now < endsAt` yerleşimler döner; bitişten sonra ≤ 60 sn içinde hiçbir yüzeyde görünmez (REQ-MIM-014). |
| REQ-SPN-006 | ZORUNLU · 1 | `sponsorshipAllowed=false` kategoride yerleşim/sponsorlu içerik oluşturulamaz; kısıtlı kategoriler (sağlık, alkol, tütün, bahis, finans, ilaç/takviye vb.) varsayılan kapalıdır (Ek D1). |
| REQ-SPN-007 | ZORUNLU · 1 | Sponsorlu içerikte editör puanı, puan kutusu, "Editörün seçimi", "En iyi", "Kazanan" rozetleri **render edilmez** (tip + test). |
| REQ-SPN-008 | ZORUNLU · 1 | Yuva rekabeti: aynı yuva için birden çok aktif kampanyada ağırlıklı rotasyon (deterministik, istek başına tohumlu); adil pay raporlanır. Frekans sınırı Faz 3 (İSTEĞE BAĞLI). |
| REQ-SPN-009 | ZORUNLU · 1 | **Ölçüm tanımları:** *Sunulan* (sunucu yerleşimi döndürdü), *Görüntülenen* (öğenin ≥ %50'si ≥ 1 sn görünür alanda — IntersectionObserver; endüstri tanımına uygunluğu doğrulanır), *Tıklama* (dış yönlendirme servisi üzerinden). Raporlar "görüntülenen gösterim"i esas alır ve tanımı rapor sayfasında yazar. |
| REQ-SPN-010 | ZORUNLU · 1 | Olaylar **yalnızca gerçek** kayıtlardan; botlar (bilinen UA listeleri, önceden getirme istekleri, başsız tarayıcı işaretleri) ve personel/önizleme trafiği ayıklanır; tekilleştirme penceresi (aynı oturum + yerleşim için gösterimde 30 dk, tıklamada 30 sn); demo/sentetik olaylar ayrı işaretli ve raporsuz. |
| REQ-SPN-011 | ZORUNLU · 1 | **Kampanya raporu:** günlük toplamlar (görüntülenen gösterim, tıklama, TO), yuva ve yüzey kırılımı, veri tazeliği zaman damgası ("Son güncelleme: …"), CSV dışa aktarma; "tahmini" değerler ayrı ve etiketli; dönüşüm verisi yoksa "Dönüşüm verisi yok" yazar; kişisel veri içermez. Sahte/örnek sayı gösterilmez (AK-02). |
| REQ-SPN-012 | ZORUNLU · 1 | Hedefli/kişiselleştirilmiş sponsorlu yerleşim yalnızca rızaya bağlı ve yalnızca bağlamsal (sayfa, şehir, kategori) sinyallerle; "Neden bunu görüyorum?" açıklaması her yerleşimde. Davranışsal hedefleme Faz 4 ve KVKK incelemesiyle. |
| REQ-SPN-013 | ZORUNLU · 1 | Tüm kampanya, yerleşim, kreatif, tutar ve durum değişiklikleri denetim kaydına yazılır. |

---

## A9 — Dış yönlendirme, affiliate, entegrasyonlar, fiyat ve müsaitlik (AFF / ENT)

### A9.1 Kategoriye uygun CTA

Her listeleme türünün izinli CTA seti Ek A4.4'tedir. Desteklenen eylem türleri: affiliate bağlantısı, otel rezervasyon bağlantısı, araç kiralama bağlantısı, tur/aktivite sağlayıcısına yönlendirme, restoran rezervasyon bağlantısı, ürün satın alma bağlantısı, telefonla arama (`tel:`), web sitesine gitme, mesajlaşma bağlantısı (işletmenin dış kanalı), yol tarifi, teklif/fiyat talebi (Faz 3), platform içi rezervasyon ve ödeme (**kapsam dışı**). Bağlamsız CTA YASAK.

### A9.2 Dış yönlendirme servisi

| ID | Düzey · Faz | Gereksinim |
|---|---|---|
| REQ-AFF-001 | ZORUNLU · 1 | Tüm ticari ve ticari olmayan dış bağlantılar merkezi kayıttadır: `outbound_links` (listeleme/içerik, entegrasyon sağlayıcısı, tür: affiliate/booking/purchase/website/phone/messaging/map/quote_request, hedef URL şablonu, alt kimlik (sub-ID) şablonu, `commercialRelation`, geçerlilik tarihleri, durum, oluşturan). |
| REQ-AFF-002 | ZORUNLU · 1 | Yönlendirme uç noktası `GET /git/{linkId}?ctx={imzalı bağlam}` → 302. Hedef **yalnızca veritabanından** okunur; istekten gelen URL'ye yönlendirme YAPILMAZ (açık yönlendirme yok). Hedef alan adı sağlayıcının `allowedDomains` listesinde değilse yönlendirme yapılmaz ve alarm üretilir. **Kabul:** keyfi URL'ye yönlendirme denemeleri (parametre enjeksiyonu, `//evil.com`, `https:evil.com`, Unicode alan adları) başarısız olur (güvenlik testi). |
| REQ-AFF-003 | ZORUNLU · 1 | Yanıt başlıkları: `Cache-Control: no-store`, `Referrer-Policy: strict-origin-when-cross-origin`, `X-Robots-Tag: noindex`; `/git/` robots.txt'de `Disallow`. Yönlendirme gecikmesi p95 < 50 ms; tıklama kaydı asenkron. |
| REQ-AFF-004 | ZORUNLU · 1 | HTML'de ticari bağlantılar `rel="sponsored noopener"` (+ gerekirse `nofollow`); yeni sekmede açılıyorsa `noopener noreferrer`; affiliate CTA'nın hemen yanında "Ortaklık bağlantısı" açıklaması (A8.2). |
| REQ-AFF-005 | ZORUNLU · 1 | `outbound_clicks`: zaman, bağlantı, yüzey, sayfa türü, yuva/yerleşim (varsa), günlük tuzlu oturum karması (ham IP saklanmaz), üye kimliği yalnızca rıza varsa, bot işareti, tekilleştirme anahtarı; aylık bölümlü. Aynı oturum + bağlantı için 30 sn içinde tek tıklama; önceden getirme (`Sec-Purpose: prefetch`) ve bot tıklamaları raporlara girmez. |
| REQ-AFF-006 | ZORUNLU · 1 | Sağlayıcıya özel kampanya ve alt kimlik parametreleri şablonla eklenir (ör. `{subId}` = yerleşim/sayfa kodu; kişisel veri İÇERMEZ). |
| REQ-AFF-007 | ZORUNLU · 1 | **Bağlantı sağlığı:** periyodik kontrol (HEAD/GET, SSRF korumalı — yalnızca izinli alanlar, özel IP aralıkları engelli), kırık/yönlendirilmiş/süresi dolmuş bağlantılar için editör uyarısı; süresi dolan bağlantı otomatik devre dışı. |
| REQ-AFF-008 | ZORUNLU · 1 | "Başarılı yönlendirme/dönüşüm" yalnızca sağlayıcı dönüşüm verisi (postback ya da rapor içe aktarma) varsa raporlanır; tahmini komisyon ile onaylı komisyon ayrı gösterilir; veri yoksa "Dönüşüm verisi yok". |
| REQ-AFF-009 | ZORUNLU · 1 | Affiliate ilişkisi sıralamayı, puanı ve editoryal seçimi etkilemez (AK-04); aynı ürün için birden çok satıcı varsa sıralama fiyat/teslim gibi kullanıcı yararına ölçütlerle yapılır, komisyon oranıyla **yapılmaz** (test). |

### A9.3 Entegrasyon katmanı

- **Port/adaptör mimarisi:** her sağlayıcı türü için arayüz: `LodgingAvailabilityPort`, `CarRentalQuotePort`, `ExperienceAvailabilityPort`, `RestaurantReservationPort`, `ProductOfferFeedPort`, `MapsGeocodingPort`, `EmailPort`, `PushPort` (Faz 2), `PaymentPort` ve `InvoicingPort` (yalnızca arayüz; kapsam dışı).
- Her sağlayıcı kaydı: `integrationStatus` (`LINK_ONLY | SANDBOX | LIVE | DISABLED`), resmî doküman URL'si, kullanım şartları URL'si ve doğrulama tarihi, izinli alan adları, önbellek/saklama süresi sınırı (şartlardan), kota, kimlik bilgisi değişken ADLARI.
- **Hiçbir sağlayıcının API'sinin mevcut olduğunu varsayma.** Önce resmî dokümanını, erişim şartlarını, kullanım izinlerini ve ticari koşullarını §13.3 ile doğrula; aday sağlayıcılar Ek D2'de "doğrulanacak" olarak listelenir.
- API erişimi yoksa entegrasyon hazırmış gibi gösterilmez; alternatif: yönlendirme bağlantısı (`LINK_ONLY`), işletme iletişim bilgisi ya da manuel yönetilen kayıt.
- Yetkisiz scraping YASAK; dış servislerden veri alırken kullanım koşulları ihlal edilmez (AK-07).

| ID | Düzey · Faz | Gereksinim |
|---|---|---|
| REQ-ENT-001 | ZORUNLU · 1 | Her port için `MOCK` adaptör (yalnızca yerel/test; üretim derlemesinde YASAK, §12.8) ve **sözleşme testleri**; gerçek adaptörler Faz 3'te ve yalnızca kimlik bilgisi sağlanırsa. |
| REQ-ENT-002 | ZORUNLU · 1 | Adaptörlerde zaman aşımı (varsayılan 3 sn), sınırlı yeniden deneme (üstel geri çekilme), devre kesici; hata durumunda kullanıcıya fiyat/müsaitlik **gösterilmez**, "Güncel fiyat ve müsaitlik için {Sağlayıcı}'ya bakın" yolu sunulur (E2E-008). |
| REQ-ENT-003 | ZORUNLU · 3 | Sağlayıcı yanıtları ham olarak loglanmaz (kişisel veri/sözleşme kısıtları); yalnızca özet ve hata kodları. |

### A9.4 Fiyat ve müsaitlik gösterimi

| ID | Düzey · Faz | Gereksinim |
|---|---|---|
| REQ-ENT-010 | ZORUNLU · 1 | Listelemede sabit "fiyat" alanı yoktur; yalnızca göreli fiyat seviyesi (₺–₺₺₺₺) ve isteğe bağlı editoryal fiyat aralığı (`observedAt` + kaynak notuyla). |
| REQ-ENT-011 | ZORUNLU · 1 | Fiyat gösterilen her yerde: **kaynak** ("{Sağlayıcı}" / "İşletme beyanı" / "Editör gözlemi"), **son güncelleme zamanı**, fiyatı değiştiren **parametreler** (tarih, kişi sayısı, oda tipi, araç sınıfı, teslim noktası), para birimi. |
| REQ-ENT-012 | ZORUNLU · 1 | `validUntil` geçmiş fiyat "güncel" olarak dönmez: API `price: null, priceStatus: 'STALE', lastKnown: {…}` döner; arayüz "Son bilinen fiyat ({tarih}) — güncel fiyat için sağlayıcıya bak" der. Varsayılan tazelik: canlı otel/araç API'si 30 dk, ürün feed'i 24 saat, manuel giriş 30 gün — sağlayıcı şartlarındaki önbellek süresinden uzun olamaz. |
| REQ-ENT-013 | ZORUNLU · 1 | Gerçek müsaitlik **yalnızca** güvenilir sağlayıcı yanıtında ve kullanıcının sorgu parametreleriyle eşleşen kayıtta gösterilir; statik içerikten görsel olarak ayrılır ("Canlı · {Sağlayıcı} · {saat}"). |
| REQ-ENT-014 | ZORUNLU · 1 | Dış serviste gerçekleşen işlem platform tarafından doğrulanamıyorsa "Rezervasyonunuz tamamlandı" gibi bir durum gösterilmez; yalnızca "{Sağlayıcı} sitesine yönlendirildin" bilgisi. |
| REQ-ENT-015 | ZORUNLU · 1 | Konaklama arama formu: destinasyon, giriş–çıkış tarihi, yetişkin/çocuk sayısı (+ çocuk yaşları), oda sayısı, bütçe aralığı; araç kiralama formu: teslim alma ve bırakma noktası (farklı nokta seçeneği), tarih ve saat, araç sınıfı, sürücü yaşı. Canlı veri yoksa form sağlayıcıya parametreli yönlendirme ya da filtreleme için kullanılır; "müsait" iddiası üretmez. |
| REQ-ENT-016 | ZORUNLU · 1 | Fırsat (`Deal`) gösterimi: kaynak, geçerlilik tarihi, koşullar, (indirimse) referans fiyatın dayanağı; süresi dolan fırsat otomatik kalkar; indirim gösterim kuralları hukuki incelemeye tabidir (Ek D1). |

---

## A10 — Yönetim paneli (ADM)

WordPress yönetim paneli kullanılmaz; projeye özel arayüz geliştirilir (AK-13). Panel platformun günlük operasyonlarını tek yerden yönetir.

**Modüller (v1 §11'in tamamı; fazlar §7.1'de):** 1 Genel kontrol paneli · 2 İçerik oluşturma/düzenleme · 3 Kategori ve etiket yönetimi · 4–8 Listeleme yönetimi (ürün veritabanı, işletme ve mekanlar, konaklama, araç kiralama firmaları, tur ve turist rehberleri — tek modülde türe göre formlar) · 9 Kullanıcı hesapları · 10 Değerlendirme moderasyonu · 11 Şikâyet ve itiraz yönetimi · 12 Sponsorlu içerikler · 13 Sponsorluk kampanyaları · 14 Affiliate/dış bağlantılar · 15 Dış API entegrasyonları · 16 Medya kütüphanesi · 17 Ana sayfa düzenleme · 18 Menü ve navigasyon · 19 SEO alanları ve yönlendirmeler · 20 Bildirim yönetimi · 21 Analitik ve trafik raporları · 22 Kampanya ve gelir raporları · 23 Roller ve izinler · 24 Sistem ayarları (+ `compliance_config`, yayın eşikleri, yerleşim sınırları) · 25 Denetim kayıtları · **Ek:** 26 Tazelik kuyruğu · 27 İşletme/reklam başvuruları · 28 KVKK başvuruları ve kaldırma talepleri · 29 Toplu içe aktarma · 30 Özellik bayrakları ve hukuki kapılar (salt okunur durum + talep).

| ID | Düzey · Faz | Gereksinim |
|---|---|---|
| REQ-ADM-001 | ZORUNLU · 1 | Panel ayrı uygulama/alt alan adında; yalnızca personel; 2FA zorunlu (REQ-HSP-007); `noindex`; IP izin listesi İSTEĞE BAĞLI. |
| REQ-ADM-002 | ZORUNLU · 1 | Genel pano yalnızca gerçek sayaçlar gösterir: bekleyen moderasyon, tazelik kuyruğu, bekleyen başvurular, aktif kampanyalar, son 7 gün olay özetleri; veri yoksa "Veri yok". |
| REQ-ADM-003 | ZORUNLU · 1 | Tablolarda arama, filtre, sıralama, sayfalama, toplu işlem (onaylı + denetim kaydı), CSV dışa aktarma (yetkili roller, step-up). |
| REQ-ADM-004 | ZORUNLU · 1 | Formlar şemadan (zod) doğrulanır; kategori şemasına göre dinamik özellik alanları; kaydetmeden çıkış uyarısı; eşzamanlı düzenleme çakışmasında (412) fark gösterimi. |
| REQ-ADM-005 | ZORUNLU · 1 | Medya kütüphanesi: yükleme, odak noktası seçimi, alt metin (ZORUNLU, Türkçe), lisans alanları (ZORUNLU), kullanım yerleri, yeniden kullanım, lisans süresi dolan görseller için uyarı. |
| REQ-ADM-006 | ZORUNLU · 1 | Ana sayfa düzenleyici: modül ekle/sırala/gizle, veri kaynağı (editoryal seçim/kural/kişisel/sponsorlu), görünürlük kuralları (tarih, şehir, platform), önizleme; sponsorlu sınırları aşan yapılandırma kaydedilemez. |
| REQ-ADM-007 | ZORUNLU · 1 | SEO alanları: başlık, açıklama, canonical geçersiz kılma (yalnızca yönetici), `noindex`, OG görseli, yapılandırılmış veri önizlemesi; yönlendirme yönetimi (301/410, zincir uyarısı). |
| REQ-ADM-008 | ZORUNLU · 1 | Panel arayüzü Türkçe; panelin kendisi de erişilebilirlik ve klavye kullanımı gereksinimlerine tabidir (Ek A18). |
| REQ-ADM-010 | ZORUNLU · 1 | **Gelir raporu** (modül 22): kaynağa göre — sponsorluk anlaşma tutarları (elle girilen, yalnızca yönetici), affiliate komisyonu (tahmini ve onaylı ayrı; yalnızca sağlayıcı raporu/içe aktarma varsa), işletme paketleri (Faz 3); dönem filtresi, CSV; yalnızca gerçek ya da elle girilmiş veriden, kaynağı etiketli; veri yoksa "Veri yok". |
| REQ-ADM-011 | ZORUNLU · 2 | **Bildirim yönetimi** (modül 20): şablonlar (işlemsel/editoryal/ticari ayrımı), hedef kitle, sıklık sınırları ve sessiz saatlerle uyum, önizleme ve test gönderimi (yalnızca personel cihazlarına); gerçek kullanıcılara gönderim C sınıfı ve ticari iletiler ayrı onaya bağlı (A17.5). |
| REQ-ADM-009 | OLMALI · 1 | Editör iş akışları: bana atananlar, inceleme bekleyenler, yayın takvimi, tazelik görevleri; içerik kontrol listesi (kaynak, deneyim beyanı, menfaat beyanı, alt metin, iç bağlantı). |

---

## A11 — İşletme ve reklamveren portalı (ISL)

İlk sürümde (Faz 1) işletme ve sponsorluk kayıtları **yönetici/editör** tarafından oluşturulur; hesapsız başvuru formları vardır. İşletme ve reklamveren hesapları Faz 3'tedir; self-servis reklam satın alma ve ödeme **kapsam dışıdır** (ayrı İnsan kararı).

| ID | Düzey · Faz | Gereksinim |
|---|---|---|
| REQ-ISL-001 | ZORUNLU · 1 | **Hesapsız işletme başvuru formu** (`/isletmeni-ekle`): işletme adı, tür/kategori, adres ya da hizmet bölgesi, iletişim, başvuran adı ve görevi, kurumsal e-posta, (isteğe bağlı) belge yükleme, KVKK aydınlatma bağlantısı ve gerekli onaylar; e-posta doğrulaması; yönetici inceleme kuyruğu (onay → listeleme taslağı / ret + gerekçe). E2E-007. |
| REQ-ISL-002 | ZORUNLU · 1 | **Hesapsız reklam/sponsorluk başvuru formu** (`/reklam-ve-sponsorluk`): kuruluş, iletişim, ilgilenilen ürünler (A8.1), hedef şehir/kategori, bütçe aralığı (isteğe bağlı), mesaj; ticari ileti izni ayrı ve isteğe bağlı kutu; yönetici kuyruğu. |
| REQ-ISL-003 | ZORUNLU · 3 | İşletme hesabı: sahiplenme (`/isletmeni-sahiplen/{slug}`) + doğrulama (REQ-GUN-011); profil bilgisi güncelleme **önerisi** (editör onayıyla yayımlanır); fotoğraf ve belge gönderme (lisans beyanıyla); değerlendirmelere yanıt; soru-cevap yanıtları; basit istatistikler (görüntüleme, dış yönlendirme tıklamaları — yalnızca gerçek veri). |
| REQ-ISL-004 | ZORUNLU · 3 | Reklamveren portalı: kampanya başvurusu oluşturma, başvuru durumunu takip, onaylanan kampanyaların performansını görüntüleme (REQ-SPN-011), sözleşme/fatura belgelerini görüntüleme (manuel yüklenen). Kampanya satın alma ve ödeme: kapsam dışı (`PaymentPort` yalnızca arayüz). |
| REQ-ISL-005 | ZORUNLU · 3 | İşletme paketleri (ücretsiz/ücretli seviyeler) yönetim panelinden tanımlanır; **hiçbir paket** puanı, organik sıralamayı, değerlendirme görünürlüğünü ya da moderasyonu etkileyemez (AK-04) — paket özellikleri sözleşme dilinde ve testle sınırlanır. |
| REQ-ISL-006 | ZORUNLU · 3 | İşletme tarafından gönderilen içerik, doğrulama ve editoryal onaydan geçmeden yayımlanmaz; `dataOrigin=OWNER`, `commercialRelation=OWNER_PROVIDED` olarak işaretlenir ve "İşletme tarafından sağlandı" ibaresiyle gösterilir. |
| REQ-ISL-007 | ZORUNLU · 3 | Kuruluş üyeliği davetle; roller OWNER/MANAGER/AD_MANAGER; erişim kuruluş kapsamlı (REQ-HSP-010). |
