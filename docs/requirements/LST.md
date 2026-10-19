# LST — Listeleme

> Ek A'dan otomatik aktarıldı (`node scripts/import-requirements.mjs`). Durumlar `requirements.json` içindedir.

### REQ-LST-001
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: Her listeleme türü için **sayfa şablonu**, yayın için zorunlu alanlar, tipe özgü bloklar, birincil CTA ve **yasak CTA** tablosu (A4.4). Zorunlu alanı eksik listeleme yayımlanamaz (API doğrulaması + test).
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-LST-010
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: Her listeleme şablonunda kısa tanıtımın yanında **"Hakkında" (detaylı açıklama)** bloğu bulunur (`description`; turist rehberinde kişinin kendi açıklaması, onaylı); işletme tarafından sağlanan metin "İşletme tarafından sağlandı" ibaresiyle gösterilir.
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-LST-002
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: Bilinmeyen opsiyonel alan "Bilinmiyor" olarak gösterilir ya da hiç gösterilmez; asla "0", "Kapalı" ya da tahmini değer gösterilmez.
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-LST-003
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: 390×844 mobil görünümde ilk ekranda: ad, tür/kategori, konum (ilçe/mahalle) ya da marka, puan özeti (A6.2 eşik tablosundaki metinlerle), fiyat seviyesi/fiyat durumu, uygunsa açık/kapalı durumu ve birincil CTA.
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-LST-004
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: Her listeleme sayfasının altında: "Bilgi hatalı mı? Düzeltme öner", "Bilgiler son doğrulama: {tarih}", bu listelemenin geçtiği rehber ve listeler, benzer seçenekler (organik; sponsorlu olan ayrı kutuda ve etiketli).
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-LST-005
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: Tazelik: her listelemede `sourceVerifiedAt`; tür bazında yeniden doğrulama aralığı (varsayılan: mekan saatleri 90 gün, konaklama belge/olanaklar 180 gün, ürün fiyat bilgisi 7 gün, etkinlik 7 gün). Aşılınca editör **tazelik kuyruğuna** düşer ve sayfada "Bu bilgiler {tarih} tarihinde doğrulandı" uyarısı belirginleşir.
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-LST-006
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: "Kalıcı olarak kapandı" / "Geçici olarak kapalı" / "Satıştan kalktı" durumları: sayfa korunur (değerlendirmeler okunabilir), CTA'lar kaldırılır, benzer seçenekler öne çıkar, arama sıralamasında aşağı iner; `noindex` kararı SEO kuralına göre (Ek A13).
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-LST-007
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: Toplu içe aktarma (CSV/XLSX): alan eşleme, doğrulama raporu, yinelenen tespiti (normalize ad + 150 m yakınlık / GTIN), önizleme, işlem kimliğiyle geri alma, `source` ZORUNLU, `dataOrigin=IMPORT`.
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-LST-008
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: Zincir işletmelerde her şube ayrı listeleme; kuruluş (marka) sayfası şubeleri listeler; şube değerlendirmeleri kuruluş düzeyinde birleştirilip tek puan yapılmaz (ayrı ayrı gösterilir).
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-LST-009
- Düzey: OLMALI · Faz: 2 · Kaynak: v2 Ek A
- Gereksinim: Soru-cevap: listeleme başına sorular; yanıtlayan rozeti (Doğrulanmış işletme / Editör / Üye); moderasyon kuralları değerlendirmelerle aynı; yanıtsız soru 30 gün sonra işletmeye hatırlatılır (Faz 3).
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._
