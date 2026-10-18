# EK A — AYRINTILI GEREKSİNİMLER

Bu ek, v1 §3–§18'in REQ kimlikli, ölçülebilir yeniden yazımıdır. Biçim: `REQ-<ALAN>-<NNN> · DÜZEY · Faz — gereksinim`. Faz 0'da her alan `docs/requirements/<ALAN>.md` dosyasına aktarılır ve her ZORUNLU/OLMALI REQ'e kabul kriteri + doğrulama yöntemi eklenir (§3.3, §12.10). Burada kabul kriteri verilenler doğrudan aktarılır.

---

## A1 — Mimari ve API (MIM)

### A1.1 Monorepo yerleşimi (varsayılan; değişiklik ADR ile)

```
incelemeler/
├─ apps/
│  ├─ web/          # Next.js (App Router) — son kullanıcı sitesi; SSR/ISR
│  ├─ admin/        # Next.js — yönetim paneli (+ Faz 3'te işletme/reklamveren portalı); ayrı alt alan adı
│  ├─ api/          # NestJS — main.ts (HTTP API) ve worker.ts (arka plan işleri) giriş noktaları
│  └─ mobile/       # Expo / React Native (Faz 2'de oluşturulur)
├─ packages/
│  ├─ contracts/    # zod şemaları: DTO'lar, enum'lar, içerik blok şemaları, hata kodları (tek doğruluk kaynağı)
│  ├─ api-client/   # OpenAPI'den ÜRETİLEN tipli istemci (elle düzenleme YASAK)
│  ├─ routes/       # URL/yol tablosu — web ve mobil derin bağlantılar aynı tabloyu kullanır
│  ├─ tokens/       # tasarım token'ları (JSON) → Tailwind preset + React Native tema
│  ├─ ui-web/       # web + admin ortak React bileşenleri (Storybook)
│  ├─ ui-native/    # mobil ortak bileşenler (Faz 2)
│  ├─ i18n/         # tr-TR metin kataloğu (web + mobil ortak)
│  ├─ utils/        # saf fonksiyonlar: slugifyTr, normalizeTr, para/tarih/saat biçimleri, çoğul/ek yardımcıları
│  └─ config/       # eslint, tsconfig, prettier, test ortak ayarları
├─ infra/           # docker-compose, IaC taslakları
├─ scripts/         # init.sh, req-check, temiz-klon testi
└─ docs/            # §10 hafıza dosyaları, architecture/, product/, ux/, legal/, requirements/, demos/
```

| ID | Düzey · Faz | Gereksinim |
|---|---|---|
| REQ-MIM-001 | ZORUNLU · 0 | Veritabanına (Prisma Client) **yalnızca** `apps/api` erişir. web/admin/mobile yalnızca `packages/api-client` üzerinden API'yi çağırır. `packages/*` hiçbir zaman `apps/*` içinden import etmez. Döngüsel bağımlılık yok. Kurallar dependency-cruiser (ya da eşdeğeri) ile CI'da zorlanır. |
| REQ-MIM-002 | ZORUNLU · 0 | `packages/contracts` tarayıcı ve React Native'de çalışır (Node'a özgü modül içermez). |
| REQ-MIM-003 | ZORUNLU · 0 | Faz 0'da `docs/architecture/` altında: bileşen diyagramı (mermaid), ER diyagramı + tablo sözlüğü, izin matrisi, sayfa türü → render/önbellek tablosu. |
| REQ-MIM-004 | ZORUNLU · 1 | NestJS modülleri ve tablo sahipliği aşağıdaki gibidir; bir modül başka modülün tablosuna doğrudan yazmaz (servis arayüzü ya da domain olayı kullanır). `forwardRef` döngüsel bağımlılık YASAK. |

