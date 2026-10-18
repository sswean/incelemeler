# İNCELEMELER.COM.TR — TAM KAPSAMLI WEB PLATFORMU VE MOBİL UYGULAMA GELİŞTİRME PROMPTU

## 1. PROJE TANIMI VE VİZYON

Sen deneyimli bir CTO, ürün yöneticisi, UI/UX tasarımcısı, yazılım mimarı, Full-Stack geliştirici ve dijital büyüme uzmanısın.

Görevin, incelemeler.com.tr markası için sıfırdan profesyonel bir web platformu ve iOS/Android mobil uygulaması tasarlamak, mimarisini oluşturmak ve çalışır yazılım olarak geliştirmektir.

Bu proje yalnızca ürün incelemelerinin yayınlandığı bir blog olmayacak.

Platform; insanların bir ürün, işletme, mekan, tatil, hizmet veya deneyim seçmeden önce araştırma yapabileceği, gerçek kullanıcı deneyimlerini inceleyebileceği, alternatifleri karşılaştırabileceği, rehberler bulabileceği ve ilgili işletmelere ulaşabileceği geniş kapsamlı bir inceleme, keşif, rehberlik ve ticari yönlendirme platformu olacaktır.

Platformun temel kullanım senaryoları şunlardır:

* Tatile çıkmadan önce otel, tatil yeri ve tur araştırmak.
* Restoran, kafe, kahvaltıcı ve farklı yemek mekanları keşfetmek.
* Araç kiralama şirketlerini, otomobilleri ve ulaşım seçeneklerini karşılaştırmak.
* Tur rehberleri, yerel rehberler, turlar ve aktiviteler bulmak.
* Teknolojik ürünleri, ev eşyalarını, otomobilleri ve tüketici ürünlerini incelemek.
* Güzellik merkezleri, kuaförler, spor salonları ve çeşitli hizmet işletmelerini araştırmak.
* Film, dizi, oyun, kitap, etkinlik ve eğlence içerikleri hakkında değerlendirme okumak.
* Seyahat rotaları, gezi rehberleri, alışveriş rehberleri ve karar vermeyi kolaylaştıran içerikler keşfetmek.
* Sponsorlu içerikler ve markalara özel fırsatlar üzerinden yeni işletmeler ve ürünler keşfetmek.

Ana hedef: Türkiye'de kullanıcıların bir seçim yapmadan önce ziyaret ettiği, farklı sektörleri tek bir çatı altında birleştiren güvenilir bir dijital marka oluşturmak.

Alan adı: `incelemeler.com.tr`
Marka adı: İncelemeler
Ana slogan önerisi: “Keşfet. Karşılaştır. Karar ver.”
Alternatif slogan: “Seçmeden önce İncelemeler'e bak.”

Birbiriyle bağlantılı iki ürün geliştirilmelidir:

1. Web sitesi: incelemeler.com.tr
2. Mobil uygulama: İncelemeler — iOS ve Android

Bütün platformlarda ortak kullanıcı hesabı, içerik altyapısı, işletme kayıtları, değerlendirmeler, sponsorlu kampanyalar ve favoriler sistemi bulunmalıdır.

## 2. KESİN TEKNİK KISITLAR

WordPress kesinlikle kullanılmayacak.

WordPress, WooCommerce, hazır WordPress temaları, WordPress eklentileri, Webflow veya projeyi hazır bir site kurucuyla oluşturmak yasaktır.

Sırf görsel olarak hazır görünen bir prototip üretip projeyi tamamlanmış gibi gösterme. Hedef, gerçek bir uygulamaya dönüştürülebilecek, sürdürülebilir ve modüler bir yazılım sistemi oluşturmaktır.

Önerilen teknoloji mimarisi:

Web uygulaması
* Next.js ve TypeScript.
* React tabanlı bileşen mimarisi.
* Tailwind CSS.
* Erişilebilir, yeniden kullanılabilir UI bileşenleri.
* Arama motorlarına uygun sunucu taraflı oluşturma ve gerektiğinde statik sayfa üretimi.
* Mobil, tablet ve masaüstü uyumlu responsive tasarım.

Backend ve API
* TypeScript tabanlı NestJS veya benzer şekilde modüler bir backend.
* REST API ve gerektiğinde OpenAPI dokümantasyonu.
* PostgreSQL veritabanı.
* Prisma ORM veya eşdeğer tip güvenli veri erişim katmanı.
* Redis ve kuyruk sistemi: yalnızca ihtiyaç duyulan önbellekleme, zamanlanmış görevler ve arka plan işlemleri için.
* Ürün görselleri ve medya dosyaları için S3 uyumlu nesne depolama.

Mobil uygulama
* React Native ve Expo ile iOS/Android uygulaması.
* Web ile ortak API kullanımı.
* Ortak tasarım sistemi ve tutarlı marka deneyimi.
* Derin bağlantılar ve paylaşılabilir içerik bağlantıları.
* Push bildirimleri için izin ve tercih yönetimi.

Geliştirme ve dağıtım
* Git tabanlı sürüm kontrolü.
* Docker ile tekrarlanabilir geliştirme ortamı.
* Ortam değişkenleri ve `.env.example`.
* Geliştirme, test ve üretim ortamlarının ayrılması.
* CI/CD, otomatik testler, hata izleme ve merkezi loglama.
* Veritabanı migration sistemi ve düzenli yedekleme.

Bu teknoloji setini mevcut projenin durumuna göre değerlendir. Gereksiz mikroservisler kurma; başlangıçta modüler bir monolit mimari tercih et ve ihtiyaç ortaya çıkarsa bağımsız servislere ayrılabilecek şekilde tasarla.

Mevcut bir kod deposu varsa önce incele. Çalışan özellikleri gereksiz yere bozma. Henüz proje yoksa sıfırdan düzenli bir monorepo oluştur.

## 3. MARKA KİMLİĞİ VE GÖRSEL TASARIM

