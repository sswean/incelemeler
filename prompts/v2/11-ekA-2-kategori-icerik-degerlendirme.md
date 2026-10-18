## A4 — Kategori mimarisi ve listeleme türleri (KAT / LST)

### A4.1 Beş eksen

v1'in kategori listesi şu eksenlere ayrılarak uygulanır (Ç-12):

1. **Listeleme türü** (`kind`, kodla tanımlı; Ek A2.2).
2. **Kategori ağacı** (yönetim panelinden; kod gerekmez): en fazla 3 seviye; her düğüm izin verilen türlere bağlı; bir listelemenin 1 birincil + en fazla 3 ikincil kategorisi olur (hepsi aynı türden).
3. **Özellikler** (yönetim panelinden; tipli; filtrelenebilir/kartta gösterilir bayrakları).
4. **İçerik türü** (editoryal): Rehber, Liste, Karşılaştırma, İnceleme, Haber, Sponsorlu içerik; konu etiketleriyle sınıflandırılır.
5. **Koleksiyon sayfası** (yönetim panelinden): kayıtlı sorgu + editoryal giriş. Ayrı kategori değildir.

### A4.2 Başlangıç kategori seti (seed — v1 §4'ün tamamı korunmuştur)

| v1 grubu | v1 öğeleri | v2 ekseni |
|---|---|---|
| **A. Seyahat ve keşif** | Şehir rehberleri, Yurt içi ve yurt dışı seyahat rehberleri, Gezi rotaları, Hafta sonu kaçamakları | İçerik türü: Rehber + konu etiketi |
| | Tatil bölgeleri | `DESTINATION` |
| | Gezilecek yerler, Plajlar ve doğal güzellikler, Kültürel mekanlar | `POI` → kategoriler |
| | Seyahat şirketleri, Tur ve deneyim organizasyonları | `SERVICE_PROVIDER` (seyahat acentesi/operatör) + `EXPERIENCE` |
| **B. Otel ve konaklama** | Oteller, Butik oteller, Tatil köyleri, Pansiyonlar, Apart oteller, Kiralık tatil evleri, Kamp ve karavan alanları | `LODGING` → kategoriler |
| | Balayı otelleri, Aile dostu, Bütçe dostu, Lüks konaklama | Özellik / fiyat seviyesi + koleksiyon sayfası |
| **C. Yeme-içme ve mekanlar** | Restoranlar, Kafeler, Kahvaltı mekanları, Fast food, Yerel mutfaklar, Fine dining, Tatlıcılar ve pastaneler, Sokak lezzetleri | `PLACE` → kategoriler (mutfak türü ayrı enum özellik) |
| | Vegan ve vejetaryen, Manzara ve özel gün mekanları, Paket servis seçenekleri | Özellik + koleksiyon sayfası |
| **D. Araç ve ulaşım** | Otomobil incelemeleri, Elektrikli otomobiller, Motosiklet ve scooter | `PRODUCT` → Otomobil / Motosiklet (elektrikli = yakıt tipi özelliği) |
| | Araç kiralama şirketleri | `SERVICE_PROVIDER` → Araç kiralama |
| | Günlük ve uzun dönem kiralama, Havalimanı ulaşımı | Özellik / filtre (kiralama süresi, teslim noktası türü) |
| | Transfer hizmetleri | `SERVICE_PROVIDER` → Transfer |
| | İkinci el araç rehberleri, Şehir içi ulaşım rehberleri, Yolculuk ve rota önerileri | İçerik türü: Rehber |
| **E. Rehberler, turlar ve aktiviteler** | Profesyonel tur rehberleri, Yerel rehberler | `GUIDE_PERSON` — tek tür; "profesyonel" ayrımı **ruhsat doğrulama durumuyla** yapılır; ruhsatsız kişi rehberlik hizmeti sunan profil olarak yayımlanmaz (Ç-14, Ek D1) |
| | Özel turlar, Yürüyüş turları, Müze ve kültür turları, Tekne turları, Doğa aktiviteleri, Macera ve spor aktiviteleri, Gastronomi turları, Fotoğraf turları, Aile ve çocuk aktiviteleri | `EXPERIENCE` → kategoriler |
| **F. Teknoloji ve ürünler** | Telefonlar, Bilgisayarlar, Tabletler, Kulaklıklar, Akıllı saatler, Oyun konsolları, Oyun ekipmanları, Ev elektroniği, Beyaz eşya, Akıllı ev ürünleri, Fotoğraf ve video ekipmanları, Aksesuarlar | `PRODUCT` → kategoriler |
| **G. Moda ve kişisel bakım** | Giyim, Ayakkabı, Çanta ve aksesuarlar, Kozmetik, Cilt ve saç bakımı, Parfümler | `PRODUCT` → kategoriler (kozmetikte sağlık beyanı kuralları, Ek A6.6) |
| | Güzellik merkezleri, Kuaförler ve berberler, Kişisel bakım hizmetleri | `PLACE` / `SERVICE_PROVIDER` → kategoriler |
| **H. Ev, yaşam ve hizmetler** | Ev eşyaları, Mobilya, Dekorasyon, Mutfak ürünleri, Evcil hayvan ürünleri | `PRODUCT` → kategoriler |
| | Temizlik hizmetleri, Taşınma hizmetleri, Evcil hayvan hizmetleri, Çeşitli yerel işletmeler | `SERVICE_PROVIDER` / `PLACE` → kategoriler |
| **I. Eğlence, kültür ve etkinlikler** | Konserler, Sergiler, Festivaller, Tiyatro | `EVENT` → kategoriler |
| | Etkinlik mekanları | `PLACE` → kategori |
| | Film ve dizi, Dijital yayın platformları, Video oyunları, Kitaplar, Müzik | `WORK` (Faz 4; meta veri lisansı X-kaydı) |
| **J. Diğer hizmetler** | Yeni iş kolları | Panelden yeni kategori + özellik şeması |
| — | Spor salonları (v1 §1 senaryosu) | `PLACE` → kategori |

