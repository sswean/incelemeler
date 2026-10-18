## §7 Faz × kapsam matrisi, pilot dikeyler ve kapsam dışı

### §7.1 Faz × kapsam matrisi

Bu matris, bir özelliğin **ne zaman** yapılacağının tek yetkili kaynağıdır. Ek A ürünün nihai hedefini tarif eder, zamanlamayı tarif etmez. Matriste olmayan bir özellik "aktif faz dışı" sayılır ve `docs/PARKING-LOT.md` dosyasına yazılır. Aşağıdaki varsayılanlar Faz 0 raporunda İnsan onayına sunulur (B sınıfı).

| Özellik | Faz | Not / çözülen v1 çelişkisi |
|---|---|---|
| Monorepo, CI, Docker Compose, hafıza dosyaları, gereksinim aktarımı, yürüyen iskelet | 0 | YENİ |
| Tasarım token'ları, temel bileşen kütüphanesi (Storybook), geçici logo + logo brifi | 0–1 | |
| Kategori ağacı, listeleme türleri, özellik şemaları, koleksiyon sayfaları | 1 | |
| Listeleme detay sayfaları | 1 | Pilot türler tam; diğerleri genel şablonla ve yayın eşiği sağlanana kadar gizli (§7.2) |
| Destinasyon (il/ilçe) sayfaları ve şehir × kategori hub'ları (yayın eşikli) | 1 | |
| Blok tabanlı içerik editörü, revizyon, önizleme, zamanlanmış yayın | 1 | |
| Editoryal içerik türleri: Rehber, Liste, Karşılaştırma (editör tablosu), İnceleme, Sponsorlu içerik | 1 | |
| E-postayla üyelik, giriş, e-posta doğrulama, parola sıfırlama, misafir gezinme | 1 | |
| Hesap silme, veri dışa aktarma (KVKK başvurusu) | 1 | Mağaza kuralları Faz 2'de mobilde de |
| Google ve Apple ile giriş | 2 | Mağaza kurallarıyla birlikte değerlendirilir |
| Favoriler (web) | 1 | E2E-003 |
| Kullanıcı değerlendirmesi, moderasyon kuyruğu, şikâyet/bildirim ve itiraz | 1 | E2E-004 |
| "Bilgi hatalı mı? Düzeltme öner" formu | 1 | |
| "Faydalı" oylaması, soru-cevap | 2 | |
| Yorum (puansız tartışma) | Kapsam dışı (varsayılan) | Flag kapalı |
| Arama (PostgreSQL tam metin + Türkçe normalizasyon + trigram), filtre, sıralama, otomatik tamamlama | 1 | |
| Yapılandırılmış sorgu ayrıştırma ("Antalya'da denize yakın uygun fiyatlı otel" → konum + tür + özellik + fiyat) | 1 | Kural/sözlük tabanlı; yapay zekâ YOK (Ç-8) |
| Web liste sayfasında harita görünümü | 1 (İSTEĞE BAĞLI) | Harita sağlayıcısı X-kaydı; erişim yoksa harita KAPALI, liste + adres gösterilir |
| "Yakınımdakiler" (izinli tarayıcı konumu; izin yoksa şehir seçimi) | 1 (İSTEĞE BAĞLI) | |
| Yöneticinin oluşturduğu sponsorlu içerik ve sponsorlu yerleşim (yuva, tarih, zorunlu açıklama, sınırlar) | 1 | v1 §9 "ilk sürüm", E2E-005 |
| Sponsorluk kampanyası kaydı, gösterim/tıklama olay kaydı, kampanya başına yönetici raporu | 1 | E2E-005/006 |
| Affiliate bağlantı yönetimi, merkezi yönlendirici, tıklama kaydı, `rel` nitelikleri, alan adı izin listesi | 1 | E2E-006 |
| Hesapsız işletme başvuru formu + yönetici inceleme kuyruğu | 1 | E2E-007 |
| Hesapsız reklam/sponsorluk başvuru formu | 1 | |
| Dış entegrasyon portları + MOCK adaptörler + "sağlayıcıda kontrol et" bağlantısı | 1 | E2E-008 |
| İşlemsel e-posta (doğrulama, sıfırlama) | 1 | Gönderim sağlayıcısı X-kaydı; yerelde e-posta yakalayıcı |
| Bülten: yalnızca abonelik formu + açık izin kaydı | 1 | Gönderim Faz 2+ ve İnsan onayıyla (ticari ileti mevzuatı, Ek D1) |
| Çerez tercih merkezi (CMP), rıza kayıtları, hukuki metin sürümleme | 1 | |
| SEO altyapısı (meta, canonical, sitemap, robots, JSON-LD, breadcrumb, yönlendirmeler) | 1 | |
| Temel analitik (rızaya bağlı, birinci taraf olay hattı) ve yönetici panoları | 1 | |
| Mobil uygulama (5 sekme, misafir modu, derin bağlantı, harita, favoriler, profil) | 2 | |
| Uygulama içi bildirim merkezi (web + mobil) ve push | 2 | v1 §5 web "Bildirimler" sayfası Faz 2'ye kaydırıldı |
| Son görüntülenenler / okuma geçmişi | 2 | Önce cihazda yerel; sunucuda saklanacaksa KVKK incelemesi |
| Açık tercih seçimi (ilgi alanları, şehir) | 2 | |
| Karanlık tema | 2 (İSTEĞE BAĞLI) | Token'lar Faz 0'dan itibaren temaya hazır |
| İşletme hesabı: sahiplenme, doğrulama, bilgi güncelleme, işletme yanıtı (ücretsiz) | 3 | B sınıfı: İnsan Faz 2'ye çekebilir |
| Reklamveren portalı, self-servis kampanya başvurusu, gelişmiş kampanya raporu | 3 | |
| Gerçek sağlayıcı adaptörleri (fiyat/müsaitlik) | 3 | Yalnızca sözleşme + kimlik bilgisi sağlanırsa |
| Teklif talebi (lead) iletimi işletmeye | 3 | KVKK aktarım incelemesi gerekli |
| Davranışa dayalı kişiselleştirme ve öneriler | 4 | KVKK incelemesi |
| Kullanıcı koleksiyonları/listeleri | 4 | v1 §6 ile çelişkide §19 (Faz 4) geçerlidir |
| Etkileşimli ve gelişmiş karşılaştırma aracı (3–4 öğe) | 4 | Editoryal karşılaştırma Faz 1'de |
| Harici arama motoruna geçiş (Meilisearch/Typesense) | 4 | Ölçüt tetiklerse ADR ile Faz 3 |
| Üründe yapay zekâ (doğal dil arama, özet) — yalnızca doğrulanmış veriyle | 4 | Faz 1–3 YASAK |
| Eser türü (film/dizi/kitap/oyun) yayını | 4 | Meta veri lisansı X-kaydı |
| Ödeme tahsilatı, fatura kesme, platform içi rezervasyon ve ödeme | **Kapsam dışı** | Ayrı İnsan kararı ve ayrı prompt |
| Reklam ağı entegrasyonu (gösterim bazlı display reklam) | **Kapsam dışı** | v1 §15 madde 7 |
| Çok dilli yayın | **Kapsam dışı** | Mimari hazırlık (i18n anahtarları, `locale` alanı) Faz 1 |