İncelemeler, geniş kategorilerde kullanılabilecek çağdaş, premium ve güvenilir bir marka gibi görünmelidir.

Tasarım yaklaşımı:
* Premium ve minimal.
* İçerik odaklı.
* Görsel açıdan güçlü ama gereksiz efektlerden uzak.
* Güven veren, profesyonel ve modern.
* Seyahat, mekan keşfi, tüketici teknolojileri ve günlük yaşam içeriklerine eşit derecede uygun.
* Mobil kullanım öncelikli.
* Reklamlarla dolu, karmaşık ve eski haber sitesi görünümünden uzak.

Renk sistemi — Başlangıç için aşağıdaki paleti değerlendir:
* Ana arka plan: `#FFFFFF`
* İkincil arka plan: `#F6F7F9`
* Ana metin: `#17191D`
* İkincil metin: `#686F7A`
* Ana marka rengi: `#315EFB`
* İkincil vurgu: `#FF8A45`
* Kenarlıklar: `#E7E9EE`
* Başarı ve olumlu durumlar: erişilebilir yeşil tonları.

Bu renkleri tasarım sisteminde merkezi değişkenler üzerinden tanımla.

UI yaklaşımı
* Güçlü tipografi ve rahat okunabilirlik.
* Büyük, kaliteli mekan ve seyahat görselleri.
* Tutarlı kart tasarımları.
* İnce kenarlıklar ve kontrollü gölgeler.
* Dengeli beyaz alan kullanımı.
* Net filtreler, arama alanları ve kategori navigasyonu.
* Gerektiğinde karanlık tema; ancak ilk sürümde diğer temel özelliklerin önüne geçmemeli.

Logo
“İncelemeler” adıyla uyumlu, farklı sektörlerde kullanılabilecek zamansız bir logo tasarla. Logo; büyüteç, keşif, değerlendirme veya yön bulma kavramlarını çağrıştırabilir. Belirli bir sektöre aşırı bağlı kalma. Hem web hem uygulama ikonu olarak çalışabilmeli. Sıradan bir yıldız simgesini bütün marka kimliğinin yerine koyma.

Önemli tasarım kuralı
Gerçek ve yüksek kaliteli fotoğraflar kullan. Ürün, restoran, otel ve destinasyon görsellerini ilgili içerikle eşleştir. Lisansı belirsiz görselleri kullanma. Eksik görseller için düzgün placeholder sistemi geliştir.

Sadece birkaç kutudan oluşan basit bir dashboard tasarımı üretme. Son kullanıcıya yönelik bütün platformu tasarla.

## 4. KATEGORİ MİMARİSİ

Sistem, yeni kategorilerin kodu yeniden yazmadan yönetim panelinden eklenmesine izin vermelidir.

Başlangıç kategorileri şunlar olmalıdır:

A. Seyahat ve keşif
* Şehir rehberleri. * Tatil bölgeleri. * Gezilecek yerler. * Gezi rotaları. * Plajlar ve doğal güzellikler. * Kültürel mekanlar. * Hafta sonu kaçamakları. * Yurt içi ve yurt dışı seyahat rehberleri. * Seyahat şirketleri. * Tur ve deneyim organizasyonları.

B. Otel ve konaklama
* Oteller. * Butik oteller. * Tatil köyleri. * Pansiyonlar. * Apart oteller. * Kiralık tatil evleri. * Kamp ve karavan alanları. * Balayı otelleri. * Aile dostu konaklama. * Bütçe dostu konaklama. * Lüks konaklama.
Kullanıcı destinasyon, tarih, konuk sayısı ve bütçe üzerinden arama yapabilmelidir. Gerçek müsaitlik yalnızca güvenilir bir rezervasyon sağlayıcısından alınmışsa gösterilmelidir.

C. Yeme-içme ve mekanlar
* Restoranlar. * Kafeler. * Kahvaltı mekanları. * Fast food. * Yerel mutfaklar. * Fine dining. * Tatlıcılar ve pastaneler. * Vegan ve vejetaryen mekanlar. * Sokak lezzetleri. * Manzara ve özel gün mekanları. * Paket servis seçenekleri.
Mekan sayfalarında menü, fiyat seviyesi, adres, harita, çalışma saatleri, fotoğraflar, kullanıcı yorumları ve varsa rezervasyon bağlantısı bulunmalıdır.

D. Araç ve ulaşım
* Otomobil incelemeleri. * Elektrikli otomobiller. * İkinci el araç rehberleri. * Araç kiralama şirketleri. * Günlük ve uzun dönem kiralama. * Motosiklet ve scooter. * Transfer hizmetleri. * Havalimanı ulaşımı. * Şehir içi ulaşım rehberleri. * Yolculuk ve rota önerileri.
Araç kiralama formunda teslim alma ve bırakma noktaları, tarih, saat, araç sınıfı ve sürücü gereksinimleri için uygun alanlar bulunmalıdır. Canlı fiyat ve müsaitlik ancak veri sağlayıcı destekliyorsa gösterilmelidir.

E. Rehberler, turlar ve aktiviteler
* Profesyonel tur rehberleri. * Yerel rehberler. * Özel turlar. * Yürüyüş turları. * Müze ve kültür turları. * Tekne turları. * Doğa aktiviteleri. * Macera ve spor aktiviteleri. * Gastronomi turları. * Fotoğraf turları. * Aile ve çocuk aktiviteleri.
Rehber profillerinde uzmanlık alanları, hizmet verdiği bölgeler, diller, açıklamalar, değerlendirmeler ve iletişim/rezervasyon bağlantıları yer almalıdır. Gerekli mesleki yetki veya lisansların doğrulanması gereken alanlar için işletme doğrulama süreci oluştur.

