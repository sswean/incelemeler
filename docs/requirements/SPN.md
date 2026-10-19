# SPN — Sponsorluk

> Ek A'dan otomatik aktarıldı (`node scripts/import-requirements.mjs`). Durumlar `requirements.json` içindedir.

### REQ-SPN-001
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: Yerleşim modeli: `placement_slots` (anahtar, yüzey, sayfa türü, pozisyonlar, izin verilen türler, maks. öğe), `campaigns`, `campaign_placements` (yuva, hedef kategori/bölge, hedef listeleme/içerik, öncelik, ağırlık), `creatives` (başlık, metin, görsel, hedef dış bağlantı, etiket türü, onay durumu). Yuva kataloğu panelden yönetilir; render noktaları kodda sabittir.
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-SPN-002
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: Sponsorlu yerleşimler organik listeye **eklenmez**; API ayrı dizi döner: `{ data: [...organik], sponsored: [{ position, item, disclosure }] }`. Aynı listeleme hem organik hem sponsorlu görünebilir; organik pozisyonu değişmez.
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-SPN-003
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: Kart DTO'larında `commercial` alanı ZORUNLU ve null olamaz; web/mobil kart bileşeni `commercial.type !== 'NONE'` iken etiket render etmeden derlenmez (zorunlu prop). **Kabul:** her yüzey için E2E'de etiket görünür ve erişilebilir adla okunur.
- Kabul kriterleri: her yüzey için E2E'de etiket görünür ve erişilebilir adla okunur.

### REQ-SPN-004
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: A8.3 sınırları ve alaka kuralları sunucuda zorlanır; panelden aşılamaz (birim + E2E).
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-SPN-005
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: Yalnızca `status=YAYINDA` ve `startsAt ≤ now < endsAt` yerleşimler döner; bitişten sonra ≤ 60 sn içinde hiçbir yüzeyde görünmez (REQ-MIM-014).
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-SPN-006
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: `sponsorshipAllowed=false` kategoride yerleşim/sponsorlu içerik oluşturulamaz; kısıtlı kategoriler (sağlık, alkol, tütün, bahis, finans, ilaç/takviye vb.) varsayılan kapalıdır (Ek D1).
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-SPN-007
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: Sponsorlu içerikte editör puanı, puan kutusu, "Editörün seçimi", "En iyi", "Kazanan" rozetleri **render edilmez** (tip + test).
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-SPN-008
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: Yuva rekabeti: aynı yuva için birden çok aktif kampanyada ağırlıklı rotasyon (deterministik, istek başına tohumlu); adil pay raporlanır. Frekans sınırı Faz 3 (İSTEĞE BAĞLI).
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-SPN-009
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: **Ölçüm tanımları:** *Sunulan* (sunucu yerleşimi döndürdü), *Görüntülenen* (öğenin ≥ %50'si ≥ 1 sn görünür alanda — IntersectionObserver; endüstri tanımına uygunluğu doğrulanır), *Tıklama* (dış yönlendirme servisi üzerinden). Raporlar "görüntülenen gösterim"i esas alır ve tanımı rapor sayfasında yazar.
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-SPN-010
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: Olaylar **yalnızca gerçek** kayıtlardan; botlar (bilinen UA listeleri, önceden getirme istekleri, başsız tarayıcı işaretleri) ve personel/önizleme trafiği ayıklanır; tekilleştirme penceresi (aynı oturum + yerleşim için gösterimde 30 dk, tıklamada 30 sn); demo/sentetik olaylar ayrı işaretli ve raporsuz.
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-SPN-011
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: **Kampanya raporu:** günlük toplamlar (görüntülenen gösterim, tıklama, TO), yuva ve yüzey kırılımı, veri tazeliği zaman damgası ("Son güncelleme: …"), CSV dışa aktarma; "tahmini" değerler ayrı ve etiketli; dönüşüm verisi yoksa "Dönüşüm verisi yok" yazar; kişisel veri içermez. Sahte/örnek sayı gösterilmez (AK-02).
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-SPN-012
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: Hedefli/kişiselleştirilmiş sponsorlu yerleşim yalnızca rızaya bağlı ve yalnızca bağlamsal (sayfa, şehir, kategori) sinyallerle; "Neden bunu görüyorum?" açıklaması her yerleşimde. Davranışsal hedefleme Faz 4 ve KVKK incelemesiyle.
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-SPN-013
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: Tüm kampanya, yerleşim, kreatif, tutar ve durum değişiklikleri denetim kaydına yazılır.
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._
