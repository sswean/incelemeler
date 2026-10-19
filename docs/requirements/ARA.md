# ARA — Arama ve filtre

> Ek A'dan otomatik aktarıldı (`node scripts/import-requirements.mjs`). Durumlar `requirements.json` içindedir.

### REQ-ARA-001
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: Arama, uygulama kodunun yalnızca gördüğü bir **arama motoru arayüzü** arkasındadır: `upsert`, `delete`, `query`, `suggest`. İlk uygulama PostgreSQL; Meilisearch/Typesense geçişi yalnızca yeni adaptör yazmayı gerektirir.
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-ARA-002
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: Okuma modeli `search_documents` (listeleme, içerik, kategori, destinasyon) outbox olaylarıyla güncellenir; tam yeniden indeksleme komutu vardır; `dataOrigin=DEMO` belgeler üretimde indekslenmez.
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-ARA-003
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: **Türkçe normalizasyon** (`normalizeTr`, uygulamada ve SQL'de birebir aynı kurallar): (1) Türkçe kurallarla küçük harf (İ→i, I→ı); (2) kesme işaretinden sonraki eki at ("Antalya'da" → "antalya"; ’ ' ` varyantları); (3) aksan katlanmış ikinci varyant (ç→c, ğ→g, ı→i, ö→o, ş→s, ü→u) — "kahvalti", "sisli", "uskudar" eşleşir. "İSTANBUL", "Istanbul", "istanbul" aynı sonucu verir.
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-ARA-004
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: PostgreSQL `turkish` metin arama yapılandırmasının kullanılan sürümde varlığı doğrulanır (ADR); özel yapılandırma + `unaccent` (IMMUTABLE sarmalayıcıyla); ağırlıklar (başlık A, kategori/yer B, alt başlık C, gövde D); GIN indeks. Kök bulucunun sınırlılığına karşı "simple" vektörle birleştirme test korpusuyla değerlendirilir.
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-ARA-005
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: Yazım hatası toleransı: `pg_trgm` ile normalize ad ve yer adları üzerinde trigram indeks; tam metin sonucu az olduğunda (< 5) benzerlik geri dönüşü; eşik test korpusuyla ayarlanır. "Bunu mu demek istediniz?" önerisi.
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-ARA-006
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: **Sorgu korpusu:** `docs/requirements/ARA-sorgu-korpusu.json` içinde ≥ 50 sorgu (A7.1 örnekleri, Türkçe karakter varyantları, büyük/küçük harf, yazım hataları — "kapadoyka", eş anlamlılar, ekli yer adları) ve her biri için beklenen ilk 5 sonuç (demo veride). **Kabul:** recall@5 ≥ %90; sıfır sonuç yalnızca beklenen sorgularda. CI'da çalışır.
- Kabul kriterleri: recall@5 ≥ %90; sıfır sonuç yalnızca beklenen sorgularda. CI'da çalışır.

### REQ-ARA-007
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: **Ortak filtreler:** konum (il/ilçe; "yakınımda + yarıçap" İSTEĞE BAĞLI, §7.1), kategori, listeleme türü/içerik türü, fiyat seviyesi/bütçe, kullanıcı puanı (≥ 3,5 / ≥ 4 / ≥ 4,5), özellikler (kategori şemasından `filterable`), açık şimdi (saatleri bilinenler), tarih (etkinlik; konaklama/araç kiralama için sağlayıcı yönlendirmesine parametre olarak), sıralama. Her içerik türü için uygun filtre seti şablonla tanımlanır.
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-ARA-008
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: **Sıralama seçenekleri:** Önerilen (alaka + Bayes puanı + tazelik + mesafe; **ticari sinyal içermez**), Puana göre (Bayes), En çok değerlendirilen, En yakın (konum varsa), En yeni (içerik). "Önerilen" formülünün bileşenleri `/nasil-degerlendiriyoruz` sayfasında açıklanır.
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-ARA-009
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: **Organik sıralama değişmezliği testi:** aynı tohum veride arama ve kategori listesi sorgusu tüm kampanyalar aktifken ve hepsi silinmişken çalıştırılır; organik `data` dizisi iki durumda birebir aynıdır (AK-04).
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-ARA-010
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: Otomatik tamamlama: yer adları, kategoriler, listelemeler ve içerikler gruplu; klavye ile gezilebilir (ARIA combobox); son aramalar yalnızca cihazda (misafir) ya da rızayla hesapta.
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-ARA-011
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: Liste görünümü ZORUNLU. **Harita görünümü İSTEĞE BAĞLI · 1** (harita sağlayıcısı X-005'e bağlı; Faz 2'de mobilde ZORUNLU); sağlayıcı yoksa harita KAPALI, liste + adres gösterilir. Harita "bu alanda ara" eylemi; kümelenme; sponsorlu pinler farklı stil + etiket ve organik pinleri gizlemez.
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-ARA-012
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: Mobil web'de filtreler **bottom sheet** içinde; uygulanan filtre sayısı rozetli; "Temizle" ve "Sonuçları göster (N)" butonları; URL filtre durumunu yansıtır (paylaşılabilir, geri tuşu çalışır).
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-ARA-013
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: Sıfır sonuç durumu: hangi filtrelerin sonucu sıfırladığını gösterir, tek tıkla gevşetme önerir, yakın şehir/kategori önerir; boş sayfa bırakılmaz.
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-ARA-014
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: `search_events`: normalize sorgu, filtre özeti, sonuç sayısı, tıklanan sonuç sırası, oturum karması (kişisel veri yok; rızaya bağlı). "En çok aranan" ve "sonuçsuz aramalar" raporları buradan.
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-ARA-015
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: Arama p95 < 300 ms (50.000 listeleme + 5.000 içerik tohum verisiyle, laboratuvar ölçümü; Ek A18).
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-ARA-016
- Düzey: ÖNERİLİR · Faz: 4 · Kaynak: v2 Ek A
- Gereksinim: Veri büyüdüğünde (ör. > 500.000 belge ya da p95 hedefi aşılırsa) harici arama motoru; geçişte korpus gerilemesi olmamalı.
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._
