# Varsayımlar (ASSUMPTIONS)

Biçim: Ek C-4. "Yüksek" geri alma maliyetli varsayımlar OPEN-QUESTIONS'ta da yer alır.

## A-001: Geliştirme `claude/pensive-hopper-oftszn` dalında yapılır
- Tarih: 2026-10-19 · Faz 0 · Gerekçe: Oturumun yetkili dal talimatı; prompt §9.4'teki `feat/*` dal modeli, `main`'e birleştirme PR'larıyla başladığında uygulanacak.
- Etkilediği REQ'ler: — · Geri alma maliyeti: Düşük · Durum: AÇIK

## A-002: Kullanıcı puanı 1–5 tam yıldız, editör puanı 10 üzerinden 0,5 adımlı
- Tarih: 2026-10-19 · Faz 0 · Gerekçe: Ç-7 varsayılanı; `packages/utils/src/rating.ts`.
- Etkilediği REQ'ler: REQ-DEG-001, REQ-VER-005/006 · Geri alma maliyeti: Orta · Durum: AÇIK (Q-001)

## A-003: Pilot dikeyler Mekan (yeme-içme), Konaklama, Ürün (teknoloji) + destinasyon sayfaları; lansman şehirleri İstanbul, İzmir, Antalya, Muğla, Nevşehir
- Tarih: 2026-10-19 · Faz 0 · Gerekçe: §7.2 varsayılanı.
- Etkilediği REQ'ler: Faz 1 LST/ARA/SEO · Geri alma maliyeti: Orta · Durum: AÇIK (Q-002)

## A-004: Arayüz hitabı "sen"
- Tarih: 2026-10-19 · Faz 0 · Gerekçe: §4.3 varsayılanı; `packages/i18n`.
- Geri alma maliyeti: Düşük · Durum: AÇIK (Q-001)

## A-005: TypeScript 6.0.3 (en güncel 7.0.2 değil)
- Tarih: 2026-10-19 · Faz 0 · Gerekçe: typescript-eslint 8.71 TypeScript `<6.1` destekliyor; TS 7 ile lint zinciri çalışmaz (ADR-0001).
- Geri alma maliyeti: Düşük · Durum: AÇIK

## A-006: Arka plan işleri için Redis/BullMQ yok; gerekirse önce PostgreSQL kuyruğu
- Tarih: 2026-10-19 · Faz 0 · Gerekçe: §14.4 tetikleyicileri henüz ölçülmedi.
- Geri alma maliyeti: Düşük · Durum: AÇIK

## A-007: Başlangıç taksonomisi yayında (PUBLISHED) yüklenir
- Tarih: 2026-10-19 · Faz 0 · Gerekçe: Yürüyen iskeletin gerçek veri okuması için. Yayın eşikleri (§7.2) listeleme ve hub sayfalarına Faz 1'de uygulanacak; eşik altı kategoriler o zaman menü ve site haritasından gizlenecek (REQ-KAT-003).
- Etkilediği REQ'ler: REQ-KAT-003 · Geri alma maliyeti: Düşük · Durum: AÇIK

## A-008: Web ve panel geliştirme sürümünde `noindex`
- Tarih: 2026-10-19 · Faz 0 · Gerekçe: Canlıya geçiş C sınıfı; erken indekslenmeyi önler.
- Geri alma maliyeti: Düşük · Durum: AÇIK

## A-009: İstemci IP'si web/panelden `X-Forwarded-For` ile API'ye iletilir; üretimde başlığı güvenilen uç vekil ekler
- Tarih: 2026-10-19 · Faz 1 · Gerekçe: IP başına hız sınırları (REQ-HSP-008) web sunucusunun değil son kullanıcının IP'siyle çalışmalı. API yalnız loopback vekile güvenir (`TRUST_PROXY`) ve en sağdaki güvenilmeyen adresi kullanır; uç vekil (X-003) başlığa gözlediği IP'yi eklemezse istemci başlığı taklit edebilir. Gereksinim X-003 kaydına not düşüldü.
- Etkilediği REQ'ler: REQ-HSP-008, REQ-GUV-009 · Geri alma maliyeti: Düşük · Durum: AÇIK

## A-010: CSRF koruması ilk sürümde SameSite çerez + Next Server Actions Origin/Host denetimi
- Tarih: 2026-10-19 · Faz 1 · Gerekçe: Durum değiştiren tüm web/panel istekleri Server Action (yalnız POST, Next Origin ≠ Host ise reddeder); API çerez kabul etmez. Çift gönderim token'ı D13 sertleştirmede eklenecek.
- Etkilediği REQ'ler: REQ-HSP-004, REQ-GUV-006 · Geri alma maliyeti: Düşük · Durum: AÇIK

