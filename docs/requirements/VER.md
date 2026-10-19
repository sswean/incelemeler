# VER — Veri modeli

> Ek A'dan otomatik aktarıldı (`node scripts/import-requirements.mjs`). Durumlar `requirements.json` içindedir.

### REQ-VER-001
- Düzey: ZORUNLU · Faz: 0 · Kaynak: v2 Ek A
- Gereksinim: `listings` ortak alanları: `id, kind, slug, name, shortDescription, description (blok JSON, kaynaklı; "Hakkında" bölümü), primaryCategoryId, organizationId?, status, primaryMediaId?, priceLevel?, attributes JSONB, attributeSchemaVersion, dataOrigin, source, sourceVerifiedAt?, publishedAt, updatedAt, deletedAt, version`.
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-VER-002
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: `categories`: ağaç (closure table ya da `ltree`), `allowedKinds[]`, sıralama, SEO alanları ve **kategori bayrakları**: `ymyl`, `requiresExpertReview`, `ugcEnabled`, `sponsorshipAllowed`, `requiresLicense` (+ lisans türü), `legalGate`. Kod bu bayraklara göre davranır (ör. `sponsorshipAllowed=false` kategoride yerleşim oluşturulamaz).
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-VER-003
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: `attribute_definitions`: `key, label(i18n), type (bool/enum/multi_enum/int/decimal+unit/text/date), options, filterable, showOnCard, required, unit, validation`; kategoriye bağlı ve **sürümlü** şema. `listings.attributes` yazılırken şemaya karşı doğrulanır; geçersiz veri kaydedilmez.
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-VER-004
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: **Editör puanı ve kullanıcı puanı ayrı tablolarda ve ayrı API alanlarındadır** (`editorialVerdict.score`, `userRating`). İkisini toplayan/ortalayan fonksiyon, sorgu ya da alan YASAK (kod araması + test).
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-VER-005
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: `editorial_verdicts`: `listingId, articleId?, score (0–10, 0,5 adım), criteria[] (ad, puan, ağırlık), pros[], cons[], summary, experienceType (TESTED_IN_PERSON / VISITED / STAYED / USED_LONG_TERM / RESEARCH_ONLY), testedAt?, authorId, version, isCurrent`. `experienceType=RESEARCH_ONLY` ise `score` boş olmak ZORUNDA.
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-VER-006
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: `user_reviews`: `listingId, userId, rating (1–5 tam sayı), title?, body, criteriaRatings[], experienceType, experienceMonth (YYYY-AA), visitContext? (aile, iş, çift…), verification (SELF_DECLARED / DOCUMENTED / PROVIDER_VERIFIED), status, moderation alanları, language, dataOrigin, createdAt, editedAt, version`. Üye başına listeleme başına **1 aktif** değerlendirme (kısmi benzersiz indeks); düzenlemeler `review_revisions` içinde.
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-VER-007
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: `rating_stats` türetilmiştir (n, ortalama, dağılım, kriter ortalamaları, son 12 ay, Bayes skoru); elle düzenlenemez; değerlendirme durum değişikliklerinden outbox ile yeniden hesaplanır.
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-VER-008
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: `organizations` (type: BUSINESS/BRAND/CHAIN/OPERATOR/ADVERTISER) ve `org_memberships` (kullanıcı × kuruluş × rol: OWNER/MANAGER/AD_MANAGER). İşletme sahibi ve reklamveren **global rol değil**, kuruluş kapsamlı üyeliktir.
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-VER-009
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: `addresses` + `admin_areas` (il / ilçe / mahalle hiyerarşisi; kaynak ve lisansı ADR'de belgelenmiş idari bölge verisi) + `geo geography(Point,4326)` + GiST indeksi. Koordinatlar 6 ondalık hassasiyetle saklanır.
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-VER-010
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: Çalışma saatleri: haftalık düzen (gece yarısını aşan aralıklar dahil: 18:00–02:00), istisnalar (`opening_hours_exceptions`: tarih, kapalı/özel saat, açıklama — resmî ve dini bayramlar), `timezone` (varsayılan `Europe/Istanbul`), `hoursVerifiedAt`. "Şu an açık" hesaplaması sunucuda ve testli.
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-VER-011
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: Para: `amountMinor` (tamsayı kuruş) + `currency` (ISO 4217). Fiyat seviyesi `priceLevel` 1–4 (₺–₺₺₺₺) **göreli** bir göstergedir; anlamı kategori + şehir bazında `docs/`'ta ve sayfada açıklanır (enflasyon nedeniyle sabit TL aralığı kullanılmaz).
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-VER-012
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: `offers` + `price_snapshots`: `source (EDITOR / OWNER / PROVIDER:<ad>)`, `observedAt`, `validUntil?`, `params` (tarih, kişi sayısı, oda tipi, araç sınıfı…), `currency`, `isLive`. `observedAt` + tazelik eşiği aşılan fiyat "güncel" gösterilmez (Ek A9.4).
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-VER-013
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: `slugs` + `slug_history` + `redirects`: slug değişikliğinde eski URL kalıcı 301; silinen listelemede 410 ya da ilgili listeye yönlendirme; yönlendirme zinciri ≤ 1 adım (zincirler sıkıştırılır).
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-VER-014
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: `media_assets`: depolama anahtarı, MIME, boyut, genişlik/yükseklik, odak noktası, blurhash/LQIP, alt metin (tr), **lisans alanları** (Ek A14.6), `exifStripped=true`, yükleyen, `dataOrigin`; `media_usages` ile çoklu kullanım. Lisans alanı eksik görsel yayımlanamaz.
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-VER-015
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: Revizyonlar: `content_revisions` (makale), `listing_revisions` (listeleme alan değişiklikleri; kim, ne zaman, önce/sonra); geri alma desteği.
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-VER-016
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: Yumuşak silme (`deletedAt`) kullanıcı içeriği ve listelemelerde; kişisel veri silme talebinde **anonimleştirme** (Ek A17.4). Saklama süreleri `compliance_config` içinde.
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-VER-017
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: `audit_log` **değiştirilemez**: uygulama rolü yalnızca INSERT yetkisine sahiptir (UPDATE/DELETE izni yok); kayıt: aktör, rol, eylem, hedef tür/id, önce/sonra özeti (kişisel veri maskeli), IP (kısaltılmış), zaman, `traceId`. Kapsam: yönetici işlemleri, rol değişiklikleri, sponsorluk/kampanya değişiklikleri, içerik silme/yayından kaldırma, değerlendirme kaldırma, toplu işlemler, dışa aktarmalar, ayar değişiklikleri, hukuki kapı açma.
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-VER-018
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: `dataOrigin` alanı listeleme, içerik, değerlendirme, kampanya, yerleşim ve olay tablolarında ZORUNLU (§12.4).
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-VER-019
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: İ18n'e hazır içerik: çevrilebilir alanlar için `locale` sütunu ya da çeviri tabloları (ADR); Faz 1'de yalnızca `tr-TR` yayımlanır.
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-VER-020
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: Uyum varlıkları birinci sınıftır: `consent_records`, `legal_document_versions`, `legal_acceptances`, `data_subject_requests`, `takedown_requests`, `license_verifications`, `processor_inventory`, `breach_incidents`, `legal_approvals` (Ek A17).
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-VER-021
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: İndeks planı ADR'de belgelenir; en az: `listings(kind, status, primaryCategoryId)`, GiST(geo), GIN(arama `tsvector`), GIN trigram (normalize ad), `user_reviews(listingId, status, createdAt DESC)`, kısmi benzersiz (aktif değerlendirme), `placements(slotKey, startsAt, endsAt) WHERE status='ACTIVE'`, olay tablolarında zaman bölümleme (aylık). Her indeksin gerekçesi bir sorguya bağlanır; `EXPLAIN` çıktıları kritik sorgular için `docs/architecture/` altında.
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-VER-022
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: **Migration stratejisi:** yalnızca ileri migration; yıkıcı değişiklikler expand/contract ile en az iki sürümde; kolon/tablo silen migration ayrı PR + ADR + yedek doğrulaması; CI'da boş veritabanına tüm migration'lar ve bir önceki sürümden yükseltme test edilir.
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-VER-023
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: Kimlikler: dahili `uuid` (v7 ÖNERİLİR); herkese açık URL'lerde yalnızca slug.
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-VER-024
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: `user_preferences` (v1 `UserPreferences`): ilgi alanları, seçili şehir, bildirim konuları ve kanalları, sessiz saatler, kişiselleştirme açık/kapalı, dil. `consent_records`'tan ayrıdır (tercih ≠ hukuki rıza); hesap silmede silinir.
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-VER-025
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: **İlişkisel bütünlük:** tüm ilişkiler yabancı anahtar (FK) kısıtlıdır; varsayılan `ON DELETE RESTRICT`, `CASCADE` yalnızca sahip olunan alt tablolarda (ör. revizyonlar, kriter puanları); yumuşak silinmiş kayda yeni referans verilemez; anonimleştirmede referanslar korunur (kullanıcı → "Silinmiş kullanıcı" yer tutucusu). Kurallar ER tablo sözlüğünde belgelenir ve migration testleri FK ihlalini yakalar.
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._