F. Teknoloji ve ürünler
* Telefonlar. * Bilgisayarlar. * Tabletler. * Kulaklıklar. * Akıllı saatler. * Oyun konsolları. * Oyun ekipmanları. * Ev elektroniği. * Beyaz eşya. * Akıllı ev ürünleri. * Fotoğraf ve video ekipmanları. * Aksesuarlar.

G. Moda ve kişisel bakım
* Giyim. * Ayakkabı. * Çanta ve aksesuarlar. * Kozmetik. * Cilt ve saç bakımı. * Parfümler. * Güzellik merkezleri. * Kuaförler ve berberler. * Kişisel bakım hizmetleri.

H. Ev, yaşam ve hizmetler
* Ev eşyaları. * Mobilya. * Dekorasyon. * Mutfak ürünleri. * Temizlik hizmetleri. * Taşınma hizmetleri. * Evcil hayvan ürünleri ve hizmetleri. * Çeşitli yerel işletmeler.

I. Eğlence, kültür ve etkinlikler
* Film ve dizi. * Dijital yayın platformları. * Video oyunları. * Kitaplar. * Müzik. * Konserler. * Sergiler. * Festivaller. * Tiyatro. * Etkinlik mekanları.

J. Diğer hizmetler
Yeni iş kolları, işletmeler, ürünler ve deneyimler eklenebilmelidir. Kategori ağacı sabit bir kod listesine bağlı olmamalıdır.
Sağlık, finans ve hukuki hizmetler gibi güven gereksinimi yüksek kategoriler eklenirse ilgili içeriklerin uzmanlık, yetki, reklam ve doğruluk gereksinimlerini ayrı değerlendir.

## 5. WEB SİTESİ — SAYFA YAPISI

Ana sayfa
Ana sayfa yalnızca son yazıları kronolojik sırada sıralayan klasik bir blog olmayacak.
Aşağıdaki modülleri içerik yönetiminden düzenlenebilir şekilde oluştur:
1. Modern üst navigasyon.
2. Büyük ve dikkat çekici arama alanı.
3. “Ne keşfetmek istiyorsun?” başlıklı kategori erişimi.
4. Kullanıcı konumuna göre yakınındaki mekanlar; konum izni isteğe bağlı.
5. Öne çıkan sponsorlu içerikler.
6. Editörün seçtikleri.
7. Popüler oteller ve tatil bölgeleri.
8. Öne çıkan restoranlar ve kafeler.
9. Araç kiralama ve ulaşım rehberleri.
10. Turlar, rehberler ve deneyimler.
11. Popüler ürün incelemeleri.
12. Karşılaştırma rehberleri.
13. Yeni yayınlanan içerikler.
14. Sezonluk öneriler ve fırsatlar.
15. Kullanıcıların favorilerine ekleyebileceği içerikler.
16. Bülten üyeliği.
17. Güven ve şeffaflık politikalarına erişim.
18. Kapsamlı ama sade bir footer.

Bütün modüller aynı anda zorunlu olarak gösterilmek zorunda değildir. Kullanıcı davranışları ve editoryal önceliklere göre yönetilebilen bir ana sayfa sistemi kur.
Sponsorlu içeriklerin görünürlüğü önemli bir gelir modelidir. Buna rağmen ana sayfanın tamamını reklama dönüştürme; organik içeriklerle sponsorlu içerikler arasında dengeli bir yapı kur.

Diğer web sayfaları
* Ana sayfa. * Kategori keşif sayfaları. * Kategori alt sayfaları. * Arama sonuçları. * Filtrelenmiş liste sayfaları. * Ürün inceleme sayfası. * İşletme detay sayfası. * Restoran ve mekan sayfası. * Otel ve konaklama sayfası. * Araç kiralama sağlayıcısı sayfası. * Tur ve rehber profili. * Seyahat rehberi. * İçerik yazısı. * Sponsorlu içerik detay sayfası. * Karşılaştırma sayfası. * Kampanya ve fırsat sayfası. * Editör profili. * Kullanıcı profili. * Favoriler. * Okuma geçmişi. * Yorum ve değerlendirmeler. * Bildirimler. * İşletme başvuru sayfası. * İşletme paneli. * Reklam ve sponsorluk başvuru sayfası. * Hakkımızda. * İletişim. * Sık sorulan sorular. * İçerik politikası. * Sponsorlu içerik politikası. * Gizlilik ve KVKK metinleri. * Çerez tercih merkezi. * Kullanım koşulları. * Şikayet ve içerik bildirim sayfası.

## 6. MOBİL UYGULAMA — IOS VE ANDROID

Mobil uygulama, web sitesinin küçültülmüş kopyası gibi hissettirmemelidir. Mobil kullanım alışkanlıklarına göre tasarlanmalıdır.

Alt navigasyon — Önerilen beş sekme:
1. Keşfet: Kişiselleştirilebilir içerik akışı.
2. Ara: Bütün kategori ve içerik türlerinde arama.
3. Harita: Yakındaki mekanlar ve keşfedilebilir noktalar.
4. Kaydedilenler: Favoriler ve koleksiyonlar.
5. Profil: Kullanıcı ayarları, yorumlar ve bildirimler.

Uygulama özellikleri
* Misafir olarak gezinme. * E-posta veya desteklenen kimlik sağlayıcılarıyla giriş. * Kullanıcı profili. * Favorilere ekleme ve koleksiyon oluşturma. * Kendi yorumlarını görüntüleme ve yönetme. * Faydalı yorumları işaretleme. * Kişisel içerik tercihleri. * Son görüntülenen içerikler. * Paylaşım bağlantıları. * Konum izni yönetimi. * İsteğe bağlı push bildirimleri. * Fırsat ve sponsorlu içerik tercihleri. * İşletme iletişim ve rezervasyon bağlantıları. * Derin bağlantılarla ilgili web ve uygulama ekranını açma. * Hata, boş durum, yüklenme durumu ve internet bağlantısı kesilmesi tasarımları.

