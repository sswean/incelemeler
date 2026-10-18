# Bulgular — Ürün, bilgi mimarisi ve kullanıcı deneyimi (product-ux)

## Özet

v1 vizyon, kategori listesi ve sayfa adları açısından geniş; ancak ürün ve UX kararlarının neredeyse tamamı ajana bırakılmış. Sonuç büyük olasılıkla tutarsız bir ürün olur. En kritik beş boşluk şunlar:

1. **Kavramsal model yok.** v1 "varlık" (değerlendirilen mekan/ürün/işletme), "editoryal içerik" (rehber/liste/karşılaştırma), "editör değerlendirmesi", "kullanıcı değerlendirmesi" ve "ticari yerleşim" kavramlarını birbirine karıştırıyor. "Rehber" kelimesi hem kişi (turist rehberi) hem yazı anlamında kullanılıyor. Kategori listesi de varlık tiplerini, özellikleri ("aile dostu", "balayı") ve içerik türlerini ("şehir rehberleri") aynı ağaçta topluyor.
2. **IA, URL ve Türkçe yerelleştirme kuralları yok.** Slug, i/İ–ı/I, ek uyumu ("İzmir'de / Kars'ta"), para, tarih ve puan biçimi tanımlanmamış. Node 22 / ICU 77 ile doğrulandı: `"İ".toLowerCase()` 2 karakter döndürüyor; `Intl` ise TRY'yi `₺1.234,56` biçiminde veriyor.
3. **Puan ölçeği kararsız ("10 veya 5"); kriterler ve eşikler tanımsız.** Değerlendirme yazma akışı, durum makinesi ve az veri durumları da yok. 2026'da yeniden düzenlendiği bildirilen tüketici değerlendirmesi mevzuatı, doğrulama ve yayın kurallarını doğrudan etkileyebilir; bu bilgi doğrulanmadı.
4. **Sponsorlu–organik dengesi ölçülebilir değil.** v1 "dengeli yapı" diyor ama sayısal sınır, konum kuralı, etiket sözlüğü ve kişiselleştirme sınırı koymuyor. v1'deki örnek aramalar ("Antalya'da denize yakın uygun fiyatlı oteller") düz tam metin aramayla karşılanamaz ve "yapay zekâ sonraki fazda" kararıyla çelişiyor.
5. **Persona, kullanıcı yolculuğu, ekran envanteri ve kabul kriteri yok.** E2E senaryoları yönetici ağırlıklı. MVP tüm dikeyleri aynı anda açmayı öngörüyor; bu, inceleme platformlarının en büyük riski olan soğuk başlangıcı (boş görünen platform) büyütüyor.

Bu dosyadaki 35 bulgu, her konuda varsayılan bir karar, sayısal eşik ve kabul kriteri öneriyor. Ajan bir kararı değiştirebilir ama bunu bir karar kaydıyla (ADR) yapmalıdır.

## Yapı önerileri

1. v2'nin başına **"0. Varsayılan Ürün Kararları"** tablosu ekle: hitap (sen/siz), puan ölçekleri, URL kalıpları, MVP dikey ve şehirleri, sponsorlu oran sınırları. Ajan bunları ancak `docs/adr/` altında gerekçeli bir karar kaydıyla değiştirebilsin.
2. Kategori bölümünden (v1 §4) önce bir **"Sözlük ve kavramsal model"** bölümü koy: Varlık / Editoryal içerik / Editör değerlendirmesi / Kullanıcı değerlendirmesi / Ticari yerleşim / Teklif / Koleksiyon. v1 §4'ü "Varlık tipleri – Kategori ağacı – Özellikler – İçerik türleri – Koleksiyon sayfaları" eksenlerine böl.
3. Sayfa yapısından (v1 §5) önce **"Personalar, JTBD ve kullanıcı yolculukları"** bölümü gelsin. Sayfa ve ekran listesi bu yolculuklardan türetilsin, düz liste olarak verilmesin.
4. v1 §8'deki "İçerik detay sayfası" listesini **varlık tipi başına sayfa şablonu tablosuna** dönüştür (zorunlu alanlar, ekranın üst kısmı, birincil/yasak CTA, tazelik alanı).
5. Ayrı bir **"Türkçe yerelleştirme ve metin standardı"** bölümü ekle: biçimler, büyük/küçük harf, slug, ek uyumu, hitap, mikro metin, yasak karanlık örüntüler.
6. Ayrı bir **"Durum tasarımı"** bölümü ekle: boş, az veri, bayat veri, kapalı işletme, hata, çevrimdışı ve yetkisiz durumlar; her biri için metin ve eylem.
7. Ticari görünürlük kurallarını v1 §5, §9 ve §10'a dağıtma; **tek bir "Ticari yerleşim kuralları" tablosunda** yüzey başına sayısal sınırlarla topla.
8. Her ana bölüm **"Kabul kriterleri"** kontrol listesiyle bitsin. Sona, yolculuk kimliklerine (Y1…Y12) bağlanan bir **kabul kriterleri matrisi** eklensin.
9. Faz planı (v1 §19) tabloya dönüşsün: her faz için "kullanıcı değeri", "çıkış kriteri" ve "kapsam dışı".
10. Proje çıktılarına (v1 §21) ürün ve UX dokümanlarını ekle: `docs/product/personalar.md`, `docs/product/sozluk.md`, `docs/ux/ia.md` (URL tablosu ve site haritası), `docs/ux/ekranlar/*.md`, `docs/ux/metin-rehberi.md`, `docs/adr/*`.
11. "Varsayılan kararlar" ile "Doğrulanması gerekenler" (hukuki/teknik inceleme listesi) ayrı başlıklarda dursun. Mevzuat ve mağaza politikalarına dayanan UX kuralları, kaynak URL'si ve doğrulama durumuyla işaretlensin.

## Bulgular

### PRODUCT-UX-01 — Persona ve "yapılacak iş" (JTBD) matrisi yok
- v1 bölüm: YENİ  ·  tür: eksik  ·  öncelik: P0  ·  doğrulandı: evet (dış olgu iddiası yok)
- Gerekçe: v1 kullanım senaryolarını sayıyor ama kimin, hangi bağlamda, hangi bilgiyle karar verdiğini tanımlamıyor. Bu yüzden sayfa içerikleri, MVP kapsamı ve önceliklendirme ajanın keyfine kalıyor. İşletme sahibi, reklamveren, editör ve moderatör ise yalnızca "rol" olarak geçiyor; ihtiyaçları ve iş akışları tanımsız.
- Kaynaklar: —
- Önerilen metin:

**PERSONALAR VE YAPILACAK İŞLER (JTBD)**

Bilgi mimarisini, sayfa şablonlarını ve MVP kapsamını aşağıdaki personalardan türet. Her ekran ve özellik için "hangi persona, hangi iş" sorusunu `docs/product/personalar.md` dosyasında yanıtla. Hiçbir personanın işine hizmet etmeyen özelliği MVP'ye alma.

| Kod | Persona | Bağlam | JTBD ("...olduğunda ...istiyorum ki ...") | Karar için kritik bilgi | Başarı sinyali (olay) | Faz |
|---|---|---|---|---|---|---|
| P1 | Tatil planlayan (aile/çift) | 2–8 hafta önceden; masaüstü + mobil; birden çok oturum | Tatil bölgesi ve otel seçerken seçenekleri bütçeme ve ihtiyacıma göre güvenilir yorumlarla daraltmak istiyorum ki pişman olmayayım | Konum ve denize/merkeze mesafe, pansiyon tipi, çocuk olanakları, kaynaklı ve tarihli fiyat aralığı, son 12 ay yorumları, ulaşım | `save`, `outbound_click{tip:rezervasyon}`, 7 gün içinde geri dönüş | 1 |
| P2 | Yerel mekan arayan | Şehirde, anlık, mobil; 0–2 saat içinde gidecek | Şu an veya bu akşam yakınımda açık ve ihtiyacıma uygun bir mekan bulmak istiyorum ki zaman kaybetmeyeyim | Şu an açık mı, mesafe, fiyat seviyesi, son yorumlar, fotoğraflar, telefon/rezervasyon | Oturumun ilk 3 dakikasında `outbound_click{tip:yol_tarifi\|telefon\|rezervasyon}` | 1 |
| P3 | Ürün alıcısı | Birkaç gün süren araştırma; karşılaştırma | Bütçeme uygun doğru modeli seçip nereden alacağıma karar vermek istiyorum ki param boşa gitmesin | Bizzat test bilgisi, teknik özellik karşılaştırması, artı/eksi, kime uygun olduğu, güncel fiyat kaynakları | `compare_view`, `affiliate_click` | 1 |
| P4 | Hizmet arayan (kuaför, temizlik, taşınma, araç kiralama) | Ara sıra ihtiyaç; risk algısı yüksek | Güvenebileceğim bir sağlayıcı seçip iletişime geçmek istiyorum ki sürprizle karşılaşmayayım | Hizmet bölgesi, fiyat şeffaflığı, gizli ücret/depozito, doğrulanmış işletme | `contact_click`, `quote_request` (Faz 3) | 1 |
| P5 | Katkıda bulunan kullanıcı | Deneyim sonrası, çoğunlukla mobil | Deneyimimi hızlı ve adil biçimde paylaşmak istiyorum ki başkaları yararlansın | Kolay form, yayın durumu, ret gerekçesi | `review_submitted` → `review_published` | 1 |
| P6 | İşletme sahibi | Kendi profilini sahiplenen | İşletmemin bilgileri doğru olsun ve yorumlara yanıt verebileyim istiyorum ki müşteri kaybetmeyeyim | Sahiplenme durumu, düzeltilebilir alanlar, yanıt kuralları | `claim_approved`, `owner_reply_published`, profil tamlık oranı | 2 |
| P7 | Reklamveren / ajans | Kampanya dönemleri | Doğru kitleye etiketli ve ölçülebilir görünürlük satın almak istiyorum ki bütçemin karşılığını göreyim | Yerleşim seçenekleri, hedefleme, gerçek olay bazlı rapor | `campaign_request_submitted`, rapor görüntüleme | 1 (admin eliyle) / 3 (self-servis) |
| P8 | Editör / yazar | Günlük üretim | Kod yazmadan doğru, güncel ve kaynaklı içerik yayımlamak ve güncel tutmak istiyorum | Blok editörü, varlık kartı gömme, tazelik kuyruğu | Taslaktan yayına süre, kuyruktaki bayat içerik sayısı | 1 |
| P9 | Moderatör | Günlük kuyruk | Bildirimleri ve yeni içerikleri hızlı ve tutarlı gerekçelerle sonuçlandırmak istiyorum | Risk sinyalleri, gerekçe kodları, geçmiş kararlar | Kuyruk yaşı, itirazda bozulan karar oranı | 1 |

**Kabul kriterleri:**
- `docs/product/personalar.md` var.
- Backlog'daki her MVP özelliği en az bir persona ve JTBD'ye bağlı.
- Her personanın en az bir uçtan uca yolculuğu var (bkz. PRODUCT-UX-28).

---

### PRODUCT-UX-02 — Kavramsal model ve sözlük: varlık, editoryal içerik, değerlendirme ve ticari yerleşim karışık
- v1 bölüm: 8  ·  tür: belirsiz  ·  öncelik: P0  ·  doğrulandı: evet (dış olgu iddiası yok)
- Gerekçe:
  - §8'deki "İçerik detay sayfası" hem değerlendirilen şeyi (mekan, ürün) hem yazıyı (rehber) anlatıyor.
  - §12'de ContentItems, Articles, Reviews ve Comments aynı listede, ilişkileri tanımsız.
  - "Rehber" hem kişi (turist rehberi) hem yazı türü anlamında; "yorum" hem değerlendirme hem tartışma anlamında kullanılıyor.
  - Bu belirsizlik veri modelini, URL'leri ve arayüz metinlerini birlikte bozar.
- Kaynaklar: —
- Önerilen metin:

**SÖZLÜK VE KAVRAMSAL MODEL** (bu bölüm diğer tüm bölümlerin üstündedir)

Aşağıdaki kavramları birbirinden ayır. Kod adlarını veri modelinde, Türkçe adları arayüzde tutarlı kullan. Sözlüğü `docs/product/sozluk.md` olarak teslim et.

| Kavram (kod adı) | Tanım | Arayüzdeki Türkçe ad | Kural |
|---|---|---|---|
| Varlık (`Entity`) | Değerlendirilen şey: mekan, konaklama, ürün, hizmet işletmesi, araç kiralama sağlayıcısı, turist rehberi (kişi), tur/aktivite, etkinlik, destinasyon/ilgi noktası | Türe göre: "Mekan", "Otel", "Ürün"... | Puan, fiyat, saat gibi canlı veriler varlığa aittir |
| Şube (`Location`) | Bir işletmenin fiziksel noktası | "Şube" | Zincirlerde her şube ayrı varlık sayfasıdır; marka sayfası ayrıdır |
| Marka/Kuruluş (`Organization`) | Zincir, üretici, operatör | "Marka" | Ürün → üretici markası; şube → zincir |
| Editoryal içerik (`EditorialContent`) | Anlatı: Rehber, Liste ("En iyiler"), Karşılaştırma, Uzun inceleme (test yazısı) | "Rehber", "Liste", "Karşılaştırma", "İnceleme" | Varlıklara gömülü varlık kartı bloğuyla bağlanır; yazının kendisi puan almaz |
| Editör değerlendirmesi (`EditorialVerdict`) | Bir varlık için editörün puanı, özeti, artı/eksileri ve deneyim türü | "Editör değerlendirmesi" | Varlık başına en fazla 1 güncel kayıt; geçmiş sürümler saklanır |
| Kullanıcı değerlendirmesi (`UserReview`) | Bir varlık için kullanıcının puanı, metni, kriter puanları ve deneyim bilgisi | "Değerlendirme"; sayaçta "128 değerlendirme" | Editör değerlendirmesiyle aynı tabloda tutulmaz, ortalaması birleştirilmez |
| İşletme yanıtı (`OwnerResponse`) | Doğrulanmış işletme sahibinin bir değerlendirmeye yanıtı | "İşletme yanıtı" | Değerlendirme başına 1 kayıt |
| Soru/Cevap (`Question`/`Answer`) | Varlık hakkında soru ve cevaplar | "Soru-cevap" | Bkz. PRODUCT-UX-25 |
| Yorum (`Comment`) | Editoryal yazı altındaki tartışma | — | **MVP'de yok.** Moderasyon maliyeti yüksek ve hiçbir personanın kritik işine hizmet etmiyor |
| Ticari yerleşim (`Placement`) | Sponsorlu kampanyanın bir yüzeydeki gösterimi | "Sponsorlu" | İçerik değildir; organik varlığa veya içeriğe referans verir |
| Sponsorlu içerik | Ücret veya menfaat karşılığı hazırlanmış editoryal içerik | "Sponsorlu içerik" | `EditorialContent` + zorunlu ticari ilişki kaydı + zorunlu etiket |
| Teklif (`Offer`) | Fiyat, müsaitlik veya kampanya bilgisi | "Fiyat", "Fırsat" | Kaynak ve zaman damgası zorunlu |
| Yönlendirme (`OutboundLink`) | Affiliate, rezervasyon, web, telefon, mesaj bağlantısı | CTA metni | Merkezi yönlendirme servisi üzerinden |
| Koleksiyon (`Collection`) | Kullanıcının kaydettiği öğelerden oluşan liste | "Kaydedilenler", "Listelerim" | Editoryal "Liste" ile karıştırılmaz |

**Kurallar:**
- Varlık sayfası ile yazı farklı şeylerdir. Varlık sayfası yapılandırılmış ve canlı veriden oluşur; yazı anlatıdır.
- "Rehber" kelimesini yalnızca yazı türü için kullan. Kişiler için arayüzde ve URL'de her zaman "Turist rehberi" veya "Yerel rehber" yaz.
- Arayüzde değerlendirme eylemi "Değerlendirme yaz" olsun. "Yorum" kelimesi yalnızca değerlendirmenin serbest metin kısmını anlatırken geçebilir.
- v1 §12'deki `Reviews` varlığını `EditorialVerdict` ve `UserReview` olarak ikiye ayır; `ContentItems`/`Articles` ile `Entity` ayrı kökler olsun. `Comments` MVP şemasına girmesin.

**Kabul kriterleri:**
- ER diyagramı bu ayrımı gösteriyor.
- i18n metin anahtarlarında sözlük dışı terim yok.
- "Rehber" kelimesi hiçbir kişi profilinde tek başına geçmiyor (otomatik metin kontrolü).

---

### PRODUCT-UX-03 — Kategori listesi varlık tipi, özellik ve içerik türü eksenlerini tek ağaçta karıştırıyor
- v1 bölüm: 4  ·  tür: hatalı  ·  öncelik: P0  ·  doğrulandı: evet (dış olgu iddiası yok)
- Gerekçe: v1 §4 aynı listede üç farklı şeyi topluyor:
  - Varlık tipleri ve kategoriler (Oteller, Pansiyonlar)
  - Özellikler (Aile dostu, Bütçe dostu, Lüks, Balayı, Vegan, Paket servis)
  - İçerik türleri (Şehir rehberleri, Gezi rotaları, İkinci el araç rehberleri)

  Bu haliyle uygulanırsa aynı otel "Aile dostu" ve "Lüks" kategorilerinde ayrı ayrı kopyalanır, filtreler çalışmaz, URL'ler çoğalır. "Kod yazmadan yeni kategori" isteği de sınırsız şablon esnekliği gibi okunabilir; ancak yeni bir varlık tipi şablon ve şema gerektirir.
- Kaynaklar: —
- Önerilen metin:

**KATEGORİ MODELİ: BEŞ EKSEN**

v1'deki kategori listesini aşağıdaki eksenlere ayırarak uygula.

1. **Varlık tipi** (kodla tanımlı, sınırlı; en fazla 12): Mekan (yeme-içme ve eğlence noktaları), Konaklama, Hizmet işletmesi, Araç kiralama sağlayıcısı, Turist rehberi (kişi), Tur/Aktivite, Ürün, Etkinlik, Destinasyon (il/ilçe/bölge), İlgi noktası (müze, plaj, doğa alanı). Eser (film/dizi/kitap/oyun) Faz 4+ adayıdır. Her varlık tipinin kendi şeması, sayfa şablonu, filtre seti ve değerlendirme kriterleri vardır. Yeni varlık tipi eklemek kod gerektirir ve bunu dokümante et.
2. **Kategori ağacı** (yönetim panelinden, kod gerekmez):
   - En fazla 3 seviye.
   - Her düğüm tam olarak bir varlık tipine bağlıdır.
   - Bir varlığın 1 birincil ve en fazla 3 ikincil kategorisi olur; hepsi aynı varlık tipindendir.
3. **Özellikler** (yönetim panelinden): Tipli alanlar (boolean, enum, sayı + birim). Her biri için "filtrelenebilir" ve "kartta gösterilir" bayrakları vardır. Örnek: aile dostu, denize sıfır, vegan seçenek, paket servis, evcil hayvan kabul, tekerlekli sandalye erişimi.
4. **İçerik türü** (editoryal): Rehber, Liste, Karşılaştırma, İnceleme. Konu etiketleriyle sınıflandırılır.
5. **Koleksiyon / keşif sayfası** (yönetim panelinden): Kayıtlı bir sorgu (varlık tipi + kategori + özellik + konum) ile editoryal giriş metninden oluşur. Örnek: "Balayı otelleri" = Konaklama ∧ özellik:balayına uygun. Ayrı bir kategori değildir.

v1 öğelerinin eşlemesi:

