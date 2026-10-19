# AFF — Dış yönlendirme ve affiliate

> Ek A'dan otomatik aktarıldı (`node scripts/import-requirements.mjs`). Durumlar `requirements.json` içindedir.

### REQ-AFF-001
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: Tüm ticari ve ticari olmayan dış bağlantılar merkezi kayıttadır: `outbound_links` (listeleme/içerik, entegrasyon sağlayıcısı, tür: affiliate/booking/purchase/website/phone/messaging/map/quote_request, hedef URL şablonu, alt kimlik (sub-ID) şablonu, `commercialRelation`, geçerlilik tarihleri, durum, oluşturan).
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-AFF-002
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: Yönlendirme uç noktası `GET /git/{linkId}?ctx={imzalı bağlam}` → 302. Hedef **yalnızca veritabanından** okunur; istekten gelen URL'ye yönlendirme YAPILMAZ (açık yönlendirme yok). Hedef alan adı sağlayıcının `allowedDomains` listesinde değilse yönlendirme yapılmaz ve alarm üretilir. **Kabul:** keyfi URL'ye yönlendirme denemeleri (parametre enjeksiyonu, `//evil.com`, `https:evil.com`, Unicode alan adları) başarısız olur (güvenlik testi).
- Kabul kriterleri: keyfi URL'ye yönlendirme denemeleri (parametre enjeksiyonu, `//evil.com`, `https:evil.com`, Unicode alan adları) başarısız olur (güvenlik testi).

### REQ-AFF-003
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: Yanıt başlıkları: `Cache-Control: no-store`, `Referrer-Policy: strict-origin-when-cross-origin`, `X-Robots-Tag: noindex`; `/git/` robots.txt'de `Disallow` (asıl mekanizma bağlantılardaki `rel="sponsored nofollow"`; Google Search Central güncel metniyle doğrulanır). Yönlendirme gecikmesi p95 < 50 ms; tıklama kaydı asenkron.
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-AFF-004
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: HTML'de ticari bağlantılar `rel="sponsored noopener"` (+ gerekirse `nofollow`); yeni sekmede açılıyorsa `noopener noreferrer`; affiliate CTA'nın hemen yanında "Ortaklık bağlantısı" açıklaması (A8.2).
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-AFF-005
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: `outbound_clicks`: zaman, bağlantı, yüzey, sayfa türü, yuva/yerleşim (varsa), günlük tuzlu oturum karması (ham IP saklanmaz), üye kimliği yalnızca rıza varsa, bot işareti, tekilleştirme anahtarı; aylık bölümlü. Aynı oturum + bağlantı için 30 sn içinde tek tıklama; önceden getirme (`Sec-Purpose: prefetch`) ve bot tıklamaları raporlara girmez.
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-AFF-006
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: Sağlayıcıya özel kampanya ve alt kimlik parametreleri şablonla eklenir (ör. `{subId}` = yerleşim/sayfa kodu; kişisel veri İÇERMEZ).
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-AFF-007
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: **Bağlantı sağlığı:** periyodik kontrol (HEAD/GET, SSRF korumalı — yalnızca izinli alanlar, özel IP aralıkları engelli), kırık/yönlendirilmiş/süresi dolmuş bağlantılar için editör uyarısı; süresi dolan bağlantı otomatik devre dışı.
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-AFF-008
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: "Başarılı yönlendirme/dönüşüm" yalnızca sağlayıcı dönüşüm verisi (postback ya da rapor içe aktarma) varsa raporlanır; tahmini komisyon ile onaylı komisyon ayrı gösterilir; veri yoksa "Dönüşüm verisi yok".
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-AFF-009
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: Affiliate ilişkisi sıralamayı, puanı ve editoryal seçimi etkilemez (AK-04); aynı ürün için birden çok satıcı varsa sıralama fiyat/teslim gibi kullanıcı yararına ölçütlerle yapılır, komisyon oranıyla **yapılmaz** (test).
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._