Bir kullanıcı uygulamayı indirdiğinde hemen hesap açmaya zorlanmamalıdır. Temel keşif deneyimi misafir modunda çalışmalıdır.
Apple ve Google mağaza kurallarına uygun hesap silme, veri yönetimi ve uygulama gizliliği süreçleri tasarlanmalıdır.

## 7. GELİŞMİŞ ARAMA VE FİLTRELEME

Arama sistemi platformun en önemli parçalarından biri olacaktır.
Kullanıcı şu tip aramalar yapabilmelidir:
* Antalya'da denize yakın uygun fiyatlı oteller.
* İstanbul'da iyi kahvaltı mekanları.
* Kapadokya'da rehberli balon ve çevre turları.
* İzmir'de günlük araç kiralama.
* İstanbul'da özel gün için restoranlar.
* Bütçeye uygun kablosuz kulaklıklar.
* Çocuklarla gidilebilecek tatil yerleri.
* Hafta sonu gidilebilecek doğal güzellikler.

Her içerik türü için uygun filtreler bulunmalıdır.
Ortak filtreler: * Konum. * Kategori. * Fiyat seviyesi veya bütçe. * Kullanıcı puanı. * İçerik türü. * Özellikler. * Tarih; ilgili içerik türünde gerekiyorsa. * Sıralama seçeneği.

İşletme listeleri için harita ve liste görünümleri sun. Mobilde filtreleri kolay kullanılabilen bir bottom sheet yapısında tasarla.
Arama motoru; Türkçe karakterler, yazım farklılıkları, eş anlamlı kelimeler ve lokasyon adlarında mümkün olduğunca dayanıklı olmalıdır.
Başlangıçta PostgreSQL tam metin araması kullanılabilir. Veri büyüdüğünde Meilisearch veya Typesense gibi bir arama motoruna geçilebilecek modüler bir arama katmanı oluştur.
AI destekli doğal dil aramasını ileri faza bırak; temel arama sistemi yapay zekâ olmadan da güvenilir çalışmalıdır.

## 8. İNCELEME VE DEĞERLENDİRME SİSTEMİ

Ürünler, işletmeler, mekanlar, konaklama yerleri ve deneyimler için ortak bir içerik çekirdeği geliştir.
Her içerik türünün kendine özgü alanları olabilir. Restoran ile telefon incelemesi aynı veri şablonuna zorla sıkıştırılmamalıdır.

İçerik detay sayfası — Genel olarak aşağıdaki bileşenleri destekle:
* Başlık. * Ana görsel ve görsel galerisi. * Kısa tanıtım. * Detaylı açıklama. * Konum veya teknik bilgiler. * Artılar ve eksiler. * Değerlendirme kriterleri. * Editör değerlendirmesi. * Kullanıcı yorumları. * Benzer seçenekler. * Karşılaştırma bağlantıları. * İlgili rehberler. * Fiyat veya fiyat aralığı. * Son güncelleme tarihi. * İlgili işletme veya marka bilgileri. * İletişim, rezervasyon veya satın alma bağlantıları.

Uygun içerik türlerinde 10 üzerinden veya 5 yıldız üzerinden değerlendirme kullanılabilir. Kullanılan ölçek platform genelinde tutarlı şekilde açıklanmalıdır.

Editoryal ve kullanıcı puanı ayrımı: * Editör puanı. * Kullanıcı puanı. * Yorum sayısı. * Doğrulanmış kullanıcı deneyimi varsa doğrulama durumu.
Bu ölçütleri birbirine karıştırma.
Bir işletmenin sponsor olması, editör puanını, kullanıcı puanını veya organik sıralamadaki yerini otomatik olarak yükseltmemelidir.
Henüz değerlendirme yoksa sahte puan, yıldız, yorum veya ziyaret sayısı üretme. Veri yetersizliğini açık şekilde göster.

## 9. SPONSORLU İÇERİK VE REKLAM SİSTEMİ

Platformun önemli gelir kaynaklarından biri sponsorlu içerikler ve işletme tanıtımlarıdır.
Bu nedenle yalnızca sabit reklam alanları değil, yönetilebilir bir ticari kampanya sistemi oluştur.

Sponsorlu içerik türleri
* Sponsorlu makale. * Sponsorlu ürün incelemesi. * Sponsorlu mekan tanıtımı. * Sponsorlu restoran veya kafe. * Sponsorlu otel tanıtımı. * Sponsorlu seyahat rehberi. * Sponsorlu şehir veya destinasyon rehberi. * Sponsorlu tur ve deneyim. * Sponsorlu araç kiralama sağlayıcısı. * Sponsorlu marka sayfası. * Sponsorlu listeleme. * Kategori sayfasında öne çıkarma. * Ana sayfada öne çıkarma. * Arama sonuçlarında sponsorlu yerleşim. * Sezonluk kampanya ve fırsat. * Markaya özel içerik serisi.

Her sponsorlu yerleşim yönetim panelinden açılıp kapatılabilmeli ve başlangıç-bitiş tarihleri belirlenebilmelidir.

Sponsorlu içeriklerin gösterilmesi
Kullanıcı sponsorlu içerikleri kolayca fark edebilmelidir.
Görünür etiketler kullan: * Sponsorlu. * Reklam. * İş birliği. * Sponsorlu sonuç.
Etiketler içerik kartında ve içerik detay sayfasında uygun şekilde görünmelidir. Yalnızca dipnotta gizlenmiş bir açıklamayla yetinme.
Sponsorlu içerik, editörün bağımsız incelemesi ve kullanıcı değerlendirmesiyle aynı şey değildir. Ticari ilişkileri açıkça belirt.