**Backend modülleri (varsayılan):** `identity` (kullanıcı, kimlik bilgisi, OAuth, oturum, MFA) · `access` (rol, izin, kuruluş üyeliği, policy servisi) · `taxonomy` (kategori, özellik şeması, etiket) · `geo` (idari bölgeler, destinasyon, adres) · `catalog` (listeleme + tür uzantıları, kuruluş, sahiplenme, çalışma saatleri) · `editorial` (makale, revizyon, yazar, editör değerlendirmesi) · `reviews` (kullanıcı değerlendirmesi, kriter puanları, faydalı oy, işletme yanıtı, puan özetleri) · `moderation` (bildirim, vaka, işlem, itiraz, kaldırma talebi) · `media` · `search` (okuma modeli, eş anlamlılar, arama olayları) · `commerce` (dış yönlendirme, affiliate, entegrasyon sağlayıcısı, fiyat bilgisi) · `ads` (kampanya, yuva, yerleşim, kreatif, reklam olayları) · `engagement` (favori, koleksiyon) · `notifications` · `analytics` · `compliance` (rıza, hukuki metin sürümleri, veri talepleri, lisans doğrulamaları) · `platform` (bayraklar, ayarlar, yönlendirmeler, slug geçmişi, outbox, denetim kaydı, idempotency).

| ID | Düzey · Faz | Gereksinim |
|---|---|---|
| REQ-MIM-005 | ZORUNLU · 1 | `search`, `catalog`, `reviews` modülleri `ads` ve `commerce` modüllerini import etmez; organik sıralama kodunun kampanya/affiliate verisine erişimi yoktur. Sponsorlu yerleşimler sunum katmanında ayrı çağrıyla birleştirilir (AK-04). |
| REQ-MIM-006 | ZORUNLU · 1 | OpenAPI 3.x şeması koddan (zod/DTO) üretilir; `packages/api-client` bu şemadan üretilir; CI'da üretilen dosyada fark varsa kırmızı. |
| REQ-MIM-007 | ZORUNLU · 1 | API tabanı `/v1`; kaynak adları çoğul ve kebab-case; JSON alanları camelCase; zaman damgaları ISO 8601 UTC (`Z`); kimlikler opak dizedir. |
| REQ-MIM-008 | ZORUNLU · 1 | Genel (public) listelerde **cursor** sayfalama: `?limit=20&cursor=…` (limit ≤ 100); yanıt `{ data, page: { nextCursor, hasMore } }`; cursor imzalı ve sıralama her zaman benzersiz id ile bağlanır. Offset yalnızca yönetim tablolarında (≤ 10.000 satır). |
| REQ-MIM-009 | ZORUNLU · 1 | Filtreler beyaz listelidir; kategoriye özgü filtreler `attr.<key>` önekiyle ve yalnızca `filterable=true` özellikler için kabul edilir; bilinmeyen parametre 400. **"Sponsorlu sıralama" diye bir parametre yoktur.** |
| REQ-MIM-010 | ZORUNLU · 1 | Hatalar RFC 9457 `application/problem+json` biçimindedir; kararlı makine kodu (`code`), `traceId`, alan hataları (`errors[].pointer`). `detail` yığın izi/SQL/iç bilgi içermez. Türkçe kullanıcı mesajları istemcide `code` üzerinden eşlenir. |
| REQ-MIM-011 | ZORUNLU · 1 | Durum değiştiren ve tekrar edilebilecek POST'larda `Idempotency-Key` desteği (değerlendirme gönderme, başvuru formları, kampanya oluşturma). Eşzamanlı düzenleme için `version` alanı + `If-Match`/412 (içerik, listeleme, kampanya). |
| REQ-MIM-012 | OLMALI · 1 | Genel GET yanıtlarında `ETag` ve uygun `Cache-Control`; kişisel yanıtlarda `private, no-store`. |
| REQ-MIM-013 | ZORUNLU · 1 | Render stratejisi ADR-0009'da sayfa türü başına tanımlanır (ör. listeleme/içerik: ISR + olay tabanlı yeniden doğrulama; arama: SSR, `noindex`; hesap sayfaları: dinamik, `no-store`). |
| REQ-MIM-014 | ZORUNLU · 1 | **Önbellek geçersiz kılma:** İçerik yayımı, listeleme güncellemesi, değerlendirme yayımı/kaldırması, kampanya başlangıç/bitişi ve kaldırma kararları ilgili sayfaların yeniden doğrulamasını tetikler. Bitiş anı geçmiş bir sponsorlu yerleşim, bitişten sonra en geç 60 sn içinde hiçbir yüzeyde (SSR, ISR, mobil API, CDN) görünmez — testli. |
| REQ-MIM-015 | ZORUNLU · 1 | Domain olayları **transactional outbox** ile yayınlanır (arama indeksi, puan özetleri, önbellek geçersiz kılma, bildirimler, analitik). İşleyiciler idempotent; yeniden deneme ve ölü mektup kaydı vardır. |
| REQ-MIM-016 | ZORUNLU · 1 | Arka plan işleri için ilk seçenek PostgreSQL tabanlı kuyruktur; Redis/BullMQ yalnızca §14.4 tetikleyicisiyle. |
| REQ-MIM-017 | ZORUNLU · 1 | Merkezi, tipli özellik bayrağı kaydı (§12.8) ve "entegrasyon yetenek" bayrakları (ör. `capabilities.hotelAvailability = false`). |
| REQ-MIM-018 | ZORUNLU · 1 | Yapılandırma ortam değişkenlerinden okunur ve açılışta şema ile doğrulanır; eksik/geçersiz değişkende uygulama başlamaz ve hangi değişkenin eksik olduğunu (değerini değil) yazar. |

