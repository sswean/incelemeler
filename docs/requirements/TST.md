# TST — Test

> Ek A'dan otomatik aktarıldı (`node scripts/import-requirements.mjs`). Durumlar `requirements.json` içindedir.

### REQ-TST-001
- Düzey: ZORUNLU · Faz: 0 · Kaynak: v2 Ek A
- Gereksinim: **Test piramidi ve araçlar** ADR-0008'de: birim (ör. Vitest/Jest), API entegrasyon (gerçek PostgreSQL konteyneriyle, ör. Testcontainers), sözleşme testleri (OpenAPI şemasına karşı; sağlayıcı adaptörleri için), E2E (Playwright — web + panel), erişilebilirlik (axe), görsel regresyon (Storybook), Lighthouse CI, yük testi, mobil E2E (Faz 2; Maestro/Detox).
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-TST-002
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: **Kapsam eşikleri** (anlamlı modüllerde; düşürülemez): `utils` (normalizeTr, slugifyTr, para/tarih, Bayes) ≥ %95 satır; `reviews`, `ads`, `commerce`, `access`, `compliance` modülleri ≥ %85 dal; genel ≥ %70.
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-TST-003
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: **Kritik test kategorileri (v1 §20'nin tamamı):** birim, API entegrasyon, kritik akış E2E, rol ve izin testleri, ticari etiket görünürlük testleri, dış yönlendirme güvenlik testleri, arama ve filtre testleri (korpus), mobil ekran uyumluluğu (görünüm alanları: 360×800, 390×844, 768×1024, 1280×800, 1920×1080; yatay kaydırma yok), form doğrulama testleri, boş veri ve hata durumu testleri, SEO meta testleri, migration testleri (boş veritabanı + önceki sürümden yükseltme), performans kontrolleri.
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-TST-004
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: **Deterministik test verisi:** testler kendi fabrikalarıyla veri üretir; seed'e bağımlı E2E'ler izole veritabanında; zaman, rastgelelik ve saat dilimi testlerde sabitlenir (`Europe/Istanbul` sınır durumları: gece yarısını aşan saatler, bayram istisnaları).
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-TST-005
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: Ek B'deki E2E senaryoları REQ kimlikleriyle eşlenir ve CI'da çalışır; faz kapısında art arda 3 yeşil koşu.
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-TST-006
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: Test ortamında kullanılan örnek veriler demo olarak işaretlidir (§12.4); gerçekte yapılmamış testler için başarılı rapor üretilmez (AK-01).
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._
