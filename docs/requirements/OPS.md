# OPS — Altyapı ve operasyon

> Ek A'dan otomatik aktarıldı (`node scripts/import-requirements.mjs`). Durumlar `requirements.json` içindedir.

### REQ-OPS-001
- Düzey: ZORUNLU · Faz: 0 · Kaynak: v2 Ek A
- Gereksinim: **Ortamlar:** yerel (Docker Compose), CI, PR önizleme (İSTEĞE BAĞLI), staging (üretime benzer, `noindex`, temel kimlik doğrulamalı), üretim. Ortam başına ayrı veritabanı, depolama, sırlar.
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-OPS-002
- Düzey: ZORUNLU · Faz: 0 · Kaynak: v2 Ek A
- Gereksinim: **CI aşamaları:** kurulum (önbellekli) → lint + format → typecheck → birim → entegrasyon (gerçek PostgreSQL konteyneri) → build → OpenAPI fark kontrolü → E2E (web/admin) → erişilebilirlik → Lighthouse CI (Faz 1) → sır/lisans/bağımlılık/SAST taramaları → `req:check`. PR'larda zorunlu kontroller. **CD:** `main` yeşilken staging'e otomatik dağıtım (migration + duman testi + başarısızlıkta otomatik geri alma); üretim dağıtım hattı hazırlanır ama tetiklenmesi C sınıfıdır (İnsan onayı).
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-OPS-003
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: **Barındırma önerisi** ADR'de seçenek karşılaştırmasıyla (yönetilen PostgreSQL + konteyner/uygulama platformu + S3 uyumlu depolama + CDN/WAF); **veri yerleşimi (Türkiye içi / AB) KVKK aktarım kuralları nedeniyle C sınıfı İnsan kararıdır**; karar verilene kadar dağıtım yapılmaz. Altyapı kodu (IaC) taslağı İSTEĞE BAĞLI Faz 1.
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-OPS-004
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: **Sıfır kesintili dağıtım** ve migration güvenliği (REQ-VER-022); geri alma planı (önceki imaj + geriye uyumlu şema).
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-OPS-005
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: **Yedekleme:** yönetilen veritabanı otomatik yedek + zaman noktasına geri dönüş; hedefler (varsayılan, B sınıfı): **RPO ≤ 15 dk, RTO ≤ 4 saat**; nesne depolama sürümleme; **geri yükleme tatbikatı** her faz kapısında: staging varsa staging'de, yoksa yerel Docker ortamında (yedek al → boş veritabanına geri yükle → migration/smoke testi; komut ve süre raporlanır); staging tatbikatı X-002 sağlanana kadar `MANUAL-QA` kaydıdır; yedekler şifreli ve ayrı hesap/bölgede (aktarım kuralları dikkate alınarak).
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-OPS-006
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: **Gözlemlenebilirlik:** yapılandırılmış loglar (merkezi), dağıtık izleme (OpenTelemetry), hata izleme (web/API/mobil; kaynak haritaları), metrikler (istek oranı, hata oranı, gecikme, kuyruk derinliği, outbox gecikmesi), uptime kontrolleri; uyarılar (hata oranı > %2 / 5 dk, p95 bütçe aşımı / 10 dk, outbox gecikmesi > 5 dk, sertifika süresi < 14 gün, disk > %80). Sağlayıcılar aktarım envanterine girer.
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-OPS-007
- Düzey: OLMALI · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: **SLO'lar** (varsayılan): herkese açık site kullanılabilirliği aylık %99,5; `/git/` yönlendirme %99,9; hata bütçesi politikası.
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-OPS-008
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: **Runbook'lar** (`docs/ops/`): dağıtım, geri alma, veritabanı geri yükleme, sır rotasyonu, olay müdahalesi, veri ihlali (REQ-KVK-024), kampanya acil durdurma ("tüm sponsorlu yerleşimleri kapat" anahtarı), moderasyon yığılması.
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-OPS-009
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: **Bakım ve özellik anahtarları:** bakım modu sayfası; sponsorlu yerleşimler, değerlendirme gönderimi, kayıt ve dış entegrasyonlar için acil kapatma anahtarları (panelden, denetim kayıtlı).
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-OPS-010
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: **Üretime geçiş kontrol listesi** (`docs/ops/canliya-gecis.md`): hukuki metin onayları, `legalGate` durumları, aktarım envanteri, DNS/TLS, güvenlik başlıkları, yedek + geri yükleme testi, izleme/uyarılar, arama motoru araçları, robots/sitemap, analitik rıza testi, demo verinin yokluğu, MOCK'ların yokluğu, performans bütçeleri, erişilebilirlik raporu, destek/iletişim kanalları. Geçiş C sınıfıdır.
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._