---

## A2 — Veri modeli (VER)

### A2.1 İlkeler

- **Kategori = veri, tür (kind) = kod** (Ç-11). `Listing.kind` küçük ve sabit bir enum'dur; davranışı belirler. Kategori ve özellikler panelden sınırsız eklenir.
- **Hibrit model:** Tüm türlerin ortak alanları `listings` tablosunda; sorgulanan ya da davranış gerektiren yapısal alanlar **1:1 tür uzantı tablolarında**; kategoriye özgü, değişken ve az sorgulanan alanlar `listings.attributes` JSONB alanında (kategori şemasına karşı doğrulanır). **Saf EAV YASAK.** Dikeye özel ayrı ana tablolar (Hotels, Products, CarRentalProviders, TourGuides) kurulmaz.
- Filtreleme performansı için JSONB'den türetilen bir **facet projeksiyonu** (ör. `listing_facets(listing_id, key, value_text, value_num, value_bool)`) kullanılabilir; projeksiyon outbox ile güncellenir.

### A2.2 Listeleme türleri (kind) ve uzantılar

| kind | Kapsam | Uzantı tablosu (yapısal alanlar) | schema.org (aday) |
|---|---|---|---|
| `PLACE` | Restoran, kafe, kahvaltıcı, bar, pastane, eğlence mekanı, güzellik merkezi gibi fiziksel nokta | adres, `geo geography(Point,4326)`, telefon, web, rezervasyon URL'si, fiyat seviyesi, çalışma saatleri | `Restaurant`/`FoodEstablishment`/`LocalBusiness` alt tipleri |
| `LODGING` | Otel, butik otel, tatil köyü, pansiyon, apart, kiralık tatil evi, kamp/karavan | adres, geo, resmî yıldız (varsa), giriş/çıkış saati, **turizm belgesi no + belge türü + doğrulama tarihi**, oda tipleri (`lodging_room_types`) | `Hotel`/`LodgingBusiness`/`VacationRental` |
| `PRODUCT` | Fiziksel/dijital ürün (model bazında): telefon, kulaklık, otomobil, beyaz eşya, kozmetik… | marka (`Organization`), model adı, model yılı, GTIN/MPN, çıkış tarihi; varyantlar (`product_variants`: renk, depolama) | `Product` |
| `SERVICE_PROVIDER` | Araç kiralama firması, transfer, temizlik, taşınma, kuaför zinciri, seyahat acentesi | hizmet bölgeleri (idari bölge listesi), fiziksel şube var mı; araç kiralama için teslim noktaları (`pickup_points`: havalimanı/ofis/otel teslim), araç sınıfları, sürücü gereksinimleri (yaş, ehliyet süresi, depozito) | `AutoRental`/`LocalBusiness`/`TravelAgency` |
| `GUIDE_PERSON` | Turist rehberi (kişi) | diller (ISO 639-1), uzmanlık alanları, hizmet bölgeleri, **ruhsat/kokart no + doğrulama durumu + tarihi**, kamuya açık profil rızası | `Person` + `Service` (doğrulanmalı) |
| `EXPERIENCE` | Tur, aktivite, tekne turu, balon turu, gastronomi/fotoğraf turu | süre, buluşma noktası, diller, operatör kuruluş, **operatör belge no** (acenta gerekiyorsa), yaş/zorluk | `TouristTrip`/`Event` (doğrulanmalı) |
| `POI` | İlgi noktası: müze, plaj, doğa alanı, kültürel mekan, manzara noktası | geo, ziyaret saatleri, giriş ücreti bilgisi (kaynaklı) | `TouristAttraction`/`Beach`/`Museum` |
| `DESTINATION` | İl, ilçe, bölge, tatil bölgesi | `admin_area_id`, sınır (MultiPolygon, isteğe bağlı), en iyi ziyaret dönemi | `Place`/`City`/`TouristDestination` |
| `EVENT` | Konser, sergi, festival, tiyatro (tarihli) | başlangıç/bitiş, mekan listelemesi, bilet bağlantısı | `Event` |
| `WORK` (Faz 4) | Film, dizi, oyun, kitap, müzik, dijital yayın platformu | tür, yıl, dış kimlikler (lisansı doğrulanmış kaynaktan) | `Movie`/`Book`/`VideoGame` … |