**Yönetim paneli modülleri (v1 §11 numaraları):**
- **Faz 1:** 1 (gerçek sayaçlı genel pano), 2, 3, 4–8 (tek "Listeleme yönetimi" modülünde, türe göre formlar), 9, 10, 11, 12, 13 (yönetici kampanya kaydı), 14, 16, 17, 18, 19, 21 (temel), 22 (kampanya başına gösterim/tıklama), 23, 24 (temel), 25.
- **Faz 2:** 20 (bildirim yönetimi).
- **Faz 3:** 15 (gerçek entegrasyonlar), 22'nin gelişmiş hali, işletme paketleri yönetimi.

**Roller:** Faz 1: Süper yönetici, Yönetici, Editör, Yazar, Moderatör, Üye. Faz 3: İşletme temsilcisi, Reklamveren temsilcisi (bunlar global rol değil, **kuruluş kapsamlı üyeliktir**, Ek A3).

**"Mobil" kelimesi** Faz 1'de "mobil öncelikli responsive web" anlamına gelir; yerel uygulama Faz 2'dir.

### §7.2 Pilot dikeyler ve lansman kapsamı

Varsayılan (B sınıfı; İnsan Faz 0 raporunda değiştirebilir):

- **Tam uygulanan pilot türler (Faz 1):** (1) Mekan — yeme-içme; (2) Konaklama; (3) Ürün — teknoloji. Ek olarak **destinasyon sayfaları ve rehber içerikleri**.
- Tür-özel alanlar, filtreler, detay şablonu, yapılandırılmış veri ve E2E kapsamı pilot türlerde tam uygulanır. Diğer türler (araç kiralama firması, tur/aktivite, hizmet işletmesi, ilgi noktası, turist rehberi, etkinlik) veri modelinde ve genel şablonda yer alır; **yayın eşiği** sağlanana kadar gizli kalır.
- **Kanıt:** Faz 1 sonunda dördüncü bir tür (ör. Tur/Aktivite kategorisi + özellik şeması) **yalnızca yönetim panelinden** eklenip yayımlanır ve demo betiğinde gösterilir.
- **Lansman şehirleri (öneri):** İstanbul, İzmir, Antalya, Muğla, Nevşehir (Kapadokya).
- Araç kiralama firması sayfaları Faz 1 sonunda **canlı fiyat olmadan** açılabilir.
- **Soğuk başlangıç önlemi:** Yönetim panelinde CSV/XLSX toplu içe aktarma (alan doğrulama, yinelenen kayıt tespiti — ad + koordinat yakınlığı, önizleme, geri alma, `source` alanı ZORUNLU) Faz 1'de ZORUNLU. Kaynak; lisanslı veri, işletme beyanı ya da editör girişi olmalıdır (scraping YASAK).
- **Yayın eşikleri** (yönetim panelinden ayarlanabilir; varsayılanlar):