Sponsor yönetim paneli — Her kampanya için şunları destekle:
* Sponsor işletme veya marka. * Kampanya adı. * Hedef kategori. * Hedef şehir veya lokasyon. * Gösterim alanları. * Başlangıç ve bitiş tarihi. * Kampanya durumu. * Görsel ve içerik. * Hedef URL. * Bütçe veya anlaşma tutarı. * Gösterim sayısı. * Tıklama sayısı. * Tıklama oranı. * Başarılı yönlendirme ölçümü. * Kampanya raporu.
Gösterim ve tıklama ölçümleri gerçek olay kayıtlarından üretilmelidir. Rapor ekranında sahte veya örnek veriler gerçek veriymiş gibi gösterilmemelidir.

Sponsor işletme paneli — Gelecekte işletmelerin kendi hesaplarıyla:
* İşletme profili oluşturabilmesi. * İşletme bilgilerini güncelleyebilmesi. * Fotoğraf ve belge gönderebilmesi. * Sponsorlu kampanya başvurusu oluşturabilmesi. * Kampanya satın alabilmesi. * Başvurunun durumunu takip edebilmesi. * Kampanya performansını görüntüleyebilmesi. * Ödeme ve fatura bilgilerini yönetebilmesi.
için bir işletme paneli tasarla.
İşletme tarafından gönderilen içerikler, doğrulama ve editoryal onaydan geçmeden otomatik olarak yayınlanmamalıdır.
İlk sürümde işletme kampanyaları editör veya yönetici tarafından da oluşturulabilsin. Self-servis reklam sistemi sonraki fazlarda açılabilsin.

## 10. AFİLYE, REZERVASYON, SATIN ALMA VE YÖNLENDİRME SİSTEMİ

Platform, ilgili kategoriye göre kullanıcıyı bir sonraki işleme yönlendirebilmelidir.

Desteklenecek ticari modeller
* Affiliate bağlantıları. * Otel rezervasyon bağlantıları. * Araç kiralama bağlantıları. * Tur ve aktivite satın alma bağlantıları. * Restoran rezervasyon bağlantıları. * Ürün satın alma bağlantıları. * İşletmeye telefon etme. * Web sitesine gitme. * Mesajlaşma bağlantısı. * Teklif veya fiyat talebi oluşturma. * İleride platform içi rezervasyon ve ödeme.

Her kategori için uygun CTA seçilmelidir. Bir film incelemesinde otel rezervasyonu, bir restoran sayfasında otomobil satın alma butonu gibi bağlamsız eylemler bulunmamalıdır.

Entegrasyon mimarisi — Dış sağlayıcılar için bağımsız entegrasyon katmanı kur. Örneğin:
* Otel ve konaklama sağlayıcıları. * Araç kiralama sağlayıcıları. * Tur ve aktivite sağlayıcıları. * Restoran rezervasyon sistemleri. * Ürün affiliate ağları. * Harita ve coğrafi arama servisleri.

Hiçbir sağlayıcının API'sinin mevcut olduğunu varsayma. Önce resmi dokümantasyonunu, erişim şartlarını, kullanım izinlerini ve ticari koşullarını doğrula.
API erişimi yoksa o entegrasyonu hazırmış gibi gösterme. Bunun yerine yönlendirme bağlantısı, işletme iletişim bilgisi veya manuel yönetilen kayıt gibi uygun bir alternatif sun.
Yetkisiz scraping yapma ve dış servislerden veri alırken kullanım koşullarını ihlal etme.

Fiyat ve müsaitlik — Fiyat gösterildiğinde:
* Fiyatın kaynağını belirt. * Mümkünse son güncellenme tarihini göster. * Tarih, kişi sayısı, araç sınıfı veya oda türü gibi fiyatı değiştiren parametreleri dikkate al. * Gerçek müsaitlik verisini statik içerikten ayır. * Eski fiyatları güncelmiş gibi gösterme.
Dış rezervasyon servisinde gerçekleşen işlem platform tarafından doğrulanamıyorsa başarılı rezervasyon gerçekleşmiş gibi davranma.

Affiliate takip sistemi
* Her ticari yönlendirme için takip edilebilir kayıt oluştur.
* Uygun bağlantılarda `rel="sponsored"` ve güvenlik açısından gerekli diğer bağlantı niteliklerini kullan.
* Yönlendirme bağlantılarını merkezi biçimde yönet.
* Sağlayıcıya özel kampanya ve alt kimlik parametrelerini destekle.
* Yetkisiz URL yönlendirmelerini engelle.
* Affiliate ilişkisinin kullanıcı tarafından anlaşılmasını sağla.

## 11. YÖNETİM PANELİ — CUSTOM ADMIN

WordPress yönetim paneli kullanma. Projeye özel bir yönetim arayüzü geliştir.
Yönetim paneli, platformun günlük operasyonlarını tek yerden yönetebilmelidir.

Yönetici modülleri
1. Genel kontrol paneli. 2. İçerik oluşturma ve düzenleme. 3. Kategori ve etiket yönetimi. 4. Ürün veritabanı. 5. İşletme ve mekan yönetimi. 6. Konaklama kayıtları. 7. Araç kiralama sağlayıcıları. 8. Tur ve rehber kayıtları. 9. Kullanıcı hesapları. 10. Yorum ve değerlendirme moderasyonu. 11. Şikayet ve itiraz yönetimi. 12. Sponsorlu içerikler. 13. Reklam kampanyaları. 14. Affiliate bağlantıları. 15. Dış API entegrasyonları. 16. Medya kütüphanesi. 17. Ana sayfa düzenleme. 18. Menü ve navigasyon yönetimi. 19. SEO alanları. 20. Bildirim yönetimi. 21. Analitik ve trafik raporları. 22. Kampanya ve gelir raporları. 23. Kullanıcı rolleri ve izinleri. 24. Sistem ayarları. 25. Denetim kayıtları ve işlem geçmişi.

İçerik editörü
Özel bir içerik editörü geliştir. İçerik blokları; başlık, metin, galeri, tablo, karşılaştırma, harita, bilgi kutusu, artılar-eksiler, sponsorlu alan ve CTA gibi bileşenleri destekleyebilsin.
İçerik üretimi ve tasarım birbirinden ayrılmalıdır. Bir editörün yeni bir rehber hazırlaması için kod değiştirmesi gerekmemelidir.

