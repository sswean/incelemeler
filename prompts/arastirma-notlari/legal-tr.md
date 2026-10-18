# legal-tr — Türkiye hukuku, KVKK, reklam mevzuatı ve mağaza politikaları

## Özet

v1, hukuki uyumu yalnızca genel cümlelerle ele alıyor: "KVKK, çerezler, ticari iletişim... için hukuki inceleme gerektiren alanları listele" (§16), "Apple ve Google mağaza kurallarına uygun hesap silme" (§6) ve "Sponsorlu / Reklam / İş birliği" etiketleri (§9). Bu düzeyde bırakılırsa ajan, yasal yükümlülüğü olan alanları sıradan özellik gibi kurar. Örnekler:
- Ruhsat kontrolü yapılmadan "yerel rehber" listelenir.
- Bakanlık belgesi olmayan konaklama tesisleri ve kiralık tatil evleri tanıtılır.
- Ürün olarak "tur satın alma" ve "platform içi rezervasyon ve ödeme" tasarlanır.
- Pazarlama amaçlı push bildirimleri izinsiz gönderilir.
- Analitik ve reklam çerezleri onay alınmadan yüklenir.

2024–2026 arasında bu alanda önemli değişiklikler oldu ve v1 hiçbirini yansıtmıyor:
- KVKK m.9 değişti: yurt dışına aktarım artık yeterlilik kararı, standart sözleşme ve bildirim rejimine bağlı (7499 s. Kanun, 01.06.2024).
- KVKK 2026/347 sayılı ilke kararı yayımlandı: aydınlatma metni ile açık rıza metni ayrı hazırlanmalı.
- Ticari Reklam ve Haksız Ticari Uygulamalar Yönetmeliği'nde 01.08.2026'da yürürlüğe giren değişiklik yapıldı. Kapsadığı konular: tüketici değerlendirmeleri, hedefli reklam, yapay zekâ ile üretilmiş içerik, "reklam" ibaresi, indirim reklamları.
- 31.12.2025 tarihli Kültür ve Turizm Bakanlığı tebliği ve 2026/4 sayılı genelge yayımlandı: belgesiz konaklama ilanı yasak, belge numarası gösterilmeli.
- 2025/10 sayılı Cumhurbaşkanlığı Genelgesi yayımlandı (web ve mobil erişilebilirlik).
- 7584 s. Kanun ile 4250 s. Kanun m.6 yeniden düzenlendi (alkol reklamı).

Bu çalışma ortamından resmî kaynaklara (resmigazete.gov.tr, kvkk.gov.tr, mevzuat.gov.tr) doğrudan erişilemedi. Türk mevzuatına ilişkin bilgiler çoğunlukla ikincil kaynaklardan (hukuk bürosu ve haber siteleri) çapraz kontrolle derlendi. Bu yüzden Türk mevzuatı bulgularında "doğrulandı: hayır" yazıyor ve önerilen metinler ajana "doğrula, doğrulayamazsan hukuki inceleme listesine ekle" talimatı veriyor. Apple App Store kuralları birincil kaynaktan doğrudan okundu. Google Play kuralları resmî yardım sayfasından aktarılan metinle doğrulandı.

v2 için temel ilkeler şunlar:
- **Hukuki kapı:** Her ticari ve düzenlenmiş özellik bir "hukuki kapı" (feature flag + onay kaydı) arkasına alınmalı.
- **Uyum varlıkları:** Uyum veri modelin birinci sınıf varlıkları olmalı: onay kayıtları, belge/ruhsat doğrulama, başvuru talepleri, kaldırma talepleri, aktarım envanteri.
- **Kabul kriterleri:** Hukuki gereksinimler test edilebilir kabul kriterlerine çevrilmeli.

## Yapı önerileri

1. v2'ye ayrı bir "§H. HUKUKİ UYUM VE MAĞAZA POLİTİKALARI" ana bölümü ekle. Şu an §16'nın içine sıkışmış durumda. Alt bölümler:
   - H1 Rol ve sorumluluk haritası (veri sorumlusu, içerik/yer sağlayıcı, reklam yayıncısı)
   - H2 KVKK
   - H3 Çerez ve izleme
   - H4 Ticari elektronik ileti / İYS / push
   - H5 Reklam, sponsorluk, affiliate açıklamaları
   - H6 Tüketici değerlendirmeleri
   - H7 UGC, 5651, kaldırma ve hakaret riski
   - H8 Fikri mülkiyet
   - H9 Sektörel lisanslar (turizm, rehberlik, acenta, sağlık, alkol)
   - H10 Ödeme ve faturalama
   - H11 Erişilebilirlik
   - H12 App Store / Google Play
   - H13 Hukuki inceleme listesi
2. Promptun başına "Hukuki doğrulama kuralı" ekle. Ajan hiçbir mevzuat maddesini, süreyi veya eşiği koda gömülü sabit olarak yazmamalı. Süreler ve eşikler `compliance_config` tablosunda/dosyasında, kaynak URL'si ve "doğrulanma tarihi" alanıyla tutulmalı.
3. Kategori mimarisi (§4) ve gelir modeli (§10, §15) içine "Hukuki kapı" sütunu ekle. Her alt kategori ve ticari model için: serbest / doğrulama gerekli / hukuki onay olmadan kapalı.
4. Veri modeli bölümüne (§12) uyum varlıklarını ekle: ConsentRecords, LegalDocumentVersions, DataSubjectRequests, TakedownRequests, LicenseVerifications, ProcessorInventory, BreachIncidents, SponsorDisclosures.
5. Test bölümüne (§20) "Uyum kabul testleri" alt başlığını ekle (çerez, hesap silme, etiket, belge numarası, onay ve İYS akışları).
6. Proje çıktılarına (§21) `docs/legal/` klasörünü ekle. İçerik: taslak hukuki metinler + hukuki inceleme listesi + aktarım envanteri. Her metin "TASLAK — hukukçu onayı gerekir" damgalı ve sürümlü olmalı.
7. Fazlara (§19) "Faz 0 — Hukuki temel" adımını ekle. Rol haritası, veri envanteri, çerez/İYS kararları ve lisans gerektiren kategorilerin kapı kararları Faz 1 kodundan önce yapılmalı.

## Bulgular

### LEGAL-TR-01 — "Platform içi rezervasyon ve ödeme" ile "tur satın alma" lisanssız kurulmamalı
- v1 bölüm: 10, 15, 19  ·  tür: risk  ·  öncelik: P0  ·  doğrulandı: hayır
- Gerekçe: Bu konuda üç ayrı düzenleme devreye giriyor:
  - Türkiye'de seyahat acentalığı faaliyeti için Kültür ve Turizm Bakanlığı işletme belgesi zorunludur (1618 s. Kanun m.4). Paket turlar için zorunlu sigorta öngörülmüştür (m.12).
  - Üçüncü kişiler adına ödeme toplamak 6493 s. Kanun kapsamındaki lisanslı faaliyetlere dokunur.
  - Platform içinde sözleşme kurulmasına aracılık etmek, 6563 kapsamındaki "aracı hizmet sağlayıcı" yükümlülüklerini doğurabilir.

  v1 bunları "ileride" diye bırakıyor ama mimariye ve CTA'lara sızdırıyor ("Tur ve aktivite satın alma bağlantıları", "platform içi rezervasyon ve ödeme").
- Kaynaklar: https://www.lexpera.com.tr/mevzuat/kanunlar/seyahat-acentalari-ve-seyahat-acentalari-birligi-kanunu/14 ; https://www.alomaliye.com/wp-content/uploads/1972/09/1618-sk-05-12-2025.doc ; https://www.tcmb.gov.tr/wps/wcm/connect/TR/TCMB+TR/Main+Menu/Temel+Faaliyetler/Odeme+Hizmetleri/Genel+Bakis
- Önerilen metin:

> **Rezervasyon, satış ve ödeme sınırı (zorunlu):**
> - Platform hiçbir aşamada tur, paket tur, konaklama veya araç kiralama hizmetini **kendi adına satmaz** ve **üçüncü kişiler adına bedel tahsil etmez**. Faz 1–4 boyunca tüm "satın al / rezervasyon yap" eylemleri dış sağlayıcıya yönlendirme (affiliate/deep link) olarak uygulanır.
> - "Tur ve aktivite satın alma bağlantıları" ifadesini "lisanslı seyahat acentası veya sağlayıcıya yönlendirme" olarak uygula. Yönlendirilen acentanın **Bakanlık işletme belgesi numarası** sağlayıcı kaydında zorunlu alan olmalı. Belge numarası olmayan acentaya ticari yönlendirme (affiliate/sponsor) açılamaz.
> - CTA metinleri satışı platformun yaptığı izlenimini vermemeli. "Satın al" yerine "{Sağlayıcı} sitesinde rezervasyon yap" kullan ve yanına harici bağlantı ikonu koy.
> - "Platform içi rezervasyon ve ödeme" yalnızca **mimari genişleme noktası** olarak bırakılır: arayüz, adaptör interface'i ve `feature_flag=in_platform_booking` (varsayılan kapalı). Bu bayrak, aşağıdaki maddeler `docs/legal/hukuki-inceleme.md` içinde "onaylandı" olarak işaretlenmeden açılamaz. Bu kural kodda ve admin ayarlarında zorlanmalıdır:
>   1. Seyahat acentası işletme belgesi (1618 s. Kanun) veya lisanslı acentayla aracılık modeli,
>   2. 6493 s. Kanun kapsamında lisanslı ödeme/elektronik para kuruluşu ile çalışma. Platform hesabında üçüncü kişi fonu tutulmaz.
>   3. Mesafeli sözleşme ve paket tur tüketici mevzuatı,
>   4. 6563 aracı hizmet sağlayıcı yükümlülükleri ve ETBİS kaydı,
>   5. e-Fatura/e-Arşiv düzeni.
> - Bu maddelerdeki madde numaraları ve yükümlülükler hukukçu tarafından doğrulanmalı. Doğrulanmadan ürün metnine veya koda "yasal olarak uygundur" ifadesi yazılmaz.

### LEGAL-TR-02 — "Yerel rehberler" ve "profesyonel tur rehberleri" yalnızca ruhsat doğrulamasıyla listelenmeli
- v1 bölüm: 4-E, 12  ·  tür: risk  ·  öncelik: P0  ·  doğrulandı: hayır
- Gerekçe: 6326 s. Turist Rehberliği Meslek Kanunu'na göre turist rehberliği ruhsatname ve çalışma kartı gerektirir. Ruhsatsız veya çalışma kartsız rehberliğe idari para cezası uygulanır. Ruhsatname sahibi olup çalışma kartı olmayan rehber "eylemsiz" kabul edilir (Turist Rehberliği Meslek Yönetmeliği, RG 07.11.2024). v1 "Yerel rehberler" kategorisi açıyor ve rehber profillerine iletişim/rezervasyon bağlantısı veriyor. Ruhsatsız kişilerin "rehber" olarak tanıtılması, platformu yasa dışı faaliyete aracılık eden konuma düşürür.
- Kaynaklar: https://www.alomaliye.com/wp-content/uploads/2012/06/6326-sk-27-04-2024.doc ; https://www.alomaliye.com/2024/11/07/turist-rehberligi-meslek-yonetmeligi-2024/ ; https://www.dha.com.tr/yerel-haberler/antalya/antalyada-kacak-rehberlere-siki-denetim-2915697
- Önerilen metin:

> **Rehber profilleri — lisans kapısı:**
> - "Turist rehberi", "profesyonel rehber", "tur rehberi" unvanlı profiller yalnızca şu alanlar doldurulup **admin tarafından doğrulandıktan** sonra yayınlanabilir: `ruhsatname_no`, `calisma_karti_no`, `calisma_karti_gecerlilik_tarihi`, `diller`, `bolge`, `dogrulama_belgesi (dosya)`, `dogrulayan_admin`, `dogrulama_tarihi`.
> - Durum makinesi: `taslak → belge_bekleniyor → inceleniyor → dogrulandi | reddedildi → suresi_doldu`. Kartın geçerlilik tarihi geçince profil otomatik olarak `suresi_doldu` olur, iletişim ve rezervasyon CTA'ları gizlenir. Bunun için zamanlanmış görev kur.
> - Doğrulanmamış hiçbir profilde "rehber" kelimesi, rehberlik hizmeti teklifi veya rezervasyon/iletişim CTA'sı gösterilmez.
> - v1'deki "Yerel rehberler" alt kategorisini kaldır. Yerine iki ayrı kavram kur:
>   1. **Lisanslı turist rehberleri:** yukarıdaki doğrulamayla.
>   2. **Yerel öneriler / yerel ipuçları:** kullanıcı veya editör içeriği. Ücretli rehberlik hizmeti teklif edilemez, iletişim/rezervasyon CTA'sı yoktur.
> - Ruhsat doğrulamasının hangi resmî kanaldan yapılabileceği (Bakanlık veya meslek kuruluşu sorgusu) doğrulanmalı. Otomatik sorgu yoksa manuel belge kontrolü uygulanır ve bu durum admin ekranında açıkça yazılır.
> - 6326 s. Kanun'un ilgili madde numaraları kodda veya metinde atıf yapılmadan önce resmî metinden doğrulanmalı.