### A4.3 Gereksinimler

| ID | Düzey · Faz | Gereksinim |
|---|---|---|
| REQ-KAT-001 | ZORUNLU · 1 | Yönetici kod değiştirmeden kategori, alt kategori, özellik şeması, değerlendirme kriteri ve koleksiyon sayfası ekleyebilir, sıralayabilir, gizleyebilir. **Kabul:** E2E'de yönetici "Glamping alanları" kategorisini (kind=LODGING) ve 3 özellik (`hasPrivateBathroom: bool`, `tentType: enum`, `maxGuests: int`) oluşturur, bir listeleme ekler, yayımlar ve bu özelliklere göre filtreler — deploy gerekmez. |
| REQ-KAT-002 | ZORUNLU · 1 | Aynı listeleme iki kategori düğümünde ayrı listeleme olarak bulunmaz; "Aile dostu" bir kategori değil, özellik + koleksiyon olarak çalışır. |
| REQ-KAT-003 | ZORUNLU · 1 | Kategori durumları `TASLAK → GİZLİ (yalnızca personel) → YAYINDA`; yayın eşiği (§7.2) altındaki kategori/hub menüde, site haritasında ve aramada önerilmez. |
| REQ-KAT-004 | ZORUNLU · 1 | **YMYL ve lisanslı kategoriler:** sağlık, finans, hukuk gibi güven gereksinimi yüksek kategoriler ve lisans gerektiren kategoriler (turist rehberi, konaklama, seyahat acentesi/tur operatörü, alkol servisi olan mekan tanıtımı) kategori bayraklarıyla işaretlenir. Bu kategorilerde: uzman incelemesi zorunlu, sponsorluk varsayılan kapalı; yayın **üretim ortamında ve `dataOrigin≠DEMO` listelemelerde** `legalGate` arkasındadır ve açılması C sınıfıdır (Ek D1). Yerel/test/staging ortamlarında `dataOrigin=DEMO` listelemeler için kapı, yalnızca bu ortamlarda yüklenen bir test fikstürüyle (`LegalApproval`, onaylayan=`TEST-FIXTURE`) açılır; fikstür üretim derlemesine giremez (E2E-020). Demo konaklamada belge no açıkça geçersiz bir yer tutucudur (`DEMO-0000`) ve "doğrulandı" ibaresi gösterilmez. |
| REQ-KAT-005 | ZORUNLU · 1 | Navigasyon: üst menüde en fazla 7 öğe (öneri: Seyahat, Konaklama, Yeme-İçme, Ürünler, Hizmetler, Rehberler, Fırsatlar); mega menü en fazla 2 seviye; mobil "Keşfet" sekmesinde en fazla 12 kategori kutucuğu. Menü yönetim panelinden düzenlenir. |
| REQ-LST-001 | ZORUNLU · 1 | Her listeleme türü için **sayfa şablonu**, yayın için zorunlu alanlar, tipe özgü bloklar, birincil CTA ve **yasak CTA** tablosu (A4.4). Zorunlu alanı eksik listeleme yayımlanamaz (API doğrulaması + test). |
| REQ-LST-010 | ZORUNLU · 1 | Her listeleme şablonunda kısa tanıtımın yanında **"Hakkında" (detaylı açıklama)** bloğu bulunur (`description`; turist rehberinde kişinin kendi açıklaması, onaylı); işletme tarafından sağlanan metin "İşletme tarafından sağlandı" ibaresiyle gösterilir. |
| REQ-LST-002 | ZORUNLU · 1 | Bilinmeyen opsiyonel alan "Bilinmiyor" olarak gösterilir ya da hiç gösterilmez; asla "0", "Kapalı" ya da tahmini değer gösterilmez. |
| REQ-LST-003 | ZORUNLU · 1 | 390×844 mobil görünümde ilk ekranda: ad, tür/kategori, konum (ilçe/mahalle) ya da marka, puan özeti (A6.2 eşik tablosundaki metinlerle), fiyat seviyesi/fiyat durumu, uygunsa açık/kapalı durumu ve birincil CTA. |
| REQ-LST-004 | ZORUNLU · 1 | Her listeleme sayfasının altında: "Bilgi hatalı mı? Düzeltme öner", "Bilgiler son doğrulama: {tarih}", bu listelemenin geçtiği rehber ve listeler, benzer seçenekler (organik; sponsorlu olan ayrı kutuda ve etiketli). |
| REQ-LST-005 | ZORUNLU · 1 | Tazelik: her listelemede `sourceVerifiedAt`; tür bazında yeniden doğrulama aralığı (varsayılan: mekan saatleri 90 gün, konaklama belge/olanaklar 180 gün, ürün fiyat bilgisi 7 gün, etkinlik 7 gün). Aşılınca editör **tazelik kuyruğuna** düşer ve sayfada "Bu bilgiler {tarih} tarihinde doğrulandı" uyarısı belirginleşir. |
| REQ-LST-006 | ZORUNLU · 1 | "Kalıcı olarak kapandı" / "Geçici olarak kapalı" / "Satıştan kalktı" durumları: sayfa korunur (değerlendirmeler okunabilir), CTA'lar kaldırılır, benzer seçenekler öne çıkar, arama sıralamasında aşağı iner; `noindex` kararı SEO kuralına göre (Ek A13). |
| REQ-LST-007 | ZORUNLU · 1 | Toplu içe aktarma (CSV/XLSX): alan eşleme, doğrulama raporu, yinelenen tespiti (normalize ad + 150 m yakınlık / GTIN), önizleme, işlem kimliğiyle geri alma, `source` ZORUNLU, `dataOrigin=IMPORT`. |
| REQ-LST-008 | ZORUNLU · 1 | Zincir işletmelerde her şube ayrı listeleme; kuruluş (marka) sayfası şubeleri listeler; şube değerlendirmeleri kuruluş düzeyinde birleştirilip tek puan yapılmaz (ayrı ayrı gösterilir). |
| REQ-LST-009 | OLMALI · 2 | Soru-cevap: listeleme başına sorular; yanıtlayan rozeti (Doğrulanmış işletme / Editör / Üye); moderasyon kuralları değerlendirmelerle aynı; yanıtsız soru 30 gün sonra işletmeye hatırlatılır (Faz 3). |