| v1 öğesi | Eksen |
|---|---|
| Oteller, Butik oteller, Tatil köyleri, Pansiyonlar, Apart oteller, Kiralık tatil evleri, Kamp ve karavan alanları | Konaklama → kategori |
| Balayı otelleri, Aile dostu, Bütçe dostu, Lüks konaklama | Özellik / fiyat seviyesi + koleksiyon sayfası |
| Şehir rehberleri, Gezi rotaları, Hafta sonu kaçamakları, Yurt içi/dışı seyahat rehberleri, İkinci el araç rehberleri, Şehir içi ulaşım rehberleri | İçerik türü: Rehber + konu etiketi |
| Tatil bölgeleri | Destinasyon |
| Gezilecek yerler, Plajlar ve doğal güzellikler, Kültürel mekanlar | İlgi noktası → kategori |
| Restoranlar, Kafeler, Kahvaltı mekanları, Fast food, Fine dining, Tatlıcılar ve pastaneler, Sokak lezzetleri | Mekan → kategori (mutfak türü ayrı enum özellik) |
| Vegan ve vejetaryen, Manzara ve özel gün, Paket servis | Özellik |
| Otomobil incelemeleri, Elektrikli otomobiller, Motosiklet ve scooter | Ürün → kategori: Otomobil / Motosiklet (elektrikli = yakıt tipi özelliği) |
| Araç kiralama şirketleri | Araç kiralama sağlayıcısı |
| Günlük ve uzun dönem kiralama, Havalimanı ulaşımı | Özellik / filtre |
| Transfer hizmetleri, Seyahat şirketleri, Temizlik, Taşınma, Kuaför, Güzellik merkezleri | Hizmet işletmesi → kategori |
| Profesyonel tur rehberleri, Yerel rehberler | Turist rehberi (kişi). Ayrım bir "ruhsat durumu" alanıyla yapılır |
| Özel/Yürüyüş/Tekne/Gastronomi/Fotoğraf turları, Doğa ve macera aktiviteleri | Tur/Aktivite → kategori |
| Konserler, Sergiler, Festivaller, Tiyatro | Etkinlik (tarihli) → kategori |
| Etkinlik mekanları | Mekan → kategori |
| Telefonlar … Aksesuarlar; Giyim … Parfümler; Ev eşyaları … Evcil hayvan ürünleri | Ürün → kategori |
| Film ve dizi, Dijital yayın platformları, Video oyunları, Kitaplar, Müzik | Eser / dijital hizmet (Faz 4+; telif ve meta veri lisansı ayrıca değerlendirilir) |

**Navigasyon:**
- Üst menüde en fazla 7 öğe olsun: Seyahat, Konaklama, Yeme-İçme, Ürünler, Hizmetler, Rehberler, Fırsatlar.
- Mega menü en fazla 2 seviye gösterir.
- Mobilde "Keşfet" sekmesinde en fazla 12 kutucuklu kategori ızgarası bulunur.
- İçeriği yayın eşiğinin altında kalan kategori menüde görünmez (bkz. PRODUCT-UX-30).

**Kabul kriterleri:**
- Aynı varlık iki kategori düğümünde ayrı kayıt olarak bulunmuyor.
- "Aile dostu" bir kategori değil, filtre ve koleksiyon olarak çalışıyor.
- Yönetici kod değiştirmeden yeni kategori, özellik ve koleksiyon ekleyebiliyor.
- Yeni varlık tipi ekleme adımları `docs/` altında yazılı.

---

### PRODUCT-UX-04 — URL ve bilgi mimarisi şeması tanımsız ("anlamlı ve kalıcı URL" yeterli değil)
- v1 bölüm: 13  ·  tür: eksik  ·  öncelik: P0  ·  doğrulandı: evet (dış olgu iddiası yok)
- Gerekçe: URL şeması sonradan değişirse SEO ve paylaşılan bağlantılar kırılır; mobil derin bağlantılar da aynı yollara dayanır. v1 yalnızca "anlamlı ve kalıcı" diyor. Varlık URL'sinde alt kategori kullanılıp kullanılmayacağı, "rehber" çakışması, il/ilçe ile kategori slug'larının çakışması ve karşılaştırma URL'lerindeki A-vs-B / B-vs-A tekrarı tanımlı değil.
- Kaynaklar: —
- Önerilen metin:

**URL ŞEMASI** (`docs/ux/ia.md` içinde teslim et; web ve mobil derin bağlantılar aynı yol tablosunu ortak bir pakette, ör. `packages/routes`, kullanır)

| Sayfa | Kalıp | Örnek | İndeks |
|---|---|---|---|
| Ana sayfa | `/` | | evet |
| Destinasyon (il) | `/{il}` | `/istanbul` | evet |
| Destinasyon (ilçe/bölge) | `/{il}/{ilce}` | `/istanbul/kadikoy` | eşik sağlanırsa |
| İl × keşif kategorisi | `/{il}/{kategori}` | `/istanbul/kahvalti` | eşik sağlanırsa (PRODUCT-UX-30) |
| İlçe × keşif kategorisi | `/{il}/{ilce}/{kategori}` | `/istanbul/kadikoy/kahvalti` | eşik sağlanırsa |
| Mekan | `/mekan/{slug}` | `/mekan/van-kahvalti-evi-cihangir` | evet |
| Konaklama (tüm türler) | `/konaklama/{slug}` | `/konaklama/ornek-butik-otel-goreme` | evet |
| Hizmet işletmesi | `/isletme/{slug}` | `/isletme/ornek-kuafor-moda` | evet |
| Araç kiralama sağlayıcısı | `/arac-kiralama/{slug}` | `/arac-kiralama/ornek-rent-izmir-havalimani` | evet |
| Turist rehberi (kişi) | `/tur-rehberi/{slug}` | `/tur-rehberi/ayse-yilmaz-kapadokya` | rıza varsa |
| Tur / aktivite | `/tur/{slug}` | `/tur/kapadokya-gun-dogumu-balon-turu` | evet |
| İlgi noktası | `/yer/{slug}` | `/yer/kaputas-plaji` | evet |
| Etkinlik | `/etkinlik/{slug}` (yıllık tekrarlarda `-{yyyy}`) | `/etkinlik/ornek-caz-festivali-2026` | bitişten 30 gün sonra noindex |
| Ürün | `/urun/{marka}-{model}` | `/urun/apple-iphone-16` | evet |
| Ürün kategorisi | `/urunler/{kategori}/{alt}` | `/urunler/teknoloji/kablosuz-kulaklik` | evet |
| Rehber (yazı) | `/rehber/{slug}` | `/rehber/kapadokya-gezi-rehberi` | evet |
| Liste (en iyiler) | `/liste/{slug}` | `/liste/istanbulun-en-iyi-kahvalti-mekanlari` | evet |
| Uzun inceleme (test yazısı) | `/inceleme/{slug}` | `/inceleme/apple-iphone-16-uzun-kullanim-testi` | evet |
| Karşılaştırma (editoryal) | `/karsilastir/{a}-vs-{b}` | `/karsilastir/apple-iphone-16-vs-samsung-galaxy-s25` | evet |
| Karşılaştırma aracı (3–4 öğe) | `/karsilastir?ogeler=a,b,c` | | noindex |
| Fırsat / kampanya | `/firsatlar/{slug}` | | süre bitince noindex |
| Yazar | `/yazar/{slug}` | | evet |
| Kullanıcı profili | `/kullanici/{kullanici-adi}` | | profil ayarına göre |
| Arama | `/ara?q=...` | | noindex |
| Hesap ve kişisel sayfalar | `/hesabim/...`, `/kaydedilenler` | | noindex |
| İşletme akışları | `/isletmeni-ekle`, `/isletmeni-sahiplen/{varlikSlug}`, `/isletme-paneli/...` | | noindex (panel) |
| Güven ve politika | `/nasil-degerlendiriyoruz`, `/sponsorlu-icerik-politikasi`, `/icerik-politikasi`, `/gizlilik`, `/kvkk-aydinlatma-metni`, `/cerez-tercihleri`, `/kullanim-kosullari`, `/bildir` | | evet |

**Kurallar:**
- Varlık URL'sinin öneki kararlı varlık tipidir; alt kategori veya özellik URL'ye girmez. Bu yüzden konaklamada `/otel/` değil `/konaklama/` kullan: pansiyonun "butik otel" olarak yeniden sınıflandırılması URL'yi değiştirmemeli.
- Slug'da yıl ve fiyat gibi bayatlayan bilgi olmaz. Yıl yalnızca başlıkta yer alır; istisna yıllık etkinlik sürümleridir.
- Ürün varyantları (renk, depolama) ayrı URL değil, sayfa içi seçimdir.
- Editoryal karşılaştırma URL'sinde slug'lar alfabetik sıradadır. Ters sıra kanonik olana 301 ile yönlenir.
- Sponsorlu içerik kendi içerik türünün yolunu kullanır; ayırt edicilik etiketle sağlanır (PRODUCT-UX-18).
- Ayrılmış kelimeler listesini (`ara`, `mekan`, `konaklama`, `urun`, `urunler`, `rehber`, `liste`, `inceleme`, `karsilastir`, `tur`, `tur-rehberi`, `yer`, `etkinlik`, `isletme`, `arac-kiralama`, `firsatlar`, `yazar`, `kullanici`, `hesabim`, `kaydedilenler`, `api`, `admin`, `giris`, `kayit` ve tüm politika yolları) kodda tut. Hiçbir il, ilçe veya kategori slug'ı bu listeye giremez.
- Aynı il altındaki ilçe slug'larıyla keşif kategorisi slug'ları kesişmemelidir; kayıt sırasında doğrula. Örneğin Afyonkarahisar'ın Çay ilçesi ile bir "çay" kategorisi çakışırsa kategori slug'ı `cay-bahceleri` gibi nitelenir.
- Slug değişikliği `SlugHistory` tablosuna yazılır ve eski URL kalıcı olarak 301 ile yönlenir; silinen varlık için 410 veya ilgili listeye yönlendirme yapılır.
- Küçük harf, tire ayracı ve sonda eğik çizgi olmaması zorunludur; aykırı biçim 301 ile normalleştirilir.
- Mobil uygulama, yukarıdaki web yollarını aynı ekranlara eşler. Tabloda karşılığı olmayan derin bağlantı yolu oluşturma.

**Kabul kriterleri:**
- Yol tablosu tek bir paketten hem Next.js hem Expo tarafından tüketiliyor.
- Rezerve kelime ve slug çakışma testleri var.
- Ters karşılaştırma URL'si 301 veriyor.
- Slug değişikliğinde eski URL 301 dönüyor.

---

