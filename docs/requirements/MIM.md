# MIM — Mimari ve API

> Ek A'dan otomatik aktarıldı (`node scripts/import-requirements.mjs`). Durumlar `requirements.json` içindedir.

### REQ-MIM-001
- Düzey: ZORUNLU · Faz: 0 · Kaynak: v2 Ek A
- Gereksinim: Veritabanına (Prisma Client) **yalnızca** `apps/api` erişir. web/admin/mobile yalnızca `packages/api-client` üzerinden API'yi çağırır. `packages/*` hiçbir zaman `apps/*` içinden import etmez. Döngüsel bağımlılık yok. Kurallar dependency-cruiser (ya da eşdeğeri) ile CI'da zorlanır.
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-MIM-002
- Düzey: ZORUNLU · Faz: 0 · Kaynak: v2 Ek A
- Gereksinim: `packages/contracts` tarayıcı ve React Native'de çalışır (Node'a özgü modül içermez).
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-MIM-003
- Düzey: ZORUNLU · Faz: 0 · Kaynak: v2 Ek A
- Gereksinim: Faz 0'da `docs/architecture/` altında: bileşen diyagramı (mermaid), ER diyagramı + tablo sözlüğü, izin matrisi, sayfa türü → render/önbellek tablosu.
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-MIM-004
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: NestJS modülleri ve tablo sahipliği aşağıdaki gibidir; bir modül başka modülün tablosuna doğrudan yazmaz (servis arayüzü ya da domain olayı kullanır). `forwardRef` döngüsel bağımlılık YASAK.
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-MIM-005
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: `search`, `catalog`, `reviews` modülleri `ads` ve `commerce` modüllerini import etmez; organik sıralama kodunun kampanya/affiliate verisine erişimi yoktur. Sponsorlu yerleşimler sunum katmanında ayrı çağrıyla birleştirilir (AK-04).
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-MIM-006
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: OpenAPI 3.x şeması koddan (zod/DTO) üretilir; `packages/api-client` bu şemadan üretilir; CI'da üretilen dosyada fark varsa kırmızı.
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-MIM-007
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: API tabanı `/v1`; kaynak adları çoğul ve kebab-case; JSON alanları camelCase; zaman damgaları ISO 8601 UTC (`Z`); kimlikler opak dizedir.
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-MIM-008
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: Genel (public) listelerde **cursor** sayfalama: `?limit=20&cursor=…` (limit ≤ 100); yanıt `{ data, page: { nextCursor, hasMore } }`; cursor imzalı ve sıralama her zaman benzersiz id ile bağlanır. Offset yalnızca yönetim tablolarında (≤ 10.000 satır).
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-MIM-009
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: Filtreler beyaz listelidir; kategoriye özgü filtreler `attr.<key>` önekiyle ve yalnızca `filterable=true` özellikler için kabul edilir; bilinmeyen parametre 400. **"Sponsorlu sıralama" diye bir parametre yoktur.**
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-MIM-010
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: Hatalar RFC 9457 `application/problem+json` biçimindedir; kararlı makine kodu (`code`), `traceId`, alan hataları (`errors[].pointer`). `detail` yığın izi/SQL/iç bilgi içermez. Türkçe kullanıcı mesajları istemcide `code` üzerinden eşlenir.
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-MIM-011
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: Durum değiştiren ve tekrar edilebilecek POST'larda `Idempotency-Key` desteği (değerlendirme gönderme, başvuru formları, kampanya oluşturma). Eşzamanlı düzenleme için `version` alanı + `If-Match`/412 (içerik, listeleme, kampanya).
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-MIM-012
- Düzey: OLMALI · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: Genel GET yanıtlarında `ETag` ve uygun `Cache-Control`; kişisel yanıtlarda `private, no-store`.
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-MIM-013
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: Render stratejisi ADR-0009'da sayfa türü başına tanımlanır (ör. listeleme/içerik: ISR + olay tabanlı yeniden doğrulama; arama: SSR, `noindex`; hesap sayfaları: dinamik, `no-store`).
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-MIM-014
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: **Önbellek geçersiz kılma:** İçerik yayımı, listeleme güncellemesi, değerlendirme yayımı/kaldırması, kampanya başlangıç/bitişi ve kaldırma kararları ilgili sayfaların yeniden doğrulamasını tetikler. Bitiş anı geçmiş bir sponsorlu yerleşim, bitişten sonra en geç 60 sn içinde hiçbir yüzeyde (SSR, ISR, mobil API, CDN) görünmez — testli.
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-MIM-015
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: Domain olayları **transactional outbox** ile yayınlanır (arama indeksi, puan özetleri, önbellek geçersiz kılma, bildirimler, analitik). İşleyiciler idempotent; yeniden deneme ve ölü mektup kaydı vardır.
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-MIM-016
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: Arka plan işleri için ilk seçenek PostgreSQL tabanlı kuyruktur; Redis/BullMQ yalnızca §14.4 tetikleyicisiyle.
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-MIM-017
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: Merkezi, tipli özellik bayrağı kaydı (§12.8) ve "entegrasyon yetenek" bayrakları (ör. `capabilities.hotelAvailability = false`).
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-MIM-018
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: Yapılandırma ortam değişkenlerinden okunur ve açılışta şema ile doğrulanır; eksik/geçersiz değişkende uygulama başlamaz ve hangi değişkenin eksik olduğunu (değerini değil) yazar.
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._