Roller — En az şu rolleri düşün:
* Süper yönetici. * Yönetici. * Editör. * Yazar. * Moderatör. * İşletme sahibi. * Reklamveren. * Normal kullanıcı.
Her rol yalnızca yetkili olduğu işlemleri yapabilmelidir.
Yönetici işlemleri, sponsorluk değişiklikleri, içerik silme ve kritik veri değişiklikleri denetim kayıtlarına yazılmalıdır.

## 12. VERİTABANI VE TEMEL VARLIKLAR

Veri modelini gelecekte büyüyebilecek şekilde tasarla.
Temel varlıklar:
Users, UserPreferences, Roles, Permissions, Categories, CategoryAttributes, Tags, ContentItems, Articles, Reviews, ReviewCriteria, Comments, Businesses, BusinessLocations, Products, Hotels, CarRentalProviders, TourGuides, Activities, Offers, AffiliateLinks, AffiliateClicks, SponsoredCampaigns, CampaignPlacements, CampaignMetrics, Favorites, Collections, MediaAssets, Reports, ModerationActions, Notifications, ProviderIntegrations, ExternalPriceSnapshots, SearchEvents, AuditLogs

Bunların hepsini körü körüne birbirinden bağımsız tablolar olarak kurma. Ortak alanları, kalıtım veya ilişkisel model yaklaşımını ve sorgu ihtiyaçlarını değerlendirerek doğru veri modelini oluştur.
İçerik tipleri farklı alanlar taşıyabilmelidir. Örneğin:
* Otelde oda tipleri ve konaklama özellikleri. * Restoranda mutfak türü, menü ve fiyat seviyesi. * Araç kiralamada araç sınıfı ve teslim noktaları. * Üründe teknik özellikler. * Rehberde uzmanlık alanları ve konuştuğu diller.
Sık sorgulanan alanlarda doğru indeksler oluştur. Silme ve veri saklama politikalarını, ilişkisel bütünlüğü ve migration stratejisini planla.

## 13. SEO VE ORGANİK BÜYÜME

Web platformu arama motorlarından ziyaretçi kazanabilecek şekilde geliştirilmeli.

Teknik SEO
* Sunucu tarafında oluşturulan içerik sayfaları. * Benzersiz sayfa başlıkları ve açıklamalar. * Canonical URL yönetimi. * XML sitemap. * Robots.txt. * Open Graph ve paylaşım görselleri. * İç bağlantı sistemi. * Breadcrumb navigasyonu. * Anlamlı ve kalıcı URL yapıları. * Çok dilli yapıya hazır mimari. * Uygun yapılandırılmış veriler. * Görsel optimizasyonu. * Yinelenen içerik kontrolü. * Yönlendirme ve 404 yönetimi.

İçeriğin gerçek türüyle eşleşen yapılandırılmış veriler kullan. Gerçekte bulunmayan kullanıcı puanları veya değerlendirmeler için yapılandırılmış veri üretme. Google'ın güncel yönergelerine göre uygulanabilirliği doğrula.

İçerik SEO'su — Örnek içerikler:
* Antalya'da Gezilecek Yerler: Ayrıntılı Gezi Rehberi. * Kapadokya'da Nerede Kalınır? * İstanbul'un Öne Çıkan Kahvaltı Mekanları. * Araç Kiralarken Nelere Dikkat Edilmeli? * Otel Seçerken Hangi Özellikler Önemli? * Ürün A ve Ürün B Karşılaştırması. * Bir Şehre İlk Kez Gidecekler İçin Rehber. * Bütçeye Göre Tatil Planlama Rehberi.
Her içerik yalnızca anahtar kelime doldurmak amacıyla yazılmamalıdır. Kullanıcının kararını gerçekten kolaylaştıracak bilgiler, kaynaklar, güncellik ve özgün değerlendirmeler esas alınmalıdır.

Programatik SEO
Şehir, kategori ve içerik kombinasyonlarıyla sayfalar oluşturulabilir; ancak sadece URL üretmek için boş veya birbirini tekrar eden yüzlerce sayfa oluşturma.
Sayfanın gerçek değer taşıması, yeterli veriye sahip olması ve kullanıcıya anlamlı sonuç sunması zorunludur.

## 14. İÇERİK KALİTESİ VE GÜVEN

Platformda yayınlanan içeriklerin güvenilir olması marka için temel önceliktir.
Aşağıdaki politikaları uygula:
* Gerçekleşmemiş testleri yapılmış gibi anlatma.
* Ziyaret edilmemiş bir mekanı bizzat deneyimlemiş gibi gösterme.
* Ürün kullanma deneyimi yoksa bunu açıkça belirt.
* Kullanıcı yorumları, editör incelemeleri ve sponsorlu metinleri birbirinden ayır.
* İçeriklerin yayın ve güncellenme tarihlerini göster.
* Kaynak ve fiyat bilgilerini uygun yerlerde belirt.
* Telif hakkıyla korunan görselleri izinsiz kullanma.
* Kullanıcı yorumları için moderasyon ve bildirim sistemi oluştur.
* İşletmelerin yanıltıcı içerikleri düzeltme veya itiraz etme talebinde bulunabilmesini sağla.
* Olumsuz yorumların sırf sponsor talebi nedeniyle silinmesini engelleyen bir politika oluştur.
Yapay zekâ içerik üretimine yardımcı olabilir; fakat doğrulanmamış bilgiyi otomatik olarak yayınlama. Özellikle fiyat, adres, çalışma saati, lisans, seyahat koşulları ve sağlıkla ilgili bilgiler kontrol edilmelidir.

## 15. GELİR MODELİ