### PRODUCT-UX-05 — Türkçe slug ve büyük/küçük harf tuzakları (i/İ, ı/I) arayüzde, slug'da ve aramada tanımsız
- v1 bölüm: 7  ·  tür: eksik  ·  öncelik: P0  ·  doğrulandı: hayır (JS davranışı çalışma zamanında doğrulandı; CSS ve PostgreSQL davranışı ikincil kaynaktan)
- Gerekçe: v1 yalnızca "Türkçe karaktere dayanıklı arama" diyor. JavaScript'in yerel ayarsız `toLowerCase()` fonksiyonu "İ" harfini "i" + U+0307 birleşik noktası olarak döndürüyor; bu, Node 22.22 / ICU 77.1'de test edildi (`"İ".toLowerCase().length === 2`). Sonuç bozuk slug'lar ve eşleşmeyen aramalardır. Diğer tuzaklar:
  - `lang="tr"` altında CSS `text-transform: uppercase` "iPhone"u "İPHONE" yapar; `toLocaleUpperCase("tr-TR")` aynı sonucu verir (Node'da doğrulandı).
  - Varsayılan `sort()` Türkçe sıralamayı bozar ("Çorum", "Ödemiş" ve "İzmir"i listenin sonuna atar).
- Kaynaklar: Node.js v22.22.0 / ICU 77.1 çalışma zamanı testi (bu inceleme sırasında); https://developer.mozilla.org/pt-BR/docs/Web/CSS/text-transform (ikincil, arama özetiyle); https://www.postgresql.org/message-id/52104a17-7a23-c315-1a97-06c691af748c%40postgrespro.ru (ikincil)
- Önerilen metin:

**TÜRKÇE HARF, SLUG VE ARAMA NORMALİZASYONU**

**Slug üretimi** (tek fonksiyon, `packages/text` içinde):
1. `toLocaleLowerCase('tr-TR')` uygula. Yerel ayarsız `toLowerCase()` kullanma.
2. Harf çevirisi: ç→c, ğ→g, ı→i, ö→o, ş→s, ü→u, â→a, î→i, û→u. Kalan aksanları Unicode NFD sonrası birleşik işaretleri silerek kaldır.
3. "&" → "ve". Kesme işaretini sil ("İstanbul'un" → "istanbulun").
4. `[a-z0-9]` dışındaki her diziyi tek tireye çevir. Baştaki ve sondaki tireleri kırp. En fazla 80 karakter; kelime ortasından kesme.
5. Çakışma halinde sırasıyla ilçe, mahalle, sonra `-2`, `-3` ekle.

Zorunlu birim test örnekleri:

| Girdi | Beklenen slug |
|---|---|
| İSTANBUL | istanbul |
| Iğdır | igdir |
| ISPARTA | isparta |
| Çeşme | cesme |
| Şile & Ağva | sile-ve-agva |
| Kadıköy Moda Sahili | kadikoy-moda-sahili |
| İstanbul'un En İyi Kahvaltı Mekanları | istanbulun-en-iyi-kahvalti-mekanlari |
| Café Nero Bağdat Caddesi | cafe-nero-bagdat-caddesi |
| IKEA | ikea |

**Arama anahtarı (katlama):**
- Hem indekslenen metne hem sorguya aynı fonksiyonu uygula: tr küçük harf → NFD → birleşik işaretleri sil → ı→i → boşlukları sadeleştir.
- Orijinal metni ayrıca indeksle; tam eşleşmeyi sıralamada öne al.
- Şu girdilerin hepsi aynı sonucu bulmalı: `kadikoy`, `KADIKÖY`, `Kadıköy`, `kadıkoy`; `igdir`, `IĞDIR`, `ığdır`; `kulaklik`, `kulaklık`.
- PostgreSQL tarafında `lower()` sonucunun veritabanı collation ayarına bağlı olduğunu test ederek doğrula. Uygulama katmanında katlanmış bir `arama_anahtari` sütunu tutmak varsayılan tercihtir. ICU `tr` collation kullanılacaksa davranışı migration testiyle doğrula.

**Gösterim:**
- `<html lang="tr">` zorunludur.
- Marka ve ürün adlarında CSS `text-transform: uppercase/capitalize` kullanma ("iPhone" → "İPHONE" olur).
- Büyük harfli etiketler yalnızca sabit Türkçe metinlerde kullanılabilir ("SPONSORLU"). Yabancı dilli adlar `lang="en"` ile işaretlenir.
- Başlıklarda "Her Kelime Büyük" yerine cümle düzeni kullan; Türkçe başlık büyük harf kuralları ("ve", "ile") otomatik dönüşümde bozulur.
- Alfabetik listeleri (il, ilçe, marka) `Intl.Collator('tr')` ile sırala. Beklenen sıra: Ağrı, Ankara, Çorum, Iğdır, İzmir, Ordu, Ödemiş, Sinop, Şile.
- Bu davranışları Playwright testiyle gerçek tarayıcıda doğrula.

**Kabul kriterleri:**
- Yukarıdaki tablo birim testlerde geçiyor.
- Arama katlama testleri geçiyor.
- Kod tabanında yerel ayarsız `toLowerCase`/`toUpperCase` kullanımı için bir lint kuralı (ör. `no-restricted-syntax`) var ya da istisnalar gerekçelendirilmiş.

---

### PRODUCT-UX-06 — Dinamik Türkçe metinlerde ek uyumu ve çoğul kuralları (programatik başlıklar bozulur)
- v1 bölüm: YENİ  ·  tür: eksik  ·  öncelik: P1  ·  doğrulandı: evet (dış olgu iddiası yok; dil bilgisi kuralı)
- Gerekçe: v1 programatik SEO ve "İstanbul'da iyi kahvaltı mekanları" gibi şablonlar öngörüyor. Türkçede bulunma, ayrılma, yönelme ve ilgi ekleri ünlü uyumuna ve sert ünsüz benzeşmesine bağlıdır: İstanbul'da, İzmir'de, Kars'ta, Ürgüp'te, Bodrum'dan, Antalya'ya. `{sehir}'de` gibi sabit bir şablon yarı yarıya yanlış metin üretir. Ayrıca sayıdan sonra çoğul eki gelmez ("3 değerlendirmeler" yanlıştır).
- Kaynaklar: —
- Önerilen metin:

**DİNAMİK METİN VE EK KURALLARI**
- Her destinasyon kaydında çekimli biçimleri ayrı alanlar olarak tut: `bulunma` ("İstanbul'da"), `ayrilma` ("İstanbul'dan"), `yonelme` ("İstanbul'a"), `ilgi` ("İstanbul'un").
  - Bir yardımcı fonksiyon bu alanları ünlü uyumu (son ünlü: a/ı/o/u → a/ı; e/i/ö/ü → e/i) ve sert ünsüz (f, s, t, k, ç, ş, h, p → -ta/-te, -tan/-ten) kurallarıyla otomatik doldursun.
  - Editör yönetim panelinde düzeltebilsin.
  - Kısaltma ve sayılarda ("2026'da", "TBMM'de") okunuşa göre karar verildiği için editör onayı zorunlu olsun.
- Programatik başlık ve meta şablonlarında yalnızca bu alanları kullan. Örnek: `{il.bulunma} kahvaltı mekanları` → "Kars'ta kahvaltı mekanları".
- İşletme ve ürün adları gibi serbest özel adlara ek getirme; cümleyi yeniden kur: "Starbucks'ta 12 değerlendirme" yerine "Starbucks · 12 değerlendirme".
- Sayıdan sonra tekil kullan: "1 değerlendirme", "128 değerlendirme", "3 gece". `Intl.PluralRules('tr')` sonucuna göre çoğul eki ekleme.
- Birim test örnekleri: İstanbul→İstanbul'da, İzmir→İzmir'de, Kars→Kars'ta, Ürgüp→Ürgüp'te, Bodrum→Bodrum'da / Bodrum'dan, Muş→Muş'ta, Antalya→Antalya'ya, Kapadokya→Kapadokya'nın.

**Kabul kriterleri:**
- 81 il için çekim alanları dolu ve editör onaylı.
- Programatik şablon motoru doğrudan `'de` veya `'da` birleştirmesi yapamıyor (kod incelemesi ve test).

---

### PRODUCT-UX-07 — Yerel biçim standardı yok (para, tarih, saat, puan, yüzde, telefon, adres, saat dilimi)
- v1 bölüm: YENİ  ·  tür: eksik  ·  öncelik: P0  ·  doğrulandı: evet (çalışma zamanında doğrulandı: Node v22.22.0, ICU 77.1)
- Gerekçe: v1 biçim kuralı vermiyor. Doğrulanan çıktılar:
  - `Intl.NumberFormat('tr-TR',{style:'currency',currency:'TRY'})` → `₺1.234,56` (sembol başta). Yaygın "1.234,56 ₺/TL" kullanımından farklı; tek bir karar verilmezse ekranlar arasında tutarsızlık oluşur.
  - Kompakt gösterim `1,2 B` ve `1,3 Mn` veriyor; "B" İngilizce "billion" ile karışır.
  - Yüzde `%25` olarak, puan `4,3` olarak (virgüllü) çıkıyor.
  - Europe/Istanbul hem Ocak'ta hem Temmuz'da GMT+3.
  - "Şu an açık" hesabı cihazın saat dilimiyle yapılırsa yurt dışındaki kullanıcıya yanlış sonuç gösterilir.
- Kaynaklar: Node.js v22.22.0 / ICU 77.1 çalışma zamanı çıktısı (bu inceleme sırasında); tz bilgisi için ikincil: https://www.timeanddate.com/news/time/turkey-scraps-dst-2016.html
- Önerilen metin:

**YEREL BİÇİM STANDARDI** (`packages/format` içinde tek kaynak; ekranlarda elle biçimlendirme yasak)

| Tür | Biçim | Not |
|---|---|---|
| Para (tam) | `1.234,56 ₺` | Sembol sonda, araya bölünmez boşluk (U+00A0). `Intl` currency stili `₺1.234,56` ürettiği için ondalık kısmı `Intl.NumberFormat('tr-TR')` ile biçimlendirip sembolü sona ekleyen `formatTRY()` yaz. Farklı bir karar verilecekse ADR ile tek biçim seç |
| Para (aralık, tam sayı) | `4.500–6.000 ₺` | Konaklama ve hizmet fiyatlarında kuruş gösterme; en-dash kullan |
| Para (birimli) | `4.500 ₺ / gece`, `450 ₺ / kişi` | Birim zorunlu |
| Büyük sayılar | `1.250`, `12,5 bin`, `1,3 milyon` | `Intl` kompakt "B"/"Mn" çıktısını kullanma |
| Puan | `4,3` (kullanıcı, 5 üzerinden), `8,5/10` (editör) | Ondalık ayırıcı virgül |
| Yüzde | `%25` | `Intl` tr çıktısı ile uyumlu |
| Tarih (kısa) | `18.10.2026` | |
| Tarih (uzun) | `18 Ekim 2026` | Değerlendirme kartında deneyim tarihi `Ekim 2026` |
| Tarih aralığı | `18–20 Ekim 2026` | |
| Göreli zaman | `dün`, `3 gün önce` | Yalnızca 7 güne kadar; sonrası mutlak tarih |
| Saat | `21:46` (24 saat) | "ÖÖ/ÖS" yok |
| Çalışma saati | `09:00–23:00`; gece yarısını geçen `18:00–02:00 (ertesi gün)` | Haftanın ilk günü Pazartesi |
| Saat dilimi | Veriyi UTC sakla, Europe/Istanbul ile göster | "Şu an açık" ve etkinlik saatleri cihaz saat dilimiyle değil, varlığın saat dilimiyle (Türkiye için Europe/Istanbul) hesaplanır |
| Mesafe | `850 m`, `1,2 km` | 1 km altı metre; konum izni yoksa mesafe gösterme |
| Telefon | Gösterim `0532 123 45 67`, `0212 123 45 67`; bağlantı `tel:+905321234567` | E.164 olarak sakla |
| Adres | `Caferağa Mah. Moda Cad. No: 12, 34710 Kadıköy/İstanbul` | Alanlar: mahalle, cadde/sokak, bina no, iç kapı, posta kodu, ilçe, il |

**Kabul kriterleri:**
- Tablodaki her satır için snapshot birim testi var.
- Test ortamında süreç saat dilimi `UTC` ve `America/New_York` iken "Şu an açık" sonucu değişmiyor.
- Kod tabanında `toFixed` veya `.` ondalıklı fiyat ve puan gösterimi yok (lint/grep kontrolü).

---

### PRODUCT-UX-08 — Hitap, ses tonu ve mikro metin kuralları ile yasaklı karanlık örüntüler tanımsız
- v1 bölüm: 5  ·  tür: eksik  ·  öncelik: P1  ·  doğrulandı: hayır (çerez bannerı satırı KVKK rehberinin birincil metniyle doğrulanmadı)
- Gerekçe: v1 kendi içinde "Ne keşfetmek istiyorsun?" diyerek "sen" hitabını kullanıyor ama hitap kararı vermiyor; ajan ekranlar arasında sen/siz karıştırabilir. Güven odaklı bir platformda mikro metinler ve karanlık örüntü yasakları açıkça listelenmeli.
- Kaynaklar: https://www.kazimceylan.av.tr/cerez-politikasi-ornegi ve https://www.alomaliye.com/2022/06/20/kvkk-cerez-uygulamalari-hakkinda-rehber-yayimladi/ (ikincil; KVKK Çerez Uygulamaları Hakkında Rehber)
- Önerilen metin:

**HİTAP VE SES TONU**
- Son kullanıcı arayüzü (web ve mobil), son kullanıcıya giden bildirimler ve ret gerekçeleri dahil: **"sen"**. Samimi, net, abartısız. Aynı kullanıcının bildirim merkezinde hitap değişmez.
- İşletme paneli, reklamveren paneli, işletmelere giden bildirimler, hukuki metinler ve KVKK başvuru yanıtları: **"siz"**.
- Ünlem, "harika!", "muhteşem!" gibi abartılar ve büyük harfle bağırma yok.
- Düğmeler fiille başlar: "Kaydet", "Değerlendirme yaz", "Yol tarifi al", "X'te fiyatları gör".
- Hata metni üç parçadan oluşur: ne oldu + neden (biliniyorsa) + ne yapabilirsin. Kullanıcıyı suçlama.
- Tüm metinleri `docs/ux/metin-rehberi.md` içinde örneklerle topla ve i18n anahtarlarıyla yönet (çok dilli yapıya hazırlık).

| Durum | Yap | Yapma |
|---|---|---|
| Giriş gerektiren eylem | "Kaydetmek için giriş yap. Kaydettiklerin tüm cihazlarında görünür." | "Devam etmek için üye olmalısınız!" |
| Bağlantı hatası | "Bağlantı kurulamadı. İnternetini kontrol edip tekrar dene." [Tekrar dene] | "Hata 500" |
| Değerlendirme reddi | "Değerlendirmen yayımlanmadı: telefon numarası gibi kişisel bilgi içeriyor. Düzenleyip yeniden gönderebilirsin." | "İçeriğiniz uygunsuz bulundu." |
| Pazarlama izni reddi | "Şimdi değil" | "Hayır, fırsatları kaçırmak istiyorum" |
| Boş değerlendirme | "Henüz değerlendirme yok. Buraya gittiysen ilk değerlendirmeyi sen yaz." | "0 yorum" |

**YASAK KARANLIK ÖRÜNTÜLER** (kod incelemesi kontrol listesine ekle):
1. Sahte kıtlık veya aciliyet ("Son 2 oda!", "12 kişi şu an bakıyor", sahte geri sayım). Yalnızca sağlayıcıdan gerçek zamanlı gelen ve kaynağı belirtilen veri gösterilebilir.
2. Önceden işaretli izin ve pazarlama kutuları.
3. Reddetme seçeneğini gizleme, küçültme veya ikinci ekrana taşıma. Çerez bannerında "Kabul et" ve "Reddet" eşit görünürlükte olur; uyum KVKK çerez rehberinin güncel metniyle hukuki incelemede teyit edilmeli.
4. "Hayır" seçeneğinde kullanıcıyı utandırma (confirmshaming).
5. Reklamı organik içerik gibi gösterme (etiketsiz veya yalnızca renkle ayrılmış sponsorlu kart).
6. Hesap silmeyi veya bildirim kapatmayı zorlaştırma: profilden en fazla 3 adım.
7. Reddedilen sistem iznini her açılışta yeniden isteme.
8. Çıkış niyetinde (exit-intent) açılan pop-up'lar, tam ekran "uygulamayı indir" ara sayfaları, sesli otomatik oynatılan videolar.
9. Web'de footer'a erişimi engelleyen sonsuz kaydırma.

**Kabul kriterleri:**
- Metin rehberi var.
- Son kullanıcı metinlerinde "siz" ve işletme/reklamveren paneli metinlerinde "sen" geçmiyor (i18n dosyalarında ad alanı bazlı basit kontrol).
- Karanlık örüntü kontrol listesi PR şablonunda yer alıyor.

---

### PRODUCT-UX-09 — Varlık tipi başına sayfa şablonları ve zorunlu alanlar tanımsız
- v1 bölüm: 8  ·  tür: eksik  ·  öncelik: P0  ·  doğrulandı: evet (dış olgu iddiası yok; belge türleri PRODUCT-UX-24'te doğrulamaya bırakıldı)
- Gerekçe:
  - v1 §8 tüm türler için tek bir genel bileşen listesi veriyor.
  - Restoran, otel, araç kiralama ve rehber için yalnızca birkaç alan sayılmış; etkinlik, tur, hizmet işletmesi ve ilgi noktası için hiç alan yok.
  - Ekranın üst kısmında hangi bilginin olacağı, birincil CTA, yasak CTA ve yayın için zorunlu alanlar belirsiz.
  - Bu durum boş bloklu, karar vermeye yetmeyen sayfalar üretir.
- Kaynaklar: —
- Önerilen metin:

**VARLIK SAYFASI ŞABLONLARI**

**Ortak kural:** 390×844 mobil görünümde ilk ekranda şunlar bulunmalıdır: ad, tür/kategori, konum (mahalle/ilçe) veya marka, puan özeti (ya da "yeterli değerlendirme yok"), fiyat seviyesi veya fiyat durumu, uygunsa açık/kapalı durumu ve birincil CTA.

Her sayfanın altında şunlar yer alır:
- "Bilgi hatalı mı? Düzeltme öner"
- "Bilgiler son doğrulama: {tarih}"
- Bu varlığın geçtiği rehber ve listeler
- Benzer seçenekler (organik; sponsorlu olan ayrı kutuda ve etiketli)

Yayın için zorunlu alanı eksik varlık yayımlanamaz. Bilinmeyen opsiyonel alanlar "bilinmiyor" olarak gösterilir veya hiç gösterilmez; asla "0" ya da "Kapalı" olarak gösterilmez.

| Varlık tipi | Yayın için zorunlu | Tipe özgü bloklar | Birincil CTA | Yasak/bağlamsız CTA |
|---|---|---|---|---|
| Mekan (restoran, kafe, kahvaltı, pastane, bar) | Ad, kategori, mutfak türü, adres + koordinat, ilçe, en az 1 iletişim kanalı, fiyat seviyesi veya "bilinmiyor", saatler veya "bilinmiyor" | Haftalık saat tablosu + özel gün saatleri; menü (görsel/PDF/yapılandırılmış, tarihli: "Menü fotoğrafı: Eylül 2026"); özellikler (rezervasyon, paket servis, alkol servisi, bahçe, manzara, çocuk dostu, evcil hayvan, tekerlekli sandalye erişimi); fotoğraflar kaynağa göre sekmeli (İşletme / Kullanıcı / Editör); öğün bazlı ipuçları | Yol tarifi al / Ara / Rezervasyon yap (yalnızca rezervasyon bağlantısı varsa) | Satın al, bilet al |
| Konaklama | Ad, konaklama türü, adres + koordinat, il/ilçe, en az 1 iletişim kanalı veya sağlayıcı bağlantısı | Konum mesafeleri ("Denize kuş uçuşu ~350 m" — hesaplama yöntemi belirtilir); sezon (açık olduğu aylar); pansiyon tipleri; oda tipleri (kapasite, yatak, m²); olanaklar (havuz, plaj, spa, otopark, Wi-Fi, çocuk kulübü, evcil hayvan, erişilebilir oda); giriş-çıkış saatleri; "Kimler için uygun" dağılımı (değerlendirmelerdeki ziyaret türü n≥10 ise); son 12 ay puanı ayrı | "{Sağlayıcı}'da fiyatları gör" (tarih/kişi seçimiyle) / Web sitesi / Ara | Fiyatı tarih ve kişi parametresi olmadan "gecelik X ₺" olarak sabit gösterme |
| Araç kiralama sağlayıcısı | Ad, en az 1 şube (adres/konum türü: havalimanı, şehir), iletişim | Şube listesi ve teslim alma prosedürü (terminal içi masa / servis aracı / karşılama); şube saatleri ve mesai dışı teslim koşulu; araç sınıfları ve örnek modeller ("Ekonomi: Fiat Egea veya benzeri" — "veya benzeri" ifadesi zorunlu); şartlar (minimum yaş, ehliyet yılı, kredi kartı/depozito, kilometre sınırı, yakıt politikası, ek sürücü, tek yön); sigorta kapsamları açıklaması | "Fiyat ve müsaitlik için {Sağlayıcı}'ya git" / Ara / Mesaj (işletme izin verdiyse) | Canlı veri yokken "günlük X ₺'den başlayan" |
| Turist rehberi (kişi) | Ad (kişinin açık rızasıyla), en az 1 bölge, en az 1 dil, ruhsat durumu (Doğrulandı / Doğrulanmadı) | Diller (seviye), hizmet bölgeleri, uzmanlık alanları, tur türleri, fiyatlandırma modeli (kişi/grup/saat), "Ruhsat bilgisi doğrulandı: {tarih}" rozeti, bağlı turlar | İletişime geç (platform formu veya kişinin izin verdiği kanal) | Ruhsatı doğrulanmamış kişiye "Profesyonel rehber" rozeti |
| Tur / aktivite | Ad, operatör (Hizmet işletmesi ilişkisi), başlangıç noktası, süre, kategori | Program akışı; dahil olanlar/olmayanlar; dil; grup büyüklüğü; zorluk; yaş sınırı; erişilebilirlik; sezon; "Hava koşullarına bağlı iptal olabilir" bilgi alanı (balon, tekne vb.); iptal koşulu yalnızca sağlayıcıdan | "{Sağlayıcı}'da tarih seç" / Operatörle iletişim | — |
| Ürün | Marka, model, kategori, en az 5 teknik özellik (kategori şemasından) | Varyant seçici; çıkış tarihi; Türkiye'de satış durumu; teknik özellik tablosu (birimli); editör testi (test süresi, koşullar, yazılım sürümü); artılar/eksiler; "Kimler için / kimler için değil"; alternatifler; karşılaştırma bağlantıları; teklif listesi (satıcı, fiyat, kontrol zamanı) | "{Satıcı}'da gör" (affiliate açıklamasıyla) | Taze olmayan karşılaştırmada "En ucuz" ifadesi; mekan CTA'ları |
| Etkinlik | Ad, başlangıç–bitiş (Europe/Istanbul), mekan (Mekan varlığına bağlı), kategori | Sanatçı/organizatör; bilet durumu (kaynaklı); fiyat aralığı; yaş sınırı; erişilebilirlik; tekrar eden oturumlar | "Bilet al ({Satıcı})" — yalnızca bitişten önce | Bitmiş etkinlikte bilet CTA'sı; etkinlik tarihinden önce değerlendirme |
| Hizmet işletmesi (kuaför, güzellik, temizlik, taşınma, transfer) | Ad, kategori, fiziksel adres **veya** hizmet bölgesi (ilçeler), iletişim | Hizmet listesi ("başlayan" fiyatlar opsiyonel, tarihli); randevu yöntemi; çalışma saatleri; doğrulanmış belgeler rozeti | Ara / Mesaj / Randevu bağlantısı; Faz 3: Teklif iste | — |
| Destinasyon (il/ilçe/bölge) | Ad, sınır/konum, kısa özet | Ne zaman gidilir (kaynaklı iklim bilgisi); nasıl gidilir; öne çıkan rehberler; kategori bazlı en iyi varlıklar (eşik sağlanırsa); harita; pratik bilgiler | Rehberi oku / Kategorileri keşfet | — |
| İlgi noktası (müze, plaj, doğa alanı) | Ad, tür, konum | Ziyaret saatleri ve giriş ücreti (kaynaklı, tarihli); erişim; en iyi ziyaret zamanı; yakındaki mekanlar | Yol tarifi al / Resmi site | — |

**Kabul kriterleri:**
- Her varlık tipi için şablon bileşeni ve Storybook hikâyesi var: tam veri, minimum veri ve bayat veri durumları.
- Zorunlu alanı eksik varlık yayımlanamıyor (API doğrulaması + test).
- Yasak CTA kombinasyonları bir yapılandırma tablosunda tanımlı ve testli.

---

### PRODUCT-UX-10 — Puan ölçeği kararsız ("10 üzerinden veya 5 yıldız"); gösterim eşikleri ve sıralama formülü yok
- v1 bölüm: 8  ·  tür: belirsiz  ·  öncelik: P0  ·  doğrulandı: evet (dış olgu iddiası yok)
- Gerekçe: v1 iki ölçeğe de izin veriyor. Aynı platformda farklı türlerin farklı ölçek kullanması kullanıcıyı yanıltır. 1–2 değerlendirmeyle "5,0" göstermek ve ham ortalamayla sıralamak, az değerlendirmeli varlıkları haksız biçimde öne çıkarır. Editör puanının hangi koşulda verileceği de tanımsız; "ziyaret edilmeden puan" riski var.
- Kaynaklar: —
- Önerilen metin:

**PUAN ÖLÇEKLERİ (platform genelinde sabit)**
- **Kullanıcı puanı:** 1–5 tam yıldız (yarım yıldız girişi yok). Opsiyonel kriter puanları da 1–5.
  - Gösterim: tek ondalık ve virgülle ortalama ("4,3") + yıldız görseli (yarım yıldız hassasiyetinde) + sayı ("128 değerlendirme").
- **Editör puanı:** 10 üzerinden, 0,5 adımlı ("8,5/10").
  - Yıldızla gösterilmez; "Editör" metinli ayrı bir rozetle gösterilir.
  - Yalnızca deneyim türü "Bizzat test edildi", "Ziyaret edildi" veya "Konaklandı" olan varlıklara verilir. Araştırma derlemelerinde editör puanı olmaz.
- İki puan **asla** birleştirilmez. "Genel puan" hesaplanmaz veya gösterilmez. Yan yana gösterilirken etiketleri ("Editör", "Kullanıcılar") her zaman görünür.

**Gösterim eşikleri:**

| Yayımlanmış kullanıcı değerlendirmesi sayısı (n) | Gösterim |
|---|---|
| 0 | "Henüz değerlendirme yok" + "Değerlendirme yaz" |
| 1–2 | Ortalama gösterilmez: "2 değerlendirme · Ortalama için en az 3 değerlendirme gerekiyor"; değerlendirmeler listelenir |
| ≥3 | Ortalama + sayı |
| ≥5 | 1–5 dağılım çubuğu ve kriter ortalamaları |
| Son 12 ayda ≥5 (mekan, konaklama, hizmet) | "Son 12 ay: 3,8 (24)" ikincil satırı |

**Sıralama:**
- "Puana göre" ve "Önerilen" sıralamalarda ham ortalama kullanma.
- Bayes ortalaması kullan: `(C·m + Σpuan) / (C + n)`. Burada `m` aynı il × kategori ortalaması, `C` varsayılan olarak 10'dur ve yönetim panelinden ayarlanır. Formülü `/nasil-degerlendiriyoruz` sayfasında açıkla.
- n<3 olan varlıklar "Puana göre" sıralamada en sonda, "Yeterli değerlendirme yok" grubunda yer alır.

**Diğer kurallar:**
- Her puan bileşeninde "Puanlar nasıl hesaplanır?" bağlantısı olsun.
- Erişilebilir metin: "5 üzerinden 4,3 puan, 128 değerlendirme".
- Düzenlenen değerlendirmenin yalnızca son sürümü sayılır. Kaldırılan değerlendirmeler ortalamaya girmez.

**Kabul kriterleri:**
- n = 0, 1, 2, 3, 5, 12 için görsel snapshot ve birim testleri var.
- Kodda editör ve kullanıcı puanını toplayan veya ortalayan fonksiyon yok.
- Bayes formülü testli.

---

### PRODUCT-UX-11 — Kategoriye özgü değerlendirme kriterleri ve zorunlu deneyim alanları tanımsız
- v1 bölüm: 8  ·  tür: eksik  ·  öncelik: P0  ·  doğrulandı: evet (dış olgu iddiası yok)
- Gerekçe: v1 "Değerlendirme kriterleri" bileşenini sayıyor ama içeriğini vermiyor. Kriterler ve deneyim bağlamı (tarih, ziyaret türü) olmadan değerlendirmeler karşılaştırılamaz ve "Kimler için uygun", "Son 12 ay" gibi filtreler kurulamaz.
- Kaynaklar: —
- Önerilen metin:

**DEĞERLENDİRME KRİTERLERİ VE DENEYİM ALANLARI**

Kriterleri kategori düğümü bazında yönetim panelinden tanımla: ad, kısa açıklama, sıra, zorunlu/opsiyonel; en fazla 6 kriter. Genel puan kullanıcı tarafından ayrıca verilir; kriterlerin ortalaması değildir. Başlangıç seti:

| Varlık tipi | Kriterler (1–5, opsiyonel) | Deneyim alanları |
|---|---|---|
| Mekan | Lezzet, Servis, Ortam, Temizlik, Fiyat/performans | **Zorunlu:** ziyaret ayı/yılı. **Opsiyonel:** öğün (kahvaltı/öğle/akşam/gece), ziyaret türü (yalnız/çift/aile/arkadaş/iş), kişi başı harcama aralığı |
| Konaklama | Konum, Temizlik, Oda konforu, Personel, Yeme-içme, Fiyat/performans | **Zorunlu:** konaklama ayı/yılı, yolculuk türü. **Opsiyonel:** süre (gece), oda tipi, pansiyon tipi |
| Araç kiralama | Teslim alma süreci, Araç durumu, Fiyat şeffaflığı (ek ücretler), Depozito/iade süreci, Müşteri hizmeti | **Zorunlu:** kiralama ayı/yılı, şube. **Opsiyonel:** araç sınıfı, süre, rezervasyon kanalı (doğrudan / aracı site) |
| Turist rehberi | Bilgi birikimi, İletişim ve dil, Dakiklik ve organizasyon, Fiyat/performans | **Zorunlu:** tur ayı/yılı. **Opsiyonel:** tur türü, dil |
| Tur / aktivite | Organizasyon, Rehberlik, Güvenlik hissi, Beklentiyle uyum, Fiyat/performans | **Zorunlu:** katılım ayı/yılı. **Opsiyonel:** grup türü |
| Ürün (genel) | Performans, Yapı kalitesi, Kullanım kolaylığı, Fiyat/performans. Kategoriye özgü örnek, kablosuz kulaklık: Ses kalitesi, Konfor, Pil ömrü, Mikrofon | **Zorunlu:** kullanım süresi (≤1 ay / 1–6 ay / 6–12 ay / 12+ ay). **Opsiyonel:** varyant, satın alma kanalı (yalnızca moderatör görür) |
| Hizmet işletmesi | İş kalitesi, Dakiklik, İletişim, Fiyat şeffaflığı, Temizlik/düzen (uygunsa) | **Zorunlu:** hizmet ayı/yılı, hizmet türü |
| Etkinlik | Organizasyon, Mekan ve ulaşım, Ses-görüntü, Fiyat/performans | **Zorunlu:** katılım tarihi; yalnızca etkinlik bittikten sonra |

**Kurallar:**
- Deneyim tarihi gelecekte olamaz. 24 aydan eski deneyimler "Eski deneyim ({ay yıl})" etiketiyle gösterilir.
- Kamuya yalnızca ay ve yıl gösterilir; tam gün gösterilmez (gizlilik).
- Kriter ortalamaları n≥5 olduğunda gösterilir (PRODUCT-UX-10).

**Kabul kriterleri:**
- Yönetici kod değiştirmeden kategoriye kriter ekleyebiliyor ve sırasını değiştirebiliyor.
- Değerlendirme formu varlık tipine göre doğru kriter ve alanları gösteriyor (E2E).

---

### PRODUCT-UX-12 — Değerlendirme yazma akışı, durum makinesi ve sürtünme azaltma kuralları yok
- v1 bölüm: 8  ·  tür: eksik  ·  öncelik: P0  ·  doğrulandı: evet (dış olgu iddiası yok; mevzuat etkisi PRODUCT-UX-13'te)
- Gerekçe: v1 yalnızca "kullanıcı yorum yapar ve moderasyona girer" diyor. Platformun en kritik içerik kaynağı olan değerlendirme formu için şunlar tanımsız:
  - Adımlar, alan limitleri, fotoğraf kuralları
  - Kanıt ve belge yönetimi
  - Çıkar çatışması beyanı
  - Taslak koruma, misafir akışı
  - Kullanıcıya gösterilen durumlar ve ret gerekçesi

  Bunlar olmadan dönüşüm düşük, kötüye kullanım yüksek olur.
- Kaynaklar: —
- Önerilen metin:

**DEĞERLENDİRME YAZMA AKIŞI**

Adımlar: mobilde en fazla 3 ekran, web'de tek sayfa ve bölümler.

1. **Genel puan** (zorunlu, 1–5). Her yıldızın metin karşılığı olur: 1 Çok kötü, 2 Kötü, 3 İdare eder, 4 İyi, 5 Mükemmel.
2. **Deneyim bilgileri:** PRODUCT-UX-11'deki zorunlu ve opsiyonel alanlar.
3. **Metin ve medya:**
   - Başlık opsiyonel, en fazla 100 karakter.
   - Metin zorunlu; en az 50, en fazla 5.000 karakter. Canlı karakter sayacı olsun.
   - Varlık tipine özel yönlendirici ipuçları: mekan için "Ne yedin? Servis nasıldı?", araç kiralama için "Depozito iadesi ne kadar sürdü?"
   - Opsiyonel kriter puanları.
   - Fotoğraf: 0–10 adet; JPEG/PNG/HEIC/WebP; her biri en fazla 10 MB. EXIF konum ve cihaz verisini sunucuda sil. Fotoğraf başına opsiyonel açıklama.
4. **Beyanlar:**
   - Zorunlu onay kutusu: "Bu deneyim bana ait ve gerçek."
   - Zorunlu onay kutusu: "Bu işletme/markayla çalışan, sahip, yakın akraba ya da rakip ilişkim yok."
   - Zorunlu soru: "Bu deneyim için ücret, ücretsiz hizmet/ürün, indirim veya hediye aldın mı?" Yanıt evetse değerlendirme "Ücretsiz/indirimli deneyim beyan edildi" etiketiyle yayımlanır ve puan ortalamasına dahil edilmez. Bu politika hukuki incelemede teyit edilmeli.
   - Önceden işaretli kutu yok.
5. **Kanıt** (opsiyonel; doğrulama rozeti için):
   - Fiş, fatura, rezervasyon veya sipariş onayı görseli.
   - Yalnızca moderatör görür, kamuya açılmaz. Saklama süresi gizlilik incelemesiyle belirlenir; varsayılan olarak doğrulamadan sonra silinir.
   - Yükleme ekranında uyarı: "Kart numarası, T.C. kimlik no gibi bilgileri kapat."

**Sürtünme azaltma:**
- Taslak her alan değişiminde otomatik kaydedilir: misafirde cihazda, girişli kullanıcıda hesapta.
- Misafir değerlendirme yazmaya başlayabilir. "Gönder" anında giriş istenir; girişten sonra taslak eksiksiz geri yüklenir ve gönderim otomatik devam eder.
- Fotoğraflar arka planda yüklenir ve gönderimi bloklamaz. Mobilde çevrimdışı gönderim kuyruğa alınır.
- Hata mesajları alanın yanında ve özet olarak formun üstünde gösterilir.

**Kurallar:**
- Kullanıcı başına varlık başına 1 aktif değerlendirme olur; kullanıcı onu günceller ve sürüm geçmişi tutulur.
- Yayımlanmış değerlendirmede "Düzenlendi: {tarih}" etiketi gösterilir. İşletme yanıtı varsa "Yanıt, değerlendirmenin önceki sürümüne verildi" notu çıkar.

**Durum makinesi** (kullanıcıya "Değerlendirmelerim" sayfasında gösterilir; her geçişte uygulama içi bildirim ve işlemsel e-posta gönderilir):

`Taslak → İncelemede → Yayında | Yayımlanmadı (gerekçe kodu + açıklama + "Düzenle ve yeniden gönder") → Bildirildi (karar verilene kadar yayında kalır) → Kaldırıldı (gerekçe) → İtiraz edildi → İtiraz sonuçlandı`

Ön moderasyon ile son moderasyon kararı ve risk sinyalleri moderasyon bölümünde tanımlanır. Bu bölüm yalnızca kullanıcıya görünen durumları tanımlar.

**Kabul kriterleri:**
- E2E (Y6): misafir yazmaya başlıyor → giriş yapıyor → taslak korunuyor → gönderiyor → "İncelemede" görüyor → onay → bildirim → "Yayında".
- Ret senaryosunda gerekçe gösteriliyor ve düzenleyip yeniden gönderme çalışıyor.
- EXIF verisinin silindiği test ediliyor.

---

### PRODUCT-UX-13 — Tüketici değerlendirmesi mevzuatı (2026 değişikliği) değerlendirme UX'ini doğrudan etkileyebilir; doğrulama seviyeleri yapılandırılabilir olmalı
- v1 bölüm: 14  ·  tür: risk  ·  öncelik: P0  ·  doğrulandı: hayır (yalnızca ikincil kaynaklar; resmigazete.gov.tr ve ticaret.gov.tr bu oturumdan erişilemedi)
- Gerekçe: İkincil kaynaklara göre Ticari Reklam ve Haksız Ticari Uygulamalar Yönetmeliği'nin tüketici değerlendirmelerine ilişkin 28/B maddesi, 1 Temmuz 2026 tarihli ve 33297 sayılı Resmî Gazete'de yayımlanan değişiklikle yeniden düzenlendi. Haberlerde öne çıkan noktalar:
  - Satın alma doğrulaması
  - Olumlu/olumsuz ayrımı yapmadan yayın
  - Objektif sıralama
  - Yayımlanmayan değerlendirmenin gerekçesinin bildirilmesi

  Reklam Kurulu'nun 2023 tarihli "Tüketici Değerlendirmeleri Hakkında Kılavuz"u da yayın süresi, objektif ölçüt ve ret gerekçesi konularında yol gösteriyor. Bu hükümlerin satıcı veya aracı hizmet sağlayıcı olmayan bağımsız bir inceleme ve yönlendirme platformuna uygulanıp uygulanmadığı belirsiz. İleride platform içi rezervasyon/ödeme açılırsa durum değişebilir. UX bu belirsizliğe karşı esnek kurulmazsa sonradan yeniden tasarım gerekir.
- Kaynaklar:
  - https://kursunpartners.com/tr/hukuk-bulteni/gelisme/ticari-reklam-haksiz-ticari-uygulamalar-yonetmelik-degisiklik-2026/ (ikincil)
  - https://www.erdem-erdem.av.tr/bilgi-bankasi/ticari-reklam-ve-haksiz-ticari-uygulamalar-yonetmeliginde-degisiklik-yapilmasina-dair-yonetmelik-yayimlandi (ikincil)
  - https://www.ulusal.com.tr/gundem/ticaret-bakanligi-tuketici-yorumlarina-iliskin-usul-ve-esaslari-yeniden-duzenledi-15103050 (ikincil)
  - https://www.esin.av.tr/2023/09/26/advertising-board-published-guidelines-on-consumer-reviews/ (ikincil)
  - https://tuketici.ticaret.gov.tr/data/65089fd113b8769d9861719f/T%C3%BCketici%20De%C4%9Ferlendirmeleri%20Hakk%C4%B1nda%20K%C4%B1lavuz%20-%20kurul%20karar%C4%B1.pdf (birincil kılavuz metni; bu oturumda açılamadı)
- Önerilen metin:

**DEĞERLENDİRME MEVZUATINA UYUMLU ESNEK TASARIM**

Ticari Reklam ve Haksız Ticari Uygulamalar Yönetmeliği'nin tüketici değerlendirmelerine ilişkin hükümleri (28/B vd.) ve Reklam Kurulu'nun "Tüketici Değerlendirmeleri Hakkında Kılavuz"u değerlendirme toplama, doğrulama, yayımlama, sıralama ve ret gerekçesi bildirme konularında yükümlülük getirebilir. İkincil kaynaklara göre 28/B, 1 Temmuz 2026 tarihli ve 33297 sayılı Resmî Gazete'deki değişiklikle yeniden düzenlendi. Hükümlerin güncel metni ve incelemeler.com.tr'ye (satıcı veya aracı hizmet sağlayıcı olmayan, yönlendirme ve affiliate yapan platform) uygulanıp uygulanmadığı hukuki incelemeyle doğrulanmalı. Platform içi rezervasyon veya ödeme açılırsa bu değerlendirme yenilenmeli. Doğrulama tamamlanana kadar tasarımı en katı senaryoya **yapılandırmayla** geçilebilecek şekilde kur:

- Her `UserReview` kaydında `dogrulama_seviyesi` alanı tut:

  | Değer | Anlamı |
  |---|---|
  | `hesap` | E-posta/telefonu doğrulanmış hesap |
  | `belge` | Kullanıcının sunduğu kanıt moderatörce kabul edildi |
  | `saglayici` | Rezervasyon veya satın alma kaydı bir sağlayıcı entegrasyonuyla eşleşti |

- Kategori bazında yönetim panelinden ayarlanabilen `yayin_icin_min_dogrulama` politikası olsun. Varsayılan `hesap`; değer hukuki görüşe göre güncellenir. Politika değişikliği denetim kaydına yazılır.
- "Doğrulanmış deneyim" rozetini yalnızca `belge` veya `saglayici` seviyesine bağla. Tooltip metni: "Bu kullanıcı deneyimine ilişkin belge sundu. İçerik kullanıcının kişisel görüşüdür."
- Yayımlanmayan her değerlendirme için kullanıcıya gecikmeden gerekçe bildir ve düzeltip yeniden gönderme hakkı ver (PRODUCT-UX-12).
- Olumlu ve olumsuz değerlendirmeleri ayrım yapmadan yayımla. Varsayılan sıralama objektif bir ölçüt (en yeni) olsun. Sponsor, işletme sahibi veya ücretli paket sıralamayı ve görünürlüğü etkileyemez.
- Yayımlanmış değerlendirmenin asgari yayında kalma süresini ve kaldırma istisnalarını (hukuka aykırılık, politika ihlali, kullanıcı talebi, hesap silme) hukuki incelemeyle belirle ve yapılandırılabilir tut.
- Sağlık beyanı içeren değerlendirmeler (güzellik merkezi, kozmetik, takviye) için ayrı moderasyon kuralı ve uyarı metni ekle.
- Platform puanları sponsorlu kartlarda veya reklam materyalinde kullanılırsa yalnızca gerçek ortalama, `n` ve tarih ile gösterilsin; seçilmiş alıntılar genel görünümü çarpıtmasın.
- Bu maddeleri "Hukuki inceleme gerektiren alanlar" listesine kaynak URL'leriyle ekle.

**Kabul kriterleri:**
- `dogrulama_seviyesi` ve `yayin_icin_min_dogrulama` çalışıyor (birim + E2E: politika `belge` yapıldığında `hesap` seviyeli yeni değerlendirme yayımlanmıyor ve kullanıcıya gerekçe gidiyor).
- Hukuki inceleme listesinde bu madde açık durumda bulunuyor.

---

### PRODUCT-UX-14 — Değerlendirmelerin listelenmesi: sıralama, filtre, "faydalı", işletme yanıtı ve bildirim kuralları tanımsız
- v1 bölüm: 8  ·  tür: eksik  ·  öncelik: P1  ·  doğrulandı: evet (dış olgu iddiası yok)
- Gerekçe: v1 "faydalı yorumları işaretleme" özelliğini sayıyor ama sıralama, filtre ve kart içeriği tanımsız. Varsayılan sıralama manipülasyona açık olursa güven ve mevzuat riski doğar (bkz. PRODUCT-UX-13).
- Kaynaklar: —
- Önerilen metin:

**DEĞERLENDİRME LİSTESİ**

- **Sıralama:**
  - Varsayılan "En yeni".
  - Seçenekler: En yeni, En faydalı (faydalı oy + yaş), En yüksek puan, En düşük puan.
  - Seçim URL parametresinde tutulur.
- **Filtreler:**
  - Puan (1–5, çoklu seçim), ziyaret türü, dönem (son 3/6/12 ay), fotoğraflı, doğrulanmış deneyim, dil (Türkçe / İngilizce / diğer).
  - "Öne çıkan konular" çipleri (ör. "kahvaltı", "otopark") yalnızca metinden gerçekten çıkarılmışsa ve n≥10 ise gösterilir.
- **Kart içeriği:**
  - Görünen ad ve profil özeti ("14 değerlendirme · 2026'dan beri üye")
  - Puan
  - Deneyim ayı/yılı ile yayın tarihi ayrı ayrı
  - Ziyaret türü
  - Metin: 6 satır + "Devamını oku"
  - Fotoğraflar
  - Açılır kriter puanları
  - Rozetler (doğrulanmış deneyim / teşvik beyanı / düzenlendi)
  - "Faydalı (12)" ve "Bildir" düğmeleri
  - İşletme yanıtı: girintili, "İşletme yanıtı · {tarih}" başlığıyla
- **Faydalı oyu:**
  - Yalnızca giriş yapmış kullanıcı verebilir; geri alınabilir.
  - Kendi değerlendirmesine veya sahiplendiği işletmenin değerlendirmelerine oy verilemez.
  - Olumsuz oy yok.
- **Bildir:**
  - Gerekçeler: sahte veya çıkar çatışması, hakaret/nefret, kişisel veri, alakasız, reklam/spam, telif, diğer (açıklama zorunlu).
  - Bildirilen değerlendirme karar verilene kadar yayında kalır. İstisna: hukuki acil durum kuralları (moderasyon bölümü).
- **Sayfalama:** ilk 10 değerlendirme, ardından "Daha fazla göster".
- **Dil ve özet:** Türkçe dışı değerlendirmeler orijinal dilinde gösterilir. Makine çevirisi ve yapay zekâ özeti ("Kullanıcılar ne diyor?") MVP'de yok. İleride yalnızca n≥20 olduğunda, "Yapay zekâ ile özetlendi · yanlış olabilir" etiketiyle ve kaynak değerlendirmelere bağlantı vererek sunulur.

**Kabul kriterleri:**
- Kendi değerlendirmesine "faydalı" verilemiyor (API testi).
- Sıralama ve filtreler URL'de korunuyor.
- Sponsor durumu sıralamayı değiştirmiyor (test: sponsor ve sponsor olmayan iki varlıkta değerlendirme sıralaması aynı kuralla).

---

### PRODUCT-UX-15 — Boş, az veri, bayat veri ve kapalı işletme durumları tanımsız
- v1 bölüm: 8  ·  tür: eksik  ·  öncelik: P0  ·  doğrulandı: evet (dış olgu iddiası yok)
- Gerekçe: v1 "veri yetersizliğini açık şekilde göster" diyor ama bileşen bazında durum ve metin vermiyor. Soğuk başlangıçta sayfaların büyük kısmı bu durumlarda olacak; tasarlanmazsa boş kutular, "0 yorum" ve "Kapalı" gibi yanlış ifadeler ortaya çıkar.
- Kaynaklar: —
- Önerilen metin:

**DURUM TASARIMI: BOŞ, AZ, BAYAT VE KAPALI**

Her bileşen için aşağıdaki durumları uygula ve Storybook'ta göster.

| Bileşen | Koşul | Gösterim / metin | Eylem |
|---|---|---|---|
| Puan özeti | n=0 | "Henüz değerlendirme yok" | "Değerlendirme yaz" |
| Puan özeti | n=1–2 | "2 değerlendirme · Ortalama için en az 3 değerlendirme gerekiyor" | Değerlendirmelere kaydır |
| Editör değerlendirmesi | Yok | Blok hiç gösterilmez; boş kutu bırakma | — |
| Fotoğraf | Yok | Varlık tipine özgü nötr placeholder (ikon + ad). Stok fotoğrafı varlığın kendisiymiş gibi kullanma | "Fotoğraf ekle" (girişli) |
| Çalışma saatleri | Bilinmiyor | "Çalışma saatleri bilinmiyor". Asla "Kapalı" gösterme | "Düzeltme öner" |
| Çalışma saatleri | Son doğrulama 180 günden eski | "Saatler en son Mart 2026'da doğrulandı; gitmeden önce işletmeyle teyit et." | "Ara" |
| Fiyat | Yok | "Fiyat bilgisi yok" | Sağlayıcı/işletme bağlantısı |
| Fiyat | Kaynak verisi bayat (PRODUCT-UX-35 eşikleri) | Fiyat gösterilmez; "Güncel fiyat için {Sağlayıcı}'ya bak" | Yönlendirme |
| İşletme durumu | Geçici olarak kapalı | Sayfa üstünde uyarı: "Geçici olarak kapalı ({tarih}'ten beri)" | Benzer açık mekanlar |
| İşletme durumu | Kalıcı olarak kapandı | Uyarı: "Kalıcı olarak kapandı (tespit: {tarih})". CTA'lar kaldırılır; değerlendirmeler arşiv olarak okunur, yenisi yazılamaz; aramada en sona düşer, 90 gün sonra keşif listelerinden çıkar | Benzer mekanlar |
| İşletme durumu | Taşındı | "Bu işletme taşındı" + yeni varlığa bağlantı | Yeni sayfa |
| Ürün | Türkiye'de satışta değil / satıştan kalktı | "Türkiye'de satışta görünmüyor (kontrol: {tarih})" | Alternatifler |
| Etkinlik | Bitti | "Bu etkinlik {tarih} tarihinde sona erdi"; bilet CTA'sı yok | Benzer yaklaşan etkinlikler |
| Liste/keşif sayfası | 0 sonuç | "Bu kriterlere uyan sonuç bulunamadı" + hangi filtre kaldırılırsa kaç sonuç çıkacağı ("'Çocuk dostu' kaldırılırsa 24 sonuç") | Filtre kaldır; yakın ilçeler |
| Liste/keşif sayfası | <5 sonuç | Sonuçları göster; sayfa noindex; yakın ilçe önerisi | — |
| Kategori/il hub'ı | Yayın eşiğinin altında (PRODUCT-UX-30) | Menüde ve site haritasında yok; doğrudan erişimde ilgili üst sayfaya yönlendirme veya noindex | — |
| Bilgi doğrulanmamış | İşletme veya editör henüz teyit etmedi | "Bu bilgiler henüz doğrulanmadı" bilgi notu | "Bu işletme senin mi?" |

Her varlıkta alan grubu bazında `son_dogrulama_tarihi` tut (iletişim, saatler, fiyat, menü, özellikler) ve hangi yöntemle doğrulandığını sakla: editör, işletme sahibi, kullanıcı önerisi veya sağlayıcı.

**Kabul kriterleri:**
- Tablodaki her durum için Storybook hikâyesi ve en az bir bileşen testi var.
- Saatleri bilinmeyen varlık hiçbir yerde "Kapalı" olarak görünmüyor (test).
- Kalıcı kapanan varlıkta CTA yok (test).

---

### PRODUCT-UX-16 — Güven sinyallerinin arayüz karşılığı yok (politika var, bileşen yok)
- v1 bölüm: 14  ·  tür: eksik  ·  öncelik: P0  ·  doğrulandı: evet (dış olgu iddiası yok)
- Gerekçe: v1 §14 doğru politikaları içeriyor ("ziyaret edilmeyen yeri deneyimlenmiş gibi gösterme", "tarihleri göster"). Ancak bunların kullanıcıya nasıl ve nerede gösterileceği tanımsız. Güven, platformun temel değer önerisi; ölçülebilir bileşenlere dönüşmeli.
- Kaynaklar: —
- Önerilen metin:

**GÜVEN BİLEŞENLERİ** (tasarım sisteminde zorunlu bileşenler; editoryal içerik ve editör değerlendirmesi bu bileşenler olmadan yayımlanamaz)

1. **`DeneyimRozeti`.** Değerler:
   - "Bizzat test edildi ({süre})": ürün; test süresi ve koşulları zorunlu alan.
   - "Ziyaret edildi ({ay yıl})": mekan, ilgi noktası.
   - "Konaklandı ({ay yıl})": konaklama.
   - "Araştırmaya dayalı": birinci elden deneyim yok; editör puanı verilmez.
   - "İşletme tarafından sağlanan bilgi".
2. **`YazarKutusu`:** ad, kısa uzmanlık açıklaması, profil bağlantısı. Varsa içeriği kontrol eden ikinci editör ("Kontrol eden: ...").
3. **`GuncellemeBilgisi`:** "Yayın: 03.05.2026 · Son güncelleme: 18.10.2026" ve açılır değişiklik özeti ("Fiyatlar güncellendi; X kapandığı için listeden çıkarıldı"). Yalnızca yazım düzeltmesi "son güncelleme" tarihini değiştirmez; anlamlı değişiklik ile düzeltme ayrı işaretlenir.
4. **`TicariIliskiKutusu`:** başlığın hemen altında, içerikte varsa gösterilir:
   - Sponsorluk
   - Affiliate bağlantı
   - Ürünün üretici tarafından ödünç/hediye verilmesi ("Bu ürün test için üretici tarafından ödünç verildi; içerik onay için paylaşılmadı")
   - Ücretsiz konaklama veya yemek
   - "Ticari ilişki yok" da açıkça yazılabilir.
5. **`/nasil-degerlendiriyoruz` sayfası:**
   - Varlık tipi başına metodoloji: kriterler, test süreleri, ziyaret kuralları.
   - Puan formülleri (PRODUCT-UX-10).
   - Sponsorluğun puan ve sıralamaya etkisi olmadığı.
   - Düzeltme politikası.
   - Her puan ve rozet bileşeni bu sayfanın ilgili bölümüne bağlanır.
6. **"Hata bildir / düzeltme öner"** bağlantısı her içerik ve varlık sayfasında bulunur. Yayımlanan düzeltmeler içerik altında "Düzeltme: {tarih} — {açıklama}" olarak gösterilir.
7. **Fotoğraf kaynak etiketi:** "İşletme", "Kullanıcı: {ad}", "Editör" veya lisanslı kaynak adı.

**Kabul kriterleri:**
- `DeneyimRozeti` değeri "Araştırmaya dayalı" iken editör puanı alanı API tarafından reddediliyor.
- Editoryal içerik `YazarKutusu`, `GuncellemeBilgisi` ve `TicariIliskiKutusu` olmadan yayımlanamıyor.
- "Ticari ilişki" alanı boş bırakılamıyor; "yok" bir değer olarak seçilmeli.

---

### PRODUCT-UX-17 — Ana sayfa: modül kuralları, kişiselleştirme sınırları ve sponsorlu oranı ölçülebilir değil
- v1 bölüm: 5  ·  tür: belirsiz  ·  öncelik: P0  ·  doğrulandı: evet (dış olgu iddiası yok)
- Gerekçe: v1 18 modül sayıyor ve "dengeli yapı" istiyor ama şunlar tanımsız:
  - Modülün hangi koşulda gizleneceği
  - Kişiselleştirme girdilerinin sınırı
  - Rıza yokken davranış
  - Sponsorlu oranı

  Gelir baskısı altında "dengeli" ifadesi uygulanamaz bir hedef olarak kalır.
- Kaynaklar: —
- Önerilen metin:

**ANA SAYFA MODÜL SİSTEMİ**

Her modül bir kayıttır: `tip`, `veri_kaynagi` (editoryal seçim / kural / kişisel / sponsorlu), `min_oge` (varsayılan 4), `max_oge`, `kisisellestirilebilir`, `sponsorlu_mu`, `gorunurluk_kurali` (tarih aralığı, şehir, platform). Öğe sayısı `min_oge` altında kalan modül otomatik gizlenir; boş veya yarım modül gösterilmez.

**Varsayılan sıra (mobil):**
1. Arama + şehir seçici
2. "Ne keşfetmek istiyorsun?" kategori kısayolları
3. Konum izni varsa "Yakınında"; yoksa "Şehrini seç" kartı (izin istemi yok)
4. Editörün seçtikleri
5. Şehre göre popüler varlıklar
6. Sezonluk seçki
7. Yeni rehberler
8. Sponsorlu modül (en fazla 1)
9. Karşılaştırma rehberleri
10. Bülten
11. Güven ve şeffaflık bağlantıları + footer

Sıra yönetim panelinden değiştirilebilir ama aşağıdaki sınırlar kodla zorlanır.

**Sponsorlu sınırları:**

| Kural | Değer |
|---|---|
| Ana sayfada sponsorlu modül sayısı | ≤ 2 |
| Tüm ana sayfa kartları içinde sponsorlu kart oranı | ≤ %20 |
| İlk mobil ekran (390×844) | Arama kutusunun üstünde sponsorlu öğe yok; ilk ekranda ≤ 1 sponsorlu kart |
| "Editörün seçtikleri" modülü | Sponsorlu öğe içeremez; sponsor olan bir varlık editoryal olarak seçilmişse "Editoryal seçim; sponsorluktan bağımsız" notu |

**Kişiselleştirme:**
- **İzin verilen girdiler:** Kullanıcının açıkça seçtiği ilgi alanları, seçtiği şehir, platform içindeki son görüntülemeleri ve kaydettikleri (rızaya bağlı; misafirde yalnızca cihazda).
- **Yasak girdiler:**
  - Hassas kategoriler (sağlık, din, siyasi görüş vb.) için çıkarım
  - Platform dışı izleme verisi
  - Kesin konum geçmişi
- **Kişiselleştirilmiş modül:**
  - "Neden bunu görüyorum?" bağlantısı. Örnek: "Kadıköy'deki kahvaltı mekanlarına baktığın için".
  - Profil ayarlarında "Kişiselleştirmeyi kapat" anahtarı.
  - Analitik/kişiselleştirme rızası yoksa ana sayfa kişisel olmayan varsayılan sıralamayla (editoryal + popüler) çalışır.
- **Sezonluk modüller:** Tarih kuralıyla açılır ve kapanır. Örnek: Haziran–Eylül arasında "Sahil kasabaları".

**Kabul kriterleri:**
- Sponsorlu oranı ve ilk ekran kuralları birim testle zorlanıyor; yönetim panelinden aşılamıyor.
- `min_oge` altındaki modül render edilmiyor.
- Rıza yokken kişisel modül çağrısı yapılmıyor (ağ testi).

---

### PRODUCT-UX-18 — Sponsorlu ve affiliate etiket sözlüğü ile yüzey bazlı yerleşim kuralları eksik
- v1 bölüm: 9  ·  tür: belirsiz  ·  öncelik: P0  ·  doğrulandı: evet (dış olgu iddiası yok; etiket terimlerinin hukuki teyidi ayrıca istenmiştir)
- Gerekçe: v1 dört etiket sayıyor ("Sponsorlu", "Reklam", "İş birliği", "Sponsorlu sonuç") ama hangisinin nerede kullanılacağını söylemiyor. Liste, arama, harita, karşılaştırma ve editoryal listelerde sponsorlu öğenin konumu, sayısı ve alaka şartı tanımsız. Kullanıcının sorgusuyla ilgisiz sponsorlu sonuç güveni doğrudan zedeler.
- Kaynaklar: —
- Önerilen metin:

**TİCARİ YERLEŞİM KURALLARI** (tek tablo; yönetim panelinden sınırlar düşürülebilir, yükseltilemez)

**Etiket sözlüğü:**

| Etiket | Ne zaman |
|---|---|
| "Sponsorlu" | Ücretli yerleşim: kart, liste öğesi, harita pini, modül |
| "Sponsorlu içerik" | Ücret veya menfaat karşılığı hazırlanmış yazı. Başlığın üstünde, kartta ve paylaşım (OG) görselinde bulunur. Detay sayfasında açıklama: "Bu içerik {Marka} ile iş birliği kapsamında hazırlanmıştır. {Marka} yayından önce içeriği gördü / görmedi." |
| "Reklam" | Reklam ağı veya gösterim bazlı banner alanları |
| Satış ortaklığı açıklaması | Affiliate CTA'nın hemen yanında: "Bu bağlantı üzerinden yapılan alışverişlerden komisyon alabiliriz; bu, değerlendirmemizi etkilemez." "Fiyat senin için değişmez" ifadesi ancak sağlayıcı sözleşmesiyle teyit edildiyse eklenir |

"İş birliği" ifadesi yalnızca sponsorlu içerik açıklama cümlesinde kullanılır, ayrı bir rozet değildir. Etiket metinlerinin Türk reklam mevzuatına uygunluğu hukuki inceleme listesinde teyit edilmeli.

**Görsel kurallar:**
- Etiket metin olarak yazılır (yalnızca ikon veya renk yetmez).
- Kartın sol üstünde, başlıktan önce yer alır; en az 12 px; kontrast ≥ 4.5:1.
- Hover gerektirmez; kullanıcı kapatamaz.
- Ekran okuyucu önce etiketi okur: "Sponsorlu: {ad}".
- "Neden bunu görüyorum?" metni: "{İşletme} bu alanda görünmek için ödeme yaptı. Sponsorluk puanları ve organik sıralamayı etkilemez."

**Yüzey kuralları:**

| Yüzey | Üst sınır | Konum ve alaka kuralı |
|---|---|---|
| Kategori/keşif listesi | Her 10 kartta ≤ 2; ardışık iki sponsorlu yok | Varsayılan slotlar 3. ve 8. sıra. Organik sıra numarası sponsoru saymaz. Sponsorlu öğe aktif filtreleri karşılamıyorsa gösterilmez |
| Arama sonuçları | Sayfa başına ≤ 2; ilk 10 sonuç içinde ≤ 1 | Sorgudaki konum, kategori ve filtreyle eşleşmeyen sponsorlu sonuç asla gösterilmez. Örnek: Kadıköy'de vegan kahvaltı arayana Bodrum'daki otel gösterilmez |
| Harita | Görünür alanda ≤ 1 sponsorlu pin | Farklı pin stili + etiket; kümelenmede organik pinleri gizlemez |
| Varlık detay sayfası | ≤ 1 rakip sponsorlu kutu | Sayfanın alt yarısında, "Benzer seçenekler" listesinin dışında ayrı kutuda |
| Editoryal liste ("En iyiler") ve karşılaştırma tablosu | 0 | Listenin veya tablonun içinde sponsorlu öğe olmaz. Ayrı "Reklam" kutusu listenin sonunda yer alabilir |
| Kullanıcı değerlendirme alanı, değerlendirme formu, hesap sayfaları | 0 | — |
| Push / e-posta | Yalnızca pazarlama izni olanlara | Metnin başında "Sponsorlu" ibaresi; bildirim sıklık sınırına dahil (PRODUCT-UX-27) |

**Kabul kriterleri:**
- Her yüzey için sınır ve alaka kuralı birim + E2E testli (v1 §20'deki "etiket görünürlük testi" genişletilir).
- Sorgu ve filtreyle eşleşmeyen sponsorlu kampanya sonuçlara girmiyor.
- OG görselinde etiket var.

---

### PRODUCT-UX-19 — Arama: v1'deki örnek sorgular düz tam metin aramayla karşılanamaz ("yapay zekâ sonraki fazda" kararıyla çelişki)
- v1 bölüm: 7  ·  tür: çelişki  ·  öncelik: P0  ·  doğrulandı: evet (dış olgu iddiası yok)
- Gerekçe: "Antalya'da denize yakın uygun fiyatlı oteller" gibi sorgular konum + varlık tipi + özellik + bütçe ayrıştırması gerektirir. PostgreSQL tam metin araması bunu tek başına yapamaz. v1 yapay zekâ aramayı ileri faza bırakıyor, bu doğru; ama bu durumda MVP'de kural tabanlı bir sorgu anlama katmanı şart. Ayrıca otomatik tamamlama, sıfır sonuç, sonuç sayfası yapısı ve "Önerilen" sıralamanın açıklanması tanımsız.
- Kaynaklar: —
- Önerilen metin:

**ARAMA DENEYİMİ**

**1. Kural tabanlı sorgu anlama (MVP; yapay zekâ gerektirmez).** Sorguyu sözlüklerle ayrıştır; yönetim panelinden düzenlenebilir sözlükler:
- **Konum sözlüğü:** 81 il, ilçeler, popüler semt ve bölgeler ("Kapadokya", "Ege", "Sapanca"). Türkçe ekleri soy: "Antalya'da", "İzmir'deki", "Kapadokya'nın", "Bodrum'a yakın" → konum.
- **Varlık tipi ve kategori eş anlamlıları:** "kahvaltıcı / kahvaltı / serpme kahvaltı" → Mekan:Kahvaltı; "otel / konaklama / pansiyon" → Konaklama; "araç kiralama / araba kiralama / rent a car" → Araç kiralama.
- **Özellik sözlüğü:** "denize sıfır", "denize yakın", "çocuk dostu / çocuklarla", "evcil hayvan dostu", "manzaralı", "otoparklı", "özel gün", "havalimanı teslim".
- **Bütçe ifadeleri:** "uygun fiyatlı / ucuz / bütçe dostu" → fiyat seviyesi 1–2; "lüks" → 4.
- **Zaman ifadeleri:** "bugün açık", "şimdi açık", "hafta sonu" (etkinlikte tarih filtresi).
- Kalan metin tam metin aramaya gider. Ayrıştırma, metni PRODUCT-UX-05'teki katlama fonksiyonundan geçirdikten sonra yapılır.

**2. Algılanan filtreleri görünür kıl.** Sonuç sayfasının üstünde kaldırılabilir çipler göster: `Antalya ✕` `Otel ✕` `Denize yakın ✕` `Uygun fiyat ✕`. Kullanıcı yanlış algılananı tek dokunuşla kaldırabilmeli.

**3. Otomatik tamamlama:**
- 2. karakterden itibaren, 150 ms debounce ile çalışır.
- Gruplu sonuçlar: Konumlar, Kategoriler, Mekanlar/Varlıklar, Rehberler, Ürünler. Her grupta en fazla 3 öğe.
- Sorgu boşken: son aramalar (cihazda, tek tek ve topluca silinebilir) ve seçili şehirde popüler aramalar.
- Sponsorlu öneri yok.

**4. Sonuç sayfası:**
- Sekmeler ve sayılar: Tümü (12), Mekanlar (5), Oteller (3), Rehberler (4)...
- Sıralama seçenekleri: Önerilen, Puan (n≥3), Değerlendirme sayısı, Mesafe (konum izni varsa), Fiyat (veri varsa), En yeni.
- "Önerilen" sıralamanın yanında "Nasıl sıralanır?" bağlantısı olur. Açıklama: alaka, Bayes puanı, değerlendirme sayısı, veri tazeliği, mesafe. Ücretli yerleşim organik sıralamayı etkilemez.

**5. Sıfır sonuç:**
- Yazım önerisi ("Bunu mu demek istedin: Kadıköy").
- Gevşetme önerisi ("'Denize yakın' kaldırılırsa 18 sonuç").
- Yakın konum önerisi.
- "Aradığını bulamadın mı? Mekan öner" formu (yeni varlık önerisi moderasyona düşer).
- Sıfır sonuçlu sorgular analitikte ayrı raporlanır.

**6. Altın test seti:** `tests/search/golden.tr.json` dosyasında en az 40 Türkçe sorgu ve beklenen ayrıştırma bulunur. Zorunlu örnekler:

| Sorgu | Beklenen ayrıştırma |
|---|---|
| `Antalya'da denize yakın uygun fiyatlı oteller` | {konum: Antalya, tip: Konaklama, özellik: denize-yakin, fiyat: 1–2} |
| `kadikoy kahvalti` | {konum: Kadıköy, kategori: Kahvaltı} |
| `İZMİR havalimanı araç kiralama` | {konum: İzmir, tip: Araç kiralama, özellik: havalimani-teslim} |
| `çocuklarla gidilecek tatil yerleri` | {özellik: cocuk-dostu, tip: Destinasyon/Konaklama} |
| `bütçeye uygun kablosuz kulaklık` | {kategori: Kablosuz kulaklık, fiyat: alt dilim} |
| `iphone 16 vs galaxy s25` | karşılaştırma önerisi |

v1'deki 8 örnek sorgunun tamamı bu sete dahildir.

**Kabul kriterleri:**
- Altın setin en az %90'ı doğru ayrıştırılıyor; CI'da çalışıyor.
- Algılanan çipler kaldırılabiliyor ve URL güncelleniyor.
- Sıfır sonuç sayfasında en az bir eylem önerisi var.

---

### PRODUCT-UX-20 — Filtre, harita ve konum bağlamı için etkileşim kuralları eksik
- v1 bölüm: 7  ·  tür: eksik  ·  öncelik: P1  ·  doğrulandı: evet (Apple 5.1.1(iv) metni birincil kaynaktan doğrulandı)
- Gerekçe: v1 "bottom sheet", "harita ve liste görünümü" ve "konum izni isteğe bağlı" diyor ama şunlar tanımsız:
  - Tipe özgü filtre setleri
  - Filtre durumunun URL'de tutulması
  - Harita gezinme davranışı
  - Konum izni reddedildiğinde alternatif yol
  - Şehir bağlamının nasıl tutulacağı

  Apple yönergesi 5.1.1(iv), konum reddedildiğinde adresin elle girilebilmesi gibi bir alternatif sunulmasını önerir.
- Kaynaklar: https://developer.apple.com/app-store/review/guidelines/ (5.1.1(iv): "if a user declines to share Location, offer the ability to manually enter an address")
- Önerilen metin:

**FİLTRELER**
- Aktif filtreler sonuçların üstünde çip olarak görünür; her biri ✕ ile kaldırılır; "Tümünü temizle" bulunur.
- Mobilde bottom sheet: düğme canlı sonuç sayısını gösterir ("128 sonucu göster"); sıfır sonuç verecek seçenek pasif görünür ve yanında "(0)" yazar.
- Filtre ve sıralama durumu URL parametrelerinde tutulur (`?fiyat=1-2&ozellik=cocuk-dostu&sirala=puan`). Geri tuşu önceki durumu getirir. Hangi kombinasyonların indekslenebilir olacağını SEO bölümü belirler.
- Tipe özgü filtre setleri (başlangıç):
  - **Konaklama:** tarih + kişi (yalnızca sağlayıcı verisi varsa fiyat ve müsaitlik), konaklama türü, pansiyon tipi (oda-kahvaltı, yarım pansiyon, tam pansiyon, her şey dahil), olanaklar, fiyat seviyesi, puan.
  - **Mekan:** şimdi açık, öğün, mutfak türü, fiyat seviyesi, özellikler (bahçe, manzara, alkol servisi, vegan seçenek, çocuk dostu, rezervasyon), mahalle.
  - **Araç kiralama:** teslim yeri türü (havalimanı/şehir), araç sınıfı, vites, yakıt, depozito/kredi kartı şartı, minimum yaş, tek yön.
  - **Turist rehberi:** dil, bölge, uzmanlık, ruhsat doğrulandı.
  - **Ürün:** marka, fiyat aralığı (teklif verisi varsa), kategoriye özgü teknik özellikler, "editör testi var".
  - **Hizmet:** hizmet bölgesi (ilçe), hizmet türü, randevu yöntemi.

**HARİTA**
- Liste ↔ harita geçişi tek dokunuşla yapılır; seçili filtreler korunur.
- Harita kaydırılınca sonuçlar otomatik yenilenmez; "Bu alanda ara" düğmesi çıkar.
- Pinler kümelenir. Seçili pin alt kartta mini varlık kartı açar.
- Sponsorlu pin kuralları PRODUCT-UX-18'de.
- Haritadaki her görev liste görünümünde de yapılabilir; harita hiçbir görev için tek yol değildir (erişilebilirlik).

**KONUM VE ŞEHİR BAĞLAMI**
- Header'da kalıcı şehir seçici bulunur ("İstanbul ▾"). Varsayılan "Tüm Türkiye" olur; seçim cihazda saklanır.
- Kesin konum yalnızca kullanıcı "Yakınımda" veya Harita'ya dokunduğunda istenir; uygulama açılışında istenmez.
- İzin reddedilirse il/ilçe/semt seçimi veya adres girişi sunulur. Sistem izin penceresi yeniden zorlanmaz; ayarlara yönlendirme yalnızca kullanıcı tetiklerse gösterilir.
- Mesafe yalnızca konum izni varsa gösterilir. Kesin koordinat yalnızca istek anında kullanılır; saklama ve loglama kuralları gizlilik bölümünde.

**Kabul kriterleri:**
- Konum reddedilmiş kullanıcı "Yakınımda" akışını çıkmaza girmeden ilçe seçerek tamamlıyor (Y2).
- Filtreli URL paylaşıldığında aynı sonuç seti açılıyor.
- Harita kaydırınca otomatik istek atılmıyor.

---

### PRODUCT-UX-21 — Karşılaştırma deneyimi tanımsız ve fazlar çelişkili
- v1 bölüm: 19  ·  tür: çelişki  ·  öncelik: P1  ·  doğrulandı: evet (dış olgu iddiası yok)
- Gerekçe: v1 §5 "Karşılaştırma sayfası"nı ana sayfa listesinde sayıyor, §19 ise "Gelişmiş içerik karşılaştırmaları"nı Faz 4'e koyuyor. Editoryal karşılaştırma yazısı mı, kullanıcının oluşturduğu karşılaştırma tablosu mu kastedildiği belirsiz. Karşılaştırma, ürün alıcısı personası (P3) için kritik bir iş.
- Kaynaklar: —
- Önerilen metin:

**KARŞILAŞTIRMA**

| Tür | Kapsam | Faz |
|---|---|---|
| Editoryal karşılaştırma (`/karsilastir/a-vs-b`) | 2 varlık; editör metni + özellik tablosu + "Kimler için hangisi?" | Faz 1 (ürünler) |
| Karşılaştırma aracı (tepsi) | Aynı varlık tipi ve uyumlu kategoride 2–4 varlık; kullanıcı ekler | Faz 2 (ürünler), Faz 4 (konaklama, araç kiralama) |

**Kurallar:**
- **Tepsi:** Kartlarda "Karşılaştır" anahtarı bulunur. Tepsi sayfanın altında sabit durur ("2/4 seçildi · Karşılaştır"). Farklı varlık tipi eklenmek istenirse "Yalnızca aynı türdeki öğeler karşılaştırılabilir" mesajı çıkar. Misafirde seçim cihazda tutulur.
- **Tablo:**
  - Satırlar `CategoryAttributes` şemasından gelir; birimler normalize edilir (g, mAh, saat, ₺).
  - "Yalnızca farkları göster" anahtarı bulunur.
  - Eksik değer "Bilgi yok" olarak yazılır; "0", "—" veya boş kullanılmaz.
  - Sayısal satırlarda en iyi değer vurgulanır; bu vurgu "daha iyi" yönü tanımlı alanlarda yapılır (ör. ağırlıkta düşük olan iyidir).
  - Mobilde ilk sütun (özellik adı) sabit, varlık sütunları yatay kaydırılır. Masaüstünde başlık satırı yapışkandır.
- Puanlar karşılaştırma tablosunda da ayrı satırlarda gösterilir: "Editör: 8,5/10" ve "Kullanıcılar: 4,3 (128)".
- "Kimler için hangisi?" bölümü yalnızca editör en az birini bizzat test ettiyse yazılır; aksi halde "Araştırmaya dayalı" rozeti zorunludur.
- Karşılaştırılan taraflardan biri sponsor ise sayfa "Sponsorlu içerik" olarak etiketlenir ve editör puanı gösterilmez. Karşılaştırma tablosunun içinde sponsorlu yerleşim yer almaz.
- Editoryal karşılaştırma URL'sinde alfabetik sıra kanoniktir (PRODUCT-UX-04). Araç sonuçları noindex'tir.

**Kabul kriterleri:**
- Farklı tipteki öğe tepsiye eklenemiyor.
- "Yalnızca farkları göster" doğru çalışıyor (birim test).
- Eksik değerler "Bilgi yok" olarak görünüyor.

---

### PRODUCT-UX-22 — Kaydet / Favoriler / Koleksiyonlar: faz çelişkisi ve misafir davranışı
- v1 bölüm: 19  ·  tür: çelişki  ·  öncelik: P1  ·  doğrulandı: evet (dış olgu iddiası yok)
- Gerekçe: v1'de üç farklı yerde üç farklı faz var:
  - §6: Faz 2 mobil "Kaydedilenler: Favoriler ve koleksiyonlar" sekmesi.
  - §19 Faz 4: "Koleksiyonlar ve kullanıcı listeleri".
  - §20 E2E: Faz 1'de "favori ekler".

  "Favori" terimi beğeniyi ima ediyor; kullanıcının asıl işi ise "sonra bakmak için saklamak". Misafirin kaydettiklerinin girişte ne olacağı da tanımsız.
- Kaynaklar: —
- Önerilen metin:

**KAYDETME VE KOLEKSİYONLAR**
- **Terim:** Arayüzde "Favori" yerine **"Kaydet / Kaydedilenler"** kullan. İkon yer imi olsun; kalp beğeniyle karışır.

| Faz | Kapsam |
|---|---|
| Faz 1 (web) | Varlıkları ve editoryal içerikleri tek bir "Kaydedilenler" listesine kaydetme. Misafir cihazda en fazla 50 öğe kaydedebilir; giriş yapınca hesapla birleştirilir (çakışmada tekilleştirme) ve "12 öğe hesabına taşındı" bildirimi gösterilir |
| Faz 2 (web + mobil) | Adlandırılmış koleksiyonlar ("Kapadokya tatili"). Varsayılan özel; paylaşılabilir ve gizli bağlantıyla görüntülenebilir; noindex. Mobilde "Kaydedilenler" sekmesi. Kaydedilen varlıkların temel bilgileri (ad, adres, telefon, saatler) çevrimdışı okunabilir |
| Faz 4 | Herkese açık kullanıcı listeleri (moderasyonlu, editoryal listelerle karışmayan ayrı görsel kimlik) |

- Kaydedilen bir varlık kalıcı kapanırsa listede "Kalıcı olarak kapandı" etiketiyle kalır; otomatik silinmez.
- Koleksiyon verisi hesap silmede silinir; veri dışa aktarmaya dahil edilir.

**Kabul kriterleri:**
- Misafir 3 öğe kaydediyor → giriş yapıyor → hesapta 3 öğe görünüyor (E2E).
- Gizli bağlantıyla açılan koleksiyon noindex.
- v1 §20 E2E senaryo 3 bu tanıma göre güncellendi.

---

### PRODUCT-UX-23 — Editoryal içerik şablonları ve varlıkların içeriğe canlı bağlanması tanımsız
- v1 bölüm: 13  ·  tür: eksik  ·  öncelik: P1  ·  doğrulandı: evet (dış olgu iddiası yok)
- Gerekçe: v1 içerik editörü bloklarını sayıyor ama içerik türlerinin şablonlarını vermiyor. En önemlisi, rehberdeki mekan bilgilerinin kopyala-yapıştır metin mi yoksa canlı varlık kartı mı olacağı tanımsız. Kopya metin kaçınılmaz olarak bayatlar (kapanan mekan, değişen saat ve fiyat).
- Kaynaklar: —
- Önerilen metin:

**EDİTORYAL ŞABLONLAR**
- **Varlık kartı bloğu:** Editör rehber veya listeye bir varlığı gömdüğünde ad, konum, puan özeti, fiyat seviyesi, açık/kapalı durumu ve CTA varlık kaydından canlı okunur. Editörün yazdığı açıklama metni ayrıdır. Varlıkla ilgili tekrar eden bilgileri (adres, telefon, saat) yazı metnine kopyalamak editör arayüzünde uyarı üretir.
- **Bayatlık tetikleyicisi:** Gömülü varlık "kalıcı kapandı", "taşındı" veya "geçici kapalı" olursa:
  - Okura kartta otomatik uyarı gösterilir.
  - İçerik "Güncelleme gerekiyor" kuyruğuna düşer (PRODUCT-UX-34).

**Şablon başına zorunlu bölümler:**

| Tür | Zorunlu bölümler |
|---|---|
| Rehber (destinasyon) | Özet (3–5 madde), ne zaman gidilir, nasıl gidilir, nerede kalınır (varlık kartları), ne yenir (varlık kartları), gezilecek yerler (ilgi noktası kartları), tahmini bütçe (tarihli), pratik bilgiler, son kontrol tarihi |
| Liste ("En iyiler") | **Seçim metodolojisi kutusu:** kaç varlık değerlendirildi, kaçı ziyaret edildi, kriterler, son güncelleme. Sıra numarası yalnızca metodoloji sıralamayı destekliyorsa kullanılır; aksi halde "sırasız seçki" yazılır. Her öğede deneyim rozeti bulunur |
| Satın alma rehberi | Kimler için, bütçe kademeleri, nelere dikkat edilmeli, önerilen ürün kartları (kademe başına), test edilen/edilmeyen ayrımı |
| Karşılaştırma | PRODUCT-UX-21 |
| Uzun inceleme (test) | Test süresi ve koşulları, yöntem, sonuçlar, artı/eksi, kimler için, editör puanı (yalnızca bizzat test), ticari ilişki kutusu |

**Diğer kurallar:**
- Her editoryal içerik en az bir varlığa veya destinasyona bağlanır ya da açıkça "genel rehber" olarak işaretlenir. Bu bağlar iç bağlantı ve "Bu mekanın geçtiği rehberler" bölümünü besler.
- Başlık ve URL'de yıl kullanımı PRODUCT-UX-04'e göre yapılır. Başlıktaki yıl yalnızca içerik o yıl içinde anlamlı biçimde güncellendiyse gösterilir.

**Kabul kriterleri:**
- Gömülü varlık kalıcı kapandı olarak işaretlenince rehberde uyarı görünüyor ve rehber kuyruğa düşüyor (E2E, Y9).
- Liste şablonu metodoloji kutusu olmadan yayımlanamıyor.

---

### PRODUCT-UX-24 — "İşletmeni sahiplen" akışı, doğrulama yöntemleri ve sahip yetki sınırları tanımsız
- v1 bölüm: 9  ·  tür: eksik  ·  öncelik: P0  ·  doğrulandı: hayır (turist rehberliği belgelerine ilişkin bilgi ikincil kaynaklardan; birincil mevzuat metni açılamadı)
- Gerekçe: v1 "İşletme başvuru sayfası" ve "işletme paneli" diyor ama editörün eklediği mevcut bir varlığın sahiplenilmesini, doğrulama yöntemlerini ve sahibin neyi değiştirip neyi değiştiremeyeceğini tanımlamıyor. Doğrulamasız sahiplenme kimlik avı, rakip sabotajı ve değerlendirme baskısı riski taşır. v1 §4E, rehberler için lisans doğrulamasını istiyor. İkincil kaynaklara göre Türkiye'de turist rehberliği 6326 sayılı Kanun'a tabi; ruhsatname ve yıllık çalışma kartı gerektiriyor.
- Kaynaklar:
  - https://www.alomaliye.com/2012/06/22/turist-rehberligi-meslek-kanunu-kanun-no6326/ (ikincil)
  - https://yigm.ktb.gov.tr/Eklenti/130608,29012025-tarihli-ve-2025-1-sayili-genelgepdf.pdf (birincil olabilir; bu oturumda açılamadı)
- Önerilen metin:

**İŞLETMENİ SAHİPLEN AKIŞI** (Faz 2; ücretli paketlerden bağımsız)

- **Giriş noktaları:**
  - Her varlık sayfasında "Bu işletme senin mi?" bağlantısı
  - `/isletmeni-ekle`: varlık yoksa yeni kayıt ve yinelenen kayıt kontrolü (ad + konum benzerliği)
- **Doğrulama yöntemleri** (en az biri; varlık tipine göre yönetim panelinden yapılandırılır):
  1. Varlık kaydında **zaten kayıtlı olan** işletme telefonuna otomatik arama veya SMS koduyla doğrulama. Talep edenin yazdığı numara kabul edilmez.
  2. İşletmenin web sitesi alan adıyla eşleşen e-posta adresine doğrulama bağlantısı.
  3. Belge yükleme, moderatör incelemesiyle. Örnekler: vergi levhası, ticaret sicili veya oda faaliyet belgesi; konaklama için turizm belgesi; turist rehberi için ruhsatname ve geçerli yılın çalışma kartı. Geçerli belge türleri ve doğrulama kanalları hukuki inceleme ile kesinleştirilmeli.
- **Durumlar:**

  `Sahiplenilmemiş → Talep alındı → Doğrulama bekleniyor → Ek belge istendi → Onaylandı | Reddedildi (gerekçe) → (Sonradan) Devredildi / İptal edildi`

  Birden fazla talep varsa moderatör karar verir. Zincirler için bir kuruluş hesabı birden çok şubeyi yönetir.
- **Rozet:** "Doğrulanmış işletme". Tooltip: "Bu profili yöneten kişinin işletmeyle bağlantısı doğrulandı. Bu rozet kaliteyi veya platform önerisini göstermez." Ücretli paket bu rozeti vermez.

**Sahip yetkileri:**

| Doğrudan yayımlanır ("İşletme tarafından güncellendi: {tarih}" etiketiyle, denetim kaydına yazılır) | Moderasyona düşer | Sahip değiştiremez |
|---|---|---|
| Açıklama, çalışma saatleri, özel gün saatleri, menü, hizmet listesi, özellikler, rezervasyon/web bağlantısı, "geçici kapalı" bildirimi | Ad, adres/konum, telefon, kategori, fotoğraflar, "kalıcı kapandı" bildirimi | Kullanıcı değerlendirmeleri ve puanlar, editör değerlendirmesi, editoryal içerik, sponsorlu etiketler, diğer işletmeler |

**İşletme yanıtı:**
- Değerlendirme başına 1 yanıt; düzenlenebilir.
- Kişisel veri, tehdit veya hakaret içeremez; otomatik filtre + bildirim akışı uygulanır.
- Yanıt verildi diye değerlendirme kaldırılmaz.
- İşletmenin itiraz hakkı yalnızca tanımlı gerekçelerle kullanılabilir: sahte, çıkar çatışması, kişisel veri, hakaret, yanlış işletme. "Olumsuz" bir gerekçe değildir.

**Çıkar çatışması:** Sahip, kendi işletmesine ve aynı ilçe/kategorideki işletmelere değerlendirme yazamaz. Engellendiğinde sistem gerekçeyi açıklar.

**Kabul kriterleri:**
- E2E Y7: sahiplenme → kayıtlı telefonla doğrulama → saat güncelleme (anında yayın) → ad değişikliği (moderasyona düşer) → yanıt yazma.
- Sahip değerlendirme silme API'sine erişemiyor (yetki testi).
- Tüm sahip değişiklikleri denetim kaydında.

---

### PRODUCT-UX-25 — Soru-cevap (S-C) modülü tanımsız
- v1 bölüm: YENİ  ·  tür: eksik  ·  öncelik: P2  ·  doğrulandı: evet (dış olgu iddiası yok)
- Gerekçe: Değerlendirmelerin yanıtlamadığı somut sorular kararı doğrudan etkiler: "Bebek arabasıyla girilebiliyor mu?", "Otopark var mı?", "Kahvaltı kaçta bitiyor?". v1'de bu kanal yok. MVP için zorunlu değil, ama veri modeli ve UX baştan düşünülmeli.
- Kaynaklar: —
- Önerilen metin:

**SORU-CEVAP** (Faz 3; veri modeli Faz 1'de hazırlanır)
- **Soru:** Yalnızca giriş yapmış kullanıcılar sorabilir; 10–300 karakter. Göndermeden önce benzer sorular ve varlık bilgilerinde cevap varsa gösterilir ("Bu sorunun cevabı burada olabilir: Otopark: Var").
- **Cevap verebilenler:**
  - Bu varlık için değerlendirme yazmış kullanıcılar ("Burayı ziyaret etti" etiketiyle)
  - Doğrulanmış işletme ("İşletme" etiketiyle)
  - Editör
  - Diğer kullanıcılar (etiketsiz)
- **Sıralama:** İşletme ve editör cevabı üstte sabitlenmez. "Faydalı" oyu ve tarih belirleyicidir; işletme cevabı rozetle ayrılır.
- **Bildirim:** Soru, varlığı son 12 ayda değerlendiren en fazla 5 kullanıcıya iletilebilir; bu, kullanıcının bildirim tercihine ve sıklık sınırına tabidir (PRODUCT-UX-27).
- **Kapsam dışı:** Sağlık, hukuk ve finans tavsiyesi isteyen sorular moderasyonda yönlendirme metniyle kapatılır.
- **Veri akışı:** Cevaplanmış ve "faydalı" bulunmuş sık sorular editörün onayıyla varlık özelliklerine aktarılabilir (ör. "Otopark: Var"). Kaynak "Kullanıcı bilgisi, editör onaylı" olarak saklanır.

**Kabul kriterleri:**
- Soru → bildirim → cevap → faydalı akışı E2E testli.
- İşletme cevabı etiketli.
- Benzer soru önerisi çalışıyor.

---

### PRODUCT-UX-26 — Onboarding, misafir modu, giriş duvarları ve izin istemleri tanımsız
- v1 bölüm: 6  ·  tür: eksik  ·  öncelik: P1  ·  doğrulandı: evet (Apple ve Android maddeleri birincil kaynaktan doğrulandı)
- Gerekçe: v1 "misafir modu" ve "hesap açmaya zorlama" diyor ama misafirin neyi yapıp neyi yapamayacağı, giriş duvarının nasıl görüneceği, niyetin korunması ve izinlerin ne zaman isteneceği tanımsız. Platform kuralları bu konularda net:
  - Apple 5.1.1(v): hesap tabanlı özellik dışında girişsiz kullanım.
  - Apple 4.8: üçüncü taraf/sosyal girişle birincil hesap kuruluyorsa gizlilik özellikli eşdeğer bir giriş seçeneği zorunlu.
  - Apple 5.1.1(iv): izin için manipülasyon yasağı.
  - Android 13+ `POST_NOTIFICATIONS` çalışma zamanı izni ve bağlam içinde isteme önerisi.
- Kaynaklar:
  - https://developer.apple.com/app-store/review/guidelines/ (5.1.1(iv), 5.1.1(v), 4.8)
  - https://developer.android.com/develop/ui/views/notifications/notification-permission
- Önerilen metin:

**İLK KULLANIM VE MİSAFİR MODU**
- İlk açılışta tanıtım karuseli, zorunlu ilgi alanı seçimi ve giriş ekranı **olmaz**. Kullanıcı doğrudan Keşfet ekranına ve şehir seçicisine gelir.
- "İlgi alanlarını seç" kartı opsiyoneldir: ikinci oturumdan sonra akış içinde bir kart olarak çıkar ve kapatılabilir. Kapatılırsa 30 gün gösterilmez.

| Eylem | Misafir | Girişli |
|---|---|---|
| Gezinme, arama, filtre, harita, karşılaştırma | ✓ | ✓ |
| Kaydetme | ✓ (cihazda, en fazla 50) | ✓ |
| Değerlendirme yazmaya başlama | ✓ (taslak) | ✓ |
| Değerlendirme gönderme, faydalı oyu, soru sorma/cevaplama, koleksiyon paylaşma | ✗ → giriş | ✓ |
| İçerik bildirme | Web formu (e-posta ile) | ✓ |

**Giriş duvarı:**
- Tam ekran değil, bottom sheet olarak açılır. Neden giriş gerektiğini tek cümleyle söyler ("Değerlendirmeni yayımlamak için giriş yap").
- Giriş veya kayıt sonrası kullanıcı kaldığı yere döner ve eylem otomatik tamamlanır: taslak gönderilir, öğe kaydedilir.
- Kayıtta zorunlu alanlar yalnızca e-posta (veya kimlik sağlayıcı) ve görünen addır. Telefon, doğum tarihi ve cinsiyet istenmez.

**Giriş seçenekleri:**
- E-posta (tek kullanımlık kod veya şifre).
- Üçüncü taraf girişleri (ör. Google) sunulursa iOS'ta Apple yönergesi 4.8'in istediği gizlilik özellikli eşdeğer seçeneği de sun (ör. Apple ile Giriş).
- Hesap silme uygulama içinden yapılabilir (Apple 5.1.1(v)) ve en fazla 3 adımdır.

**İzinler (bağlam içinde):**
- **Konum:** Yalnızca "Yakınımda" veya Harita'ya dokunulduğunda istenir. Öncesinde tek ekranlık açıklama gösterilir ("Yakınındaki açık mekanları göstermek için"). Reddedilirse elle şehir/ilçe/adres girişi sunulur.
- **Bildirim:** Asla ilk açılışta istenmez. Anlamlı bir eylemden sonra teklif edilir: değerlendirme gönderildiğinde "Yayımlanınca haber verelim mi?", bir mekan kaydedildiğinde. Android 13+ için `POST_NOTIFICATIONS` bu anda istenir.
- **Fotoğraf:** Galeri için sistem seçicisi kullanılır; tüm galeriye erişim izni istenmez. Kamera izni yalnızca "Fotoğraf çek"e dokunulunca istenir.
- Reddedilen bir izin için sistem penceresi yeniden zorlanmaz. Ayarlara yönlendirme yalnızca kullanıcı ilgili özelliği tekrar tetiklediğinde sunulur.

**Kabul kriterleri:**
- Taze kurulumda ilk ekranda izin istemi veya giriş ekranı yok (mobil E2E).
- Misafir taslağı girişten sonra kaybolmuyor.
- Konum reddedilince elle seçim çalışıyor.
- Hesap silme ≤ 3 adım.

---

### PRODUCT-UX-27 — Bildirim stratejisi, kategorileri, sıklık sınırları ve sessiz saatler tanımsız
- v1 bölüm: 6  ·  tür: eksik  ·  öncelik: P1  ·  doğrulandı: hayır (Apple 4.5.4 ve Android doğrulandı; ticari elektronik ileti/İYS kapsamı doğrulanmadı)
- Gerekçe: v1 "isteğe bağlı push" ve "fırsat tercihleri" diyor ama bildirim türleri, varsayılanlar ve sıklık sınırı yok. Sponsorlu gelir baskısı aşırı bildirime ve uygulama silinmesine yol açar. Apple 4.5.4'e göre push bildirimleri pazarlama için yalnızca uygulama içinde açık onay ve vazgeçme yolu sunulduğunda kullanılabilir.
- Kaynaklar:
  - https://developer.apple.com/app-store/review/guidelines/ (4.5.4)
  - https://developer.android.com/develop/ui/views/notifications/notification-permission
- Önerilen metin:

**BİLDİRİM STRATEJİSİ**

| Kategori | Örnekler | Varsayılan | Kanal |
|---|---|---|---|
| A. İşlemsel / hesap | Değerlendirme yayımlandı/yayımlanmadı (gerekçeli), işletme yanıt verdi, soruna cevap geldi, sahiplenme sonucu, güvenlik | Açık (push için işletim sistemi izni gerekir) | Uygulama içi + push + e-posta |
| B. Etkileşim | Değerlendirmen faydalı bulundu (günlük özet), kaydettiğin mekan hakkında yeni editör içeriği, kaydettiğin mekan kapandı | Uygulama içi açık; push kapalı | Uygulama içi, opsiyonel push |
| C. Pazarlama / fırsat / sponsorlu | Kampanyalar, sezonluk öneriler, sponsorlu fırsatlar | **Kapalı.** Uygulama içinde açık onay metniyle ayrı ayrı açılır (push, e-posta ayrı anahtarlar) | Push, e-posta |

**Sıklık ve zaman sınırları** (sunucuda zorlanır):
- C kategorisi push: günde ≤ 1, haftada ≤ 3.
- B + C toplamı push: günde ≤ 2.
- E-posta bülteni: haftada ≤ 1.
- Sessiz saatler 22:00–09:00 (Europe/Istanbul): A kategorisindeki güvenlik bildirimleri dışında gönderim ertesi sabaha ertelenir.
- Geri çekilme: Kullanıcı art arda 5 pazarlama bildirimini açmazsa C sıklığı otomatik olarak haftada 1'e düşer.
- Toplama: Aynı türden birden fazla olay tek bildirimde birleştirilir ("3 değerlendirmen faydalı bulundu").

**Diğer kurallar:**
- Her bildirim ilgili ekrana derin bağlantıyla açılır.
- Uygulama içi bildirim merkezi 90 gün saklar ve okundu/okunmadı durumu tutar.
- Her e-postada tek tıkla abonelikten çıkış bulunur. Bildirim tercihleri profilden en fazla 2 adımda değiştirilebilir.
- Coğrafi çit (geofence) ve konum tetiklemeli bildirimler MVP kapsamında değildir.
- Pazarlama içerikli push, e-posta ve SMS'in Türkiye'deki ticari elektronik ileti mevzuatı ve İleti Yönetim Sistemi (İYS) kapsamında olup olmadığı ve gerekli onay/kayıt süreçleri hukuki incelemeyle doğrulanmalı. Doğrulanmadan C kategorisi üretimde açılmamalı.

**Kabul kriterleri:**
- Sıklık sınırı ve sessiz saat birim testli (saat dilimi sabitlenmiş testlerle).
- C kategorisi varsayılan kapalı.
- Onay metni ve vazgeçme yolu uygulama içinde mevcut.

---

### PRODUCT-UX-28 — Uçtan uca kullanıcı yolculukları ve ölçülebilir kabul kriterleri eksik (v1 E2E senaryoları yönetici ağırlıklı)
- v1 bölüm: 20  ·  tür: kabul_kriteri  ·  öncelik: P0  ·  doğrulandı: evet (dış olgu iddiası yok)
- Gerekçe: v1 §20'deki 8 senaryonun çoğu yönetici ve sistem akışı. Son kullanıcının karar yolculukları (yakında mekan bulma, otel seçme, ürün karşılaştırma), konum reddi, misafir taslak, sahiplenme ve paylaşılan bağlantı gibi akışlar yok. Başarı ölçütleri de ölçülebilir değil.
- Kaynaklar: —
- Önerilen metin:

**ANA KULLANICI YOLCULUKLARI** (her biri web için Playwright, mobil için bir uçtan uca test aracıyla, ör. Maestro veya Detox, otomatik testtir; `docs/product/yolculuklar.md` içinde adım adım belgelenir)

| Kod | Persona | Yolculuk | Ölçülebilir kabul kriteri |
|---|---|---|---|
| Y1 | P2 | Mobil, konum izni var: ana sayfa → "kadikoy kahvalti" araması → sonuç → mekan detay → "Yol tarifi al" | Arama kutusundan CTA'ya ≤ 4 dokunuş. Algılanan çipler: Kadıköy, Kahvaltı. Kartlarda ad, mahalle, mesafe, puan (veya eşik metni), fiyat seviyesi, açık/kapalı. "Şu an açık" cihaz saat dilimi UTC iken bile doğru. `outbound_click{tip:yol_tarifi}` kaydediliyor |
| Y2 | P2 | Konum izni reddedilmiş: "Yakınımda" → ret → ilçe seçimi → liste | Çıkmaz ekran yok; sistem izin penceresi ikinci kez açılmıyor; ilçe seçimiyle liste geliyor |
| Y3 | P1 | Masaüstü: `/rehber/kapadokya-gezi-rehberi` → gömülü otel kartı → konaklama detay → "{Sağlayıcı}'da fiyatları gör" | Fiyat gösteriliyorsa kaynak ve zaman damgası görünür; gösterilmiyorsa sabit fiyat yok. Bağlantıda `rel="sponsored"` (affiliate ise) ve affiliate açıklaması var. `affiliate_click` kaydediliyor |
| Y4 | P3 | `/urunler/teknoloji/kablosuz-kulaklik` → filtre (fiyat, gürültü engelleme) → 2 ürünü tepsiye ekle → karşılaştır → "{Satıcı}'da gör" | "Yalnızca farkları göster" çalışıyor; eksik değer "Bilgi yok"; puanlar ayrı satırlarda |
| Y5 | P4 | "izmir havalimanı araç kiralama" → sağlayıcı listesi (filtre: havalimanı teslim) → sağlayıcı detay → yönlendirme | Şartlar (yaş, depozito) ilk iki ekranda görünür. Canlı veri yokken hiçbir fiyat güncelmiş gibi gösterilmiyor (v1 senaryo 8 ile birleşik) |
| Y6 | P5 | Misafir: mekan → "Değerlendirme yaz" → puan + metin → Gönder → giriş → otomatik gönderim → "İncelemede" → moderatör onayı → bildirim → "Yayında" | Taslak kaybı 0. Ret dalında gerekçe gösteriliyor ve düzenleyip yeniden gönderme çalışıyor |
| Y7 | P6 | "Bu işletme senin mi?" → giriş → kayıtlı telefonla doğrulama → onay → saat güncelleme → ad değişikliği önerisi → değerlendirmeye yanıt | Saat güncellemesi anında ve etiketli yayımlanıyor; ad değişikliği moderasyonda; yanıt görünür; denetim kaydı var |
| Y8 | P7 | Reklamveren başvurusu → yönetici kampanya ve yerleşim oluşturur → yayın → gösterim/tıklama raporu | Etiket her yüzeyde var; alaka kuralı çalışıyor; rapor yalnızca gerçek olaylardan |
| Y9 | P8 | Editör rehber oluşturur → varlık kartı gömer → önizleme → yayın → gömülü mekan "kalıcı kapandı" yapılır | Rehberde uyarı çıkıyor; içerik "Güncelleme gerekiyor" kuyruğunda |
| Y10 | P9 | Bildirilen değerlendirme → moderatör kararı + gerekçe kodu → kullanıcıya bildirim → itiraz → ikinci moderatör | Gerekçe kullanıcıya iletiliyor; itiraz farklı moderatöre atanıyor |
| Y11 | Tümü | Profil → Ayarlar → Hesabı sil | ≤ 3 adım; silinecek ve anonimleştirilecek veriler açıklanıyor; onay sonrası oturum kapanıyor |
| Y12 | Tümü | WhatsApp'tan gelen `/mekan/{slug}` bağlantısı | Uygulama yüklüyse ilgili ekran, değilse web sayfası açılıyor; geri tuşu beklendiği gibi çalışıyor |

**Kabul kriterleri:**
- Y1–Y12 CI'da yeşil.
- Her yolculuk ilgili persona ve analitik olaylarla eşleşmiş.
- v1 §20'deki 8 senaryo bu tabloya dahil edilmiş veya eşlenmiş.

---

### PRODUCT-UX-29 — Ekran envanteri ve wireframe/ekran teslimatları tanımsız
- v1 bölüm: 22  ·  tür: eksik  ·  öncelik: P1  ·  doğrulandı: evet (dış olgu iddiası yok)
- Gerekçe: v1 "bilgi mimarisini ve kullanıcı akışlarını oluştur" ve "temel ekranları oluştur" diyor ama teslimat biçimi, ekran listesi ve her ekranın hangi durumları içereceği tanımsız. Bu yüzden "yalnızca mutlu yol" ekranları üretilmesi olası.
- Kaynaklar: —
- Önerilen metin:

**EKRAN ENVANTERİ VE TESLİMATLAR**

**Teslimat biçimi:**
- `docs/ux/ia.md`: Mermaid site haritası + URL tablosu (PRODUCT-UX-04).
- `docs/ux/ekranlar/{kod}.md`: her ekran için amaç, persona/JTBD, bileşen listesi, veri kaynakları, durumlar, metinler, analitik olayları, erişilebilirlik notları.
- Her ekranın kodlanmış hali ve şu durumlar için Storybook hikâyeleri: **yükleniyor (iskelet), dolu, boş, kısmi veri, hata, çevrimdışı (mobil), yetkisiz (giriş gerekli)**.
- Web için Playwright ekran görüntüleri 360, 768 ve 1280 px genişlikte; mobil için 390×844 ve 412×915 görünümlerde. Görüntüler `docs/ux/ekran-goruntuleri/` altında ve CI artefaktı olarak tutulur.

**Ekran listesi (öncelik sırasıyla):**
- **P0 (Faz 1, web):**
  - Ana sayfa
  - Arama sonuçları
  - İl sayfası
  - İl/ilçe × kategori keşif listesi (liste + harita)
  - Mekan detay
  - Konaklama detay
  - Ürün detay
  - Ürün kategori listesi
  - Rehber (yazı)
  - Liste ("En iyiler")
  - Editoryal karşılaştırma
  - Değerlendirme yazma
  - Değerlendirmelerim (durumlarla)
  - Kaydedilenler
  - Giriş/kayıt bottom sheet ve sayfası
  - Profil ve ayarlar (bildirim, gizlilik, hesap silme)
  - Yazar sayfası
  - Nasıl değerlendiriyoruz
  - Politika sayfaları
  - Çerez tercih merkezi
  - Bildir formu
  - 404/410
- **P1:**
  - Araç kiralama sağlayıcısı
  - Tur/aktivite
  - Hizmet işletmesi
  - Destinasyon/ilgi noktası
  - Kullanıcı profili (herkese açık)
  - Fırsatlar
  - Sahiplenme akışı
  - İşletme paneli (özet, profil düzenleme, değerlendirmeler ve yanıt)
  - Bildirim merkezi
- **P1 (yönetim paneli):**
  - Varlık düzenleme
  - İçerik blok editörü
  - Moderasyon kuyruğu
  - Tazelik kuyruğu
  - Kampanya ve yerleşim
  - Ana sayfa modülleri
  - Sözlükler (arama eş anlamlıları, konum çekimleri)
- **P2:**
  - Etkinlik
  - Turist rehberi profili
  - Karşılaştırma aracı (3–4 öğe)
  - Koleksiyon paylaşımı
  - Soru-cevap

**Kabul kriterleri:**
- P0 ekranlarının tamamında 7 durumun Storybook hikâyesi ve ekran dokümanı var.
- Ekran görüntüleri CI'da üretiliyor.
- Belgelenmemiş P0 ekranı "tamamlandı" sayılmıyor.

---

### PRODUCT-UX-30 — MVP kapsamı: tüm dikeyleri aynı anda açmak soğuk başlangıç riskini büyütüyor; yayın eşikleri yok
- v1 bölüm: 19  ·  tür: risk  ·  öncelik: P0  ·  doğrulandı: evet (dış olgu iddiası yok)
- Gerekçe: v1 Faz 1'de tüm kategorilerin "işletme ve mekan detayları" ile açılmasını öngörüyor. İnceleme platformlarında değer veri yoğunluğundan gelir: az sayıda iyi doldurulmuş şehir × kategori, çok sayıda boş sayfadan daha güvenilirdir. v1'de şunlar da yok:
  - İçerik başlangıç beslemesi (seed) için toplu veri girişi
  - Kategori/şehir yayın eşiği
  - "Gizli" kategori durumu

  Ayrıca işletme sahibinin hatalı veriyi düzeltme yolu Faz 3'e kalıyor; bu da ilk günden şikâyet üretir.
- Kaynaklar: —
- Önerilen metin:

**MVP KAPSAMI VE YAYIN EŞİKLERİ** (değerler varsayılandır; ADR ile değiştirilebilir)

**Lansman kapsamı (Faz 1):**
- **Dikeyler:**
  - Yeme-içme (Mekan)
  - Konaklama
  - Teknoloji ürünleri (ürün sayfaları, editoryal karşılaştırma ve satın alma rehberleri)
  - Destinasyon rehberleri
- **Şehirler:** İstanbul, İzmir, Antalya, Muğla, Nevşehir (Kapadokya).
- Araç kiralama sağlayıcısı sayfaları canlı fiyat olmadan Faz 1'in sonunda açılır.
- Turist rehberi, Etkinlik, Hizmet işletmesi ve Eser tipleri altyapıda modellenir ama yayın eşiği sağlanana kadar gizli kalır.

**Kategori ve hub durumları:** `taslak → gizli (yalnızca yönetici görür) → yayında`. "Yakında" sayfası açma.

**Yayın eşikleri** (yönetim panelinden ayarlanabilir):

| Sayfa | Menüde görünme ve indekslenme eşiği |
|---|---|
| İl × kategori hub'ı | ≥ 30 yayımlanmış varlık (zorunlu alanları tam) ve ≥ 1 editoryal içerik |
| İlçe × kategori | ≥ 10 varlık |
| Ürün kategorisi | ≥ 15 ürün (teknik özellikleri dolu) ve ≥ 3 editör testli ürün |
| Destinasyon (il) sayfası | ≥ 1 rehber ve ≥ 2 yayımlanmış kategori hub'ı |

**Başlangıç besleme araçları (Faz 1 zorunlu):**
- Yönetim panelinde CSV/XLSX toplu varlık içe aktarma.
- Alan doğrulama, yinelenen kayıt tespiti (ad + koordinat yakınlığı), önizleme ve geri alma.
- Her kayıtta veri kaynağı alanı.
- Kaynak, lisanslı veri veya editör girişi olmalıdır; yetkisiz scraping ile doldurma (v1 §10 ile uyumlu).

**Faz düzeltmeleri:**
- "Bilgi hatalı mı? Düzeltme öner" formu Faz 1'de gelir.
- Sahiplenme + işletme yanıtı + temel bilgi güncelleme Faz 2'ye çekilir. Bunlar ücretsizdir.
- Ücretli işletme paketleri ve self-servis kampanya Faz 3'te kalır.

**Faz çıkış kriterleri (Faz 1):**
- Lansman şehirlerinde her yayımlanan hub eşiği sağlıyor.
- Y1, Y3, Y4, Y6, Y9 ve Y10 yolculukları CI'da yeşil.
- Sıfır sonuç oranı izleniyor.
- Tüm P0 ekranları 7 durumuyla teslim edilmiş.

**Kabul kriterleri:**
- Eşiğin altındaki hub menüde ve site haritasında yok (test).
- Toplu içe aktarma yinelenen kaydı yakalıyor (test).

---

### PRODUCT-UX-31 — Ürün başarı metrikleri (North Star, girdi metrikleri, sınır metrikleri) tanımsız
- v1 bölüm: 18  ·  tür: eksik  ·  öncelik: P1  ·  doğrulandı: evet (dış olgu iddiası yok)
- Gerekçe: v1 olay listesi ve gösterge panelleri sayıyor ama ürünün başarılı olup olmadığını gösteren tanımlı bir metrik yok. Sponsorlu gelir ile güven arasındaki gerilimi izleyecek sınır metrikleri (guardrail) de eksik. Bunlar olmadan ana sayfa ve yerleşim kararları yalnızca tıklamaya göre optimize edilir.
- Kaynaklar: —
- Önerilen metin:

**ÜRÜN METRİKLERİ**

**North Star:** Haftalık **nitelikli karar oturumu** sayısı. Tanım: bir oturumda en az 1 varlık veya editoryal içerik detay görüntülemesi (≥ 20 sn görünür) **ve** en az 1 karar eylemi. Karar eylemleri: kaydetme, karşılaştırma görüntüleme, `outbound_click` (yol tarifi, telefon, web, rezervasyon, affiliate).

| Tür | Metrik | Tanım |
|---|---|---|
| Girdi | Arama başarı oranı | Sonuç sayfası görüntülenen aramalardan aynı oturumda sonuç tıklamasıyla biten oranı |
| Girdi | Sıfır sonuç oranı | Sıfır sonuçlu arama / toplam arama (alarm: %10 üzeri, haftalık) |
| Girdi | Değerlendirme formu dönüşümü | `review_started` → `review_submitted` |
| Girdi | Değerlendirme yayın süresi | Gönderimden yayına medyan süre |
| Girdi | Veri tazeliği | Son 12 ayda doğrulanmış varlık oranı (hub bazında) |
| Girdi | Sahiplenme oranı | Değerlendirmesi olan varlıklar içinde sahiplenilmiş olanların oranı |
| Sınır | Sponsorlu yoğunluk | Yüzey bazında gösterilen sponsorlu kart oranı (PRODUCT-UX-17/18 sınırları aşılmıyor mu) |
| Sınır | Sponsorlu ile organik TO farkı | Sponsorlu tıklama oranı organikten belirgin yüksekse etiket görünürlüğü incelenir |
| Sınır | Şikayet ve ret oranı | Bildirilen içerik / yayımlanan; reddedilen değerlendirme oranı |
| Sınır | Bildirim kapatma oranı | Push iznini geri alma ve e-posta abonelikten çıkış oranı |
| Sınır | "Bilgi hatalı" bildirimleri | 1.000 varlık görüntülemesi başına |

**Kurallar:**
- Hedef değerleri ilk 4 haftalık temel ölçümden sonra belirle. Uydurma hedef veya örnek sayıyı gösterge panelinde gerçek veri gibi gösterme (v1 §9 ile uyumlu).
- Her olayın şeması `docs/analytics/olaylar.md` içinde tanımlanır: olay adı, zorunlu özellikler (`varlik_tipi`, `yuzey`, `sponsorlu_mu`, `konum_kaynagi`), rıza gereksinimi.

**Kabul kriterleri:**
- North Star ve sınır metrikleri yönetim panelinde gerçek olaylardan hesaplanıyor.
- Rıza yokken analitik olayları gönderilmiyor (test).

---

### PRODUCT-UX-32 — Erişilebilirlik akış düzeyinde somutlaştırılmamış (puan girişi, harita, karusel, bottom sheet, hedef boyutları)
- v1 bölüm: 17  ·  tür: eksik  ·  öncelik: P1  ·  doğrulandı: hayır (Android 48dp birincil kaynaktan doğrulandı; WCAG 2.5.8 ikincil kaynaktan; iOS 44pt sayfası içerik döndürmedi)
- Gerekçe: v1 genel erişilebilirlik maddeleri sayıyor. Bu platformun riskli bileşenleri ise özel: yıldız puan girişi, harita, karusel, bottom sheet filtreleri, yalnızca renkle ayrılan sponsorlu kartlar. Ölçülebilir bir hedef seviye de belirtilmemiş.
- Kaynaklar:
  - https://developer.android.com/guide/topics/ui/accessibility/apps (48dp)
  - https://www.w3.org/TR/WCAG22/ (2.5.8 Target Size (Minimum), AA, 24×24 CSS px; bu oturumda doğrudan açılamadı, ikincil: https://kb.daisy.org/publishing/docs/wcag/target-size-minimum.html)
- Önerilen metin:

**ERİŞİLEBİLİRLİK: AKIŞ DÜZEYİ KURALLAR**

Hedef: Web için WCAG 2.2 AA. Kriter metinleri W3C'nin resmi sayfasından doğrulanmalı. Mobil için platform erişilebilirlik yönergeleri.

- **Puan girişi:**
  - Radyo grubu olarak uygulanır (`role="radiogroup"`); her seçenek metin etiketli ("4 yıldız: İyi").
  - Ok tuşlarıyla değiştirilebilir.
  - Sürükleme gerektirmez.
- **Puan gösterimi:** Ekran okuyucu metni "5 üzerinden 4,3 puan, 128 değerlendirme" olur; yıldız ikonları `aria-hidden` olur.
- **Sponsorlu etiket:** Metin olarak bulunur, yalnızca renk veya ikonla ifade edilmez; ekran okuyucu önce etiketi okur.
- **Harita:** Her görev liste görünümünde de yapılabilir. Pinler klavyeyle erişilebilir ya da eşdeğer liste sunulur. Harita kendi kendine odak yakalamaz.
- **Bottom sheet ve modal:**
  - Açılışta odak sheet'e taşınır; odak içeride tutulur.
  - Esc, Android geri tuşu ve kaydırma ile kapanır; kapanınca odak tetikleyiciye döner.
  - Yapışkan header/footer odaklanan öğeyi örtmez.
- **Karusel:**
  - Otomatik oynatma yok.
  - Önceki/sonraki düğmeleri ve "x / n" konum bilgisi bulunur.
  - Kaydırma tek başına zorunlu değildir.
- **Dokunma hedefleri:**
  - Web: tüm etkileşimli hedefler en az 24×24 CSS px (WCAG 2.2 2.5.8); birincil eylemler en az 44×44 CSS px.
  - Android: en az 48×48 dp.
  - iOS: en az 44×44 pt (Apple HIG'de doğrulanmalı).
- **Metin ölçekleme:** Mobilde sistem yazı tipi boyutu en büyük ayardayken ve web'de %200 yakınlaştırmada içerik kaybı ve yatay kaydırma olmaz.
- **Hareket:** `prefers-reduced-motion` ve sistem "hareketi azalt" ayarına uyulur.
- **Formlar:**
  - Hata mesajı alanın yanında ve özet olarak formun üstünde gösterilir; odak ilk hatalı alana taşınır.
  - Zorunlu alanlar metinle belirtilir.
  - Giriş için bilişsel test (karmaşık CAPTCHA) zorunlu değildir; alternatif sunulur.
- **Görseller:**
  - Kullanıcı fotoğraflarına opsiyonel açıklama alanı vardır.
  - Açıklama yoksa varsayılan alt metin "{Kullanıcı adı} tarafından paylaşılan {varlık adı} fotoğrafı" olur.
  - Dekoratif görseller `alt=""`.
- **Dil:** `<html lang="tr">`; yabancı dildeki bloklar `lang` ile işaretlenir.

**Kabul kriterleri:**
- axe-core taraması P0 ekranlarında kritik veya ciddi ihlal vermiyor (CI).
- Puan girişi klavyeyle E2E test ediliyor.
- Bottom sheet odak testi geçiyor.
- VoiceOver ve TalkBack ile Y1 ve Y6 için manuel test kontrol listesi doldurulmuş.

---

### PRODUCT-UX-33 — Kullanıcı profili ve kamuya açık kimlik kuralları tanımsız
- v1 bölüm: 5  ·  tür: eksik  ·  öncelik: P1  ·  doğrulandı: evet (dış olgu iddiası yok)
- Gerekçe: v1 "Kullanıcı profili" ve "Okuma geçmişi" sayfalarını sayıyor. Ancak profilde neyin herkese açık olacağı, görünen ad kuralları, güvenilirlik sinyalleri ve okuma geçmişinin gizliliği tanımsız. Değerlendirme platformunda kimlik kuralları hem güveni hem kullanıcının güvenliğini (işletmeyle yaşanabilecek anlaşmazlık) etkiler.
- Kaynaklar: —
- Önerilen metin:

**KULLANICI PROFİLİ**
- **Görünen ad:** Varsayılan biçim "Ad S." (soyadın baş harfi). Kullanıcı takma ad seçebilir. Kullanıcı adı benzersiz, küçük harf ve slug kurallarına uygun olur (PRODUCT-UX-05). Kurum veya marka adını taklit eden adlar ve küfür filtreden geçirilir.
- **Herkese açık profil:** Görünen ad, avatar (opsiyonel), üyelik yılı, değerlendirme sayısı, toplam "faydalı" sayısı, yayımlanmış değerlendirmeler.
  - Kullanıcı "Profilimi gizle" seçebilir. Bu durumda değerlendirmeler görünen adla yayında kalır ama profil sayfası listelenmez.
- **Gizli kalanlar:** E-posta, telefon, kesin ziyaret günü (yalnızca ay/yıl gösterilir), kanıt belgeleri, kaydedilenler (koleksiyon paylaşılmadıkça), okuma geçmişi.
- **Rozetler yalnızca olgusal olur:** "25 değerlendirme", "2026'dan beri üye", "Doğrulanmış işletme sahibi" (yalnızca işletme yanıtlarında). Oyunlaştırma rozetleri ("Gurme", "Elit") Faz 4'e kadar yok; kriterleri yayımlanmadan verilmez.
- **Okuma ve görüntüleme geçmişi:**
  - Misafirde yalnızca cihazda tutulur.
  - Girişli kullanıcıda varsayılan olarak hesapta tutulur; ayarlardan kapatılabilir ve tek tek veya topluca silinebilir.
  - Kişiselleştirme rızası yoksa sunucuya gönderilmez.
- **Veri yönetimi:** Profil ayarlarında veri dışa aktarma ve hesap silme bulunur. Hesap silinince değerlendirmelerin silinip silinmeyeceği veya anonimleştirilip anonimleştirilmeyeceği politikası gizlilik ve hukuk incelemesiyle belirlenir ve silme ekranında açıkça yazılır.

**Kabul kriterleri:**
- Herkese açık profil API'si gizli alanları döndürmüyor (test).
- "Profilimi gizle" profili listelerden kaldırıyor.
- Geçmiş silme çalışıyor.

---

### PRODUCT-UX-34 — İşletme paneli ile editör ve moderatör araçlarının iş akışı UX'i tanımsız (tazelik kuyruğu yok)
- v1 bölüm: 11  ·  tür: eksik  ·  öncelik: P1  ·  doğrulandı: evet (dış olgu iddiası yok)
- Gerekçe: v1 25 yönetim modülünün adını sayıyor ama hiçbirinin iş akışını tanımlamıyor. Şunlar yok:
  - İçerik durumları
  - Sponsorlu içeriğin ek onay adımı
  - İçeriklerin bayatlamasını yakalayan bir kuyruk
  - Moderatör hızı ve tutarlılığı için araçlar
  - İşletme panelinin ilk ekranında ne olacağı

  "İçeriklerin güncellik durumu" gösterge panelinde var ama işlenebilir bir iş listesine dönüşmüyor.
- Kaynaklar: —
- Önerilen metin:

**EDİTÖRYAL İŞ AKIŞI**
- **Durumlar:**

  `Taslak → Editör incelemesinde → (Sponsorlu ise) Ticari/hukuki onay → Zamanlanmış → Yayında → Güncelleme gerekiyor → Arşiv`

  Her geçiş denetim kaydına yazılır. Sponsorlu içerik "Ticari/hukuki onay" adımı atlanarak yayımlanamaz.
- **Tazelik kuyruğu** (ilk değerler yönetim panelinden ayarlanabilir):

  | İçerik türü | "Güncelleme gerekiyor" eşiği |
  |---|---|
  | Fiyat içeren liste veya rehber | 90 gün |
  | "En iyiler" listesi (mekan) | 180 gün |
  | Destinasyon rehberi | 12 ay |
  | Satın alma rehberi | 6 ay veya kategoriye yeni model eklendiğinde |
  | Gömülü varlığı kapanan içerik | Anında |

  Kuyruk; trafik, sorumlu editör ve eşiğin ne kadar aşıldığına göre sıralanır.
- **Yayın öncesi kontrol listesi:** Editör "Yayınla" demeden önce otomatik kontrol çalışır. Kontroller:
  - Güven bileşenleri (PRODUCT-UX-16)
  - Ticari ilişki alanı
  - Alternatif metinler
  - Kırık bağlantılar
  - Fiyatların kaynak ve tarihi
  - Başlık uzunluğu
  - Ek kuralları (PRODUCT-UX-06)

**MODERATÖR ARAÇLARI**
- Tek kuyruk, risk ve yaşa göre sıralı; kaynak türüne göre filtrelenir: değerlendirme, fotoğraf, soru-cevap, işletme yanıtı, sahiplenme, düzeltme önerisi.
- Klavye kısayolları: onayla, reddet + gerekçe kodu, ertele, üst düzeye ilet.
- Kullanıcıya giden açıklama gerekçe koduna bağlı şablondan gelir. Hitap PRODUCT-UX-08'e göre seçilir: son kullanıcıya "sen", işletmeye "siz".
- Karar ekranında yazarın geçmişi (önceki ret ve bildirimler), aynı cihaz/IP kümesinden gelen benzer içerik sinyali (gizlilik kurallarına uygun) ve varlığın son 30 günlük değerlendirme yoğunluğu gösterilir.
- İtiraz, ilk kararı veren moderatöre atanamaz.
- Hedef süreler (iç hedef): yeni değerlendirmeye ilk karar 48 saat içinde; bildirilen içeriğe 24 saat içinde. Yasal süreler varsa hukuki inceleme belirler.

**İŞLETME PANELİ ÖZETİ (Faz 2)**
- İlk ekranda şunlar bulunur:
  - Profil tamlık yüzdesi ve eksik alan listesi
  - Yanıtlanmamış değerlendirmeler
  - Cevapsız sorular
  - Bekleyen değişiklik onayları
  - Son 30 gün görüntülenme ve CTA tıklamaları (yalnızca gerçek olaylardan; veri yoksa "Henüz yeterli veri yok")
- Panelde ücretli paket önerileri, değerlendirme kaldırma veya puan iyileştirme ima eden hiçbir metin bulunmaz. Kalıcı bir bilgi notu yer alır: "Sponsorluk ve paketler değerlendirmeleri ve puanları etkilemez."

**Kabul kriterleri:**
- Sponsorlu içerik onay adımı atlanarak yayımlanamıyor (yetki testi).
- Tazelik kuyruğu eşik testleri geçiyor.
- İtiraz ilk moderatöre atanmıyor.

---

### PRODUCT-UX-35 — Fiyat seviyesi ve fiyat gösterimi UX'i tanımsız (yüksek enflasyonda sabit aralıklar hızla bayatlar)
- v1 bölüm: 10  ·  tür: eksik  ·  öncelik: P1  ·  doğrulandı: hayır (indirim/eski fiyat gösterimine ilişkin mevzuat doğrulamaya bırakıldı)
- Gerekçe: v1 "fiyat seviyesi" ve "fiyatın kaynağını belirt" diyor. Ancak "₺₺" gibi seviyelerin neyi ifade ettiği ve hangi tarihe göre tanımlandığı belirsiz. Türkiye'de fiyatlar hızla değiştiği için sabit TL aralıkları birkaç ayda anlamsızlaşır. Ayrıca şunlar tanımsız:
  - "En ucuz" iddiası
  - Üstü çizili "eski fiyat"
  - Konaklamada parametresiz "gecelik X ₺" gösterimi

  Bu ifadeler yanıltıcı reklam riskini artırır.
- Kaynaklar: —
- Önerilen metin:

**FİYAT SEVİYESİ VE FİYAT GÖSTERİMİ**
- **Fiyat seviyesi:** 4 kademe (`₺`, `₺₺`, `₺₺₺`, `₺₺₺₺`).
  - Her il × kategori için yönetim panelinde **tarihli** TL aralıklarıyla tanımlanır (ör. Mekan/İstanbul: kişi başı ana yemek + içecek).
  - Tooltip: "₺₺: kişi başı yaklaşık 400–800 ₺ (Ekim 2026 tanımı)".
  - Tanımlar en az 6 ayda bir gözden geçirilir; 6 ayı aşan tanım için yönetim panelinde uyarı çıkar.
  - Bir varlığın seviyesi kaynağıyla birlikte saklanır: editör, işletme veya kullanıcı değerlendirmelerinden çıkarım.
- **Varlık fiyatları:**
  - **Konaklama:** Fiyat yalnızca sağlayıcıdan; tarih, kişi sayısı, oda tipi ve kontrol zamanıyla birlikte gösterilir ("18–20 Ekim, 2 yetişkin · 6.200 ₺/gece · {Sağlayıcı} · 14:05'te kontrol edildi"). Parametresiz "X ₺'den başlayan" gösterimi yasak; yerine "Tarih seç" düğmesi gelir.
  - **Ürün:** Satıcı adına göre teklif listesi gösterilir; her satırda kontrol zamanı vardır.
    - "En uygun teklif" ifadesi yalnızca listedeki tüm teklifler son 24 saat içinde kontrol edilmişse kullanılır.
    - 7 günden eski teklif gösterilmez.
    - Üstü çizili "eski fiyat" veya "% indirim" ancak sağlayıcı bu veriyi sağlıyorsa ve gösterim indirimli satış/fiyat reklamı mevzuatına uygunsa yer alabilir; bu konu hukuki inceleme listesine eklenmeli. Doğrulanana kadar gösterme.
  - **Hizmet ve tur:** "Başlayan" fiyatlar işletme tarafından tarihli girilir ("Saç kesimi: 600 ₺'den başlayan · İşletme bilgisi, Eylül 2026"). Tarihi 6 aydan eski olan fiyat gizlenir.
- **Para biçimi:** PRODUCT-UX-07'ye göre uygulanır. Yalnızca TRY desteklenir; yurt dışı içerikte döviz gösterimi Faz 4'e kalır.

**Kabul kriterleri:**
- Parametresiz konaklama fiyatı render edilemiyor (bileşen sözleşmesi + test).
- 7 günden eski ürün teklifi gizleniyor.
- Fiyat seviyesi tooltip'i tanım tarihini gösteriyor.