| Sayfa | Menüde görünme ve indekslenme eşiği |
|---|---|
| İl × kategori hub'ı | ≥ 30 yayımlanmış listeleme (zorunlu alanları tam) ve ≥ 1 editoryal içerik |
| İlçe × kategori hub'ı | ≥ 10 listeleme |
| Ürün kategorisi | ≥ 15 ürün (teknik özellikleri dolu) ve ≥ 3 editör değerlendirmeli ürün |
| Destinasyon (il) sayfası | ≥ 1 rehber ve ≥ 2 yayımlanmış hub |
| Eşiğin altı | Sayfa üretilmez ya da `noindex` + menü/site haritası dışı; "Yakında" sayfası açılmaz |

### §7.3 Aşırı mühendislik yasağı

- İstenmeyen özellik, yapılandırılabilirlik ya da "ileride lazım olur" soyutlaması ekleme. Tek kullanım için yardımcı katman yazma.
- **İstisna:** Bu belgenin açıkça istediği genişleme noktaları — arama sağlayıcı arayüzü, dış entegrasyon portları, kategori özellik şemaları, i18n'e hazır metinler, ödeme/fatura portları (yalnızca arayüz).
- Faz 1–3'te YASAK (İnsan onayı + ADR olmadıkça): mikroservis, GraphQL, event sourcing, Kubernetes, birden fazla veritabanı motoru, kendi yazılmış kriptografi/kimlik doğrulama algoritması.
- Doğrulama sistem sınırlarında yapılır (kullanıcı girdisi, dış API, dosya yükleme); iç kodda olası olmayan senaryolar için savunmacı katman ekleme.

### §7.4 Kapsam dışı