Platformun iş modeli yalnızca reklama dayanmamalıdır.
Öncelikli gelir kaynakları:
1. Sponsorlu içerikler: Markaların ve işletmelerin ücretli tanıtım yazıları ve inceleme içerikleri.
2. Sponsorlu listeleme: Restoran, otel, ürün, tur veya hizmetin uygun alanlarda öne çıkarılması.
3. Affiliate gelirleri: Harici satın alma, rezervasyon ve hizmet bağlantılarından elde edilebilecek komisyonlar.
4. İşletme paketleri: İşletme profili, özel içerik alanları, kampanya raporu ve tanıtım paketleri.
5. Rezervasyon ve talep yönlendirme: Uygun iş ortaklıklarında nitelikli müşteri yönlendirmeleri.
6. Marka kampanyaları: Şehir, seyahat, sezon, ürün veya kategori odaklı sponsorluklar.
7. Reklam alanları: İlerleyen dönemde uygun reklam ağlarıyla gösterim bazlı gelir.
Her gelir modelinin uygulanabilmesi ilgili sağlayıcının ticari şartlarına, sözleşmelere ve mevzuata bağlıdır. Desteklenmeyen bir modeli tamamlanmış özellik gibi gösterme.
İşletme paketlerini, fiyatlandırmayı ve kampanya performansını yönetim panelinden idare edilebilecek biçimde tasarla.

## 16. GÜVENLİK, KVKK VE OPERASYON

Platform, Türkiye'de hizmet veren bir işletme olarak değerlendirildiğinde uygulanması gereken hukuki yükümlülükleri proje gereksinimlerine dahil et.
Asgari teknik gereksinimler:
* Yetkilendirme ve rol tabanlı erişim kontrolü. * Güvenli oturum yönetimi. * Hassas bilgiler için uygun şifreleme. * Rate limiting. * Girdi doğrulama. * XSS, CSRF, SQL injection ve benzeri saldırılara karşı koruma. * Güvenli dosya yükleme. * Güvenli sır yönetimi. * Loglarda hassas verilerin maskelenmesi. * Kişisel verilerin amaca uygun işlenmesi. * Çerez ve analitik tercih yönetimi. * Hesap silme ve veri talepleri için iş akışları. * İçerik raporlama ve itiraz prosedürü. * Düzenli yedekleme ve geri yükleme testi.
KVKK, çerezler, ticari iletişim, reklam açıklamaları, tüketici mevzuatı ve elektronik ticaret yükümlülükleri için hukuki inceleme gerektiren alanları açıkça listele. Hukuki metinlerin otomatik olarak her durumda yeterli olduğunu iddia etme.
Kullanıcı konumunu varsayılan olarak zorunlu tutma. Konum erişimini izinli ve amaçla sınırlı şekilde uygula.

## 17. HIZ, ERİŞİLEBİLİRLİK VE KULLANILABİLİRLİK

Hedeflenen teknik kalite:
* Mobile-first responsive tasarım. * Core Web Vitals odaklı performans. * Görsel boyutlandırma ve lazy loading. * Gereksiz JavaScript'in azaltılması. * Önbellekleme stratejisi. * Veritabanı sorgularının optimize edilmesi. * Uzun listelerde sayfalama veya uygun yükleme modeli. * Klavye ile kullanım. * Anlamlı erişilebilir HTML. * Yeterli renk kontrastı. * Ekran okuyucu uyumlu kontroller. * Formlarda açıklayıcı hata mesajları. * Yüklenme, boş sonuç ve hata durumları. * Mobil cihazlarda anlaşılır dokunma hedefleri.
Gereksiz animasyon, pahalı görsel efekt veya onlarca bağımsız kütüphane kullanarak performansı düşürme.

## 18. ANALİTİK VE BÜYÜME SİSTEMİ

Platform kullanıcı davranışını ve ticari performansı ölçebilmelidir.
Takip edilecek temel olaylar:
* Arama yapıldı. * Kategori görüntülendi. * İçerik görüntülendi. * Sponsorlu içerik görüntülendi. * Sponsorlu içerik tıklandı. * Affiliate bağlantısı tıklandı. * Telefon veya web sitesi bağlantısı açıldı. * Favoriye eklendi. * Yorum gönderildi. * İşletme başvurusu oluşturuldu. * Rezervasyon sağlayıcısına yönlendirildi. * Kampanya başvurusu tamamlandı.
İlk etapta temel gösterge panelleri:
* Aktif kullanıcılar. * Organik trafik. * Kategori bazında içerik performansı. * Sponsorlu gösterim ve tıklamalar. * Affiliate yönlendirmeleri. * Kullanıcıların en çok aradığı konular. * İçeriklerin güncellik durumu. * İşletme ve reklamveren başvuruları.
KVKK ve izin gereksinimlerine uygun analitik mimarisi kur. Kişisel verileri gereksiz yere toplama.

## 19. MVP VE GELİŞTİRME FAZLARI

Bütün sistemi tek aşamada bitirmeye çalışma. Ancak mimariyi başlangıçtan itibaren genişlemeye hazır kur.

FAZ 1 — Çalışan temel platform
* Özel web sitesi. * Next.js tabanlı frontend. * Backend API. * PostgreSQL. * Custom admin paneli. * Kullanıcı hesabı ve misafir gezinme. * Kategori yönetimi. * İçerik oluşturma ve yayımlama. * İşletme ve mekan detayları. * İnceleme ve yorum sistemi. * Arama ve filtreleme. * Harici bağlantılar. * Sponsorlu içerik etiketleri. * Temel affiliate yönlendirme takibi. * SEO altyapısı. * Mobil uyumlu arayüz. * Temel analitik.

FAZ 2 — Mobil uygulama
* iOS ve Android uygulamaları. * Ortak kullanıcı hesabı. * Favoriler. * Arama. * Keşfet akışı. * Harita görünümü. * Profil. * Bildirimler. * Paylaşılabilir derin bağlantılar.

