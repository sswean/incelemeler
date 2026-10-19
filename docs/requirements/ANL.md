# ANL — Analitik

> Ek A'dan otomatik aktarıldı (`node scripts/import-requirements.mjs`). Durumlar `requirements.json` içindedir.

### REQ-ANL-001
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: **Birinci taraf olay hattı** (`analytics_events`, aylık bölümlü) + rızaya bağlı istemci olayları; üçüncü taraf analitik aracı kullanılacaksa rızaya bağlı yüklenir ve aktarım envanterine girer (ADR + L-kaydı).
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-ANL-002
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: **Olay sözlüğü** (`docs/analytics/olay-sozlugu.md`): ad, tetiklenme anı, özellikler, kişisel veri içerip içermediği, rıza gereksinimi, saklama süresi. Başlangıç olayları (v1 §18): `search_performed`, `category_viewed`, `listing_viewed`, `content_viewed`, `sponsored_impression` (görüntülenen tanımıyla), `sponsored_click`, `affiliate_click`, `outbound_click` (telefon/web/yol tarifi/mesaj/rezervasyon), `favorite_added`, `review_submitted`, `review_published`, `business_application_created`, `ad_application_created`, `provider_redirected`, `newsletter_subscribed`, `consent_changed`, `zero_result_search`.
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-ANL-003
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: Sponsorluk/yönlendirme sayımları (A8, A9) rızadan bağımsız, çerezsiz, toplulaştırılmış ve kişisel veri içermez; davranışsal analitik rızaya bağlıdır.
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-ANL-004
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: **Panolar (yönetim paneli, yalnızca gerçek veri; veri yoksa "Veri yok"):** aktif kullanıcılar (rızalı ölçüm), organik trafik (arama motoru araçlarından içe aktarma ya da giriş sayfası referansı), kategori bazında içerik performansı, sponsorlu gösterim ve tıklamalar, affiliate/dış yönlendirmeler, en çok aranan ve sonuçsuz aramalar, içerik tazelik durumu, işletme ve reklamveren başvuruları, moderasyon SLA'ları, kuzey yıldızı ve sınır metrikleri (§6.3). Her panoda veri tazeliği zaman damgası.
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-ANL-005
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: Bot ve personel trafiği ayıklanır; demo/sentetik olaylar raporlara girmez.
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-ANL-006
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: Kişisel veriler gereksiz yere toplanmaz; kullanıcı düzeyi olay verisi saklama süresi `compliance_config` (varsayılan ≤ 14 ay), sonra toplulaştırılıp silinir.
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._