Bu belgenin hiçbir fazında yapılmaz; ayrı İnsan kararı gerekir:
- Ödeme tahsilatı, fatura kesme, platform içi rezervasyon, tur/paket satışı.
- Kullanıcılar arası mesajlaşma (v1'deki "mesajlaşma bağlantısı" yalnızca işletmenin kendi dış kanalına giden bağlantıdır).
- Scraping ve izinsiz veri içe aktarımı.
- Gerçek işletmeler hakkında **senin** içerik yazıp yayımlaman.
- Reklam ağı (display) entegrasyonu.
- Kullanıcıya mobil uygulama içinden dijital ürün/abonelik satışı.

---

## §8 Fazlar, Bitti Tanımı ve faz kapıları

### §8.1 Faz 0 — Temel ve yürüyen iskelet

Tamamen yereldir ve geri alınabilir; İnsan onayı beklemeden ilerle.

**Dilimler:**
1. **Ortam keşfi:** `git status`, `git log`, `ls -la`, Node/pnpm/Docker sürümleri, npm registry ve resmî doküman sitelerine erişim → `docs/ENVIRONMENT.md`.
2. **Hafıza dosyaları** (§10) ve bu belgenin birebir kopyası: `docs/prompt/PROMPT-v2.md`.
3. **Gereksinim aktarımı:** Ek A → `docs/requirements/<ALAN>.md` + `docs/requirements/requirements.json` (tüm REQ'ler `BAŞLANMADI`). Her ZORUNLU/OLMALI REQ'e kabul kriteri ve doğrulama yöntemi yazılır (§3.3).
4. **İlk ADR'ler:** ADR-0001 yığın ve sürümler · 0002 monorepo yerleşimi ve yönetim panelinin konumu · 0003 kimlik doğrulama · 0004 içerik çekirdeği/veri modeli · 0005 arama katmanı · 0006 puan ölçekleri · 0007 medya depolama ve görsel işleme · 0008 test araçları · 0009 sayfa türü başına render ve önbellek stratejisi · 0010 olay hattı (outbox/analitik).
5. **Monorepo iskeleti** (Ek A1.1): `apps/web`, `apps/admin`, `apps/api`, `packages/*`. `apps/mobile` Faz 2'ye kadar oluşturulmaz; ortak paketler mobilde kullanılabilir tasarlanır.
6. **Docker Compose:** PostgreSQL (+ PostGIS), yerel S3 uyumlu depolama, yerel e-posta yakalayıcı. Redis eklenmez (§14.4).
7. **Kanonik komutlar** ve `scripts/init.sh` (§9.5).
8. **CI:** lint, typecheck, birim, entegrasyon, build, sır taraması, lisans denetimi, bağımlılık güvenlik denetimi, `req:check`, commit biçimi.
9. **Yürüyen iskelet:** Bir web sayfası → API uç noktası → PostgreSQL arasında gerçek bir okuma; en az bir birim, bir entegrasyon ve bir E2E testi CI'da yeşil.
10. **Seed altyapısı** (§12.4): üretimde çalışmayı reddettiği testle kanıtlanır.
11. **Tasarım token'ları** paketi ve Storybook iskeleti (Ek A14).

**Faz 0 Bitti Tanımı:**
- Temiz bir klondan README'deki en fazla 3 komutla iskelet ayağa kalkar (geçici dizine yeniden klonlanarak gösterilir, komut çıktısı raporlanır).
- `pnpm verify` yerelde ve CI'da yeşil.
- §10'daki tüm dosyalar mevcut ve dolu.
- Faz 1'in tüm REQ'leri `requirements.json` içinde.
- Engelleyici sorular varsayılanlarıyla `OPEN-QUESTIONS` içinde.

**Faz 0 → Faz 1 geçişi onay beklemez.** Faz 0 raporunu sun ve Faz 1'e devam et. Raporda onaya sunulan varsayılanlar (matris, pilot dikeyler, puan ölçeği, hitap, şehirler) İnsan itiraz ederse güncellenir.

### §8.2 Dilim Bitti Tanımı

Her madde kanıtla raporlanır:
- [ ] İlgili REQ'lerin kabul kriterleri için testler yazıldı ve **bu oturumda** geçti (komut + sonuç raporda).
- [ ] `pnpm verify` yeşil.
- [ ] Arayüz değiştiyse ilgili E2E senaryoları yeşil.
- [ ] Migration'lar boş veritabanına sıfırdan uygulanabiliyor; seed çalışıyor.
- [ ] Yeni ortam değişkenleri `.env.example` ve dokümanda.
- [ ] Arayüz dilimlerinde **yükleniyor, boş, az veri, hata, yetkisiz ve çevrimdışı** durumları uygulandı (Ek A15.3).
- [ ] Yeni sayfa/bileşende otomatik erişilebilirlik denetimi Ek A18 eşiğini sağlıyor.
- [ ] Güvenlik (yetki, girdi doğrulama), SEO (meta, yapılandırılmış veri) ve performans bu dilim için uygulandı — sona bırakılmadı.
- [ ] Yeni MOCK/DEMO varsa kaydı açıldı ve arayüzde işaretlendi.
- [ ] `requirements.json`, `STATUS.md` ve gerekiyorsa ADR/ASSUMPTIONS/LEGAL-REVIEW güncellendi.
- [ ] Commit'ler Conventional Commits biçiminde, `Refs: REQ-…` altbilgili.

### §8.3 Faz Bitti Tanımı (Faz 1–4 ortak)

- Aktif fazın tüm ZORUNLU REQ'leri `TAMAM` ya da İnsan'ın yazılı onayıyla `ERTELENDİ`. `TAMAM` olmayan her OLMALI REQ için tek satırlık gerekçe.
- Fazın E2E senaryoları CI'da **art arda 3 koşuda** yeşil (kararsız test yok).
- Açık P0 hata sayısı 0; P1 hatalar listelenmiş.
- Temiz klon testi geçti (`pnpm verify` + `pnpm test:e2e`).
- Bağımlılık denetiminde yüksek/kritik açık yok (varsa ADR'li istisna); sır taraması temiz.
- `LEGAL-REVIEW`, `EXTERNAL-DEPENDENCIES`, `MOCKS`, `MANUAL-QA` güncel.
- `docs/demos/FAZ-<N>.md`: İnsan'ın 15 dakikada adım adım izleyebileceği gösterim betiği.
- Bağımsız doğrulama yapıldı (§12.6), bulgular kapatıldı ya da kayda geçti.
- Faz raporu (Ek C-2) yazıldı.

### §8.4 Faz kapısı

Faz N'in (N ≥ 1) çıkış ölçütleri sağlandığında **DUR**: (1) faz raporunu sun; (2) İnsan'dan yazılı "Faz N onaylandı, Faz N+1 başlasın" onayı bekle; (3) onay gelene kadar yalnızca Faz N'in hataları, testleri, dokümantasyonu ve performans/erişilebilirlik iyileştirmeleri üzerinde çalış. İnsan geri bildirimleri `docs/DECISIONS/` altına kaydedilir.

### §8.5 Faza özel çıkış ölçütleri

| Faz | Çıkış ölçütleri (§8.3'e ek) |
|---|---|
| **1 — Çalışan temel platform** | E2E-001…E2E-020 yeşil. Matristeki yönetim modülleri çalışıyor. Matristeki web sayfaları sunucu tarafında render edilmiş içerikle HTTP 200 dönüyor. SEO meta/sitemap/robots/JSON-LD testleri yeşil. Lighthouse CI bütçeleri (Ek A18) pilot şablonlarda sağlanıyor. Eşiğin altındaki hub'lar menü ve site haritası dışında. Arama sorgu korpusu kabul eşiğini sağlıyor (Ek A7). |
| **2 — Mobil uygulama** | Mobil typecheck, birim ve bileşen testleri yeşil; mobil E2E (Maestro/Detox — ADR) duman senaryoları yeşil. Derin bağlantı, misafir modu, hesap silme, push izin akışları test edilmiş. Cihazda doğrulanamayanlar `MANUAL-QA` içinde. Mağaza meta verisi ve gizlilik beyanı taslakları hazır (gönderim YOK — C sınıfı). |
| **3 — Ticari sistemler** | Her sağlayıcı adaptörü için sözleşme (contract) testleri. Kimlik bilgisi sağlanmamış sağlayıcı `ENGELLİ` ya da `MOCK`; asla `TAMAM` değil. İşletme sahiplenme, doğrulama ve yanıt akışları E2E'de. Reklamveren raporları yalnızca gerçek olaylardan. |
| **4 — Gelişmiş keşif** | Kişiselleştirme rıza olmadan devre dışı (test). Yapay zekâ özellikleri yalnızca doğrulanmış veriyle, kaynak göstererek ve ayrı ADR + İnsan onayıyla. Harici arama motoru geçişi sorgu korpusunda gerileme olmadan. |

### §8.6 Faz başına teslimatlar (v1 §21 numaralarıyla)

| Faz | Teslimatlar |
|---|---|
| 0 | 3 (ilk şema ve migration), 6 (token'lar + Storybook iskeleti), 7, 8, 9 (ilk sürüm), CI |
| 1 | 1, 2, 3, 4, 6 (web), 9, 10, 11, 12 (taslak), 13 (port + MOCK adaptörler), 14, 16; 15'in web taslağı |
| 2 | 5, 6 (mobil), 9/10/11 güncel, mağaza meta verisi ve gizlilik beyanı taslakları |
| 3 | 13 (gerçek adaptörler — yalnızca sağlanan kimlik bilgileriyle), işletme ve reklamveren portalları, 15 güncel |
| 4 | Faz 4 matris maddeleri, 15 nihai |