### LEGAL-TR-03 — Konaklama ve kiralık tatil evi kayıtlarında Bakanlık belge numarası zorunlu olmalı
- v1 bölüm: 4-B, 9, 12  ·  tür: eksik  ·  öncelik: P0  ·  doğrulandı: hayır
- Gerekçe: Bu alanda üç düzenleme var:
  - 31.12.2025 tarihli (RG 33124) Kültür ve Turizm Bakanlığı tebliği, belgesiz konaklama işletmelerinin ve izin belgesi olmayan kısa süreli kiralık konutların elektronik ortamda tanıtım, pazarlama ve satışını yasaklıyor. İlanda belge numarasının Bakanlık veri tabanından doğrulanıp görünür biçimde gösterilmesini istiyor. Uyarıdan sonra 24 saat içinde kaldırmamaya ilan başına yaptırım öngörüyor.
  - 2026/4 sayılı genelge, ilanın "rezervasyona kapalı" diye yayında tutulmasının da aykırı olduğunu belirtiyor.
  - 7464 s. Kanun, turizm amaçlı konut kiralamayı izin belgesine bağlıyor.

  v1'in "Kiralık tatil evleri", "Pansiyonlar" ve "Sponsorlu otel tanıtımı" kalemleri doğrudan bu kapsamda.
- Kaynaklar: https://www.resmigazete.gov.tr/eskiler/2025/12/20251231-7.htm (okunamadı; ikincil özet:) https://www.alomaliye.com/2025/12/31/kisa-sureli-kiralamaya-konu-konutlarin-e-ortamda-tanitim-pazarlama-ve-satisinin-yapilmasi/ ; https://www.alomaliye.com/2026/10/07/belgesiz-konaklama-ilanlarina-gecit-yok-platformlar-ilanlari-tamamen-kaldiracak/ ; https://www.cnnturk.com/ekonomi/belgesiz-konaklama-ve-kisa-sureli-kiralamaya-dijital-yasak-2379697 ; https://www.alomaliye.com/2023/11/02/7464-sayili-konutlarin-turizm-amacli-kiralanmasi
- Önerilen metin:

