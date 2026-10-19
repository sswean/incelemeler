# ENT — Dış entegrasyon

> Ek A'dan otomatik aktarıldı (`node scripts/import-requirements.mjs`). Durumlar `requirements.json` içindedir.

### REQ-ENT-001
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: Her port için `MOCK` adaptör (yalnızca yerel/test; üretim derlemesinde YASAK, §12.8) ve **sözleşme testleri**; gerçek adaptörler Faz 3'te ve yalnızca kimlik bilgisi sağlanırsa.
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-ENT-002
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: Adaptörlerde zaman aşımı (varsayılan 3 sn), sınırlı yeniden deneme (üstel geri çekilme), devre kesici; hata durumunda kullanıcıya fiyat/müsaitlik **gösterilmez**, "Güncel fiyat ve müsaitlik için {Sağlayıcı}'ya bak" yolu sunulur (tek i18n anahtarı; E2E-008 aynı anahtarı doğrular).
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-ENT-003
- Düzey: ZORUNLU · Faz: 3 · Kaynak: v2 Ek A
- Gereksinim: Sağlayıcı yanıtları ham olarak loglanmaz (kişisel veri/sözleşme kısıtları); yalnızca özet ve hata kodları.
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-ENT-010
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: Listelemede sabit "fiyat" alanı yoktur; yalnızca göreli fiyat seviyesi (₺–₺₺₺₺) ve isteğe bağlı editoryal fiyat aralığı (`observedAt` + kaynak notuyla).
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-ENT-011
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: Fiyat gösterilen her yerde: **kaynak** ("{Sağlayıcı}" / "İşletme beyanı" / "Editör gözlemi"), **son güncelleme zamanı**, fiyatı değiştiren **parametreler** (tarih, kişi sayısı, oda tipi, araç sınıfı, teslim noktası), para birimi.
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-ENT-012
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: `validUntil` geçmiş fiyat "güncel" olarak dönmez: API `price: null, priceStatus: 'STALE', lastKnown: {…}` döner; arayüz "Son bilinen fiyat ({tarih}) — güncel fiyat için sağlayıcıya bak" der. Varsayılan tazelik: canlı otel/araç API'si 30 dk, ürün feed'i 24 saat, manuel giriş 30 gün — sağlayıcı şartlarındaki önbellek süresinden uzun olamaz.
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-ENT-013
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: Gerçek müsaitlik **yalnızca** güvenilir sağlayıcı yanıtında ve kullanıcının sorgu parametreleriyle eşleşen kayıtta gösterilir; statik içerikten görsel olarak ayrılır ("Canlı · {Sağlayıcı} · {saat}").
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-ENT-014
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: Dış serviste gerçekleşen işlem platform tarafından doğrulanamıyorsa "Rezervasyonunuz tamamlandı" gibi bir durum gösterilmez; yalnızca "{Sağlayıcı} sitesine yönlendirildin" bilgisi.
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-ENT-015
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: Konaklama arama formu: destinasyon, giriş–çıkış tarihi, yetişkin/çocuk sayısı (+ çocuk yaşları), oda sayısı, bütçe aralığı; araç kiralama formu: teslim alma ve bırakma noktası (farklı nokta seçeneği), tarih ve saat, araç sınıfı, sürücü yaşı. Canlı veri yoksa form sağlayıcıya parametreli yönlendirme ya da filtreleme için kullanılır; "müsait" iddiası üretmez.
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-ENT-016
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: Fırsat (`Deal`) gösterimi: kaynak, geçerlilik tarihi, koşullar, (indirimse) referans fiyatın dayanağı; süresi dolan fırsat otomatik kalkar; indirim gösterim kuralları hukuki incelemeye tabidir (Ek D1).
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._