### A4.4 Listeleme sayfa şablonları

| Tür | Yayın için zorunlu | Tipe özgü bloklar | Birincil CTA | Yasak / bağlamsız CTA |
|---|---|---|---|---|
| **Mekan** (restoran, kafe, kahvaltı, pastane, bar) | Ad, kategori, mutfak türü, adres + koordinat, ilçe, ≥ 1 iletişim kanalı, fiyat seviyesi ya da "bilinmiyor", saatler ya da "bilinmiyor" | Haftalık saat tablosu + özel gün saatleri; menü (görsel/PDF/yapılandırılmış, **tarihli**: "Menü fotoğrafı: Eylül 2026"); özellikler (rezervasyon, paket servis, alkol servisi, bahçe, manzara, çocuk dostu, evcil hayvan, tekerlekli sandalye erişimi); fotoğraflar kaynağa göre sekmeli (İşletme / Kullanıcı / Editör); harita | Yol tarifi al · Ara · Rezervasyon yap (yalnızca rezervasyon bağlantısı varsa) | Satın al, bilet al, araç kirala |
| **Konaklama** | Ad, konaklama türü, adres + koordinat, il/ilçe, ≥ 1 iletişim kanalı ya da sağlayıcı bağlantısı, **turizm belge numarası** (hukuki kapı, Ek D1) | Konum mesafeleri ("Denize kuş uçuşu ~350 m" — hesaplama yöntemi belirtilir); sezon; pansiyon tipleri; oda tipleri (kapasite, yatak, m²); olanaklar; giriş-çıkış saatleri; "Kimler için uygun" (ziyaret türü dağılımı, n ≥ 10); son 12 ay puanı | "{Sağlayıcı}'da fiyatları gör" (tarih/kişi parametreli) · Web sitesi · Ara | Tarih/kişi parametresi olmadan "gecelik X ₺" |
| **Araç kiralama firması** | Ad, ≥ 1 şube (konum türü: havalimanı/şehir), iletişim | Şube listesi ve teslim prosedürü (terminal içi masa/servis aracı/karşılama); mesai dışı teslim koşulu; araç sınıfları ve örnek modeller ("Ekonomi: X **veya benzeri**" ifadesi ZORUNLU); şartlar (min. yaş, ehliyet yılı, kredi kartı/depozito, km sınırı, yakıt politikası, ek sürücü, tek yön); sigorta kapsamları açıklaması | "Fiyat ve müsaitlik için {Sağlayıcı}'ya git" · Ara | Canlı veri yokken "günlük X ₺'den başlayan" |
| **Turist rehberi (kişi)** | Ad (kişinin açık rızasıyla), ≥ 1 bölge, ≥ 1 dil, **ruhsat doğrulandı** | Diller (seviye), hizmet bölgeleri, uzmanlık alanları, tur türleri, fiyatlandırma modeli, "Ruhsat bilgisi doğrulandı: {tarih}", bağlı turlar | İletişime geç (kişinin izin verdiği kanal) · Rezervasyon bağlantısı (rehberin kendi dış kanalı, varsa; platform içi rezervasyon değil) | Doğrulanmamış kişiye "Ruhsatlı turist rehberi" rozeti |
| **Tur / aktivite** | Ad, operatör (kuruluş), başlangıç noktası, süre, kategori | Program akışı; dahil olanlar/olmayanlar; dil; grup büyüklüğü; zorluk; yaş sınırı; erişilebilirlik; sezon; "Hava koşullarına bağlı iptal olabilir" (balon, tekne); iptal koşulu yalnızca sağlayıcıdan | "{Sağlayıcı}'da tarih seç" · Operatörle iletişim | Platform içi satın alma (kapsam dışı) |
| **Ürün** | Marka, model, kategori, ≥ 5 teknik özellik (kategori şemasından) | Varyant seçici; çıkış tarihi; Türkiye'de satış durumu; birimli teknik özellik tablosu; editör testi (süre, koşullar, yazılım sürümü); artılar/eksiler; "Kimler için / kimler için değil"; alternatifler; karşılaştırma bağlantıları; satıcı fiyat bilgisi listesi (`Offer`: satıcı, fiyat, kontrol zamanı) | "{Satıcı}'da gör" (affiliate açıklamasıyla) | Taze olmayan veride "En ucuz"; mekan CTA'ları |
| **Etkinlik** | Ad, başlangıç–bitiş (`Europe/Istanbul`), mekan listelemesi, kategori | Sanatçı/organizatör; bilet durumu (kaynaklı); fiyat aralığı; yaş sınırı; erişilebilirlik; oturumlar | "Bilet al ({Satıcı})" — yalnızca bitişten önce | Bitmiş etkinlikte bilet CTA'sı; tarihinden önce değerlendirme |
| **Hizmet işletmesi** (kuaför, güzellik, temizlik, taşınma, transfer, spor salonu) | Ad, kategori, adres **ya da** hizmet bölgesi, iletişim | Hizmet listesi ("başlayan" fiyatlar isteğe bağlı, tarihli); randevu yöntemi; saatler; doğrulanmış belge rozeti | Ara · Mesaj · Randevu bağlantısı · Faz 3: Teklif iste | — |
| **Destinasyon** | Ad, sınır/konum, kısa özet | Ne zaman gidilir (kaynaklı iklim bilgisi); nasıl gidilir; öne çıkan rehberler; kategori bazlı öne çıkanlar (eşik sağlanırsa); harita; pratik bilgiler | Rehberi oku · Kategorileri keşfet | — |
| **İlgi noktası** | Ad, tür, konum | Ziyaret saatleri ve giriş ücreti (kaynaklı, tarihli); erişim; en iyi ziyaret zamanı; yakındaki mekanlar | Yol tarifi al · Resmî site | — |
| **Eser** (Faz 4) | Ad, tür, yıl | Künye (lisanslı kaynaktan), nereden izlenir/okunur (kaynaklı, tarihli) | "{Platform}'da izle" (affiliate ise açıklamalı) | Otel/araç CTA'ları |