> **Konaklama kayıtları — belge kapısı (Türkiye'deki tesisler):**
> - Her konaklama kaydında zorunlu alanlar:
>   - `belge_turu`: Turizm İşletmesi Belgesi / Geçici Turizm İşletmesi Belgesi / Basit Konaklama Turizm İşletmesi Belgesi / Turizm Amaçlı Kiralanan Konut İzin Belgesi
>   - `belge_no`
>   - `belge_dogrulama_durumu`
>   - `dogrulama_kaynagi`
>   - `dogrulama_tarihi`
>   - `dogrulayan`
> - Belge numarası doğrulanmamış Türkiye'deki konaklama kaydı **yayına alınamaz**. Bu kayıt sponsorlu yerleşime, affiliate/rezervasyon yönlendirmesine ve harita/arama sonuçlarına giremez. "Rezervasyona kapalı" diye yayında tutmak da yasaktır.
> - Doğrulanmış belge numarası konaklama detay sayfasında ve sponsorlu kartlarda **kolayca görülebilir** şekilde gösterilir. Örnek: "Kültür ve Turizm Bakanlığı Belge No: …".
> - Editoryal destinasyon rehberlerinde belgesiz bir tesisin adı geçiyorsa bağlantı ve CTA verilmez. Bu durumun "tanıtım" sayılıp sayılmadığı hukuki inceleme listesine eklenir.
> - Admin'e "Bakanlık uyarısı / kaldırma talebi" iş akışı ekle. Talep kaydedildiği anda SLA sayacı başlar: **24 saat** içinde ilgili tüm ilanlar (web, mobil, sitemap, önbellek, CDN) kaldırılır ve işlem denetim kaydına yazılır. Kaldırılan kayıt, yeni bir doğrulama yapılmadan tekrar yayına alınamaz (yeniden yayın kilidi).
> - Doğrulama için Bakanlık veri tabanının API/sorgu erişimi olup olmadığını araştır. Yoksa manuel doğrulama yap ve bunu admin ekranında belirt. Tebliğ ve genelgenin güncel metni ile yabancı platformlara yönelik bekleyen kanun düzenlemeleri, yayına çıkmadan önce hukukçu tarafından doğrulanmalı.

### LEGAL-TR-04 — Sponsorlu içerik etiketleme: serbest seçim yerine sabit, denetlenebilir "Reklam" ibaresi
- v1 bölüm: 9, 8  ·  tür: hatalı  ·  öncelik: P0  ·  doğrulandı: hayır
- Gerekçe: v1 dört etiketi ("Sponsorlu", "Reklam", "İş birliği", "Sponsorlu sonuç") serbest seçenek gibi sunuyor. Ayrıca "Sponsorlu ürün incelemesi" türü açıyor ve bu içeriğe editör puanı verilmesine engel koymuyor. 6502 s. Kanun ve Ticari Reklam ve Haksız Ticari Uygulamalar Yönetmeliği örtülü reklamı yasaklıyor. Reklam olduğunu açıkça belirtmeden editoryal içerik kullanmak haksız ticari uygulama sayılıyor. 01.08.2026 değişikliğiyle etkileyici paylaşımlarında "reklam" ibaresi zorunlu hâle geldi. Bu zorunluluk ücretsiz/indirimli ürün, davet ve sponsorluk gibi menfaatleri de kapsıyor.
- Kaynaklar: https://www.ozdagistanliekici.com/mevzuat-degisikligi-ticari-reklam-ve-haksiz-ticari-uygulamalar-yonetmeligi/ ; https://www.gzt.com/gundem/sosyal-medyada-reklam-yazmak-zorunlu-mu-4245635 ; https://iabtr.org/wp-content/uploads/2024/06/Sosyal-Medya-Etkileyicileri-Tarafindan-Yapilan-Ticari-Reklam-ve-Haksiz-Ticari-Uygulamalar-Hakkinda-Kilavuz1062021101250.pdf ; https://www.cottgroup.com/tr/mevzuat/item/ticari-reklam-ve-haksiz-ticari-uygulamalar-yonetmeliginde-degisiklik-yapildi
- Önerilen metin:

> **Ticari ilişki açıklama sistemi (zorunlu, kod düzeyinde):**
> - Her içerik ve yerleşimde `ticari_iliski` alanı zorunludur: `yok | sponsorlu | affiliate | ucretsiz_urun_veya_davet | isletme_tarafindan_saglanan`. Değer `yok` dışında ise etiket otomatik basılır. Editör etiketi kaldıramaz, gizleyemez, rengini veya boyutunu değiştiremez.
> - Etiket sözlüğü sabittir (admin'den serbest metin girilmez):
>
> | ticari_iliski | Kart etiketi | Detay sayfası üst bandı |
> |---|---|---|
> | sponsorlu | **Reklam** | "Reklam — Bu içerik {Sponsor} ile ücretli iş birliği kapsamında hazırlanmıştır." |
> | affiliate | **Ortaklık bağlantısı** | "Bu sayfadaki bazı bağlantılardan satış olursa komisyon alabiliriz. Bu, değerlendirmemizi etkilemez." (bağlantıların hemen yanında) |
> | ucretsiz_urun_veya_davet | **Reklam** | "Bu inceleme için ürün/konaklama {Firma} tarafından ücretsiz sağlanmıştır." |
> | arama/kategori yerleşimi | **Reklam** | — |
>
> - Etiket kart görselinin üzerinde veya başlığın hemen önünde yer alır. Font boyutu gövde metninin en az %85'i olmalı ve WCAG AA kontrastını sağlamalı. Etiket "devamını oku" arkasına, dipnota veya yalnızca tooltip'e konamaz. Aynı etiket web, mobil, bülten, push ve Open Graph paylaşım başlığında da bulunur.
> - **Sponsorlu içerikte editör puanı, "Editörün seçimi", "En iyi", "Kazanan" rozeti kullanılamaz.** v1'deki "Sponsorlu ürün incelemesi" türünün adını "Sponsorlu tanıtım" yap. Bu tür, puanlama şablonunu kullanamaz.
> - Ücretsiz ürün veya konaklama alan editör ve yazarların içerikleri de `ucretsiz_urun_veya_davet` ile işaretlenir. Yayın formunda "Bu içerik için herhangi bir menfaat sağlandı mı?" sorusu zorunludur.
> - Etiket metinlerinin 01.08.2026 yönetmelik değişikliği ve Reklam Kurulu kılavuzlarıyla uyumu hukukçu tarafından doğrulanmalı. Metinler `compliance_config` üzerinden güncellenebilir tutulur.

### LEGAL-TR-05 — Tüketici değerlendirmeleri: 28/B kapsamı, satın alma doğrulaması ve yorumların reklamda kullanımı
- v1 bölüm: 8, 14  ·  tür: eksik  ·  öncelik: P0  ·  doğrulandı: hayır
- Gerekçe: Yönetmeliğin 28/B maddesi (2022) ile ilgili kurallar:
  - Değerlendirme imkânı sunan satıcı, sağlayıcı ve aracı hizmet sağlayıcılarda yalnızca satın alanların değerlendirme yapmasına izin veriliyor.
  - Değerlendirmeler olumlu/olumsuz ayrımı yapılmadan, en az bir yıl, objektif bir ölçüte göre yayınlanmalı.
  - Mevzuata aykırı sağlık beyanı içeren değerlendirmeler yayınlanamıyor.

  Reklam Kurulu'nun "Tüketici Değerlendirmeleri Hakkında Kılavuz"u (2023) manipülasyonu yasaklıyor, forum benzeri platformları ise kapsam dışı tutuyor. 01.08.2026 değişikliğine göre satın alma sürecinin doğrulanamadığı mecralardan alınan değerlendirmeler reklamlarda kullanılamıyor. Sahte yorum üretmek, satın almak veya yanıltıcı biçimde öne çıkarmak yasak. İncelemeler.com.tr'nin bu kapsamda "aracı hizmet sağlayıcı" mı yoksa bağımsız bir değerlendirme platformu mu sayılacağı belirsiz. Bu belirsizlik doğrudan ürün tasarımını etkiliyor.
- Kaynaklar: https://www.resmigazete.gov.tr/eskiler/2022/02/20220201-6.htm ; https://tuketici.ticaret.gov.tr/data/65089fd113b8769d9861719f/T%C3%BCketici%20De%C4%9Ferlendirmeleri%20Hakk%C4%B1nda%20K%C4%B1lavuz%20-%20kurul%20karar%C4%B1.pdf ; https://www.ozdagistanliekici.com/mevzuat-degisikligi-ticari-reklam-ve-haksiz-ticari-uygulamalar-yonetmeligi/ ; https://www.ulusal.com.tr/gundem/ticaret-bakanligi-tuketici-yorumlarina-iliskin-usul-ve-esaslari-yeniden-duzenledi-15103050
- Önerilen metin:

> **Kullanıcı değerlendirmeleri — uyum kuralları:**
> - Her değerlendirmede şu alanlar bulunur:
>   - `deneyim_turu` (satın aldım / konakladım / ziyaret ettim / hizmet aldım)
>   - `deneyim_tarihi` (ay/yıl)
>   - `dogrulama_durumu` (`beyan` | `belgeli` | `sağlayıcı_doğruladı`)
>   - `dogrulama_kanıtı` (fiş, fatura veya rezervasyon e-postası: yalnız moderatör görür; kişisel veriler maskelenir ve doğrulamadan sonra silinir)
> - Arayüzde yalnızca `belgeli` veya `sağlayıcı_doğruladı` kayıtlara "Doğrulanmış deneyim" rozeti verilir. `beyan` kayıtlar "Kullanıcı beyanı" olarak gösterilir. Ortalama puan iki türü ayrı ayrı veya filtrelenebilir şekilde gösterir.
> - **Gösterim sırası objektiftir:** varsayılan "en yeni". Kullanıcı tarih / puan / faydalı oy seçeneklerinden birini seçebilir. Olumsuz değerlendirmeler gizlenemez, aşağı itilemez. Sponsorluk ve işletme paketi sıralamayı etkileyemez. Bu kuralı otomatik testle doğrula.
> - Yayınlanmış değerlendirme yalnızca içerik politikası ihlali, hukuki talep, kullanıcı talebi veya mahkeme/idari karar gerekçesiyle kaldırılır. Her kaldırmanın gerekçe kodu ve denetim kaydı tutulur. İşletme talebiyle "beğenmedim" gerekçesine dayalı kaldırma yapılamaz.
> - Sağlık beyanı içeren değerlendirmeler moderasyona düşer (ör. "tedavi etti", "zayıflattı", tıbbi işlem sonucu). Bunun için anahtar kelime filtresi ve moderatör kontrol listesi kur.
> - **Kullanıcı değerlendirmeleri sponsorlu içeriklerde, işletme panelinden dışa aktarılan materyallerde ve reklam kreatiflerinde alıntılanamaz.** "Doğrulanmış deneyim" olanlar istisna olabilir; ancak bu ayrıca hukuki onaya tabidir. İşletme paneline "yorumları sitende kullan" widget'ı ekleme.
> - İşletmeler, çalışanları veya onlardan menfaat alanlar değerlendirme yazamaz. Teşvikli (indirim, hediye karşılığı) değerlendirme kabul edilmez.
> - Hukuki inceleme listesine yaz: "İncelemeler.com.tr, 28/B ve 28/C (şikâyet platformlarına 48 saat yanıt süresi) kapsamında mı? En az bir yıl yayın zorunluluğu kapsamda mı? Kapsamdaysa hesap silme sonrası değerlendirmelerin akıbeti ne olacak?" Karar gelene kadar en kısıtlayıcı yorumu uygulayan ayarları `compliance_config` içinde tut.

### LEGAL-TR-06 — KVKK işleme envanteri ve hukuki sebep eşlemesi; açık rızanın yanlış kullanımını önle
- v1 bölüm: 16, 18  ·  tür: belirsiz  ·  öncelik: P0  ·  doğrulandı: hayır
- Gerekçe: v1 "kişisel verilerin amaca uygun işlenmesi" diyor ama hangi işlemenin hangi hukuki sebebe dayandığını tanımlamıyor. KVKK m.5'te açık rıza tek sebep değil. Sözleşmenin ifası, hukuki yükümlülük ve meşru menfaat de sebeptir. Açık rıza hizmet şartına bağlanırsa geçersiz olur. Aydınlatma Tebliği ve Kurul'un 18.02.2026 tarih ve 2026/347 sayılı ilke kararı, aydınlatma ile açık rızanın ayrı ayrı yerine getirilmesini istiyor.
- Kaynaklar: https://www.lexpera.com.tr/mevzuat/kurul-kararlari/kisisel-verileri-koruma-kurulunun-18-02-2026-tarihli-ve-2026-347-sayili-karari-2026-347-1 ; https://www.alomaliye.com/2026/03/24/kvkkdan-yeni-ilke-karari-acik-riza-metni-ile-aydinlatma-metni-artik-ayri-duzenlenmeli/ ; https://resmigazete.gov.tr/eskiler/2018/03/20180310-5.htm
- Önerilen metin:

> **KVKK işleme envanteri (kod yazmadan önce `docs/legal/isleme-envanteri.md` olarak üret, hukukçu onayına sun):**
>
> | İşleme faaliyeti | Veri kategorileri | Önerilen hukuki sebep (doğrulanacak) | Saklama süresi | Aktarım (yurt içi/dışı) |
> |---|---|---|---|---|
> | Üyelik ve oturum | ad, e-posta, şifre özeti, cihaz | sözleşmenin ifası | hesap silinene kadar + yasal süre | barındırma |
> | Güvenlik ve trafik logları | IP, zaman damgası, user-agent | hukuki yükümlülük / meşru menfaat | 5651 için doğrulanacak süre | log servisi |
> | Değerlendirme yayını | takma ad, içerik, fotoğraf, deneyim tarihi | sözleşmenin ifası | yayın süresi | CDN |
> | Doğrulama kanıtı (fiş/rezervasyon) | fatura/rezervasyon bilgisi | açık rıza veya meşru menfaat (hukukçu kararı) | doğrulama + 30 gün | — |
> | Bülten / pazarlama e-postası | e-posta | 6563 onayı + İYS (LEGAL-TR-09) | ret + yasal süre | e-posta servisi |
> | Kişiselleştirme ve hedefli sponsorlu yerleşim | tercih, gezinme | **açık rıza** | rıza geri alınana kadar | — |
> | Analitik çerez/SDK | çerez kimliği, olaylar | **açık rıza** | rehberdeki ilkeye göre | analitik sağlayıcı |
> | Hassas konum ("yakınımda") | anlık konum | açık rıza / talep anında işleme | **sunucuda saklama yok** | harita sağlayıcı |
> | İşletme başvurusu ve doğrulama | yetkili kişi kimliği, vergi no, belgeler | sözleşme kurulması / hukuki yükümlülük | sözleşme + yasal süre | — |
> | Hukuki talep ve şikâyet kayıtları | başvuran bilgileri | hukuki yükümlülük | doğrulanacak | — |
>
> - Açık rıza **yalnızca** başka sebebin bulunmadığı işlemeler için istenir. Üyelik, yorum yapma veya uygulamayı kullanma şartına **bağlanmaz**. Rıza vermeyen kullanıcı temel hizmeti aynen kullanabilir. Bunu e2e testle doğrula.
> - Aydınlatma metni ve açık rıza metni **ayrı belgeler** ve **ayrı UI eylemleridir**. Aydınlatma metninin altına "okudum, rıza veriyorum" kutusu konmaz. Aydınlatma için "bilgilendirildim" beyanı veya bağlantı yeterlidir. Açık rıza her amaç için ayrı, önceden işaretlenmemiş bir onay kutusudur.
> - Her rıza ve aydınlatma gösterimi `ConsentRecords` tablosuna yazılır. Alanlar: `user_id|anon_id`, `amac`, `metin_versiyonu`, `kanal (web/ios/android)`, `durum (verildi/geri_alindi)`, `zaman`, `ip_hash`. Rıza, verildiği kadar kolay geri alınabilmelidir (ayarlar ekranında tek dokunuş).

### LEGAL-TR-07 — Yurt dışına aktarım: bulut, CDN, e-posta, analitik ve push sağlayıcıları için KVKK m.9 rejimi
- v1 bölüm: 2, 16, 18  ·  tür: eksik  ·  öncelik: P0  ·  doğrulandı: hayır
- Gerekçe: v1'in teknoloji setinde kişisel veri neredeyse kesin olarak yurt dışına çıkar. Örnekler: S3 uyumlu depolama, CI/CD, hata izleme, push (APNs/FCM), e-posta, harita ve analitik. 7499 s. Kanun'la değişen KVKK m.9 01.06.2024'te yürürlüğe girdi. Yeni rejimde aktarım yeterlilik kararına veya uygun güvencelere (özellikle standart sözleşme) dayanıyor. Açık rızaya dayalı düzenli aktarım 01.09.2024'ten sonra mümkün değil. Standart sözleşmeler değiştirilmeden kullanılmalı ve Kurum'a bildirilmeli. Bildirim yükümlülüğüne uyulmazsa idari para cezası uygulanır. Yönetmelik RG 10.07.2024/32598'de yayımlandı.
- Kaynaklar: https://www.erdem-erdem.av.tr/bilgi-bankasi/kisisel-verilerin-korunmasi-kanununda-neler-degisti ; https://www.cottgroup.com/en/legislation/item/standart-sozlesme-bildirim-yukumlulugu-ve-yaptirimlari ; https://www.erdem-erdem.av.tr/bilgi-bankasi/standart-sozlesme-bildirim-modulu-hakkinda-kamuoyu-duyurusu ; https://www.erdem-erdem.av.tr/bilgi-bankasi/yurt-disina-kisisel-veri-aktarimi-rehberi-neleri-duzenliyor
- Önerilen metin:

> **Veri işleyen ve aktarım envanteri (`docs/legal/aktarim-envanteri.md` + admin'de `ProcessorInventory` tablosu):**
> - Kullanılan her dış servis için şu alanları doldur: `servis`, `amaç`, `veri kategorileri`, `veri merkezi ülkesi`, `rol (veri işleyen/veri sorumlusu)`, `aktarım mekanizması (yeterlilik kararı / standart sözleşme / bağlayıcı şirket kuralları / arızi aktarım)`, `sözleşme tarihi`, `Kurum'a bildirim tarihi`, `sorumlu`.
> - Mekanizması "standart sözleşme" olan ve bildirimi yapılmamış bir servis **üretimde etkinleştirilemez**. Bunun için deploy checklist'e ve `ProcessorInventory` durum alanına kontrol ekle.
> - Standart sözleşmenin Kurum'a bildirim süresi (kanunda "imzadan itibaren beş iş günü" olarak bilinen süre) ve bildirim yöntemi (KEP/çevrim içi modül) resmî metinden doğrulanmalı. Bu süre `compliance_config.transfer_notification_days` olarak tutulur.
> - Mimari tercihler:
>   1. Birincil veritabanı ve nesne depolama için Türkiye'de veya hukukçunun onayladığı bölgede barındırma seçeneğini değerlendir ve kararı ADR olarak yaz.
>   2. Hata izleme ve loglarda kişisel veri maskeleme varsayılan açık olsun (e-posta, IP son oktet, telefon).
>   3. Analitik için önce kendi barındırdığın veya Türkiye'de/AB'de çalışan bir çözümü değerlendir.
>   4. Push bildirim içeriğine kişisel veri koyma.
> - Hiçbir servis için "GDPR uyumlu olduğu için KVKK uyumludur" varsayımı yapma. AB'de barındırma da KVKK m.9 kapsamında yurt dışı aktarımdır.

### LEGAL-TR-08 — Çerez ve izleme onayı: KVKK Çerez Rehberi'ne uygun CMP, ölçüm ve kabul testleri
- v1 bölüm: 5, 16, 18  ·  tür: belirsiz  ·  öncelik: P0  ·  doğrulandı: hayır
- Gerekçe: v1 yalnızca "Çerez tercih merkezi" diyor. KVKK'nın Çerez Uygulamaları Hakkında Rehberi (2022, 2025'te güncellendi) iki temel ilke koyuyor:
  - Zorunlu çerezler dışındaki çerezler yerleştirilmeden önce açık rıza alınmalı.
  - "Kabul ediyorum" türü genel ifadeler açık rıza sayılmaz.

  "Reddet" seçeneğinin "Kabul et" ile eşit görünürlükte olması ve önceden işaretli kutuların geçersizliği hukuk kaynaklarında rehberin yorumu olarak aktarılıyor. Bunlar resmî metinden doğrulanmalı. Sponsor raporlaması için gereken gösterim/tıklama ölçümü de bu çerçeveye oturtulmalı.
- Kaynaklar: https://kvkk.gov.tr/Icerik/7353/Cerez-Uygulamalari-Hakkinda-Rehber ; https://www.erdem-erdem.av.tr/bilgi-bankasi/kisisel-verileri-koruma-kurumu-cerez-uygulamalari-hakkinda-rehberi-guncelledi ; https://www.ffkpartnerhukuk.com.tr/sirketlerde-cerez-cookie-politikasi-nasil-hazirlanir-2026-guncel-rehber-kvkk-uyumlu-cerez-politikasi-hazirlama-rehberi/
- Önerilen metin:

> **Çerez/SDK onay yönetimi (web + mobil):**
> - Kategoriler: `zorunlu` (oturum, CSRF, yük dengeleme, onay tercihinin kendisi), `işlevsel`, `analitik`, `pazarlama/kişiselleştirme`. Yalnızca `zorunlu` olanlar onaysız yüklenir.
> - İlk ziyaret bandında üç eşit ağırlıklı buton olur: **"Tümünü kabul et"**, **"Tümünü reddet"**, **"Tercihleri yönet"**. Bunlar aynı boyut, aynı stil ve aynı katmanda yer alır. Kategoriler önceden işaretli gelmez. Bant içeriği engelleyen bir "cookie wall" olamaz.
> - Onay alınana kadar hiçbir analitik/pazarlama script'i, pikseli veya SDK'sı **yüklenmez**. Etiketleri "yükle ama veri gönderme" modunda çalıştırmak bunu karşılamaz.
> - Onay kaydı `ConsentRecords` tablosuna yazılır (kategori bazında, metin sürümüyle). Tercih merkezine footer'dan ve uygulama ayarlarından **tek tıkla** ulaşılır. Geri alma anında ilgili çerezler silinir.
> - **Sponsor ve affiliate ölçümü:** Kampanya gösterim/tıklama sayımları için birinci taraf, sunucu tarafı, çerezsiz ve kişisel veri içermeyen sayaç kullan (kampanya_id, yerleşim_id, zaman, toplulaştırılmış). Kullanıcı düzeyinde atıf/yeniden hedefleme yalnızca `pazarlama` onayıyla yapılır.
> - **Kabul testleri (Playwright):**
>   - (a) Temiz profilde ilk yüklemede yalnızca zorunlu çerezler bulunur ve üçüncü taraf analitik isteği gitmez.
>   - (b) "Tümünü reddet" sonrası 3 sayfa gezinmede de durum aynı kalır.
>   - (c) "Analitik" kabulünden sonra yalnızca analitik istekleri başlar.
>   - (d) Onay geri alındığında çerezler silinir.
> - "Reddet butonunun eşitliği", "cookie wall yasağı" ve onayın geçerlilik/yenileme süresi KVKK'nın güncel rehber metninden doğrulanmalı.

### LEGAL-TR-09 — Bülten, SMS ve push bildirimler: 6563 / ticari elektronik ileti / İYS akışı
- v1 bölüm: 5 (bülten), 6 (push), 11 (bildirim yönetimi)  ·  tür: eksik  ·  öncelik: P0  ·  doğrulandı: hayır
- Gerekçe: Ticari elektronik iletiler alıcının önceden onayı olmadan gönderilemez. Onaylar İYS'ye kaydedilmelidir. Tacir ve esnaf alıcılarda önceden onay aranmaz; ancak adresleri İYS'ye kaydedilir ve ret durumu İYS'den kontrol edilir. Hukuk kaynaklarında pazarlama amaçlı push bildirimlerin de "elektronik iletişim aracı" üzerinden gönderilen ticari ileti sayılabileceği belirtiliyor. v1 "fırsat ve sponsorlu içerik tercihleri" ile "bülten üyeliği" öngörüyor ama onay, İYS ve ret mekanizmasından söz etmiyor. İşletmelere yönelik satış e-postaları (B2B) da ayrı bir rejime tabi.
- Kaynaklar: https://cottgroup.com/tr/mevzuat/item/ileti-yonetim-sistemi-ve-yeni-uygulamalar ; https://sen.av.tr/tr/makale/mevzuat-kapsaminda-ticari-elektronik-iletiler ; https://www.alomaliye.com/2020/01/04/ticari-iletisim-ve-ticari-elektronik-iletiler/ ; https://hukukcularevi.com/ticari-elektronik-ileti-iys-izin-6563-reklam/
- Önerilen metin:

> **İleti sınıflandırması ve izin akışı:**
>
> | Tür | Örnek | Onay | İYS | Ret bağlantısı |
> |---|---|---|---|---|
> | İşlemsel / hizmet | şifre sıfırlama, OTP, yorum onaylandı, hesap silme teyidi | gerekmez | hayır | — |
> | Editoryal bildirim (ticari öğe yok) | takip edilen şehirde yeni rehber | uygulama içi tercih | hayır (hukukçu teyidi) | tercih ekranı |
> | Ticari (bireysel alıcı) | bülten, fırsat, sponsorlu içerik, kampanya push'u | **önceden açık onay** | **evet** (e-posta/SMS) | her iletide tek tık ret |
> | Ticari (tacir/esnaf alıcı) | işletmelere sponsorluk teklifi | önceden onay aranmaz | **İYS'ye kayıt + ret kontrolü** | her iletide ret |
>
> - İşlemsel e-posta veya push içine **sponsorlu/kampanya içeriği eklenmez**. Eklenirse ileti ticari sayılır.
> - Bülten kaydında çift aşamalı onay (double opt-in) uygula. Onay kaydında şu alanlar tutulur: `kanal`, `adres`, `onay_metni_versiyonu`, `kaynak (web form/app)`, `zaman`, `ip_hash`.
> - Gönderimden hemen önce İYS sorgusu ve senkronizasyonu yapılır. Bunun için entegratör API'si gerekir; hesap/marka kodu yoksa adaptörü mock'la ve `docs/setup` listesine ekle. Ret talebi geldiğinde gönderim listeleri **yasal süre içinde** güncellenir. Süre `compliance_config.iys_opt_out_days` alanında tutulur ve resmî metinden doğrulanmalı.
> - **Push için:** İşletim sistemi bildirim izni ≠ ticari ileti onayı. Uygulamada ayrı açma/kapama anahtarları olur: "Hizmet bildirimleri" (varsayılan açık) ve "Fırsatlar ve sponsorlu öneriler" (varsayılan **kapalı**, açık onay metniyle). Ticari push'lar yalnızca ikinci anahtar açıksa gönderilir ve başında "Reklam" ibaresi bulunur.
> - Push bildirimlerin İYS kapsamına girip girmediği ve onayın hangi formda alınacağı Ticaret Bakanlığı/İYS güncel duyurularından doğrulanmalı. Doğrulanamazsa hukuki inceleme listesine eklenir ve en kısıtlayıcı yorum (önceden onay) uygulanır.

### LEGAL-TR-10 — İlgili kişi başvuruları, hesap silme ve veri saklama/imha: tek, birbiriyle tutarlı akış
- v1 bölüm: 6, 12, 16  ·  tür: eksik  ·  öncelik: P0  ·  doğrulandı: kısmen (Apple/Google evet, KVKK hayır)
- Gerekçe: Bu konuda üç kaynak bağlayıcı:
  - **KVKK:** İlgili kişi başvuruları en geç otuz gün içinde ve kural olarak ücretsiz sonuçlandırılır. Yazılı yanıtta on sayfayı aşan her sayfa için ücret alınabilir. Başvuru KEP, kayıtlı e-posta veya uygulama üzerinden yapılabilir.
  - **Apple 5.1.1(v):** Hesap oluşturmayı destekleyen uygulamalar hesap silmeyi uygulama içinden sunmalıdır.
  - **Google Play:** Hem uygulama içi silme yolu hem de uygulamayı yeniden kurmadan kullanılabilecek bir web bağlantısı ister. Bu bağlantı Data safety formuna girilir. Yalnızca devre dışı bırakma yeterli değildir.

  v1 bunları birbirine bağlamıyor. Saklama/imha politikasıyla ve yasal saklama yükümlülükleriyle (log, fatura) olası çatışmaları da çözmüyor.
- Kaynaklar: https://developer.apple.com/app-store/review/guidelines/ ; https://support.google.com/googleplay/android-developer/answer/13327111 ; https://kvkk.gov.tr/SharedFolderServer/CMSFiles/353d85d5-87df-4c91-b08e-b4f0991a80f4.pdf ; https://www.kvkk.gov.tr/Icerik/5441/KISISEL-VERILERIN-SILINMESI-YOK-EDILMESI-VEYA-ANONIM-HALE-GETIRILMESI-HAKKINDA-YONETMELIK
- Önerilen metin:

> **Hesap silme (web + iOS + Android, aynı backend akışı):**
> - Erişim yolları:
>   - Profil → Ayarlar → "Hesabımı sil" (en fazla 3 adım).
>   - Herkese açık web sayfası `incelemeler.com.tr/hesap-silme`: giriş yapmadan da talep alır, e-posta doğrulamasıyla çalışır. Bu URL Google Play Data safety formuna girilir.
>   - Mağazaya yönlendiren veya "e-posta atın" diyen akış kabul edilmez.
> - Silme sonucu:
>   - Hesap, profil, favoriler, koleksiyonlar, tercihler, push token'ları, onay dışındaki pazarlama verileri **kalıcı olarak silinir**.
>   - Değerlendirmeler ve fotoğraflar için kullanıcıya seçim sunulur: "içeriklerimi de sil" (varsayılan) veya "anonim olarak kalsın". İkinci seçenek LEGAL-TR-05'teki hukuki karara bağlıdır.
>   - Yasal saklama gerektiren kayıtlar (ör. 5651 trafik logları, fatura/sözleşme kayıtları, hukuki talepler) **erişimi kısıtlanmış arşive** ayrılır ve süre sonunda imha edilir.
>   - Kullanıcıya silinen ve saklanan veri türleri ile saklama süreleri gösterilir.
> - Silme işlemi en fazla `compliance_config.account_deletion_days` gün içinde tamamlanır. Varsayılan değer 30 gündür ve KVKK başvuru süresiyle uyumludur. Kuyruktaki işler ve yedekler için imha planı belgelenir.
>
> **İlgili kişi başvuruları (`DataSubjectRequests`):**
> - Web formu + uygulama içi form + KEP/e-posta ile gelen başvuruların manuel kaydı.
> - Talep türleri: bilgi, erişim/kopya, düzeltme, silme, itiraz, zarar giderimi.
> - Kimlik doğrulaması: oturum veya kayıtlı e-posta. T.C. kimlik numarası gibi gereksiz veri **istenmez**; mevzuat zorunlu kılıyorsa hukukçu onayıyla eklenir.
> - SLA: başvuru anında 30 günlük sayaç başlar. 20. günde moderatöre, 27. günde yöneticiye uyarı gider. Yanıt şablonları ve gerekçeli ret seçeneği bulunur. Her adım denetim kaydına yazılır.
> - Admin raporu: açık/kapanan başvurular, ortalama süre, süre aşımı. **Kabul kriteri:** süresi geçen başvuru sayısı = 0 olmalıdır; aksi hâlde panelde kırmızı alarm görünür.
>
> **Saklama ve imha politikası:** Her veri kategorisi için azami süre, imha yöntemi (silme/anonimleştirme) ve periyodik imha görevi tanımlanır. Görev cron ile çalışır, imha kaydı tutar ve periyodik imha aralığı yönetmelikteki üst sınırı aşmaz. Üst sınır (bilinen değer: 6 ay) resmî metinden doğrulanmalı.

### LEGAL-TR-11 — Veri ihlali müdahale planı: 72 saat
- v1 bölüm: 16  ·  tür: eksik  ·  öncelik: P1  ·  doğrulandı: hayır
- Gerekçe: KVKK m.12/5'teki "en kısa sürede" ifadesi, Kurul'un 2019/10 sayılı kararıyla "ihlalin öğrenilmesinden itibaren en geç 72 saat" olarak yorumlandı. İlgili kişilere de makul sürede bildirim yapılması gerekiyor. v1'de olay müdahale süreci yok.
- Kaynaklar: https://www.alomaliye.com/2019/01/24/kvkk-karari-2019-10-kisisel-veri-ihlali-bildirim-usul-ve-esaslari/ ; https://cottgroup.com/tr/mevzuat/item/veri-sorumlulari-icin-kisisel-veri-ihlali-bildirim-proseduru
- Önerilen metin:

> **Kişisel veri ihlali runbook'u (`docs/security/ihlal-mudahale.md`) ve `BreachIncidents` tablosu:**
> - Alanlar: `tespit_zamani`, `ogrenilme_zamani`, `etkilenen_veri_kategorileri`, `etkilenen_kisi_sayisi_tahmini`, `kok_neden`, `alinan_onlemler`, `kurula_bildirim_zamani`, `ilgili_kisilere_bildirim_zamani`, `sorumlu`.
> - Öğrenilme anında 72 saatlik geri sayım başlar. Admin panelinde süre göstergesi ve 24/48/66. saatlerde eskalasyon uyarısı bulunur.
> - Hazır şablonlar: Kurul bildirim formu taslağı, kullanıcı bildirim e-postası, web duyurusu.
> - Ihlal, bildirim yapılmasa bile iç kayıt defterine işlenir.
> - Süre ve form içeriği Kurul'un güncel kararlarından doğrulanmalı (2019/10 ve asgari unsurlar için 2019/271).

### LEGAL-TR-12 — VERBİS ve veri sorumlusu kimliği: kayıt yükümlülüğü kontrolü
- v1 bölüm: 16  ·  tür: eksik  ·  öncelik: P1  ·  doğrulandı: hayır
- Gerekçe: Kurul'un 2023/1154 sayılı kararına göre yıllık çalışan sayısı 50'den az ve yıllık mali bilanço toplamı 100 milyon TL'den az olan, ana faaliyeti özel nitelikli veri işleme olmayan veri sorumluları VERBİS kaydından istisna. 2025/2393 sayılı karar, bilanço esasına göre defter tutmayanlarda yalnızca çalışan kriterinin uygulanacağını açıkladı. İstisna, aydınlatma, güvenlik ve imha gibi diğer yükümlülükleri kaldırmaz.
- Kaynaklar: https://www.erdem-erdem.av.tr/bilgi-bankasi/verbis-kayit-yukumlulugune-iliskin-istisna-kriteri-degistirildi ; https://www.erdem-erdem.av.tr/bilgi-bankasi/verbis-kayit-yukumlulugune-iliskin-yeni-istisnalarin-uygulama-esaslari-aciklandi
- Önerilen metin:

> - Veri sorumlusunun tüzel kişiliğini (unvan, MERSİS, adres, KEP, irtibat kişisi) `compliance_config.data_controller` içinde tanımla. Tüm aydınlatma metinleri bu kaynaktan beslenir.
> - VERBİS kaydının gerekip gerekmediği (çalışan sayısı, bilanço eşiği, ana faaliyetin özel nitelikli veri olup olmadığı) **şirket kurulduğunda ve her yıl** kontrol edilir. Sonuç hukuki inceleme listesine yazılır.
> - Kayıt gerekmese bile işleme envanteri, saklama-imha politikası ve aktarım envanteri hazırlanır ve güncel tutulur.
> - Eşikler resmî Kurul kararlarından doğrulanmadan koda veya dokümana kesin değer olarak yazılmaz.

### LEGAL-TR-13 — UGC için 5651 rolleri, bildirim-kaldırma iş akışı ve log saklama
- v1 bölüm: 5, 11, 14, 16  ·  tür: eksik  ·  öncelik: P0  ·  doğrulandı: hayır
- Gerekçe: Platform, editoryal içerikte "içerik sağlayıcı", kullanıcı yorum ve fotoğraflarında ise "yer sağlayıcı" konumundadır. Yer sağlayıcıların trafik bilgisini "bir yıldan az ve iki yıldan fazla olmamak üzere" saklama yükümlülüğü olduğu aktarılıyor. Ancak yönetmelikte farklı bir süre görülebiliyor, bu yüzden doğrulanmalı. Kişilik hakkı ihlali ve erişim engeli/içerik çıkarma kararlarının kısa sürelerde uygulanması gerekiyor. v1'de yalnızca "şikâyet ve içerik bildirim sayfası" var, hukuki talep sınıfı yok.
- Kaynaklar: https://medya.barobirlik.org.tr/barowebsite/uploads/17/cmkkanunlari/internet_ortaminda_yapilan_yayinlarin.pdf ; https://www.lexpera.com.tr/mevzuat/yonetmelikler/internet-ortaminda-yapilan-yayinlarin-duzenlenmesine-dair-usul-ve-esaslar-hakkinda-yonetmelik ; https://www.alomaliye.com/2023/04/01/bilgi-teknolojileri-ve-iletisim-kurulu-karari-2023-dk-id-119/
- Önerilen metin:

> **Bildirim ve kaldırma (`TakedownRequests`) — v1'deki "şikâyet" akışını şu sınıflara ayır:**
>
> | Sınıf | Kim başvurur | İlk işlem | Hedef süre (config) |
> |---|---|---|---|
> | Kullanıcı şikâyeti (politika ihlali) | herkes | moderasyon kuyruğu | 48 saat |
> | Kişilik hakkı / hakaret iddiası | ilgili kişi/işletme | içerik geçici gizlenir mi kararı + moderatör | 24 saat |
> | Telif/marka iddiası | hak sahibi | belge kontrolü + kaldırma/itiraz | 48 saat |
> | Resmî karar (mahkeme, BTK, Bakanlık, Reklam Kurulu) | resmî makam | **derhal uygula** + hukukçuya ilet | `compliance_config.official_order_hours` |
> | Bakanlık belgesiz ilan uyarısı | Kültür ve Turizm Bakanlığı | LEGAL-TR-03 | 24 saat |
>
> - Her talepte şunlar bulunur: başvuranın kimlik ve iletişim bilgisi, içerik URL'si, gerekçe, ek belge, karar, karar gerekçesi, itiraz hakkı ve sonucu. İçerik sahibine bildirim gider ve itiraz formu sunulur.
> - Kaldırma, içeriği **fiziksel olarak silmez**. İçerik `hukuki_saklama` durumuna alınır ve yalnızca yetkili rolün erişebildiği arşivde tutulur. Erişim engeli kararıyla kaldırılan içerik **tüm yüzeylerden** (web, mobil, arama indeksi, sitemap, CDN önbelleği, OG görselleri) çıkar.
> - Trafik bilgisi logları (IP, port, zaman, içerik kimliği, kullanıcı kimliği) değiştirilemez (append-only) ve erişimi kısıtlı bir depoda `compliance_config.traffic_log_retention_days` süresiyle tutulur. Değer 5651 ve ilgili yönetmelikten doğrulanmalı. Süre sonunda otomatik imha edilir.
> - Kullanıcı verisi resmî makamlara yalnızca yazılı resmî talep veya karar üzerine, hukukçu onayıyla verilir ve kaydedilir.
> - Platformun 5651 ve ilgili BTK düzenlemeleri kapsamında herhangi bir bildirim/kayıt yükümlülüğü olup olmadığı (yer sağlayıcı bildirimi, sosyal ağ sağlayıcı eşikleri) hukukçu tarafından doğrulanmalı. Sosyal ağ sağlayıcı yükümlülükleri yüksek trafik eşiklerine bağlıdır. Takip ve mesajlaşma gibi sosyal özellikler eklenirse bu konu yeniden değerlendirilmeli.

### LEGAL-TR-14 — Hakaret ve itibar riski: moderasyon politikası ve yorum kuralları
- v1 bölüm: 8, 14  ·  tür: eksik  ·  öncelik: P1  ·  doğrulandı: hayır
- Gerekçe: İşletme ve kişi hakkındaki olumsuz yorumlar hakaret ve kişilik hakkı ihlali iddialarına açıktır. Bu risk özellikle personelin adının anılması, suç isnadı ve doğrulanmamış iddialarda yüksektir. Moderasyon kuralları platformun hem sorumluluğunu hem de yorumların güvenilirliğini belirler. v1'de "olumsuz yorumların sponsor talebiyle silinmemesi" var ama "neyin yayınlanamayacağı" yok.
- Kaynaklar: — (genel hukuk ilkesi; ilgili TCK/TBK hükümleri hukukçu tarafından teyit edilmeli)
- Önerilen metin:

> **Topluluk ve değerlendirme kuralları (`/icerik-politikasi`) — moderasyon kontrol listesine çevir:**
> - Yayınlanmaz:
>   - (1) küfür, aşağılama, nefret söylemi
>   - (2) çalışan veya üçüncü kişilerin tam adı, fotoğrafı, telefonu, plakası
>   - (3) mahkeme kararı veya resmî belgeyle desteklenmeyen suç isnadı ("dolandırıcı", "hırsız")
>   - (4) sağlık beyanı ve teşhis
>   - (5) deneyime dayanmayan veya rakip işletmenin yazdığı içerik
>   - (6) yorumla ilgisiz reklam veya bağlantı
>   - (7) başkasına ait fotoğraf
> - Moderatör kullanıcı metnini **düzenlemez**. Yalnızca "onayla / reddet (gerekçe kodu) / kullanıcıdan düzeltme iste" seçenekleri vardır. Kişisel veri maskeleme istisnadır (ör. telefon numarası); bu durumda "moderatör tarafından kısaltıldı" notu düşülür.
> - İşletmeye **herkese açık yanıt hakkı** tanınır: doğrulanmış işletme hesabıyla, tek yanıt ve yanıt da moderasyondan geçer. İşletme yorum sahibinin kimliğini göremez.
> - Otomatik ön filtre: küfür listesi, telefon/e-posta/T.C. kimlik no/IBAN regex'leri, URL, tekrar eden metin (spam). Filtreye takılan içerik otomatik reddedilmez, insan moderasyonuna düşer.
> - Bu kurallar hukukçu tarafından gözden geçirilmeden "nihai" olarak yayınlanmaz.

### LEGAL-TR-15 — Kullanıcı fotoğrafları ve telif: FSEK'e uygun lisans, kişilik hakları ve kaldırma
- v1 bölüm: 3, 14  ·  tür: eksik  ·  öncelik: P1  ·  doğrulandı: hayır
- Gerekçe: v1 lisansı belirsiz görselleri yasaklıyor ama kullanıcıların yüklediği görsellerin lisansını, kişilerin yüz görüntülerini ve işletmelerin gönderdiği görsellerin hak zincirini tanımlamıyor. FSEK'te mali hak sözleşmeleri ve ruhsatların yazılı şekil şartına tabi olduğu biliniyor. Bu yüzden elektronik onay ile alınan lisansın geçerliliği hukukçuya sorulmalı.
- Kaynaklar: — (5846 s. FSEK ilgili maddeleri resmî metinden doğrulanmalı)
- Önerilen metin:

> - Yükleme ekranında zorunlu iki onay kutusu bulunur (önceden işaretlenmemiş):
>   - (a) "Bu fotoğrafı ben çektim veya yayınlama hakkına sahibim."
>   - (b) "İncelemeler'e bu fotoğrafı platformda ve platformun tanıtımında gösterme, boyutlandırma ve kırpma için münhasır olmayan, bedelsiz, hesabım silinene veya fotoğrafı kaldırana kadar süren bir kullanım izni veriyorum." Bu metnin FSEK'teki şekil şartına uygunluğu hukukçu tarafından doğrulanmalı.
> - Kullanıcı fotoğrafları sponsorlu içerikte veya reklam kreatifinde, kullanıcının ayrı ve açık izni olmadan kullanılmaz.
> - Yüklemede EXIF/GPS meta verileri **sunucuda silinir**.
> - Yüz içeren fotoğraflar için moderasyon kontrol listesi: tanınabilir üçüncü kişiler varsa reddet veya bulanıklaştır.
> - Her medya kaydında şu alanlar tutulur: `kaynak (kullanıcı/editör/işletme/stok/lisanslı ajans)`, `lisans_turu`, `lisans_belgesi`, `hak_sahibi`, `atif_metni`, `gecerlilik_bitis`. Lisans bitişi olan görseller süre dolunca otomatik yayından kalkar.
> - İşletmelerin yüklediği görseller için işletme sözleşmesinde hak garantisi ve tazmin maddesi bulunur. Bu madde hukukçu tarafından hazırlanır.

### LEGAL-TR-16 — Marka adları, logolar ve karşılaştırmalı içerik
- v1 bölüm: 3, 8, 13  ·  tür: eksik  ·  öncelik: P2  ·  doğrulandı: hayır
- Gerekçe: Ürün ve işletme incelemelerinde marka adlarının tanımlayıcı amaçla kullanılması olağandır. Ancak logo kullanımı, ortaklık izlenimi ve sponsorlu karşılaştırmalar marka hukuku ile karşılaştırmalı reklam kuralları açısından risklidir. Ayrıca "İncelemeler" jenerik bir kelime olduğu için kendi marka tescil edilebilirliği de belirsizdir.
- Kaynaklar: — (6769 s. SMK ve Ticari Reklam Yönetmeliği'ndeki karşılaştırmalı reklam hükümleri hukukçu tarafından doğrulanmalı)
- Önerilen metin:

> - Üçüncü taraf marka **adları** yalnızca ürün/işletmeyi tanımlamak için kullanılır. **Logolar** yalnızca marka sahibinin izni, basın kiti lisansı veya sponsorluk sözleşmesi varsa kullanılır. `MediaAssets.lisans_turu = marka_izni` olarak işaretlenir.
> - Platformun bir markayla resmî ortaklığı yoksa "resmî", "yetkili", "onaylı" ifadeleri kullanılmaz.
> - **Sponsorlu** karşılaştırma içeriği (sponsor ürünü rakiplerle karşılaştırılıyorsa) yayından önce hukuki onay kuyruğuna düşer. Karşılaştırmalı reklam kuralları uygulanır: objektif, ölçülebilir, aynı ihtiyaca yönelik ürünler, kötüleme yok. Editoryal karşılaştırmalarda kaynak ve test yöntemi gösterilir.
> - Footer'da şu not yer alır: "Sitede geçen marka ve logolar ilgili hak sahiplerine aittir."
> - "İncelemeler" ve logonun TÜRKPATENT'te tescil edilebilirliği ile benzer marka araştırması lansmandan önce yapılmalı ve hukuki inceleme listesine eklenmeli.

### LEGAL-TR-17 — Hedefli ve kişiselleştirilmiş sponsorlu yerleşimler: "Bu reklamı neden görüyorum?"
- v1 bölüm: 9, 18, 19 (Faz 4 kişiselleştirme)  ·  tür: eksik  ·  öncelik: P1  ·  doğrulandı: hayır
- Gerekçe: 01.08.2026 yönetmelik değişikliği hedefli reklamcılığı tanımlıyor. Aktarılan Bakanlık açıklamasına göre hedefli reklam, reklamın hangi kriterlerle gösterildiği ve bu kriterlerin nasıl değiştirilebileceği açık ve kolay erişilebilir biçimde sunulursa yapılabiliyor. v1 kampanyaları şehir ve kategoriye göre hedefliyor, Faz 4'te kişiselleştirme planlıyor.
- Kaynaklar: https://www.gzt.com/gundem/sosyal-medyada-reklam-yazmak-zorunlu-mu-4245635 ; https://www.cottgroup.com/tr/mevzuat/item/ticari-reklam-ve-haksiz-ticari-uygulamalar-yonetmeliginde-degisiklik-yapildi ; https://blog.reklamstore.com/1-agustos-2026da-yururluge-giren-reklam-yonetmeligi-degisiklikleri-markalar-icin-uygulama-rehberi/
- Önerilen metin:

> - Her sponsorlu yerleşimin "Reklam" etiketinin yanında **"Neden görüyorum?"** bağlantısı bulunur. Açılan panelde şunlar yer alır: reklamveren adı; hedefleme kriterleri ("İstanbul'da restoran kategorisinde gezindiğiniz için", "Kampanya hedefi: Antalya"); kişiselleştirme ayarına bağlantı.
> - Hedefleme iki düzeye ayrılır:
>   - (a) **Bağlamsal** (sayfanın şehri/kategorisi): kişisel veri kullanmaz, onaysız çalışır.
>   - (b) **Davranışsal/kişisel** (geçmiş, favoriler, konum): yalnızca `pazarlama/kişiselleştirme` açık rızası varsa çalışır.
> - Kullanıcı ayarlarında "Kişiselleştirilmiş reklam ve öneriler" anahtarı bulunur. Kapatıldığında yalnızca bağlamsal yerleşim yapılır.
> - Hassas çıkarımlara (sağlık, din, siyasi görüş vb.) dayalı hedefleme **yasaktır** ve kampanya formunda bu seçenekler bulunmaz.
> - Panel metni ve hedefli reklam yükümlülüklerinin kapsamı, 01.07.2026 tarihli RG 33297 yönetmelik metninden doğrulanmalı.

### LEGAL-TR-18 — Yapay zekâ ile üretilmiş içerik ve görsellerin açıklanması
- v1 bölüm: 14, 19  ·  tür: eksik  ·  öncelik: P1  ·  doğrulandı: hayır
- Gerekçe: Aktarılan 2026 değişikliğine göre yapay zekâ ile oluşturulan ve insandan ayırt edilemeyen dijital karakterlerin reklamlarda açıkça belirtilmesi zorunlu. v1 yapay zekâ yardımlı içerik üretimine izin veriyor ama açıklama kuralı koymuyor. Gerçek mekân sanılabilecek yapay görseller de tüketiciyi yanıltma riski taşıyor.
- Kaynaklar: https://www.ozdagistanliekici.com/mevzuat-degisikligi-ticari-reklam-ve-haksiz-ticari-uygulamalar-yonetmeligi/ ; https://www.milliyet.com.tr/7616011
- Önerilen metin:

> - `ContentItems` ve `MediaAssets` tablolarına `ai_kullanimi` alanı ekle: `yok | metin_yardimi | gorsel_uretildi | gorsel_duzenlendi | sentetik_karakter`.
> - `gorsel_uretildi`, `gorsel_duzenlendi` ve `sentetik_karakter` değerlerinde görselin üzerinde veya hemen altında "Yapay zekâ ile oluşturulmuştur/düzenlenmiştir" ibaresi zorunlu olarak basılır.
> - **Mekân, otel, restoran, ürün ve destinasyon sayfalarında yapay üretilmiş görsel, gerçek fotoğraf yerine kullanılamaz.** Yalnızca açıkça işaretlenmiş illüstrasyon olarak kullanılabilir.
> - Sponsorlu içerikte sentetik insan/karakter kullanımı reklam etiketi + AI ibaresi + hukuki onay gerektirir.
> - Yayın akışında `ai_kullanimi != yok` olan metinler insan editör onayı olmadan yayınlanamaz. Bu, v1'in "doğrulanmamış bilgiyi otomatik yayınlama" kuralının kod karşılığıdır.

### LEGAL-TR-19 — Kampanya, fırsat ve indirim gösterimleri: indirim reklamı kuralları ve çekilişler
- v1 bölüm: 5 (sezonluk fırsatlar), 9, 10  ·  tür: eksik  ·  öncelik: P1  ·  doğrulandı: hayır
- Gerekçe: Bu alanda iki konu öne çıkıyor:
  - **İndirim gösterimi:** İndirimli satış reklamlarında "önceki fiyat"ın belirli bir referans dönemdeki en düşük fiyat olması gerekiyor. Haberlere göre bu süre 01.08.2026 değişikliğiyle 30 günden 10 güne indirildi, hizmetler de kapsama alındı. Kaynaklar çelişkili olduğu için doğrulanmalı.
  - **Çekilişler:** Sosyal medya ve kampanya çekilişleri Milli Piyango İdaresi izni gerektirebiliyor.

  v1 "fırsatlar", "kampanya ve fırsat sayfası" ve "markalara özel fırsatlar" öngörüyor.
- Kaynaklar: https://www.alomaliye.com/2026/09/02/indirimli-satislarda-yeni-donem/ ; https://www.ticimax.com/blog/indirimli-satis-reklamlari-yeni-kurallar ; https://www.ensonhaber.com/gundem/milli-piyangodan-izinsiz-cekilis-yapan-16-fenomene-sorusturma ; https://oner.av.tr/cekilis-dolandiriciligi/
- Önerilen metin:

> - `Offers` varlığında indirim gösterilecekse şu alanlar zorunludur: `onceki_fiyat`, `onceki_fiyat_kaynagi`, `onceki_fiyat_donemi_baslangic/bitis`, `indirimli_fiyat`, `gecerlilik_baslangic/bitis`, `kosullar (şartlı kampanya metni)`, `reklamveren_beyan_belgesi`.
> - Bu alanlar eksikse arayüz yüzde indirim veya üstü çizili fiyat **göstermez**. Yalnızca "Kampanya" ve koşul metnini gösterir.
> - Referans dönem uzunluğu kodda sabit yazılmaz: `compliance_config.discount_reference_days`. Değer 01.08.2026 yönetmelik değişikliğinden doğrulanmalı. İspat yükü reklamverene aittir; işletme panelinde beyan ve belge yükleme zorunlu olur.
> - Süresi biten fırsat otomatik olarak yayından kalkar (cron) ve "sona erdi" olarak gösterilir. Önbellek ve sitemap de güncellenir.
> - **Çekiliş, hediye ve yarışma özellikleri ilk fazlarda yapılmaz.** Eklenecekse Milli Piyango İdaresi izni, katılım koşulları ve KVKK metinleri hukuki onaydan geçmeden `feature_flag=giveaways` açılamaz.

### LEGAL-TR-20 — Sponsorluğa ve tanıtıma kapalı veya kısıtlı kategoriler (sağlık, alkol, tütün, bahis, falcılık, finans)
- v1 bölüm: 4-J, 9, 15  ·  tür: eksik  ·  öncelik: P0  ·  doğrulandı: hayır
- Gerekçe: v1 yüksek güven gerektiren kategorileri yalnızca "ayrı değerlendir" diye geçiyor. Oysa somut tanıtım kısıtları var:
  - Sağlık hizmetlerinde talep yaratan tanıtım yasak. Güzellik ve estetik merkezleri bu sınırda kalıyor.
  - Alkollü içkilerin reklamı ve tanıtımı yasak. Tarım ve Orman Bakanlığı duyurusuna göre 4250 s. Kanun m.6/1, 7584 s. Kanun ile yeniden düzenlendi (RG 20.06.2026).
  - Falcı, medyum ve astrolog reklamları ile yasa dışı bahis reklamlarına ilişkin yasak 2026 değişikliğiyle genişletildi.

  v1'deki "Güzellik merkezleri", restoran ve bar tanıtımları ile etkinlik sponsorlukları doğrudan bu alana giriyor.
- Kaynaklar: https://www.tarimorman.gov.tr/TADAB/Duyuru/280/Alkollu-Icki-Reklamlarina-Iliskin-Mevzuatta-Yapilan-Degisiklik-Hakkinda-Duyuru ; https://www.hukukihaber.net/sosyal-medya-ortaminda-estetik-amacli-saglik-hizmetlerinin-dijital-tanitimi-ve-hukuki-sinirlari ; https://kadimhukuk.com.tr/makale/saglikta-reklam-yasagi-cezalari/ ; https://www.ozdagistanliekici.com/mevzuat-degisikligi-ticari-reklam-ve-haksiz-ticari-uygulamalar-yonetmeligi/
- Önerilen metin:

> **Kategori bazlı ticari kısıt matrisi (`CategoryAttributes.ticari_kisit`), admin'den yönetilir ama varsayılanları şunlardır:**
>
> | Kategori/konu | Editoryal içerik | Kullanıcı yorumu | Sponsorlu içerik / öne çıkarma | Affiliate |
> |---|---|---|---|---|
> | Sağlık kuruluşları, klinik, estetik (tıbbi işlem) | yalnızca bilgilendirici, uzman kontrolü | sağlık beyanı filtresi | **kapalı** (hukuki onay olmadan açılamaz) | kapalı |
> | Güzellik merkezi (tıbbi olmayan) | serbest | serbest + sağlık beyanı filtresi | hukuki onay | hukuki onay |
> | Alkollü içki markaları / alkol kampanyaları | marka tanıtımı yok | serbest | **kapalı** | kapalı |
> | Bar, meyhane gibi alkol servisli mekânlar | mekân bilgisi serbest | serbest | açılabilir; ancak kreatifte alkol ürünü/markası/fiyatı/kampanyası **olamaz** (kreatif kontrol listesi) | hukuki onay |
> | Tütün, nargile | marka tanıtımı yok | serbest | **kapalı** | kapalı |
> | Bahis, şans oyunları, falcılık, medyum | — | — | **kapalı** | kapalı |
> | Finansal ürünler, kripto | yalnızca genel bilgi | serbest | **kapalı** | kapalı |
> | İlaç, takviye | — | sağlık beyanı filtresi | **kapalı** | kapalı |
>
> - Kampanya oluşturulurken sponsor kategorisi ve kreatif bu matrise karşı **sunucu tarafında** kontrol edilir. Kapalı kombinasyon kaydedilemez.
> - Sponsorlu kreatiflerde görsel kontrol listesi bulunur: alkol şişesi, markası, kadeh kampanyası; "tedavi eder", "garantili sonuç" ifadeleri.
> - Matristeki her satırın dayanağı (4250 s. Kanun m.6 son hâli, sağlık tanıtım yönetmeliği, tütün mevzuatı, reklam yönetmeliği) hukukçu tarafından doğrulanmalı. Doğrulanana kadar en kısıtlayıcı değer geçerlidir.

### LEGAL-TR-21 — Platform künyesi ve hizmet sağlayıcı bilgileri (6563, 5651, ETBİS)
- v1 bölüm: 5 (footer, hakkımızda, iletişim)  ·  tür: eksik  ·  öncelik: P1  ·  doğrulandı: hayır
- Gerekçe: Elektronik ticaret mevzuatı hizmet sağlayıcıya tanıtıcı bilgileri erişilebilir tutma yükümlülüğü getiriyor. 5651'de ticari amaçlı içerik ve yer sağlayıcılar için de benzer bir yükümlülük olduğu biliniyor. Online satış (sponsorluk paketi, self-servis reklam) başladığında ETBİS kaydı gündeme gelebilir. ETBİS kapsamı kendi e-ticaret ortamındaki hizmet sağlayıcıları ve aracı hizmet sağlayıcıları içeriyor. Apple 1.2 de UGC uygulamalarında yayımlanmış iletişim bilgisi istiyor.
- Kaynaklar: https://ticaret.gov.tr/duyurular/elektronik-ticaret-bilgi-sistemine-etbis-kayit-ve-bildirim-esaslari ; https://www.parasut.com/blog/elektronik-ticaret-sitelerinin-etbise-kayit-zorunlulugu ; https://developer.apple.com/app-store/review/guidelines/
- Önerilen metin:

> - `/kunye` sayfası ve footer/uygulama "Hakkında" ekranı `compliance_config.data_controller` kaynağından beslenir. Gösterilecek bilgiler: ticaret unvanı, MERSİS no, vergi dairesi/no, adres, telefon, e-posta, KEP adresi, sorumlu müdür/yayın sorumlusu (gerekiyorsa), ETBİS kayıt bilgisi (gerekiyorsa), şikâyet ve hukuki talep iletişim kanalı.
> - Bu alanlar boşsa üretim build'i **başarısız olur** (CI kontrolü). Örnek veriyle üretime çıkılamaz.
> - Hukuki inceleme listesine yaz: "Self-servis reklam veya paket satışı başladığında ETBİS kaydı ve 6563 kapsamındaki bilgi verme yükümlülükleri gerekiyor mu?"

### LEGAL-TR-22 — Sponsorluk ve paket satışı: ödeme kuruluşu, e-Fatura/e-Arşiv ve reklamveren sözleşmesi
- v1 bölüm: 9 (sponsor işletme paneli: "kampanya satın alabilmesi", "ödeme ve fatura bilgileri"), 15  ·  tür: eksik  ·  öncelik: P1  ·  doğrulandı: hayır
- Gerekçe: Self-servis kampanya satın alma, kart bilgisinin işlenmesini (PCI DSS kapsamı), lisanslı bir ödeme kuruluşuyla çalışmayı (6493 / TCMB), e-Fatura veya e-Arşiv fatura düzenlemeyi ve B2B reklamveren sözleşmesini gerektirir. v1 bunları "ödeme ve fatura bilgileri" diye tek satırda geçiyor.
- Kaynaklar: https://tcmb.gov.tr/wps/wcm/connect/TR/TCMB+TR/Main+Menu/Temel+Faaliyetler/Odeme+Hizmetleri/Odeme+Kuruluslari
- Önerilen metin:

> - Kart verisi platform sunucularına **asla** ulaşmaz. Ödeme, TCMB listesindeki lisanslı bir ödeme kuruluşunun barındırılan ödeme sayfası veya tokenizasyonuyla alınır. Sağlayıcı seçimi ADR ile belgelenir. Hesap yoksa ödeme adaptörü mock'lanır ve "üretimde kapalı" olarak işaretlenir.
> - Platform yalnızca **kendi hizmet bedelini** (sponsorluk/paket) tahsil eder. Başka bir işletme adına para toplamaz (bkz. LEGAL-TR-01).
> - Fatura: e-Fatura veya e-Arşiv entegratörü (GİB onaylı özel entegratör) için `InvoicingAdapter` arayüzünü kur. Mükellefiyet türü ve eşikler mali müşavirle doğrulanır; değerler koda yazılmaz. Reklamveren kaydında şu alanlar zorunludur: `unvan`, `vergi_no/TCKN`, `vergi_dairesi`, `fatura_adresi`, `e_fatura_mukellefi_mi`, `KEP`.
> - Kampanya satın almadan önce reklamveren şunları elektronik olarak onaylar ve sürüm kaydı tutulur:
>   - Reklamveren Sözleşmesi
>   - Sponsorlu İçerik Politikası (etiketleme, editoryal bağımsızlık, iade/iptal koşulları, içerik onayı, yasaklı kategoriler)
> - Muhasebe kayıtları ve faturalar yasal saklama süresince (VUK/TTK; süreler mali müşavirle doğrulanır) hesap silinse bile kısıtlı arşivde tutulur.

### LEGAL-TR-23 — Mobil uygulamada sponsorluk satın alma: Apple 3.1.3(g) ve IAP riski
- v1 bölüm: 9, 19 (Faz 3)  ·  tür: risk  ·  öncelik: P1  ·  doğrulandı: evet
- Gerekçe: Apple 3.1.3(g)'ye göre yalnızca farklı mecralardaki kampanyaları yöneten reklam yönetimi uygulamaları IAP'den muaf. Uygulamanın kendi içinde gösterilecek reklamların satışı ("boost" benzeri) in-app purchase kullanmak zorunda. v1'in işletme panelindeki "kampanya satın alabilmesi" mobil uygulamaya taşınırsa ya IAP gerekir ya da red riski doğar.
- Kaynaklar: https://developer.apple.com/app-store/review/guidelines/
- Önerilen metin:

> - Sponsorluk, öne çıkarma ve işletme paketi satın alma akışları **yalnızca web'deki işletme panelinde** bulunur. iOS ve Android tüketici uygulamasında satın alma butonu, fiyat listesi veya ödeme sayfasına yönlendiren CTA **olmaz**.
> - Mobil uygulamada işletme sahipleri yalnızca profil bilgilerini görür veya düzenler. Bu da isteğe bağlıdır.
> - Gelecekte mobilde işletme paneli istenirse App Store Review Guidelines 3.1.1 ve 3.1.3 ile Google Play ödeme politikası güncel metinleriyle yeniden değerlendirilir ve karar ADR olarak yazılır.

### LEGAL-TR-24 — App Store / Google Play: UGC, giriş seçenekleri, gizlilik beyanları, izinler
- v1 bölüm: 6  ·  tür: kabul_kriteri  ·  öncelik: P0  ·  doğrulandı: evet
- Gerekçe: Mağaza kuralları şunları istiyor:
  - **Apple 1.2:** UGC uygulamalarında sakıncalı içerik filtresi, içerik bildirme mekanizması ve zamanında yanıt, kötüye kullanan kullanıcıyı engelleme ve yayımlanmış iletişim bilgisi.
  - **Apple 4.8:** Üçüncü taraf sosyal giriş kullanılıyorsa, veri toplamayı ad ve e-postayla sınırlayan, e-postayı gizli tutmaya izin veren ve onaysız reklam takibi yapmayan eşdeğer bir giriş seçeneği sunulmalı.
  - **Apple 5.1.2(i):** İzleme için ATT izni gerekiyor. Push, konum veya izleme izni uygulamayı kullanma şartı yapılamaz.
  - **Google Play UGC politikası:** Kullanım koşullarının UGC'den önce kabul edilmesi, uygulama içi içerik/kullanıcı bildirme ve engelleme, zamanında aksiyon.
- Kaynaklar: https://developer.apple.com/app-store/review/guidelines/ ; https://support.google.com/googleplay/android-developer/answer/9876937 ; https://support.google.com/googleplay/android-developer/answer/13327111
- Önerilen metin:

> **Mağaza uyum kabul kriterleri (Faz 2 çıkış kapısı):**
> - [ ] Kullanıcı yorum, fotoğraf veya koleksiyon paylaşmadan önce Kullanım Koşulları ve Topluluk Kuralları'nı kabul eder. Kabul sürümüyle `ConsentRecords` tablosuna yazılır.
> - [ ] Her yorum, fotoğraf, koleksiyon ve kullanıcı profilinde **uygulama içi** "Bildir" eylemi bulunur. Bildirim moderasyon kuyruğuna 1 dakika içinde düşer. Hedef ilk yanıt süresi `compliance_config.report_first_response_hours`, varsayılan 24 saattir.
> - [ ] Kullanıcı başka bir kullanıcıyı **engelleyebilir**. Engellenen kullanıcının içerikleri engelleyen kullanıcıya gösterilmez. Moderatör de hesabı askıya alabilir veya yasaklayabilir.
> - [ ] Yayından önce otomatik filtre (küfür, kişisel veri, spam) çalışır (LEGAL-TR-14).
> - [ ] Uygulama içinde ve mağaza sayfasında iletişim e-postası ve künye bağlantısı bulunur.
> - [ ] Google ile giriş sunuluyorsa **Sign in with Apple** (veya 4.8 kriterlerini karşılayan eşdeğeri) iOS'ta aynı ekranda sunulur. E-posta+şifre veya e-posta bağlantısı ile kendi hesap sistemi de sunulur.
> - [ ] Uygulama içi hesap silme ve web silme bağlantısı hazırdır (LEGAL-TR-10).
> - [ ] Konum, push ve izleme izinleri **bağlam içinde** ve isteğe bağlı istenir. Reddedildiğinde uygulama çalışmaya devam eder. Bunun için "izin reddedildi" senaryoları e2e test edilir.
> - [ ] Üçüncü taraf takip SDK'sı (reklam ağı, atıf SDK'sı) varsa ATT istemi, ATT reddinde ilgili SDK devre dışı kalır. Yoksa ATT istenmez ve App Privacy beyanında "Tracking: No" doğru şekilde işaretlenir.
> - [ ] Apple App Privacy beyanı, gerekli privacy manifest dosyaları ve Google Play Data safety formu, **aktarım envanteri ve SDK listesinden otomatik üretilen** bir tabloyla tutarlıdır. Uyumsuzluk CI'da raporlanır.
> - [ ] Uygulama, kurumsal hesap (tüzel kişi) adına yayınlanır. Bireysel geliştirici hesabı kullanılmaz.
> - [ ] Yaş derecelendirmesi anketleri UGC ve sponsorlu içerik varlığına göre doldurulur.

### LEGAL-TR-25 — Erişilebilirlik: 2025/10 sayılı Cumhurbaşkanlığı Genelgesi ve WCAG 2.2
- v1 bölüm: 17  ·  tür: belirsiz  ·  öncelik: P1  ·  doğrulandı: hayır
- Gerekçe: 2025/10 sayılı Genelge (RG 21.06.2025) kamu kurumlarını, bankaları, özel hastaneleri, elektronik haberleşme işletmecilerini ve 6563 kapsamında elektronik ticaret yapan hizmet sağlayıcıları kapsıyor. Bu kuruluşların web ve mobil uygulamalarının erişilebilirlik kontrol listesi ve WCAG 2.2 ile uyumlu olmasını istiyor. Aktarılan süreler genel kapsam için 1 yıl, e-ticaret için 2 yıl. v1 erişilebilirliği ölçütsüz bırakıyor.
- Kaynaklar: https://www.alomaliye.com/2025/06/21/web-siteleri-ve-mobil-uygulamalarin-erisilebilirligi-2025-10/ ; https://webrazzi.com/2025/06/30/web-siteleri-ve-uygulamalar-icin-erisilebilirlik-zorunlulugu-geliyor/ ; https://assets.kpmg.com/content/dam/kpmgsites/tr/pdf/2026/05/Web%20Siteleri%20ve%20Mobil%20Uygulamalar%C4%B1n%20Eri%C5%9Filebilirli%C4%9Fi.pdf
- Önerilen metin:

> - Hedef: web ve mobilde **WCAG 2.2 AA**. Bu hedef Genelge'nin istediği seviyenin üzerindedir; seviye ve süreler Genelge metni ile Aile ve Sosyal Hizmetler Bakanlığı'nın yayımladığı kontrol listesinden doğrulanmalı.
> - CI'da otomatik erişilebilirlik testi çalışır (axe-core ile ana sayfa, kategori, arama, detay, yorum formu, çerez bandı, hesap silme). Yeni **ciddi/kritik** ihlal varsa build başarısız olur.
> - Çerez bandı, onay kutuları, "Reklam" etiketleri ve "Neden görüyorum?" paneli ekran okuyucuda okunur. Etiketin `aria-label` değeri görünür metinle aynıdır.
> - Platformun Genelge kapsamına (6563 e-ticaret hizmet sağlayıcısı) girip girmediği ve uyum son tarihi hukuki inceleme listesine eklenir. Erişilebilirlik beyanı sayfası (`/erisilebilirlik`) hazırlanır.

### LEGAL-TR-26 — Konum verisi ve "yakınımdaki mekânlar": veri minimizasyonu
- v1 bölüm: 5 (madde 4), 6, 16  ·  tür: kabul_kriteri  ·  öncelik: P1  ·  doğrulandı: kısmen (Apple evet)
- Gerekçe: v1 konumu "isteğe bağlı" tutuyor ama saklama, hassasiyet ve analitikte kullanım kurallarını tanımlamıyor. Hassas konum geçmişi KVKK ve mağaza beyanları açısından yüksek riskli bir veri. Apple 5.1.2(i), konum izninin uygulamayı kullanma şartı yapılamayacağını söylüyor.
- Kaynaklar: https://developer.apple.com/app-store/review/guidelines/
- Önerilen metin:

> - Hassas konum yalnızca "yakınımda" araması anında, istemciden sorgu parametresi olarak gönderilir. Sunucu bunu **loglamaz ve saklamaz**. Analitik olaylarına en fazla il/ilçe düzeyinde yuvarlanmış konum yazılır, o da analitik onayı varsa.
> - Arka plan konum izni **istenmez**.
> - İzin reddedilirse kullanıcı şehir/ilçe seçerek aynı özelliği kullanır.
> - Konum verisi aydınlatma metninde ayrı işleme faaliyeti olarak yer alır (LEGAL-TR-06).
> - **Kabul testi:** API ve uygulama loglarında enlem/boylam alanı bulunmadığı otomatik log taramasıyla doğrulanır.

### LEGAL-TR-27 — Yaş sınırı ve küçük kullanıcılar
- v1 bölüm: 6, 16  ·  tür: eksik  ·  öncelik: P1  ·  doğrulandı: hayır
- Gerekçe: Platformda değerlendirme yazma, işletme iletişimi, pazarlama izni ve alkol servisli mekân içerikleri bulunuyor. Küçüklerin hukuki işlem ehliyeti ve rıza geçerliliği konusunda Türk hukukunda özel değerlendirme gerekiyor. Mağaza yaş derecelendirmesi de UGC'den etkileniyor. v1 yaş politikası tanımlamıyor.
- Kaynaklar: — (TMK ehliyet hükümleri ve KVKK açısından rıza geçerliliği hukukçu tarafından doğrulanmalı)
- Önerilen metin:

> - Kayıt sırasında doğum yılı veya "18 yaşından büyüğüm" beyanı alınır. Hangi yöntemin seçileceği ve alt yaş sınırı hukukçu kararıyla `compliance_config.min_account_age` alanına yazılır. Karar gelene kadar hesap açma, yorum yazma, pazarlama onayı ve işletme hesabı için **18+** uygulanır. Misafir gezinme yaş beyanı istemez.
> - 18 yaş altı beyan eden kullanıcıya hesap açılmaz ve beyan verisi saklanmaz.
> - Alkol servisli mekân içeriklerinde yaşa göre filtreleme gerekip gerekmediği hukuki inceleme listesine eklenir.

### LEGAL-TR-28 — Hukuki metin seti, sürümleme ve "hukuki inceleme gerektiren alanlar" tablosu
- v1 bölüm: 16, 21  ·  tür: yapı  ·  öncelik: P0  ·  doğrulandı: hayır
- Gerekçe: v1 "hukuki inceleme gerektiren alanları açıkça listele" diyor ama listenin biçimini, sahibini ve ürün etkisini tanımlamıyor. Hukuki metinlerin sürümü değiştiğinde kullanıcı kabulünün nasıl yenileneceği de belirsiz. Bu bulgu, diğer tüm bulguların birleştiği çıktıyı tanımlıyor.
- Kaynaklar: Bu dosyadaki tüm kaynaklar.
- Önerilen metin:

> **`docs/legal/` çıktıları (her biri başlıkta "TASLAK — Hukukçu onayı olmadan yayına alınamaz" damgalı):**
> 1. Gizlilik politikası
> 2. Aydınlatma metinleri (işleme faaliyeti başına)
> 3. Açık rıza metinleri (amaç başına, ayrı)
> 4. Çerez politikası
> 5. Kullanım koşulları
> 6. Topluluk ve değerlendirme kuralları
> 7. Sponsorlu içerik ve affiliate açıklama politikası
> 8. İşletme sözleşmesi
> 9. Reklamveren sözleşmesi
> 10. Saklama ve imha politikası
> 11. İhlal müdahale planı
> 12. İlgili kişi başvuru formu ve prosedürü
> 13. Bildirim-kaldırma prosedürü
> 14. Künye
> 15. Erişilebilirlik beyanı
> 16. İşleme envanteri
> 17. Aktarım envanteri
>
> - Metinler `LegalDocumentVersions` tablosunda sürümlenir (`tur`, `versiyon`, `yururluk_tarihi`, `icerik_hash`, `onaylayan_hukukcu`, `onay_tarihi`). Yayındaki sürüm admin'den değiştirilir. Kullanım koşullarında esaslı değişiklik olursa kullanıcıdan bir sonraki girişte yeniden kabul alınır.
> - `onaylayan_hukukcu` boş olan bir metin üretimde yayınlanırsa sayfanın üstünde "taslak" uyarısı görünür ve deploy checklist'te kırmızı madde olarak durur.
>
> **Hukuki inceleme gerektiren alanlar (`docs/legal/hukuki-inceleme.md`), en az şu satırlarla başlat ve durum sütununu güncel tut:**
>
> | # | Alan | İlgili mevzuat / politika | Risk | Ürün etkisi | Kim onaylamalı | Durum |
> |---|---|---|---|---|---|---|
> | 1 | Platform içi rezervasyon/ödeme, tur satışı | 1618 s. Kanun, 6493 s. Kanun, 6563, paket tur ve mesafeli sözleşme mevzuatı | lisanssız faaliyet, idari para cezası | `in_platform_booking` kapalı | turizm + ödeme hukukçusu | açık |
> | 2 | Turist rehberi profilleri | 6326 s. Kanun, Turist Rehberliği Meslek Yönetmeliği (2024) | ruhsatsız rehberliğe aracılık | lisans kapısı, "yerel rehber" kaldırıldı | turizm hukukçusu | açık |
> | 3 | Konaklama ve kiralık konut kayıtları | 2634 s. Kanun, 7464 s. Kanun, KTB tebliği (RG 31.12.2025), 2026/4 Genelge | ilan başına yaptırım, 24 saatte kaldırma | belge no zorunlu, kaldırma SLA'sı | turizm hukukçusu | açık |
> | 4 | Tüketici değerlendirmeleri | 6502, Ticari Reklam Yön. 28/B–28/C (01.08.2026 değişikliği), Reklam Kurulu kılavuzu | haksız ticari uygulama | doğrulama rozeti, sıralama, yorumların reklamda kullanılmaması, silme sonrası akıbet | tüketici hukukçusu | açık |
> | 5 | Sponsorlu içerik ve affiliate etiketleri | 6502, Ticari Reklam Yön., etkileyici kılavuzu | örtülü reklam | sabit etiket sözlüğü | reklam hukukçusu | açık |
> | 6 | Hedefli reklam, yapay zekâ içerik | Ticari Reklam Yön. (RG 01.07.2026/33297) | şeffaflık ihlali | "Neden görüyorum?", AI ibaresi | reklam hukukçusu | açık |
> | 7 | İndirim ve fırsat gösterimi, çekiliş | Ticari Reklam Yön. (indirim hükümleri), MPİ mevzuatı | yanıltıcı indirim, izinsiz çekiliş | zorunlu fiyat alanları, `giveaways` kapalı | reklam hukukçusu | açık |
> | 8 | Kısıtlı kategoriler | 4250 s. Kanun m.6 (7584 s. Kanunla değişik), sağlık tanıtım mevzuatı, tütün mevzuatı | yasak reklam | ticari kısıt matrisi | reklam/sağlık hukukçusu | açık |
> | 9 | KVKK hukuki sebepler, aydınlatma/rıza | 6698 m.5, m.10, Aydınlatma Tebliği, Kurul 2026/347 ilke kararı | geçersiz rıza, idari para cezası | ayrı metinler, `ConsentRecords` | KVKK uzmanı | açık |
> | 10 | Yurt dışı aktarım | 6698 m.9 (7499 s. Kanunla değişik), Yurt Dışı Aktarım Yönetmeliği (RG 10.07.2024) | bildirimsiz aktarım | `ProcessorInventory` kapısı | KVKK uzmanı | açık |
> | 11 | Çerezler | KVKK Çerez Rehberi (güncel) | geçersiz rıza | CMP + testler | KVKK uzmanı | açık |
> | 12 | Ticari ileti, İYS, push | 6563, Ticari İletişim Yönetmeliği, İYS | izinsiz ileti cezası | ileti sınıflandırması, İYS adaptörü | e-ticaret hukukçusu | açık |
> | 13 | UGC, kaldırma, log saklama | 5651 ve yönetmelikleri | sorumluluk, erişim engeli | `TakedownRequests`, log saklama | bilişim hukukçusu | açık |
> | 14 | Hakaret ve kişilik hakları | TCK/TBK ilgili hükümler (doğrulanacak) | dava, tazminat | moderasyon kuralları | bilişim hukukçusu | açık |
> | 15 | Telif ve marka | 5846 FSEK, 6769 SMK | ihlal | lisans alanları, logo kuralı, marka tescili | FSEK/marka vekili | açık |
> | 16 | Ödeme ve fatura | 6493, VUK (e-Fatura/e-Arşiv) | lisans ve vergi ihlali | PSP adaptörü, `InvoicingAdapter` | mali müşavir + hukukçu | açık |
> | 17 | ETBİS, künye, bilgi verme | 6563 ve ikincil mevzuat | idari para cezası | `/kunye`, CI kontrolü | e-ticaret hukukçusu | açık |
> | 18 | Erişilebilirlik | 2025/10 Cumhurbaşkanlığı Genelgesi | uyumsuzluk | WCAG 2.2 AA, axe CI | erişilebilirlik uzmanı | açık |
> | 19 | Yaş sınırı | TMK, KVKK | geçersiz rıza | 18+ varsayılan | hukukçu | açık |
> | 20 | VERBİS | Kurul kararları 2023/1154, 2025/2393 | kayıt yükümlülüğü ihlali | yıllık kontrol | KVKK uzmanı | açık |
> | 21 | Mağaza politikaları | Apple 1.2, 3.1.3(g), 4.8, 5.1.1(v), 5.1.2; Google Play UGC, hesap silme, Data safety | red / kaldırılma | Faz 2 çıkış kapısı | ürün sahibi | açık |
>
> - Ajan, kendisinin hukuki onay veremeyeceğini kabul eder. "Kim onaylamalı" sütununu boş bırakmaz ve "Durum"u hiçbir zaman kendisi "onaylandı" yapmaz.

### LEGAL-TR-29 — Hukuki kapılar: feature flag ile zorlanan onay mekanizması
- v1 bölüm: 15, 19, 21, 22  ·  tür: yapı  ·  öncelik: P0  ·  doğrulandı: hayır
- Gerekçe: v1 "desteklenmeyen modeli tamamlanmış gibi gösterme" diyor ama bunun mekanizmasını tanımlamıyor. Mekanizma olmazsa ajan veya ileride bir geliştirici düzenlenmiş özellikleri açabilir. Kapıları kodda zorlamak, hukuki bulguların hepsini uygulanabilir ve test edilebilir yapar.
- Kaynaklar: Bu dosyadaki bulgular.
- Önerilen metin:

> **Hukuki kapı mekanizması:**
> - `LegalGates` tablosunu kur. Alanlar: `anahtar`, `aciklama`, `ilgili_inceleme_satiri`, `durum (kapali|onay_bekliyor|acik)`, `onaylayan`, `onay_belgesi`, `onay_tarihi`.
> - Varsayılan **kapalı** anahtarlar:
>   - `in_platform_booking`
>   - `payments_self_serve_ads`
>   - `giveaways`
>   - `health_sponsorship`
>   - `alcohol_venue_sponsorship`
>   - `review_quotes_in_ads`
>   - `personalized_ads`
>   - `ticari_push`
>   - `guide_listings` (doğrulama modülü hazır olana kadar)
>   - `short_term_rental_listings` (belge doğrulaması hazır olana kadar)
> - Kapı yalnızca `Süper yönetici` rolüyle ve onay belgesi yüklenerek açılır. Her değişiklik denetim kaydına yazılır.
> - Kapalı kapının arkasındaki API uç noktaları `403 LEGAL_GATE_CLOSED` döner. UI ise özelliği "henüz kullanılamıyor" olarak gösterir veya hiç göstermez.
> - **Kabul testleri:** her kapı için "kapalıyken uç nokta 403 döner" ve "kapalıyken UI'da CTA yok" testleri yazılır.

### LEGAL-TR-30 — İşletme doğrulaması (KYC) ve "doğrulanmış işletme" rozetinin anlamı
- v1 bölüm: 9, 19 (Faz 3 işletme doğrulama)  ·  tür: belirsiz  ·  öncelik: P1  ·  doğrulandı: hayır
- Gerekçe: v1 "işletme doğrulama süreci" diyor ama neyin doğrulandığını tanımlamıyor. "Doğrulanmış" rozeti tüketiciye kalite veya güvence vaadi gibi görünebilir ve yanıltıcı olabilir. Sektörel lisans alanları (LEGAL-TR-02, -03) bu modüle bağlanmalı.
- Kaynaklar: — (sektörel belge türleri ilgili mevzuattan doğrulanmalı)
- Önerilen metin:

> - `BusinessVerifications` kaydı şunları içerir:
>   - **Yetki doğrulaması:** başvuranın işletmeyi temsil yetkisi; vergi levhası, imza sirküleri veya yetki belgesi ile.
>   - **Kimlik:** unvan, vergi no, MERSİS.
>   - **Sektörel belge:** konaklama belge no, acenta belge no, rehber ruhsat ve çalışma kartı, sağlık ruhsatı, gerekiyorsa işyeri açma ruhsatı. Her belge için `gecerlilik_bitis` tutulur.
> - Rozet metni yalnızca doğrulananı söyler: "İşletme sahibi doğrulandı". Bu bir kalite onayı değildir; tooltip'te açıklanır. "Güvenilir", "Onaylı işletme" gibi ifadeler kullanılmaz.
> - Belge süresi dolunca rozet ve ticari yerleşimler otomatik olarak askıya alınır. İşletmeye süre bitmeden 30 ve 7 gün önce uyarı gider.
> - Yüklenen belgeler kısıtlı erişimli ve şifreli depoda tutulur. Doğrulama sonrası saklama süresi `compliance_config` içinde tanımlanır (LEGAL-TR-10).