## A-011: YMYL ve lisanslı kategorilerde sponsorluk Faz 1'de kapalı tutulur; yayımlanmış kategorinin slug'ı değişmez
- Tarih: 2026-10-19 · Faz 1 · Gerekçe: REQ-KAT-004 "sponsorluk varsayılan kapalı" der; açma yolu hukuki kapı (C sınıfı) olduğundan API ve veritabanı (CHECK) bu kategorilerde sponsorluğu reddeder. Slug değişikliği SEO yönlendirme kaydı gerektirir (D4); o zamana dek kilitli.
- Etkilediği REQ'ler: REQ-KAT-003/004, REQ-SPN-* · Geri alma maliyeti: Düşük · Durum: AÇIK

## A-012: Görsel lisans tamlığı kuralı
- Tarih: 2026-10-19 · Faz 1 · Gerekçe: Ek A14.6 alanları; kaynak türü, hak sahibi ve lisans türü her görselde; işletme ve stok görsellerinde yazılı izin belgesi; süresi dolan lisans geçersiz. Model/mülk izni "gerekiyorsa" — otomatik çıkarılamadığından yalnızca kaydedilir. Yayımlanmış listelemeye sonradan eklenen lisanssız görsel herkese açık sayfada gösterilmez (D4 filtresi).
- Etkilediği REQ'ler: REQ-VER-014 · Geri alma maliyeti: Düşük · Durum: AÇIK

## A-013: Destinasyon listelemeleri `/destinasyon/{slug}`; harita yerine "Yol tarifi al" dış bağlantısı
- Tarih: 2026-10-19 · Faz 1 · Gerekçe: A15.1'de il/ilçe destinasyon yolları (`/{il}`, `/{il}/{ilce}`) hub dilimine (D6) aittir; il olmayan destinasyon listelemeleri (ör. tatil bölgesi) için ayrı önek. Harita sağlayıcısı (X-005) seçilmediğinden yol tarifi koordinatla dış harita bağlantısıdır (X-005 "erişim yokken davranış").
- Etkilediği REQ'ler: REQ-SEO-003, REQ-LST-003 · Geri alma maliyeti: Düşük · Durum: AÇIK

