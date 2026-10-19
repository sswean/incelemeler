# SEO — SEO

> Ek A'dan otomatik aktarıldı (`node scripts/import-requirements.mjs`). Durumlar `requirements.json` içindedir.

### REQ-SEO-001
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: Tüm herkese açık içerik sayfaları sunucu tarafında render edilmiş HTML ile birincil içeriği döndürür (JS kapalıyken başlık, metin, puan özeti, iç bağlantılar görünür).
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-SEO-002
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: Her sayfa için benzersiz `<title>` (≤ 60 karakter hedef) ve meta açıklama (≤ 155 karakter hedef); şablonlar türe göre; Türkçe ek uyumu yardımcıları kullanılır (A15.2). Yinelenen başlık/açıklama CI raporunda listelenir.
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-SEO-003
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: **URL şeması** A15.1'deki tablodur; küçük harf, tire ayracı, sonda eğik çizgi yok (aykırı biçim 301 ile normalleştirilir); slug'da yıl/fiyat gibi bayatlayan bilgi yok; slug değişikliği 301 (REQ-VER-013).
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-SEO-004
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: **Canonical:** her indekslenebilir sayfada kendine referans veren canonical; filtre/sıralama parametreli varyantlar ana hub'a canonical verir ya da `noindex,follow`; yalnızca **izin listesindeki** yüzeyler (ör. il × kategori, il × kategori × tek bir öne çıkan özellik — eşik sağlanırsa) temiz URL ile indekslenir.
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-SEO-005
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: **Tarama kontrolü:** arama sonuçları (`/ara`), karşılaştırma aracı, hesap sayfaları, `/git/`, önizleme, panel `noindex` ile dışarıda tutulur ve robots.txt'de **Disallow edilmez** (taranması engellenen sayfanın `noindex`'i okunamaz; doğrulanır) — istisna: `/git/` yönlendirme yolu Disallow edilir; sınırsız filtre kombinasyonu taranabilir bağlantı üretmez (filtre bağlantıları izin listesi dışında `nofollow` ya da form/JS ile).
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-SEO-006
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: **XML site haritaları:** dizin + türe göre bölümlü (listelemeler, içerikler, hub'lar, destinasyonlar, görseller); her dosya ≤ 50.000 URL; `lastmod` yalnızca anlamlı değişiklikte güncellenir; `noindex`, eşiğin altı, demo, kapalı ve yönlendirilen URL'ler site haritasında yer almaz (test).
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-SEO-007
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: `robots.txt` ortama göre (staging/preview tamamen `Disallow` + HTTP temel kimlik doğrulama; üretimde site haritası dizini bildirimi).
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-SEO-008
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: **Yapılandırılmış veri (JSON-LD):** içeriğin gerçek türüyle eşleşen tipler (Ek A2.2 tablosu + `Article`, `BreadcrumbList`, `ItemList`, `Person` yazarlar için, `Organization` site için, `WebSite` + arama kutusu uygunluğu doğrulanarak). **Kurallar:** (a) `Review`/`AggregateRating` yalnızca sayfada görünen gerçek değerlendirmelerden; n < 3 ise `AggregateRating` yok; (b) Google'ın işletmelerin kendi sitelerindeki "kendine hizmet eden" değerlendirmelere ilişkin kısıtları doğrulanır ve uygulanır; (c) sponsorlu içerikte editör `Review` işaretlemesi yok; (d) demo veride JSON-LD yok; (e) fiyat işaretlemesi yalnızca güncel ve kaynaklı fiyatta. Rich Results test doğrulaması CI'da şema doğrulayıcıyla (çevrimdışı) + `M` (canlı test aracı).
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-SEO-009
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: **Open Graph ve paylaşım görselleri:** her sayfa için OG başlık/açıklama/görsel (1200×630); dinamik OG görselleri (listeleme adı, puan özeti — yalnızca gerçek veri, sponsorluysa etiket görselde).
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-SEO-010
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: **Breadcrumb** (görünür + JSON-LD): Ana sayfa › İl › Kategori › Listeleme; içeriklerde Ana sayfa › Rehberler › Konu.
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-SEO-011
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: **İç bağlantı sistemi:** şehir hub'ı ↔ kategori hub'ları ↔ listelemeler ↔ rehberler/listeler/karşılaştırmalar; listeleme sayfasında "Bu listelemenin geçtiği rehberler", "Yakındaki benzerler"; içeriklerde gömülü listeleme kartları; yetim sayfa raporu (hiç iç bağlantı almayan indekslenebilir sayfa) panelde.
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-SEO-012
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: **Durum kodları:** bulunamayan 404 (yararlı öneri sayfası), kalıcı silinen 410, taşınan 301 (zincirsiz), kapalı işletme 200 + "Kalıcı olarak kapandı" (değerlendirmeler değerli olduğu sürece); bitmiş etkinlik 200 + 30 gün sonra `noindex`; süresi dolmuş fırsat `noindex`.
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-SEO-013
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: **Çok dile hazır mimari:** `lang="tr"`, `hreflang` altyapısı (yalnızca tek dil yayımlanırken hreflang üretilmez), yerelleştirilebilir slug alanı.
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-SEO-014
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: **Görsel SEO:** anlamlı Türkçe `alt` metinleri (dekoratif görselde boş alt), açıklayıcı dosya adları, `width/height`, modern formatlar, görsel site haritası.
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-SEO-015
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: **Arama motoru araçları:** Google Search Console, Bing Webmaster Tools ve Yandex Webmaster doğrulama hazırlığı (meta/DNS — İnsan yapar, X-kaydı); IndexNow desteği (destekleyen motorlar için, doğrulanarak).
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-SEO-016
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: **SEO test paketi (CI):** her sayfa türü için title/description/canonical/robots/JSON-LD şema doğrulaması, site haritası içerik testleri, yönlendirme testleri, `noindex` kuralları.
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._
