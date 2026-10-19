# MOB — Mobil

> Ek A'dan otomatik aktarıldı (`node scripts/import-requirements.mjs`). Durumlar `requirements.json` içindedir.

### REQ-MOB-001
- Düzey: ZORUNLU · Faz: 2 · Kaynak: v2 Ek A
- Gereksinim: Expo + React Native + Expo Router; `apps/mobile` monorepo içinde; ortak paketler (`contracts`, `api-client`, `tokens`, `i18n`, `routes`, `utils`) paylaşılır; web bileşenleri RN'ye zorlanmaz (`ui-native` ayrı). Expo SDK sürümü Faz 2 başında registry'den doğrulanır (ADR).
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-MOB-002
- Düzey: ZORUNLU · Faz: 2 · Kaynak: v2 Ek A
- Gereksinim: **Misafir modu:** uygulama açılışında hesap zorunlu değildir; keşif, arama, harita, listeleme ve içerik okuma misafirle çalışır. Giriş yalnızca eylemde istenir. Açılışta zorunlu onboarding duvarı YASAK; isteğe bağlı 2–3 ekranlık tanıtım + şehir/ilgi alanı seçimi atlanabilir.
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-MOB-003
- Düzey: ZORUNLU · Faz: 2 · Kaynak: v2 Ek A
- Gereksinim: Giriş: e-posta, Google, Apple (REQ-HSP-005/006). Token'lar yalnızca güvenli depoda.
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-MOB-004
- Düzey: ZORUNLU · Faz: 2 · Kaynak: v2 Ek A
- Gereksinim: **Derin bağlantılar:** iOS Universal Links ve Android App Links; `apple-app-site-association` ve `assetlinks.json` web uygulaması tarafından sunulur; web URL'leri ile uygulama ekranları birebir eşlenir (`packages/routes`); uygulama yüklü değilse web sayfası açılır. Ertelenmiş derin bağlantı yalnızca gerçek bir sağlayıcı seçilirse (X-kaydı). Gerçek alan adıyla ilişkilendirme doğrulaması `M` yöntemlidir.
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-MOB-005
- Düzey: ZORUNLU · Faz: 2 · Kaynak: v2 Ek A
- Gereksinim: **Paylaşım:** listeleme/içerik/arama sonuçları sistem paylaşım sayfasıyla paylaşılır; paylaşılan bağlantı web URL'sidir; sponsorlu içerik paylaşımında etiket önizlemede de görünür.
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-MOB-006
- Düzey: ZORUNLU · Faz: 2 · Kaynak: v2 Ek A
- Gereksinim: **Push bildirimleri:** izin sistem diyaloğundan **önce** bağlamsal ön açıklama ekranı (ör. ilk favori ya da değerlendirme gönderiminden sonra; açılışta değil); konu bazlı tercihler (değerlendirme durumu, işletme yanıtı, kaydedilen listelemedeki değişiklik, editoryal öneriler, fırsat/sponsorlu); sessiz saatler (varsayılan 22:00–09:00); frekans sınırı (varsayılan pazarlama push'u ≤ 2/hafta); **ticari/pazarlama içerikli push yalnızca ayrı ticari ileti izniyle** ve "Sponsorlu" ibaresiyle (Ek D1). Gerçek kişilere gönderim C sınıfı.
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-MOB-007
- Düzey: ZORUNLU · Faz: 2 · Kaynak: v2 Ek A
- Gereksinim: **Konum:** yalnızca ön planda ("uygulamayı kullanırken"); arka plan konumu YASAK; izin istemeden önce amaç açıklaması (Türkçe izin metinleri `Info.plist` / Android izin açıklamaları); "yaklaşık konum" desteklenir; izin reddedilirse şehir seçimiyle tam işlev; kesin konum sunucuya gönderilirse yuvarlanır (≈ 1 km) ve saklanmaz (KVKK minimizasyonu).
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-MOB-008
- Düzey: ZORUNLU · Faz: 2 · Kaynak: v2 Ek A
- Gereksinim: **Harita:** kütüphane ve sağlayıcı ADR'de (lisans + API anahtarı X-kaydı; anahtar uygulama paketinde ise platform/paket kısıtlı ve ADR'de "herkese açık anahtar" olarak kayıtlı); kümelenme; liste/harita geçişi; erişilebilir alternatif (harita içeriği liste olarak da erişilebilir).
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-MOB-009
- Düzey: ZORUNLU · Faz: 2 · Kaynak: v2 Ek A
- Gereksinim: **Veri katmanı:** web ile aynı veri getirme kütüphanesi ÖNERİLİR; okuma önbelleği cihazda kalıcı (son görüntülenenler çevrimdışı okunabilir); favori ekleme iyimser güncellemeli; çevrimdışı yazma işlemleri kuyruğa alınır ve bağlantı gelince gönderilir.
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-MOB-010
- Düzey: ZORUNLU · Faz: 2 · Kaynak: v2 Ek A
- Gereksinim: **Durum tasarımları:** yükleniyor (iskelet), boş, az veri, hata (yeniden dene), çevrimdışı (afiş + önbellekten okuma), yetkisiz, bakım/zorunlu güncelleme ekranı (minimum sürüm API'den).
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-MOB-011
- Düzey: ZORUNLU · Faz: 2 · Kaynak: v2 Ek A
- Gereksinim: **Hesap silme uygulama içinden** başlatılabilir (Profil > Hesap > Hesabımı sil) ve web'deki silme sayfasının bağlantısı mağaza listesinde verilir; veri dışa aktarma talebi uygulamadan yapılabilir (Apple ve Google kurallarının güncel metni doğrulanır — Ek D1).
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-MOB-012
- Düzey: ZORUNLU · Faz: 2 · Kaynak: v2 Ek A
- Gereksinim: **UGC gereksinimleri (mağaza):** içerik bildirme, kötüye kullanan kullanıcıyı engelleme, filtreleme/moderasyon ve yayımlanmış iletişim bilgisi uygulamada mevcuttur.
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-MOB-013
- Düzey: ZORUNLU · Faz: 2 · Kaynak: v2 Ek A
- Gereksinim: **Gizlilik beyanları:** Apple gizlilik etiketi ve gizlilik manifesti (gerekli API kullanım gerekçeleri), Google Play Veri güvenliği formu — gerçek veri akışlarından (`processor_inventory`, analitik olay listesi) türetilerek **taslak** hazırlanır; uygulamalar arası izleme yapılmaz (dolayısıyla izleme izni istemi gerekmez; yapılacaksa ayrı ADR + İnsan onayı).
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-MOB-014
- Düzey: ZORUNLU · Faz: 2 · Kaynak: v2 Ek A
- Gereksinim: **Erişilebilirlik:** sistem yazı boyutu ölçeklemesi (Dynamic Type / font scale) en az %200'e kadar düzen bozulmadan; VoiceOver/TalkBack etiketleri, rolleri ve sıraları; dokunma hedefleri ≥ 44×44 pt (iOS) / 48×48 dp (Android); hareket azaltma tercihine uyum; renk dışında ikinci gösterge.
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-MOB-015
- Düzey: ZORUNLU · Faz: 2 · Kaynak: v2 Ek A
- Gereksinim: **Performans:** uzun listelerde sanallaştırılmış liste (ör. FlashList — ADR); görseller önbellekli bileşenle (ör. `expo-image`) ve CDN varyantlarıyla; soğuk açılış hedefi orta segment Android cihazda < 2,5 sn (laboratuvar; ölçüm koşulları raporlanır); JS paket boyutu bütçesi ADR'de.
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-MOB-016
- Düzey: ZORUNLU · Faz: 2 · Kaynak: v2 Ek A
- Gereksinim: **Dağıtım:** EAS Build/Submit/Update (ADR); kanallar: development / preview / production; OTA güncellemeleri yalnızca JS/varlık düzeltmeleri için — yerel kod/izin değişikliği mağaza sürümü gerektirir; sürümleme (semver + build numarası); minimum OS sürümleri ADR'de; tablet desteği kararı ADR'de (varsayılan: telefon öncelikli, tablette ölçeklenmiş). Mağaza gönderimi C sınıfı.
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-MOB-017
- Düzey: ZORUNLU · Faz: 2 · Kaynak: v2 Ek A
- Gereksinim: **Hata izleme:** çökme raporlama (kaynak haritaları yüklenmiş), kişisel veri maskelenmiş; analitik yalnızca rızayla.
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-MOB-018
- Düzey: ZORUNLU · Faz: 2 · Kaynak: v2 Ek A
- Gereksinim: **Mobil testler:** birim + bileşen testleri; E2E (Maestro ya da Detox — ADR) duman senaryoları: misafir keşif, arama + filtre, listeleme açma, giriş, favori ekleme, değerlendirme gönderme, derin bağlantı açma, hesap silme başlatma; cihaz matrisi `MANUAL-QA` içinde.
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-MOB-019
- Düzey: ZORUNLU · Faz: 2 · Kaynak: v2 Ek A
- Gereksinim: **Mağaza varlıkları taslakları:** Türkçe uygulama adı, alt başlık, açıklama, anahtar kelimeler, ekran görüntüsü senaryoları (demo veri kullanılan her görselde "(Demo)" eki görünür kalır; "Demo" ibaresiz mağaza görseli yalnızca gerçek ve lisanslı veriyle ve İnsan onayıyla — C sınıfı), destek URL'si, gizlilik politikası URL'si.
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-MOB-021
- Düzey: ZORUNLU · Faz: 2 · Kaynak: v2 Ek A
- Gereksinim: **Bildirim merkezi** (web `/bildirimler` ve mobil Profil): liste, okundu/okunmadı, tür filtresi, derin bağlantıyla ilgili ekrana gitme, toplu okundu; türler: değerlendirme durumu, işletme yanıtı, kaydedilen listelemede değişiklik, editoryal öneri, (izinliyse) fırsat; saklama 90 gün.
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-MOB-020
- Düzey: OLMALI · Faz: 2 · Kaynak: v2 Ek A
- Gereksinim: Sponsorlu içerik ve fırsat tercihleri: kullanıcı fırsat/sponsorlu **bildirimlerini** kapatabilir; akıştaki sponsorlu yerleşimler etiketli kalır (kapatma seçeneği gelir modeline göre B sınıfı karar).
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._