## A-014: İçerik akışı ayrıntıları
- Tarih: 2026-10-19 · Faz 1 · Gerekçe: (1) A15.1'de olmayan türler için önek: Haber `/haber/{slug}`, Sponsorlu içerik `/sponsorlu/{slug}` (ticari ilişki URL'de de açık). (2) Sponsorlu içerikte "ticari açıklama kontrolü" adımı, İNCELEMEDE → ONAYLANDI geçişinin yönetici (`campaigns.amount` izni: yönetici/süper yönetici) tarafından yapılmasıyla karşılanır; kontrol eden kaydedilir. (3) "GÜNCELLENİYOR" ara durumu yerine yayındaki içerik editör tarafından doğrudan güncellenir; her güncellemede önceki hâl revizyon olarak saklanır ve değişiklik notu zorunludur (aşamalı taslak sürüm D13'te değerlendirilecek).
- Etkilediği REQ'ler: REQ-ICR-004/005, REQ-SEO-003 · Geri alma maliyeti: Orta · Durum: AÇIK

## A-015: Metodoloji ve politika sayfaları TASLAK iken noindex
- Tarih: 2026-10-19 · Faz 1 · Gerekçe: REQ-ICR-012 sayfaları TASLAK damgalıdır (AK-12) ve hukuki/editoryal incelemeden geçmemiştir; hukuki taslak sayfalarla aynı biçimde arama motorlarına kapalı tutulur. Kurallar Ek A6/A8'den aktarılmıştır; "Test yöntemleri" bölümü editoryal ekip metni gelene kadar yer tutucu açıklamadır (uydurma yöntem yazılmadı).
- Etkilediği REQ'ler: REQ-ICR-012, REQ-SEO-005 · Geri alma maliyeti: Düşük (TASLAK kaldırma C sınıfı; kaldırıldığında `robots` açılır) · Durum: AÇIK

## A-016: Önizleme belirteci sorgu parametresinde
- Tarih: 2026-10-19 · Faz 1 · Gerekçe: URL normalleştirme (REQ-SEO-003) yolu küçük harfe çevirir; büyük/küçük harf duyarlı imzalı belirteç yolda bozulurdu. Önizleme adresi `/onizleme?belirtec=…` (noindex, `Cache-Control: private, no-store`, API'de `X-Robots-Tag: noindex`).
- Etkilediği REQ'ler: REQ-ICR-005 · Geri alma maliyeti: Düşük · Durum: AÇIK

## A-017: Arama sözlüğü varsayılanları ve demo veri
- Tarih: 2026-10-19 · Faz 1 · Gerekçe: Ek A7.1 örneklerinin filtreye çevrilmesi için varsayılan niyetler (uygun fiyatlı → fiyat ≤ 2; denize yakın → `beachfront`; çocuklarla → `familyFriendly`; özel gün → `specialOccasion`; rehberli → `guided`; kablosuz → `wireless`), eş anlamlılar ve takma adlar (Kapadokya → Nevşehir, Sultanahmet → Fatih…) platform yapılandırması olarak seed edilir; ilgili filtrelenebilir özellikler kategori şemalarına eklenir. "Hafta sonu", "günlük" gibi ifadeler Faz 1'de filtreye çevrilmez (koleksiyon/kiralama süresi verisi yok) — dolgu ifadesi sayılır. Korpusun beklenen sonuçları `seedDemoListings` içindeki 64 kurgusal "(Demo)" kayıttır (gerçek işletme/yer adı taklidi yok; görsel, puan, fiyat, lisans no yok).
- Etkilediği REQ'ler: REQ-ARA-006, REQ-ARA-007 · Geri alma maliyeti: Düşük (panelden değiştirilebilir — 6e) · Durum: AÇIK

## A-018: Hub kuralları
- Tarih: 2026-10-19 · Faz 1 · Gerekçe: (1) Hub'ın kategori bölümü kategori slug'ıdır (`/istanbul/kahvalti-mekanlari`; A15.1 örneğindeki ayrı "keşif kategorisi" slug'ı için ayrı model açılmadı); kategori slug'ı il/ilçe slug'ı ya da ayrılmış sözcükle çakışamaz (kayıtta doğrulanır). (2) "Editoryal içerik" ve "rehber" eşik sayımı: hub'ın listelemelerinden en az birini gömülü kart olarak içeren yayımlanmış içerik (içeriklerde ayrı yer/konu alanı yok). (3) Eşik altındaki hub sayfası üretilmez (404); ilçe sayfası eşiği varsayılan 10 listeleme (tabloda ayrı satır yok). (4) Sayfalama varyantları `noindex,follow`; yalnızca demo listelemeli hub noindex ve JSON-LD'siz; site haritası demo kaydı saymaz. (5) Eşikler `platform_settings` içinde, panelden (`taxonomy.manage`) sürüm denetimli değişir.
- Etkilediği REQ'ler: REQ-KAT-003, REQ-SEO-003/004/006/011 · Geri alma maliyeti: Düşük · Durum: AÇIK

## A-019: Değerlendirme ve moderasyon ayrıntıları
- Tarih: 2026-10-19 · Faz 1 · Gerekçe: (1) Bayes öncülü (m): grup ≥ 30 değerlendirme → grup ortalaması; değilse üst kategorinin ülke geneli ortalaması; o da yoksa platform ortalaması; hiç değerlendirme yoksa ölçek ortası 3,0 (A6.2 son basamağı tanımlamıyor). Öncül yalnızca değişen listelemede yeniden hesaplanır; gece toplu yeniden hesaplama D13. (2) Moderasyon varsayılanları: risk eşiği 40, güvenilir hesap = ≥ 3 onaylı değerlendirme (`platform_settings.moderation`). (3) Teşvik beyanlı değerlendirme etiketle yayımlanır, ortalamaya girmez (A6.4; politika hukuki incelemeye tabi). (4) Düzenlemede beyanlar yeniden verilir (önceden işaretli kutu yok). (5) Yerel/E2E'de `RUN_WORKER_IN_PROCESS=true` ile outbox API sürecinde işlenir; üretimde ayrı worker. (6) Sponsor kuruluşa bağlı değerlendirme kaldırmada ikinci onay (REQ-GUN-004) kampanya verisi gelince (D9).
- Etkilediği REQ'ler: REQ-DEG-001/004, REQ-GUN-001/004, REQ-VER-007 · Geri alma maliyeti: Düşük · Durum: AÇIK

## A-020: Dış yönlendirme ayrıntıları
- Tarih: 2026-10-19 · Faz 1 · Gerekçe: (1) `/git/{id}` web'de bir rota işleyicisi; hedefi API çözer (`/v1/outbound/{id}/resolve`), istemcinin verdiği URL hiç kullanılmaz. Bağlam (`ctx`) API imzalı belirteç (30 gün); geçersiz/eksik bağlam yönlendirmeyi engellemez, yalnızca yüzey/alt kimlik değerleri boş kalır. (2) Sağlayıcı kaydı varsayılanı LINK_ONLY; API anahtarı yalnızca ortam değişkeni adı olarak tutulur (AK-06/AK-08). (3) Ticari türler (AFFILIATE/BOOKING/PURCHASE) sağlayıcı + `affiliate.manage` ister; editör/satış yalnızca ticari olmayan bağlantı ekler. (4) Sağlık denetimi yalnızca 4xx veya izinli alan dışı yönlendirmede BROKEN yazar; DNS/ağ hatası durumu değiştirmez (yanlış alarm yerine sessiz kalma), özel adreslere istek yok. (5) `outbound_clicks` aylık bölümleme, rızaya bağlı üye kimliği (D10 CMP), p95 < 50 ms ölçümü (D13), dönüşüm raporu (REQ-AFF-008; sağlayıcı verisi yok) ve çok satıcılı ürün sıralaması (REQ-AFF-009) ertelendi. (6) Listeleme sayfası ISR 60 sn: kapatılan bağlantının CTA'sı en geç 60 sn sayfada kalabilir; `/git/` o an 404 döner.
- Etkilediği REQ'ler: REQ-AFF-001…009 · Geri alma maliyeti: Düşük · Durum: AÇIK

## A-021: Sponsorluk ayrıntıları
- Tarih: 2026-10-19 · Faz 1 · Gerekçe: (1) Varsayılan yuva pozisyonları: arama 3 ve 13 (ilk 10'da ≤ 1), kategori/keşif 3 ve 8, detay kutusu 1, ana sayfa 2 ve 4 (D11'de render). (2) Tüm hub türleri "kategori/keşif listesi" yuvasını kullanır. (3) Hedef kategori verilmiş yerleşim yalnızca o kategori (ya da alt kategorisi) bağlamında; hedef il verilmişse yalnızca o il bağlamında sunulur; hedefsiz yerleşim alaka denetimiyle her bağlamda aday olur. (4) Kampanya yalnızca taslakta düzenlenir; tutar ve sözleşme referansı her durumda (yetkiyle). (5) Satış ve editoryal onayı aynı kişi veremez. (6) Kreatif yalnızca kısa başlık (kartta alt başlık yerine); görsel kreatif D11'e. (7) Personel/önizleme trafiğinin ayıklanması: önizleme yüzeyinde yerleşim yok; personel oturumu web'de ayrı tanınmadığından (panel ayrı alan adı) ayrıca işaretlenmiyor — D12 analitikte yeniden ele alınır. (8) Rıza altyapısı (D10) gelene kadar hedefleme yalnızca bağlamsal; kişisel sinyal hiç kullanılmıyor (REQ-SPN-012). (9) Görüntülenen gösterim olayı uç noktası IP öneki başına saatte 300 ile sınırlı.
- Etkilediği REQ'ler: REQ-SPN-001…013, REQ-GUN-004 · Geri alma maliyeti: Düşük · Durum: AÇIK

## A-022: Hesap silme ve kaydedilenler ayrıntıları
- Tarih: 2026-10-19 · Faz 1 · Gerekçe: (1) Geri alma penceresi 30 gün (REQ-HSP-011 varsayılanı); iptal yalnızca e-postadaki tek kullanımlık bağlantıyla (giriş silme beklerken kapalı, hata mesajı yolu gösterir). (2) Varsayılan "içeriklerimi de sil": değerlendirmeler, taslaklar, itirazlar silinir; kullanıcının açtığı bildirimler moderasyon kaydı olarak kalır ama bildiren kimliği ayrılır. "Anonim kalsın" L kaydına kadar kapalı. (3) Kullanıcı satırı silinmez, anonimleştirilir (e-posta `silinmis-{id}@silinmis.invalid`, ad "Silinmiş üye", kullanılamaz parola, durum DELETED): denetim kayıtlarının bütünlüğü için; denetim kayıtlarının saklama süresi hukuki incelemeyle belirlenecek (REQ-KVK-023, D10c). (4) Personel hesabı self-servis silinemez (409); yetkiler önce yönetici tarafından kaldırılır. (5) Girişsiz yol (`/hesap-silme`): onay bağlantısı 1 saat geçerli; yanıt hesabın varlığını sızdırmaz; e-postadaki bağlantılar sayfayı açar, işlem ayrıca düğmeyle yapılır (bağlantı önizleyicileri belirteci tüketmesin). (6) Silme işi worker'da 10 dakikada bir, partide en çok 50 hesap. (7) Kaydedilenler yalnızca sahibine görünür; kaydetme saatte 120 ile sınırlı; listeleme sayfası ISR'de kaldığı için düğme durumu istemcide alınır.
- Etkilediği REQ'ler: REQ-HSP-011/012, REQ-KVK-020/021 · Geri alma maliyeti: Düşük · Durum: AÇIK

## A-023: Çerez onay yönetimi (CMP) ayrıntıları
- Tarih: 2026-10-19 · Faz 1 · Gerekçe: (1) Hazır CMP ürünü yerine birinci taraf, bağımlılıksız bileşen (üçüncü taraf istek yok; lisans/sır gerekmez). (2) Tercih çerezi `cerez_tercihi` zorunlu kategoride: rastgele anonim kimlik + üç bayrak + zaman; ömrü 180 gün (sonra bant yeniden gösterilir) — süre hukuki incelemeyle kesinleşir. (3) Bant sayfanın altında sabit, içeriği engellemez; üç düğme aynı sınıf/boyut/katman. (4) Her karar `consent_records`'a kategori başına satır olarak eklenir (geçmiş korunur); IP yerine sunucu anahtarlı karma; oturum varsa üyeye bağlanır, hesap silinince ayrılır. (5) Faz 1'de analitik/pazarlama aracı yok: `ConsentGate` hazır, E2E-016 (c) adımı ("yalnızca analitik istekleri başlar") araç seçilince (D12) eklenecek. (6) Sponsorluk ve dış yönlendirme sayaçları çerezsiz, sunucu tarafı, günlük tuzlu karma ile (REQ-KVK-013) — rıza gerektirmez. (7) Metin sürümü `2026-10-taslak` (TASLAK; hukuki onayla değişir).
- Etkilediği REQ'ler: REQ-KVK-002/003/010…014 · Geri alma maliyeti: Düşük · Durum: AÇIK

## A-024: KVKK başvuruları, hukuki metin sürümleri ve saklama ayrıntıları
- Tarih: 2026-10-19 · Faz 1 · Gerekçe: (1) `compliance_config` = `platform_settings.compliance`; ayar yoksa varsayılanlar (başvuru yanıtı 30 gün, hesap silme 30 gün, saklama süreleri `docs/legal/saklama-imha-politikasi.md`). Tüm süreler hukuki incelemeyle **doğrulanacak** (L kaydı); kod yasa maddesi varsaymaz. Panelden düzenleme arayüzü sonraya (yalnızca okuma uç noktası var). (2) Uyarılar sürenin 10 ve 3 gün öncesinde (30 günde 20./27. gün), süre aşımında kırmızı alarm. (3) KVKK başvurusu ve ihlal kayıtları yeni izin eklenmeden `audit.read` (Yönetici/Süper yönetici) ile yönetilir; ayrı "KVKK sorumlusu" rolü rol matrisi değişikliği (C sınıfı) olduğundan önerildi, eklenmedi. (4) Girişsiz başvuru imzalı 72 saatlik bağlantıyla doğrulanır; doğrulanmamış başvuru da kaydedilir ve panelde "Kimlik doğrulanmadı" görünür. (5) Hukuki metin sürümleri açılışta arayüz metninden hesaplanan özetle (sha256) kaydedilir; ilk sürümler TASLAK (onaylayan boş) ve esaslı değil; yürürlük tarihi taslak ayının başı (2026-10-01). Esaslı yeni sürümde üye bir sonraki girişte `/kosullar/kabul` sayfasına yönlenir. (6) İhlal kayıtları için yalnızca API (oluştur/listele) var; panel arayüzü ve bildirim akışı sonraya — bildirim C sınıfı. (7) Periyodik imha worker'da günde bir; dağıtım kontrol listesinde onaysız hukuki metin kırmızı madde.
- Etkilediği REQ'ler: REQ-HSP-012, REQ-KVK-001/004/022…025 · Geri alma maliyeti: Düşük · Durum: AÇIK

## A-025: Ana sayfa modülleri
- Tarih: 2026-10-19 · Faz 1 · Gerekçe: (1) Arama kutusu ve başlık modül değil, her zaman en üstte (sponsorlu öğe aramanın üstüne çıkamaz). (2) Varsayılan modüller migration ile A15.4 mobil sırasıyla; bülten modülü yok (e-posta pazarlama sağlayıcısı ve ticari ileti izni yok — AK-06), "Yakınındaki mekanlar" yerine "Şehrini seç" (konum izni istenmez). (3) Kişiselleştirme yalnızca açıkça seçilen il (`?il=`), çerez/davranışsal sinyal yok; rızalı kişiselleştirme sonraya. (4) Sponsorlu modül kuralları: ilk 3 modülde değil, ≤ 2 kart, en çok 2 sponsorlu modül, kartların ≤ %20'si (`homeRuleErrors` + çalışma anında bütçe; DB CHECK sponsorlu kaynağı yalnızca sponsorlu modüle bağlar). (5) Organik içerik modülleri yalnızca ticari ilişkisi olmayan içerikleri gösterir. (6) Önizleme yayındaki hesaplanmış durumdur (kaydedilmemiş taslak önizlemesi yok); platform görünürlük kuralı (web/iOS/Android) Faz 2'de. (7) Modül düzenleme `content.publish` yetkisiyle.
- Etkilediği REQ'ler: REQ-ADM-006, REQ-SPN-003/004 · Geri alma maliyeti: Düşük · Durum: AÇIK

## A-026: Analitik ayrıntıları
- Tarih: 2026-10-19 · Faz 1 · Gerekçe: (1) Üçüncü taraf analitik aracı yok; birinci taraf `analytics_events` (yalnızca analitik onayıyla, vekil onayı tercih çerezinden ayrıca denetler, anonim kimlik çerezden). (2) Aylık bölümleme veri hacmi gerektiğinde (A-020 ile aynı yaklaşım). (3) Davranışsal olaylar dışındaki metrikler mevcut alan tablolarından (search_events, outbound_clicks, sponsored_events, reviews, favorites) hesaplanır; aynı bilgi için ikinci olay tutulmaz. (4) Sorgu panolarında k-anonimlik eşiği 3 (daha az aranan sorgu kişisel veri içerebilir). (5) Personel trafiği: web oturumu personele aitse işaretlenir; içerik önizleme sayfaları olay göndermez. (6) Kuzey yıldızı: `engaged_30s`, `favorite_added` ya da `outbound_click` içeren farklı oturum. Organik trafik: `landing.source = search` (arama konsolu içe aktarımı yok). (7) Gelir raporu yalnızca elle girilen sözleşme tutarlarından; affiliate alanları sağlayıcı raporu olmadan null. (8) Genel pano her personel için açık; analitik panosu `audit.read`, gelir raporu `campaigns.amount`.
- Etkilediği REQ'ler: REQ-ANL-001…006, REQ-ADM-002/010, REQ-KVK-014 · Geri alma maliyeti: Düşük · Durum: AÇIK

## A-027: Sertleştirme ayrıntıları (F1-D13)
- Tarih: 2026-10-19 · Faz 1 · Gerekçe: (1) CSP istek başına nonce + `strict-dynamic` (web ve panel `proxy.ts`); `style-src 'unsafe-inline'` Next/React satır içi `style` öznitelikleri nedeniyle (betik yürütmez); geliştirmede yalnızca `'unsafe-eval'`. Panelin tüm sayfaları dinamik (`connection()`), nonce statik HTML'e giremez. (2) Konum izni hiçbir sayfada gerekmediğinden `geolocation=()`; "yakınımda" eklenince yalnızca o rotada açılır. (3) API: JSON gövde sınırı body-parser varsayılanı 100 KB (yükleme uç noktaları multipart, ayrı sınır); body-parser hataları 4xx problem. (4) Log: Nest varsayılan biçimi yerine `JsonLogger` (maskeleme kalıpları: e-posta, TR telefon, TCKN, IBAN, IPv4, Bearer; sır anahtarları). (5) İlk yükleme JS ölçümü: sunucu HTML'indeki `<script src>` (nomodule hariç) dosyalarının gzip toplamı, E2E'de; Lighthouse CI kurulmadı — ağ/tarayıcı koşulları bu ortamda doğrulanamaz, araç seçimi Faz 2 başında ADR ile (PRF-002 KISMİ). (6) İstemci paketleri `@incelemeler/contracts` kök modülünü (zod) içe aktarmaz; zod içermeyen yardımcılar alt yoldan (`/consent-cookie`).
- Etkilediği REQ'ler: REQ-GUV-002/003/004/005/014/015/016, REQ-ERS-004/008, REQ-PRF-002/004 · Geri alma maliyeti: Düşük · Durum: AÇIK

## A-028: Hesapsız başvurular (F1-D15)
- Tarih: 2026-10-19 · Faz 1 · Gerekçe: (1) İşletme ve reklam başvuruları tek `applications` tablosunda (tür + türe özgü JSON yükü sözleşmeyle doğrulanır). (2) Doğrulama: imzalı, 72 saat geçerli e-posta bağlantısı; doğrulanmamış başvuru kuyruğa düşmez ve 7 gün sonra silinir, reddedilen 365 gün sonra (saklama politikası TASLAK). (3) Görünürlük mevcut izinlerden: işletme başvurusu `listings.write`, reklam başvurusu `campaigns.manage` (rol matrisi değişmedi). (4) İşletme onayı, doğrulanmamış kaynak notuyla EDITORIAL kökenli **taslak** listeleme oluşturur; yayın her zamanki yayın kurallarına ve editoryal doğrulamaya bağlı. (5) Başvuruyla eklenebilen türler: mekan, hizmet sağlayıcı, turist rehberi, tur/aktivite; konaklama hukuki kapı (REQ-KAT-004) açılana dek dışarıda. (6) Belge yükleme kapalı: anonim dosya yüklemesi kötü amaçlı içerik taraması (X-010) olmadan açılmaz (REQ-GUV-008); gerekirse belge e-postayla istenir. (7) Reklam başvurusundaki ticari ileti izni ayrı, isteğe bağlı ve işaretsiz; yalnızca zaman damgası saklanır, İYS'ye aktarılmaz ve bu izinle ileti gönderilmez (L-012). (8) "Kurumsal e-posta" zorunlu tutulmaz; ücretsiz sağlayıcı alan adları panelde inceleme sinyali olarak işaretlenir. (9) Hız sınırı: aynı ağdan saatte 5, aynı e-postayla günde 3 başvuru.
- Etkilediği REQ'ler: REQ-ISL-001, REQ-ISL-002, REQ-GUN-008, REQ-KVK-023 · Geri alma maliyeti: Düşük · Durum: AÇIK

## A-029: Hız sınırı sınıfları, step-up kapsamı ve veritabanı rolleri (F1-D16a)
- Tarih: 2026-10-19 · Faz 1 · Gerekçe: (1) Rota sınıfı sınırları dakikalık sabit pencere, PostgreSQL sayaçlarıyla (A-006): kimlik 30, yazma 60, arama 120, yönlendirme 60 (IP /24 öneki başına), panel 600 (kullanıcı başına); önbellekli herkese açık okumalar sınıfsız. Her sınıflandırılmış istek bir UPSERT ekler — ölçülmüş darboğazda Redis (§14.4). `RATE_LIMIT_MULTIPLIER` yalnızca testlerde > 1 (üretimde 1 zorunlu, env doğrulaması). (2) Step-up penceresi 10 dk; kapsam: rol atama, kampanya tutarı, içe aktarma geri alma, gelir raporu. Uyum ayarlarının güncelleme uç noktası ve hukuki kapı API'si yok. (3) Roller: uygulama (DML), salt okunur (raporlama/replika), migration (şema sahibi). Yerel geliştirme sahip rolüyle çalışabilir; E2E ve staging/üretim uygulama rolüyle. Yönetilen veritabanında rol oluşturma yetkisi barındırma kararına bağlıdır (Q-005).
- Etkilediği REQ'ler: REQ-GUV-009, REQ-GUV-011, REQ-GUV-017, REQ-HSP-007 · Geri alma maliyeti: Düşük · Durum: AÇIK

## A-030: Yaptırım basamakları ve değerlendirme bütünlüğü (F1-D16b)
- Tarih: 2026-10-19 · Faz 1 · Gerekçe: (1) Basamak önerisi son 365 gündeki kaldırılmamış yaptırımların en yükseğinin bir üstü; atlama yalnızca işaretli ve notta gerekçeli (`skipped_level` denetim kaydında). (2) Süreler: kısıtlama ve askı 1–90 gün; uyarı ve kalıcı kapatma süresiz. (3) Askı ve kalıcı kapatma oturumları kapatır, girişi engeller; süresi dolan askı girişte ve işçide (10 dk) kalkar. (4) İtiraz 14 gün geçerli imzalı e-posta bağlantısıyla, bir kez; karar verenin yaptırımı uygulayandan farklı olması API ve CHECK kısıtıyla. (5) Personel hesapları bu akışla yaptırılamaz (rol yönetimi ayrı). Kalıcı kapatma step-up ister. (6) Toplu sahte değerlendirme temizliğinde gerekçe kodu `NOT_PERSONAL_EXPERIENCE`; yazarlar mevcut itiraz akışını kullanır; listeleme bildirimi 180 gün görünür. (7) Yetki: `reviews.moderate` (rol matrisi değişmedi).
- Etkilediği REQ'ler: REQ-GUN-007, REQ-GUN-003 · Geri alma maliyeti: Düşük · Durum: AÇIK

## A-031: Hukuki talepler ve bildirim-kaldırma (F1-D16c)
- Tarih: 2026-10-19 · Faz 1 · Gerekçe: (1) Herkese açık form (`/hukuki-talep`) yalnızca telif, kişilik hakkı ve diğer hukuki talepler; mahkeme ve idari kararlar ayrı akışta — yalnızca panelden, karar sayı/tarihiyle (API + CHECK). (2) Yanıt süresi varsayılanları (saat): kişilik hakkı 24, mahkeme 24, idari 24, telif 72, diğer 168 — **hukuken doğrulanmadı** (L-013); `compliance_config` üzerinden değişir. (3) Belgeler: anonim dosya yükleme X-010 olmadan kapalı; talep kaydı belge açıklamasını tutar, belgeler e-postayla istenir. (4) Değerlendirme hedefinde "işlem yapıldı" kararı değerlendirmeyi `LEGAL_REQUEST`/`COURT_ORDER` gerekçesiyle kaldırır ve istatistikten çıkarır; listeleme/içerik/görsel hedeflerinde işlem ilgili editör ekranlarından yapılır, karar kaydı burada. (5) Yetki `audit.read` (KVKK başvurularıyla aynı, A-024). (6) Kayıtların saklama süresi doğrulanacak; şimdilik imha işinde yok.
- Etkilediği REQ'ler: REQ-GUN-005, REQ-VER-020 · Geri alma maliyeti: Düşük · Durum: AÇIK

## A-032: Özellik bayrakları, işletim anahtarları ve kapsam mandalı (F1-D17)
- Tarih: 2026-10-19 · Faz 1 · Gerekçe: (1) Özellik bayrakları kodda (contracts/operations.ts), uzaktan servis yok (§12.8); durum değişikliği kod incelemesiyle. (2) İşletim anahtarları `platform_settings` içinde; API örnek başına 5 sn önbellek, web vekili bakım durumunu 10 sn önbellekler (çok örnekte en fazla bu gecikme). Yetki: `system.settings` ya da `audit.read` (süper yönetici ve yönetici; matris değişmedi). (3) Bakım modu yalnızca herkese açık siteyi kapatır; panel ve API sağlık uçları açık kalır; değerlendirme ve kayıt da kapanır. (4) "Dış entegrasyonlar" Faz 1'de bağlantı sağlığı denetimini kapsar (sağlayıcı adaptörü yok). (5) Kapsam eşikleri mandal: kritik modüllerin dal eşiği bugünkü değerlerde, yalnızca yükseltilebilir; hedef %85 (TST-002 KISMİ). (6) Yerel geri yükleme tatbikatı Docker'daki geliştirme veritabanıyla.
- Etkilediği REQ'ler: REQ-MIM-017, REQ-OPS-009, REQ-TST-002, REQ-OPS-005 · Geri alma maliyeti: Düşük · Durum: AÇIK

## A-033: Çalışma saatleri modeli ve "Şu an açık" (F1-D18a)
- Tarih: 2026-10-23 · Faz 1 · Gerekçe: (1) Haftalık aralık dakika cinsinden (0–1440); kapanış ≤ açılış ise aralık ertesi güne taşar (18:00–02:00); 00:00–24:00 gün boyu açık. (2) Tarihli özel gün o günün haftalık aralıklarının yerine geçer (kapalı ya da özel saat); önceki günden taşan aralık özel günden etkilenmez. (3) Saat dilimi listeleme başına (varsayılan Europe/Istanbul), veritabanında geçerlilik CHECK'i. (4) "Şu an açık" yalnızca sunucuda hesaplanır; haftalık düzen yoksa durum bilinmiyor ve arama filtresinde açık sayılmaz (yanıltıcı "açık" yok — AK-02). (5) Panelde gün başına en çok iki aralık, özel günler satır biçiminde ("2026-10-29 kapalı Not"); API en çok 28 aralık / 60 özel gün kabul eder. (6) Herkese açık detayda son 2 günden eski özel günler gösterilmez. (7) Demo listelemelere saat eklenmedi (kurgusal saat üretmemek için); E2E saatleri panelden girer.
- Etkilediği REQ'ler: REQ-VER-010, REQ-TST-004, REQ-ARA-012 · Geri alma maliyeti: Düşük · Durum: AÇIK

## A-034: Editör değerlendirmesi sürümleme ve yayın (F1-D18b)
- Tarih: 2026-10-23 · Faz 1 · Gerekçe: (1) Her kayıt yeni sürüm (listeleme başına tek `is_current`); sürüm içeriği tetikleyiciyle değişmez, yalnızca güncellik ve bir kez yayın bilgisi yazılır. (2) Yayın ayrı adım; herkese açık sayfa yayımlanan en son sürümü gösterir, yeni taslak yayımlanana dek eski sürüm kalır. (3) Deneyime dayanan değerlendirmede puan zorunlu; RESEARCH_ONLY'de puan ve ölçüt yok. Genel puan ölçütlerin ağırlıklı ortalamasından hesaplanmaz (editör kararı; ölçütler bilgi amaçlı). (4) Okuma dahil tüm panel uçları `editorial.verdict.write` ister (REQ-GUN-012; rol matrisi değişmedi). (5) Sponsorlu içeriğe bağlanamaz (REQ-SPN-007). (6) Eşzamanlı kayıt taban sürümle denetlenir (412, depodaki iyimser kilit kalıbı). (7) Demo veriye editör değerlendirmesi eklenmedi (kurgusal puan üretmemek için — AK-02).
- Etkilediği REQ'ler: REQ-VER-005, REQ-VER-004, REQ-ICR-007, REQ-GUN-012, REQ-SPN-007 · Geri alma maliyeti: Düşük · Durum: AÇIK
