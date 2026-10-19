# PRF — Performans

> Ek A'dan otomatik aktarıldı (`node scripts/import-requirements.mjs`). Durumlar `requirements.json` içindedir.

### REQ-PRF-001
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: **Core Web Vitals hedefleri** (saha, 75. yüzdelik; eşikler doğrulanır): LCP ≤ 2,5 sn, INP ≤ 200 ms, CLS ≤ 0,1. Saha ölçümü yalnızca üretimde ve `M`/`A` yöntemli.
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-PRF-002
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: **Laboratuvar bütçeleri (Lighthouse CI, mobil profil, pilot şablonlar: ana sayfa, hub, listeleme detay, içerik, arama):** Performans ≥ 85, Erişilebilirlik ≥ 95, SEO ≥ 95, En iyi uygulamalar ≥ 95; ilk yükleme JS (gzip) ≤ 170 KB sayfa başına (ana sayfa hariç kritik şablonlar); LCP görseli öncelikli yüklenir. Araç ve koşullar raporlanır.
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-PRF-003
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: Görsel optimizasyonu: responsive `srcset`/`sizes`, modern formatlar, `width/height`, ekran dışı görsellerde lazy loading, CDN önbelleği.
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-PRF-004
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: Gereksiz JavaScript azaltılır: sunucu bileşenleri varsayılan; istemci bileşenleri yalnızca etkileşimde; üçüncü taraf script'ler rızaya bağlı ve ertelenmiş; paket analizi CI'da raporlanır.
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-PRF-005
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: **API bütçeleri** (laboratuvar; 50.000 listeleme + 5.000 içerik + 200.000 değerlendirme tohum verisi): okuma uç noktaları p95 < 200 ms, arama p95 < 300 ms, yazma p95 < 400 ms, `/git/` p95 < 50 ms; yük testi senaryosu (araç ADR) Faz 1 sonunda; N+1 sorgu tespiti testlerde.
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-PRF-006
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: Önbellekleme stratejisi ADR-0009'da: CDN (statik + ISR), uygulama düzeyi (gerekirse), HTTP önbellek başlıkları; geçersiz kılma REQ-MIM-014.
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-PRF-007
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: Uzun listelerde cursor sayfalama ve "Daha fazla yükle" (SEO için bağlantılı sayfalar da üretilir); sonsuz kaydırmada footer'a erişim engellenmez.
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-PRF-008
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: Gereksiz animasyon, pahalı görsel efekt ve onlarca bağımsız kütüphane YASAK (§13.2).
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._
