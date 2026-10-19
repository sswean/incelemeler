# DEG — Değerlendirme ve puan

> Ek A'dan otomatik aktarıldı (`node scripts/import-requirements.mjs`). Durumlar `requirements.json` içindedir.

### REQ-DEG-001
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: Puan ölçekleri ve eşikler A6.1–A6.2'deki gibidir. **Kabul:** n = 0, 1, 2, 3, 5, 12 için birim + görsel snapshot testleri; editör ve kullanıcı puanını birleştiren kod yok; Bayes formülü testli.
- Kabul kriterleri: n = 0, 1, 2, 3, 5, 12 için birim + görsel snapshot testleri; editör ve kullanıcı puanını birleştiren kod yok; Bayes formülü testli.

### REQ-DEG-002
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: Değerlendirme listesi varsayılan sıralaması **"En yeni"**; kullanıcı seçenekleri: en yeni, en yüksek puan, en düşük puan, en faydalı (Faz 2), belgeli olanlar. Olumsuz değerlendirmeler gizlenemez, aşağı itilemez; sponsorluk (Faz 1) ve işletme paketi (Faz 3, REQ-ISL-005) değerlendirme sıralamasını etkileyemez (otomatik test).
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-DEG-003
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: Filtreler: puan, deneyim türü/ziyaret türü, dil, fotoğraflı, belgeli. "Belgeli deneyim" rozeti yalnızca `DOCUMENTED` ya da `PROVIDER_VERIFIED` kayıtlara verilir; diğerleri "Kullanıcı beyanı".
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-DEG-004
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: Değerlendirme durum makinesi, gerekçe kodları ve bildirimler A6.4'teki gibidir. **Kabul (E2E-004/E2E-012):** misafir yazmaya başlar → giriş yapar → taslak korunur → gönderir → "İncelemede" → onay → bildirim → "Yayında"; ret senaryosunda gerekçe gösterilir ve yeniden gönderme çalışır; EXIF silme testli.
- Kabul kriterleri: misafir yazmaya başlar → giriş yapar → taslak korunur → gönderir → "İncelemede" → onay → bildirim → "Yayında"; ret senaryosunda gerekçe gösterilir ve yeniden gönderme çalışır; EXIF silme testli.

### REQ-DEG-005
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: Kullanıcı değerlendirmeleri sponsorlu içeriklerde, reklam kreatiflerinde ve işletme paneli dışa aktarımlarında alıntılanamaz (hukuki onay olmadan "değerlendirme widget'ı" yok).
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-DEG-006
- Düzey: ZORUNLU · Faz: 3 · Kaynak: v2 Ek A
- Gereksinim: İşletme yanıtı: doğrulanmış işletme temsilcisi, değerlendirme başına 1 herkese açık yanıt; yanıtlar da moderasyon kurallarına tabidir; yanıt değerlendirmenin sıralamasını/görünürlüğünü değiştirmez.
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-DEG-007
- Düzey: OLMALI · Faz: 2 · Kaynak: v2 Ek A
- Gereksinim: "Faydalı" oylaması: üye başına değerlendirme başına 1 oy; kendi değerlendirmesine oy yok; anormal oy kümeleri sinyal üretir.
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._