Yeni `kind` eklemek kod değişikliği + ADR gerektirir. Kategori ve özellik eklemek gerektirmez.

### A2.3 Tablolar ve gereksinimler

| ID | Düzey · Faz | Gereksinim |
|---|---|---|
| REQ-VER-001 | ZORUNLU · 0 | `listings` ortak alanları: `id, kind, slug, name, shortDescription, primaryCategoryId, organizationId?, status, primaryMediaId?, priceLevel?, attributes JSONB, attributeSchemaVersion, dataOrigin, source, sourceVerifiedAt?, publishedAt, updatedAt, deletedAt, version`. |
| REQ-VER-002 | ZORUNLU · 1 | `categories`: ağaç (closure table ya da `ltree`), `allowedKinds[]`, sıralama, SEO alanları ve **kategori bayrakları**: `ymyl`, `requiresExpertReview`, `ugcEnabled`, `sponsorshipAllowed`, `requiresLicense` (+ lisans türü), `legalGate`. Kod bu bayraklara göre davranır (ör. `sponsorshipAllowed=false` kategoride yerleşim oluşturulamaz). |
| REQ-VER-003 | ZORUNLU · 1 | `attribute_definitions`: `key, label(i18n), type (bool/enum/multi_enum/int/decimal+unit/text/date), options, filterable, showOnCard, required, unit, validation`; kategoriye bağlı ve **sürümlü** şema. `listings.attributes` yazılırken şemaya karşı doğrulanır; geçersiz veri kaydedilmez. |
| REQ-VER-004 | ZORUNLU · 1 | **Editör puanı ve kullanıcı puanı ayrı tablolarda ve ayrı API alanlarındadır** (`editorialVerdict.score`, `userRating`). İkisini toplayan/ortalayan fonksiyon, sorgu ya da alan YASAK (kod araması + test). |
| REQ-VER-005 | ZORUNLU · 1 | `editorial_verdicts`: `listingId, articleId?, score (0–10, 0,5 adım), criteria[] (ad, puan, ağırlık), pros[], cons[], summary, experienceType (TESTED_IN_PERSON / VISITED / STAYED / USED_LONG_TERM / RESEARCH_ONLY), testedAt?, authorId, version, isCurrent`. `experienceType=RESEARCH_ONLY` ise `score` boş olmak ZORUNDA. |
| REQ-VER-006 | ZORUNLU · 1 | `user_reviews`: `listingId, userId, rating (1–5 tam sayı), title?, body, criteriaRatings[], experienceType, experienceMonth (YYYY-AA), visitContext? (aile, iş, çift…), verification (SELF_DECLARED / DOCUMENTED / PROVIDER_VERIFIED), status, moderation alanları, language, dataOrigin, createdAt, editedAt, version`. Üye başına listeleme başına **1 aktif** değerlendirme (kısmi benzersiz indeks); düzenlemeler `review_revisions` içinde. |
| REQ-VER-007 | ZORUNLU · 1 | `rating_stats` türetilmiştir (n, ortalama, dağılım, kriter ortalamaları, son 12 ay, Bayes skoru); elle düzenlenemez; değerlendirme durum değişikliklerinden outbox ile yeniden hesaplanır. |
| REQ-VER-008 | ZORUNLU · 1 | `organizations` (type: BUSINESS/BRAND/CHAIN/OPERATOR/ADVERTISER) ve `org_memberships` (kullanıcı × kuruluş × rol: OWNER/MANAGER/AD_MANAGER). İşletme sahibi ve reklamveren **global rol değil**, kuruluş kapsamlı üyeliktir. |
| REQ-VER-009 | ZORUNLU · 1 | `addresses` + `admin_areas` (il / ilçe / mahalle hiyerarşisi; kaynak ve lisansı ADR'de belgelenmiş idari bölge verisi) + `geo geography(Point,4326)` + GiST indeksi. Koordinatlar 6 ondalık hassasiyetle saklanır. |
| REQ-VER-010 | ZORUNLU · 1 | Çalışma saatleri: haftalık düzen (gece yarısını aşan aralıklar dahil: 18:00–02:00), istisnalar (`opening_hours_exceptions`: tarih, kapalı/özel saat, açıklama — resmî ve dini bayramlar), `timezone` (varsayılan `Europe/Istanbul`), `hoursVerifiedAt`. "Şu an açık" hesaplaması sunucuda ve testli. |
| REQ-VER-011 | ZORUNLU · 1 | Para: `amountMinor` (tamsayı kuruş) + `currency` (ISO 4217). Fiyat seviyesi `priceLevel` 1–4 (₺–₺₺₺₺) **göreli** bir göstergedir; anlamı kategori + şehir bazında `docs/`'ta ve sayfada açıklanır (enflasyon nedeniyle sabit TL aralığı kullanılmaz). |
| REQ-VER-012 | ZORUNLU · 1 | `offers` + `price_snapshots`: `source (EDITOR / OWNER / PROVIDER:<ad>)`, `observedAt`, `validUntil?`, `params` (tarih, kişi sayısı, oda tipi, araç sınıfı…), `currency`, `isLive`. `observedAt` + tazelik eşiği aşılan fiyat "güncel" gösterilmez (Ek A9.5). |
| REQ-VER-013 | ZORUNLU · 1 | `slugs` + `slug_history` + `redirects`: slug değişikliğinde eski URL kalıcı 301; silinen listelemede 410 ya da ilgili listeye yönlendirme; yönlendirme zinciri ≤ 1 adım (zincirler sıkıştırılır). |
| REQ-VER-014 | ZORUNLU · 1 | `media_assets`: depolama anahtarı, MIME, boyut, genişlik/yükseklik, odak noktası, blurhash/LQIP, alt metin (tr), **lisans alanları** (Ek A14.6), `exifStripped=true`, yükleyen, `dataOrigin`; `media_usages` ile çoklu kullanım. Lisans alanı eksik görsel yayımlanamaz. |
| REQ-VER-015 | ZORUNLU · 1 | Revizyonlar: `content_revisions` (makale), `listing_revisions` (listeleme alan değişiklikleri; kim, ne zaman, önce/sonra); geri alma desteği. |
| REQ-VER-016 | ZORUNLU · 1 | Yumuşak silme (`deletedAt`) kullanıcı içeriği ve listelemelerde; kişisel veri silme talebinde **anonimleştirme** (Ek A17.4). Saklama süreleri `compliance_config` içinde. |
| REQ-VER-017 | ZORUNLU · 1 | `audit_log` **değiştirilemez**: uygulama rolü yalnızca INSERT yetkisine sahiptir (UPDATE/DELETE izni yok); kayıt: aktör, rol, eylem, hedef tür/id, önce/sonra özeti (kişisel veri maskeli), IP (kısaltılmış), zaman, `traceId`. Kapsam: yönetici işlemleri, rol değişiklikleri, sponsorluk/kampanya değişiklikleri, içerik silme/yayından kaldırma, değerlendirme kaldırma, toplu işlemler, dışa aktarmalar, ayar değişiklikleri, hukuki kapı açma. |
| REQ-VER-018 | ZORUNLU · 1 | `dataOrigin` alanı listeleme, içerik, değerlendirme, kampanya, yerleşim ve olay tablolarında ZORUNLU (§12.4). |
| REQ-VER-019 | ZORUNLU · 1 | İ18n'e hazır içerik: çevrilebilir alanlar için `locale` sütunu ya da çeviri tabloları (ADR); Faz 1'de yalnızca `tr-TR` yayımlanır. |
| REQ-VER-020 | ZORUNLU · 1 | Uyum varlıkları birinci sınıftır: `consent_records`, `legal_document_versions`, `legal_acceptances`, `data_subject_requests`, `takedown_requests`, `license_verifications`, `processor_inventory`, `breach_incidents`, `legal_approvals` (Ek A17). |
| REQ-VER-021 | ZORUNLU · 1 | İndeks planı ADR'de belgelenir; en az: `listings(kind, status, primaryCategoryId)`, GiST(geo), GIN(arama `tsvector`), GIN trigram (normalize ad), `user_reviews(listingId, status, createdAt DESC)`, kısmi benzersiz (aktif değerlendirme), `placements(slotKey, startsAt, endsAt) WHERE status='ACTIVE'`, olay tablolarında zaman bölümleme (aylık). Her indeksin gerekçesi bir sorguya bağlanır; `EXPLAIN` çıktıları kritik sorgular için `docs/architecture/` altında. |
| REQ-VER-022 | ZORUNLU · 1 | **Migration stratejisi:** yalnızca ileri migration; yıkıcı değişiklikler expand/contract ile en az iki sürümde; kolon/tablo silen migration ayrı PR + ADR + yedek doğrulaması; CI'da boş veritabanına tüm migration'lar ve bir önceki sürümden yükseltme test edilir. |
| REQ-VER-023 | ZORUNLU · 1 | Kimlikler: dahili `uuid` (v7 ÖNERİLİR); herkese açık URL'lerde yalnızca slug. |

---

## A3 — Hesap, kimlik doğrulama ve yetkilendirme (HSP)

| ID | Düzey · Faz | Gereksinim |
|---|---|---|
| REQ-HSP-001 | ZORUNLU · 1 | Misafir gezinme: listeleme, içerik, arama, harita hiçbir hesap gerektirmez. Giriş yalnızca eylem anında istenir (kaydet, değerlendirme yaz, başvuru). Giriş duvarı (içeriği hesapla kilitleme) YASAK. |
| REQ-HSP-002 | ZORUNLU · 1 | E-posta + parola ile kayıt; e-posta doğrulama (tek kullanımlık, hash'lenmiş token, 24 saat); parola sıfırlama (30 dk, tek kullanım; sıfırlamada tüm oturumlar iptal). Değerlendirme yazma ve başvuru için doğrulanmış e-posta ZORUNLU. |
| REQ-HSP-003 | ZORUNLU · 1 | Parola hash'i Argon2id (parametreler güncel OWASP Password Storage önerisine göre ADR'de; doğrulanmalı). Parola politikası: en az 10 karakter, bilinen sızıntı listesine karşı kontrol (k-anonimlik ile, yalnızca hash öneki gönderilerek; dış servis X-kaydı), maksimum uzunluk ≥ 64. |
| REQ-HSP-004 | ZORUNLU · 1 | Web: sunucu tarafı oturum; çerez `__Host-` önekli, `HttpOnly`, `Secure`, `SameSite=Lax`. JWT/token `localStorage`/`sessionStorage`'a konmaz. Durum değiştiren isteklerde CSRF koruması (SameSite + Origin kontrolü + token). Oturum ömrü (varsayılan): kayan 30 gün, mutlak 90 gün; personel kayan 12 saat. Kullanıcı aktif oturumlarını görüp iptal edebilir. |
| REQ-HSP-005 | ZORUNLU · 2 | Mobil: kısa ömürlü erişim token'ı (10–15 dk, kişisel veri içermez) + opak, hash'lenmiş, **her kullanımda döndürülen** yenileme token'ı; yeniden kullanım tespitinde tüm aile iptal. Token'lar yalnızca güvenli depoda (iOS Keychain / Android Keystore). |
| REQ-HSP-006 | ZORUNLU · 2 | Google ile giriş ve Apple ile giriş; hesap birleştirme yalnızca iki tarafta doğrulanmış e-posta + kullanıcı onayıyla. Apple özel e-posta aktarma adresleri desteklenir. Mağaza giriş kuralının güncel metni doğrulanır (Ek D1, L-kaydı). |
| REQ-HSP-007 | ZORUNLU · 1 | Personel (süper yönetici, yönetici, editör, yazar, moderatör) için TOTP tabanlı 2FA ZORUNLU; 2FA kurulmadan panel işlevleri açılmaz (403 `MFA_REQUIRED`). 10 kurtarma kodu (hash'li). Kritik işlemlerde (rol değişikliği, kampanya tutarı, toplu silme, dışa aktarma, hukuki kapı) son 10 dk içinde yeniden doğrulama (step-up). |
| REQ-HSP-008 | ZORUNLU · 1 | Hız sınırları (varsayılan): giriş IP başına 10/dk ve hesap başına 5/dk (artan bekleme); parola sıfırlama e-posta başına 3/saat; kayıt IP başına 5/saat; değerlendirme gönderme üye başına 5/gün. Aşımda 429 + `Retry-After`. Yanıtlar hesabın var olup olmadığını açığa vurmaz. |
| REQ-HSP-009 | ZORUNLU · 1 | **Rol × izin matrisi** `docs/requirements/HSP.md` içinde tablo olarak yazılır; her hücre bir yetkilendirme testine bağlanır. Varsayılan özet aşağıdadır. |
| REQ-HSP-010 | ZORUNLU · 3 | Kuruluş kapsamlı yetki: İşletme temsilcisi yalnızca kendi kuruluşunun listelemelerini, yanıtlarını ve raporlarını görür/değiştirir; başka kuruluşun kaynağına erişim 404 döner (IDOR testi). |
| REQ-HSP-011 | ZORUNLU · 1 | Hesap silme web'de (Faz 2'de uygulama içinde de) self-servis; onay adımı + 30 gün geri alma penceresi (varsayılan, B sınıfı) sonrasında anonimleştirme; yayımlanmış değerlendirmelerin akıbeti hukuki karara bağlıdır (L-kaydı) — karar gelene kadar varsayılan: içerik "Silinmiş kullanıcı" olarak anonimleştirilir. |
| REQ-HSP-012 | ZORUNLU · 1 | Kullanıcı verilerini makine tarafından okunabilir biçimde (JSON) dışa aktarabilir; talep kaydı ve süre takibi Ek A17'ye bağlıdır. |
| REQ-HSP-013 | OLMALI · 1 | Kamuya açık profil: görünen ad (gerçek ad zorunlu değil), avatar (isteğe bağlı), şehir (isteğe bağlı), değerlendirme sayısı, üyelik ayı. E-posta, telefon ve kesin konum asla herkese açık değildir. Profil gizlilik ayarı: herkese açık / yalnızca değerlendirmelerde ad. |
| REQ-HSP-014 | ZORUNLU · 1 | Yaş: hizmet 18 yaş ve üzerine yöneliktir (varsayılan, hukuki doğrulama L-kaydı); kayıtta beyan alınır. |

**Rol matrisi (özet; ayrıntı HSP.md'de):**

| Eylem | Süper yön. | Yönetici | Editör | Yazar | Moderatör | Üye | İşletme t. (F3) | Reklamveren t. (F3) |
|---|---|---|---|---|---|---|---|---|
| Rol atama, sistem ayarları, hukuki kapı açma talebi | ✔ | — | — | — | — | — | — | — |
| Kategori/özellik şeması yönetimi | ✔ | ✔ | — | — | — | — | — | — |
| Listeleme oluşturma/düzenleme | ✔ | ✔ | ✔ | taslak | — | düzeltme önerisi | kendi listelemesi: öneri (onaylı) | — |
| İçerik yayımlama | ✔ | ✔ | ✔ | taslak + incelemeye gönder | — | — | — | — |
| Editör değerlendirmesi/puanı | ✔ | ✔ | ✔ | taslak | — | — | — | — |
| Kullanıcı değerlendirmesi moderasyonu | ✔ | ✔ | — | — | ✔ | bildir | bildir + yanıt | — |
| Sponsorluk kampanyası/yerleşim | ✔ | ✔ (tutar alanı: yönetici) | sponsorlu içerik metni | — | — | — | — | kendi kampanyası: başvuru/rapor |
| Affiliate bağlantı yönetimi | ✔ | ✔ | bağlantı ekleme (izinli alanlar) | — | — | — | — | — |
| Denetim kaydı görüntüleme | ✔ | ✔ (salt okunur) | — | — | kendi işlemleri | — | — | — |
| Kişisel veri dışa aktarma (kullanıcı adına) | ✔ | — | — | — | — | kendi verisi | — | — |

**Çıkar çatışması kuralı:** Satış/sponsorluk sorumlusu rolündeki bir personel aynı listelemenin editör değerlendirmesini düzenleyemez; moderatör kendi değerlendirmesini ya da yakını olduğu işletmeyi modere edemez (beyan alanı + kontrol).