FAZ 3 — Ticari sistemler
* İşletme paneli. * Reklamveren paneli. * Sponsorlu kampanyalar. * Kampanya ölçümü. * İşletme doğrulama. * Ticari başvuru formları. * Affiliate sağlayıcı entegrasyonları. * Fiyat ve müsaitlik entegrasyonları; uygun sağlayıcılarla.

FAZ 4 — Gelişmiş keşif
* Kişiselleştirilmiş öneriler. * Gelişmiş arama motoru. * Koleksiyonlar ve kullanıcı listeleri. * Gelişmiş içerik karşılaştırmaları. * Sezonluk ve lokasyon bazlı öneriler. * Gelişmiş ticari raporlama. * AI destekli keşif; doğrulanmış verilerle sınırlandırılmış şekilde.

Her fazda çalışan yazılım, testler ve dokümantasyon bulunmalıdır.

## 20. TEST VE KALİTE KONTROLÜ

Aşağıdaki testleri uygula:
* Birim testleri. * API entegrasyon testleri. * Kritik kullanıcı akışları için uçtan uca testler. * Rol ve izin testleri. * Sponsorlu içerik etiketlerinin görünürlük testleri. * Affiliate bağlantısı güvenlik testleri. * Arama ve filtreleme testleri. * Mobil ekran uyumluluğu. * Form doğrulama testleri. * Boş veri ve hata durumları. * SEO metadata kontrolleri. * Veritabanı migration testleri. * Performans kontrolleri.

Özellikle aşağıdaki uçtan uca senaryolar çalışmalıdır:
1. Yönetici kategori oluşturur, bir içerik yayınlar ve içerik web sitesinde görünür.
2. Kullanıcı arama yapar, filtre uygular ve bir içerik sayfasını açar.
3. Kullanıcı oturum açar, favori ekler ve kendi profilinde favorisini görür.
4. Kullanıcı yorum yapar ve yorum moderasyon akışına girer.
5. Yönetici sponsorlu kampanya oluşturur ve ilgili alanda açıkça etiketlenerek görünür.
6. Bir sponsorlu bağlantıya tıklanır ve tıklama olayı kaydedilir.
7. Bir işletme başvurusu oluşturulur ve yönetici tarafından incelenir.
8. Harici bir sağlayıcının API'si kullanılamadığında sistem kullanıcıya hatalı müsaitlik veya fiyat göstermez.

Gerçekte yapılmamış testler için başarılı rapor üretme. Test ortamında örnek veri kullanılabilir; bu verilerin demo olduğu açıkça belirtilmelidir.

## 21. PROJE ÇIKTILARI

Geliştirme sonunda aşağıdaki çıktılar hazırlanmalıdır:
1. Çalışan web uygulaması. 2. Backend kaynak kodu ve API. 3. Veritabanı şeması ve migration dosyaları. 4. Custom yönetim paneli. 5. Mobil uygulama projesi. 6. Tasarım sistemi ve tekrar kullanılabilir bileşenler. 7. `.env.example`. 8. Docker geliştirme ortamı. 9. Kurulum ve çalıştırma talimatları. 10. API dokümantasyonu. 11. Testler. 12. Güvenlik ve dağıtım checklist'i. 13. Entegrasyon sağlayıcıları için adaptör yapısı. 14. Örnek demo verileri. 15. Üretime geçiş planı. 16. Eksik dış API erişimleri ve ticari hesaplar için kurulum listesi.

Bütün ana işlevleri gerçek kod üzerinden uygula. Boş butonlar, çalışmayan formlar, sabitlenmiş sahte istatistikler veya yalnızca görsel amaçlı ekranlar bırakma. Henüz tamamlanmayan özellikleri açık şekilde işaretle.
Harici API anahtarları yoksa güvenli bir arayüz ve mock test adaptörü hazırla; mock veriyi üretim verisiymiş gibi sunma.

## 22. ÇALIŞMA YÖNTEMİN

Projeyi geliştirirken şu sırayla ilerle:
1. Mevcut repository ve teknoloji altyapısını incele.
2. Proje gereksinimlerini ve teknik riskleri belirle.
3. Bilgi mimarisini ve kullanıcı akışlarını oluştur.
4. Veritabanı modelini ve API sözleşmelerini tanımla.
5. Tasarım sistemini ve temel ekranları oluştur.
6. Web uygulamasının ana akışlarını çalışır hâle getir.
7. Backend, veritabanı ve yönetim panelini entegre et.
8. Arama, inceleme, sponsorlu içerik ve yönlendirme özelliklerini uygula.
9. Testleri çalıştır ve hataları düzelt.
10. Mobil uygulamayı ortak API üzerinden geliştir.
11. Performans, güvenlik ve SEO kontrollerini yap.
12. Kurulum, dağıtım ve bakım dokümantasyonunu hazırla.

Önce repository'yi kontrol et. Ardından kısa bir mimari özeti, klasör yapısı ve uygulanacak adımları ortaya koy; sonrasında yalnızca plan yazmakla kalmayıp doğrudan uygulamaya başla.
Eksik API erişimi, sağlayıcı hesabı veya ticari sözleşme gerektiren işleri açıkça belirt. Gerçekte mümkün olmayan özellikler için sahte entegrasyon üretme.
Gereksiz sorularla geliştirmeyi durdurma. Eksik olan ayrıntılarda en makul ve sürdürülebilir kararı ver, önemli varsayımları dokümante et.

SON HEDEF: incelemeler.com.tr markası altında; seyahat, konaklama, restoranlar, otomobiller, araç kiralama, rehberlik, ürün incelemeleri ve çok çeşitli hizmetleri bir araya getiren; sponsorlu içeriklerden gelir elde edebilen; iOS, Android ve web üzerinde çalışan; güvenilir, hızlı, modern ve gelecekte büyüyebilir bir keşif platformu geliştirmek.

Sadece güzel görünen bir arayüz üretme. Gerçek bir yazılım ürünü geliştir.