**Kabul:** Her tür için şablon bileşeni ve Storybook hikâyeleri (tam veri, minimum veri, bayat veri, kapalı işletme); yasak CTA kombinasyonları bir yapılandırma tablosunda tanımlı ve testli (v1 §10: "film incelemesinde otel rezervasyonu" gibi bağlamsız eylem YASAK).

---

## A5 — İçerik, editör ve yayın akışı (ICR)

| ID | Düzey · Faz | Gereksinim |
|---|---|---|
| REQ-ICR-001 | ZORUNLU · 1 | **Blok tabanlı içerik editörü** (özel geliştirme; çekirdek editör kütüphanesi lisans izin listesinden seçilebilir — ADR). İçerik JSON blok dizisi olarak saklanır; her blok tipinin zod şeması `packages/contracts` içindedir; web ve mobil aynı blokları render eder. |
| REQ-ICR-002 | ZORUNLU · 1 | **Blok tipleri (Faz 1):** başlık, paragraf (zengin metin: kalın, italik, bağlantı, liste), görsel, galeri, tablo, **listeleme kartı** (canlı veriye bağlı), **karşılaştırma tablosu** (listelemelerden/özelliklerden beslenir), harita (listeleme seçimi), bilgi kutusu (ipucu/uyarı), artılar–eksiler, puan kutusu (yalnızca `EditorialVerdict` bağlıysa), SSS, alıntı, **CTA** (dış yönlendirme servisine bağlı), **ticari açıklama bloğu** (sponsorlu/affiliate içerikte otomatik eklenir, silinemez), **sponsorlu yuva bloğu** (v1 "sponsorlu alan"; bir `PlacementSlot`'a bağlıdır, etiket zorunlu, A8.3 sınırlarına tabi; Liste, Karşılaştırma ve İnceleme içeriklerinde YASAK), içindekiler. Ham HTML bloğu YASAK. |
| REQ-ICR-003 | ZORUNLU · 1 | Gömülü listeleme kartları **canlı** veriden render edilir (ad, puan, fiyat durumu, açık/kapalı); listeleme kapanırsa içerikte "Kalıcı olarak kapandı" görünür ve editörün panel iş listesine (REQ-ADM-009) görev düşer. |
| REQ-ICR-004 | ZORUNLU · 1 | İçerik türleri ve şablonları: **Rehber** (destinasyon/konu; içindekiler, harita, pratik bilgi), **Liste** ("En iyi N"; seçim yöntemi kutusu ZORUNLU; sıra editoryal ve sponsorluktan bağımsız; içinde sponsorlu öğe YASAK), **Karşılaştırma** (A vs B; kriter tablosu; kazanan ancak test edildiyse), **İnceleme** (uzun test yazısı; `EditorialVerdict`'e bağlı), **Haber** (tarihli), **Sponsorlu içerik** (ticari ilişki ZORUNLU; puanlama blokları kullanılamaz). |
| REQ-ICR-005 | ZORUNLU · 1 | **Yayın akışı:** `TASLAK → İNCELEMEDE → ONAYLANDI → ZAMANLANDI → YAYINDA → GÜNCELLENİYOR → ARŞİV`. Yazar yayımlayamaz; editör onaylar. Sponsorlu içerik ek olarak **ticari açıklama kontrolü** adımından geçer (yönetici/hukuk kontrol listesi). Önizleme bağlantısı (imzalı, süreli, `noindex`). Zamanlanmış yayın `Europe/Istanbul`'a göre. |
| REQ-ICR-006 | ZORUNLU · 1 | Her içerikte: yazar (yazar sayfası bağlantılı), editör, **yayın tarihi**, **son güncelleme tarihi**, güncellemede kısa değişiklik notu ("Güncelleme notları"), kaynaklar bölümü (fiyat/saat/kural gibi olgular için), ticari ilişki beyanı. "Son güncelleme" yalnızca anlamlı içerik değişikliğinde değişir (yazım düzeltmesi tarih yenilemez). |
| REQ-ICR-007 | ZORUNLU · 1 | **Deneyim beyanı** (v1 §14): her İnceleme/editör değerlendirmesinde ZORUNLU ve görünür: "Bizzat test edildi ({süre}, {koşullar})", "Yerinde ziyaret edildi ({ay yıl})", "Konaklandı", "Uzun süreli kullanıldı", "Kaynaklardan derlendi — denenmedi". Derlemelerde editör puanı verilemez. Gerçekleşmemiş testi yapılmış gibi, ziyaret edilmemiş mekanı deneyimlenmiş gibi anlatmak YASAK. |
| REQ-ICR-008 | ZORUNLU · 1 | **Menfaat beyanı:** yayın formunda "Bu içerik için ücretsiz ürün/konaklama/davet ya da ödeme alındı mı?" sorusu ZORUNLU; evetse `commercialRelation=GIFTED/SPONSORED` ve etiket otomatik basılır (Ek A8.2). |
| REQ-ICR-009 | ZORUNLU · 1 | Düzeltme politikası: yayımlanmış içerikteki olgusal hata düzeltmesi sayfada görünür "Düzeltme: {tarih} — {ne düzeltildi}" notuyla yapılır; denetim kaydına girer. |
| REQ-ICR-010 | ZORUNLU · 1 | İçerik ve tasarım ayrıdır: editör yeni bir rehber, liste ya da koleksiyon sayfası hazırlamak için kod değiştirmez. |
| REQ-ICR-011 | ZORUNLU · 1 | Yazar/editör profili sayfası: ad, unvan, uzmanlık alanları, yazdığı içerikler, kısa biyografi, (isteğe bağlı) sosyal bağlantılar, etik beyanı. |
| REQ-ICR-012 | ZORUNLU · 1 | Editoryal metodoloji sayfaları: `/nasil-degerlendiriyoruz` (puan ölçekleri, Bayes formülü, deneyim beyanı türleri, test yöntemleri), `/editoryal-bagimsizlik`, `/sponsorlu-icerik-politikasi`, `/duzeltme-politikasi`. Metinler TASLAK damgalı (AK-12). |

### A5.6 Yapay zekâ destekli içerik

- Editörler taslak hazırlarken yapay zekâ aracı kullanabilir; ancak **doğrulanmamış bilgi otomatik olarak yayımlanmaz** (v1 §14).
- Fiyat, adres, çalışma saati, lisans/belge, seyahat koşulları ve sağlıkla ilgili her bilgi insan tarafından birincil kaynaktan kontrol edilir; kaynak bölümüne yazılır.
- İçerik formunda "Yapay zekâ yardımı kullanıldı mı?" alanı tutulur; açıklama gerekliliği (okura gösterim biçimi) hukuki incelemeye bağlıdır (Ek D1). Yapay zekâ ile üretilmiş görsel gerçek bir yeri/ürünü temsil eder biçimde kullanılamaz (AK-07); illüstratif kullanımda "Yapay zekâ ile üretilmiş görsel" etiketi ZORUNLU.
- Ürüne yapay zekâ özelliği eklemek Faz 4'e kadar YASAK (Ç-8).

---

## A6 — Değerlendirme, puanlama, güven ve moderasyon (DEG / GUN)

### A6.1 Puan ölçekleri (platform genelinde sabit)

- **Kullanıcı puanı:** 1–5 **tam** yıldız (yarım yıldız girişi yok); isteğe bağlı kriter puanları 1–5. Gösterim: tek ondalık, virgülle ("4,3") + yarım yıldız hassasiyetinde görsel + sayı ("128 değerlendirme").
- **Editör puanı:** 10 üzerinden, 0,5 adımlı ("8,5/10"). Yıldızla gösterilmez; "Editör" metinli ayrı rozet. Yalnızca deneyim beyanı test/ziyaret/konaklama/uzun kullanım olan listelemelere verilir.
- İki puan **asla** birleştirilmez; "genel puan" yoktur. Yan yana gösterildiğinde etiketler ("Editör", "Kullanıcılar") her zaman görünür.
- Her puan bileşeninde "Puanlar nasıl hesaplanır?" bağlantısı. Erişilebilir ad: "5 üzerinden 4,3 puan, 128 değerlendirme".

### A6.2 Gösterim eşikleri ve sıralama

| Yayımlanmış kullanıcı değerlendirmesi (n) | Gösterim |
|---|---|
| 0 | "Henüz değerlendirme yok" + "İlk değerlendirmeyi sen yaz" |
| 1–2 | Ortalama gösterilmez: "2 değerlendirme · Ortalama için en az 3 değerlendirme gerekiyor"; değerlendirmeler listelenir |
| ≥ 3 | Ortalama + sayı |
| ≥ 5 | 1–5 dağılım çubuğu ve kriter ortalamaları |
| Son 12 ayda ≥ 5 (mekan, konaklama, hizmet) | "Son 12 ay: 3,8 (24)" ikincil satırı |

- "Puana göre" ve "Önerilen" sıralamalarda ham ortalama kullanılmaz; **Bayes ortalaması**: `(C·m + Σpuan) / (C + n)`; `m` = konumlu türlerde aynı il × birincil kategori ortalaması, konumsuz türlerde (PRODUCT, WORK) aynı birincil kategori ortalaması; grupta < 30 yayımlanmış değerlendirme varsa bir üst kategorinin ülke geneli ortalaması; `C` varsayılan 10 (panelden ayarlanır). Formül `/nasil-degerlendiriyoruz` sayfasında açıklanır. n < 3 olanlar "Yeterli değerlendirme yok" grubunda en sonda.
- Düzenlenen değerlendirmenin yalnızca son sürümü sayılır; kaldırılan ya da "teşvikli" beyanlı değerlendirmeler ortalamaya girmez.
- Henüz değerlendirme yoksa sahte puan, yıldız, değerlendirme ya da ziyaret sayısı üretilmez (AK-02).

### A6.3 Değerlendirme kriterleri ve deneyim alanları

Kriterler kategori düğümü bazında yönetim panelinden tanımlanır (ad, açıklama, sıra, zorunlu/isteğe bağlı; en fazla 6). Genel puan kriterlerin ortalaması değildir. Başlangıç seti:

| Tür | Kriterler (1–5, isteğe bağlı) | Deneyim alanları |
|---|---|---|
| Mekan | Lezzet, Servis, Ortam, Temizlik, Fiyat/performans | **Zorunlu:** ziyaret ay/yıl. İsteğe bağlı: öğün, ziyaret türü, kişi başı harcama aralığı |
| Konaklama | Konum, Temizlik, Oda konforu, Personel, Yeme-içme, Fiyat/performans | **Zorunlu:** konaklama ay/yıl, yolculuk türü. İsteğe bağlı: süre, oda tipi, pansiyon tipi |
| Araç kiralama | Teslim alma süreci, Araç durumu, Fiyat şeffaflığı (ek ücretler), Depozito/iade süreci, Müşteri hizmeti | **Zorunlu:** kiralama ay/yıl, şube. İsteğe bağlı: araç sınıfı, süre, rezervasyon kanalı |
| Turist rehberi | Bilgi birikimi, İletişim ve dil, Dakiklik/organizasyon, Fiyat/performans | **Zorunlu:** tur ay/yıl |
| Tur / aktivite | Organizasyon, Rehberlik, Güvenlik hissi, Beklentiyle uyum, Fiyat/performans | **Zorunlu:** katılım ay/yıl |
| Ürün | Performans, Yapı kalitesi, Kullanım kolaylığı, Fiyat/performans (+ kategoriye özgü: kulaklıkta Ses, Konfor, Pil, Mikrofon) | **Zorunlu:** kullanım süresi (≤1 ay / 1–6 ay / 6–12 ay / 12+ ay) |
| Hizmet işletmesi | İş kalitesi, Dakiklik, İletişim, Fiyat şeffaflığı | **Zorunlu:** hizmet ay/yıl, hizmet türü |
| Etkinlik | Organizasyon, Mekan ve ulaşım, Ses-görüntü, Fiyat/performans | **Zorunlu:** katılım tarihi; yalnızca etkinlik bittikten sonra |

Deneyim tarihi gelecekte olamaz; 24 aydan eski deneyimler "Eski deneyim ({ay yıl})" etiketiyle gösterilir; kamuya yalnızca ay/yıl gösterilir.

### A6.4 Değerlendirme yazma akışı

1. **Genel puan** (ZORUNLU; yıldızların metin karşılığı: 1 Çok kötü · 2 Kötü · 3 İdare eder · 4 İyi · 5 Mükemmel).
2. **Deneyim bilgileri** (A6.3).
3. **Metin ve medya:** başlık isteğe bağlı (≤ 100 karakter); metin ZORUNLU 50–5.000 karakter, canlı sayaç; türe özgü yönlendirici ipuçları; fotoğraf 0–10 (JPEG/PNG/HEIC/WebP, ≤ 10 MB; EXIF konum/cihaz verisi sunucuda silinir).
4. **Beyanlar (önceden işaretli kutu YOK):** "Bu deneyim bana ait ve gerçek." · "Bu işletme/markayla çalışan, sahip, yakın akraba ya da rakip ilişkim yok." · "Bu deneyim için ücret, ücretsiz hizmet/ürün, indirim ya da hediye aldın mı?" — evetse "Ücretsiz/indirimli deneyim beyan edildi" etiketiyle yayımlanır ve ortalamaya girmez (politika hukuki incelemeye tabi).
5. **Kanıt** (isteğe bağlı; "Belgeli deneyim" rozeti için): fiş/fatura/rezervasyon görseli — yalnızca moderatör görür, kişisel verileri maskelemesi için uyarı gösterilir, doğrulamadan sonra silinir (saklama süresi `compliance_config`).

**Sürtünme azaltma:** taslak otomatik kaydedilir (misafirde cihazda, üyede hesapta); misafir yazmaya başlayabilir, "Gönder"de giriş istenir ve taslak eksiksiz geri yüklenir; fotoğraflar arka planda yüklenir; mobilde çevrimdışı gönderim kuyruğa alınır; hatalar alanın yanında ve formun üstünde özetlenir.

**Kullanıcıya görünen durumlar:** `Taslak → İncelemede → Yayında | Yayımlanmadı (gerekçe kodu + açıklama + "Düzenle ve yeniden gönder") → Bildirildi (karar verilene kadar yayında) → Kaldırıldı (gerekçe) → İtiraz edildi → İtiraz sonuçlandı`. Her geçişte işlemsel e-posta ve "Değerlendirmelerim" sayfasında durum güncellemesi (Faz 1); uygulama içi bildirim merkezi ve push Faz 2'de eklenir. Yayımlanmış ve düzenlenmiş değerlendirmede "Düzenlendi: {tarih}".

### A6.5 Gereksinimler

| ID | Düzey · Faz | Gereksinim |
|---|---|---|
| REQ-DEG-001 | ZORUNLU · 1 | Puan ölçekleri ve eşikler A6.1–A6.2'deki gibidir. **Kabul:** n = 0, 1, 2, 3, 5, 12 için birim + görsel snapshot testleri; editör ve kullanıcı puanını birleştiren kod yok; Bayes formülü testli. |
| REQ-DEG-002 | ZORUNLU · 1 | Değerlendirme listesi varsayılan sıralaması **"En yeni"**; kullanıcı seçenekleri: en yeni, en yüksek puan, en düşük puan, en faydalı (Faz 2), belgeli olanlar. Olumsuz değerlendirmeler gizlenemez, aşağı itilemez; sponsorluk (Faz 1) ve işletme paketi (Faz 3, REQ-ISL-005) değerlendirme sıralamasını etkileyemez (otomatik test). |
| REQ-DEG-003 | ZORUNLU · 1 | Filtreler: puan, deneyim türü/ziyaret türü, dil, fotoğraflı, belgeli. "Belgeli deneyim" rozeti yalnızca `DOCUMENTED` ya da `PROVIDER_VERIFIED` kayıtlara verilir; diğerleri "Kullanıcı beyanı". |
| REQ-DEG-004 | ZORUNLU · 1 | Değerlendirme durum makinesi, gerekçe kodları ve bildirimler A6.4'teki gibidir. **Kabul (E2E-004/E2E-012):** misafir yazmaya başlar → giriş yapar → taslak korunur → gönderir → "İncelemede" → onay → bildirim → "Yayında"; ret senaryosunda gerekçe gösterilir ve yeniden gönderme çalışır; EXIF silme testli. |
| REQ-DEG-005 | ZORUNLU · 1 | Kullanıcı değerlendirmeleri sponsorlu içeriklerde, reklam kreatiflerinde ve işletme paneli dışa aktarımlarında alıntılanamaz (hukuki onay olmadan "değerlendirme widget'ı" yok). |
| REQ-DEG-006 | ZORUNLU · 3 | İşletme yanıtı: doğrulanmış işletme temsilcisi, değerlendirme başına 1 herkese açık yanıt; yanıtlar da moderasyon kurallarına tabidir; yanıt değerlendirmenin sıralamasını/görünürlüğünü değiştirmez. |
| REQ-DEG-007 | OLMALI · 2 | "Faydalı" oylaması: üye başına değerlendirme başına 1 oy; kendi değerlendirmesine oy yok; anormal oy kümeleri sinyal üretir. |

### A6.6 Güven ve moderasyon

**Moderasyon modeli:**
- **Ön moderasyon** (yayından önce insan onayı) varsayılan olarak: yeni hesapların (ilk 3) değerlendirmeleri, risk skoru eşiği aşanlar, YMYL kategoriler, fotoğraflı değerlendirmeler (fotoğraflar), sağlık beyanı içerenler.
- **Son moderasyon** (otomatik kontrollerden geçen ve risk düşük olan değerlendirmeler yayımlanır, bildirimle incelenir) güvenilir hesaplar için; eşikler panelden ayarlanır.
- **Otomatik kontroller (sinyal üretir, tek başına ceza vermez):** küfür/hakaret sözlüğü, kişisel veri kalıpları (telefon, e-posta, T.C. kimlik no, IBAN, plaka), bağlantı/spam, yinelenen metin (benzerlik), hız (aynı hesap/cihaz/IP kümesinden kısa sürede çok değerlendirme), yeni hesap, aynı listelemeye kısa sürede olağan dışı değerlendirme dalgası, işletme ile ilişkili hesaplar (aynı e-posta alan adı vb.). Sinyaller KVKK veri minimizasyonuna uygun tutulur (ham IP saklama süresi kısa, karma/kısaltma — Ek A17).
- **Değerlendirme kuralları** (`/topluluk-kurallari`, TASLAK): kişisel deneyim; nefret söylemi, hakaret, tehdit, kişisel veri, ifşa, reklam, alakasız içerik, başkasının içeriğini kopyalama, teşvikli değerlendirmeyi beyan etmeme, sağlık/tedavi iddiaları YASAK. Kişilerin (çalışan adları vb.) itibarına yönelik iddialar moderasyona düşer.

| ID | Düzey · Faz | Gereksinim |
|---|---|---|
| REQ-GUN-001 | ZORUNLU · 1 | **Moderasyon kuyruğu:** öncelik (risk skoru, bildirim sayısı, hukuki talep), SLA sayaçları (varsayılan: ön moderasyon medyan ≤ 24 saat; hukuki talepler ≤ 24 saat ilk inceleme), hazır gerekçe şablonları (makrolar), toplu işlem, karar başına zorunlu gerekçe kodu, tam denetim kaydı. |
| REQ-GUN-002 | ZORUNLU · 1 | **Bildir (şikâyet) akışı:** her değerlendirme, fotoğraf, soru-cevap, işletme yanıtı ve içerik için "Bildir": neden (sabit liste) + açıklama + (hukuki taleplerde) talep sahibi bilgileri; misafir de bildirebilir (hız sınırlı); bildirim sahibine durum bildirimi (Faz 1: e-posta). |
| REQ-GUN-003 | ZORUNLU · 1 | **İtiraz:** kaldırılan içeriğin sahibi ve bildirimi reddedilen taraf 14 gün içinde bir kez itiraz edebilir; itiraz ilk kararı veren moderatörden **farklı** bir moderatör tarafından incelenir. |
| REQ-GUN-004 | ZORUNLU · 1 | **Sponsor/işletme talebiyle olumsuz değerlendirme silinmez.** Kaldırma yalnızca içerik politikası ihlali, hukuki talep/karar, kullanıcının kendi talebi gerekçeleriyle yapılır; her kaldırmanın gerekçe kodu ve denetim kaydı tutulur; "işletme beğenmedi" bir gerekçe kodu değildir. Sponsor kuruluşa bağlı değerlendirmelerde kaldırma kararı ikinci bir moderatör onayı gerektirir. |
| REQ-GUN-005 | ZORUNLU · 1 | **Hukuki talepler ve bildirim-kaldırma:** `takedown_requests` (talep eden, dayanak, hedef içerik, belge, durum, karar, süreler); mahkeme/idari kararlar ve kişilik hakkı ihlali iddiaları ayrı akış; yanıt süreleri `compliance_config`'ten (5651 ve ilgili mevzuat — Ek D1, doğrulanacak). |
| REQ-GUN-006 | ZORUNLU · 1 | **Fotoğraf moderasyonu:** yüzler (özellikle çocuklar) ve araç plakaları için uyarı/bulanıklaştırma aracı; telif şüphesi; uygunsuz içerik; kullanıcı fotoğraf lisans beyanı (Ek A14.6). |
| REQ-GUN-007 | ZORUNLU · 1 | **Hesap yaptırım basamakları:** uyarı → değerlendirme hakkının geçici kısıtlanması → askıya alma → kalıcı kapatma; her adım gerekçeli ve itiraz edilebilir; toplu sahte değerlendirme tespitinde ilgili değerlendirmeler ortalamadan çıkarılır ve listelemede "Bu sayfada olağan dışı değerlendirme etkinliği tespit edildi; şüpheli değerlendirmeler kaldırıldı" bildirimi (tarihli) gösterilebilir. |
| REQ-GUN-008 | ZORUNLU · 1 | **Bot/spam koruması:** gizlilik dostu CAPTCHA (yalnızca risk sinyalinde; sağlayıcı ve veri aktarımı Ek D1/X-kaydı), hız sınırları, tek kullanımlık e-posta alan adı listesi. |
| REQ-GUN-009 | ZORUNLU · 1 | **Moderatör çıkar çatışması:** moderatör kendi değerlendirmesini, yakını olduğu işletmeyi ya da sponsor ilişkisinde görev aldığı listelemeyi modere edemez (beyan + sistem kontrolü). |
| REQ-GUN-010 | OLMALI · 3 | **Şeffaflık raporu** (yarı yıllık): yayımlanan/kaldırılan değerlendirme sayıları, gerekçe dağılımı, hukuki talep sayıları, itiraz sonuçları — yalnızca gerçek verilerden. |
| REQ-GUN-011 | ZORUNLU · 3 | **İşletme doğrulama ve sahiplenme:** yöntemler (kurumsal e-posta alan adı, işletme telefonuna kod, vergi levhası/ticaret sicil belgesi, sektörel belge — turizm işletme belgesi, rehber ruhsatı); belgeler yalnızca doğrulama personeline görünür, şifreli saklanır, saklama süresi `compliance_config`; "Doğrulanmış işletme" rozeti yalnızca sahiplik doğrulandığında ve anlamı rozet açıklamasında yazılı ("Bu işletmenin temsilcisi kimliğini doğruladı; bu, kalite onayı değildir"). İşletme tarafından gönderilen bilgi/içerik doğrulama ve editoryal onaydan geçmeden yayımlanmaz (v1 §9). |
| REQ-GUN-012 | ZORUNLU · 1 | **Editoryal bağımsızlık güvenlik duvarı:** satış/sponsorluk personeli editör değerlendirmelerini göremez/düzenleyemez (yayından önce); sponsor yayından önce bağımsız incelemeyi onaylayamaz; sponsorlu içerikte sponsorun yayından önce içeriği görüp görmediği açıklamada belirtilir. |
