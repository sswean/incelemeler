# ADM — Yönetim paneli

> Ek A'dan otomatik aktarıldı (`node scripts/import-requirements.mjs`). Durumlar `requirements.json` içindedir.

### REQ-ADM-001
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: Panel ayrı uygulama/alt alan adında; yalnızca personel; 2FA zorunlu (REQ-HSP-007); `noindex`; IP izin listesi İSTEĞE BAĞLI.
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-ADM-002
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: Genel pano yalnızca gerçek sayaçlar gösterir: bekleyen moderasyon, tazelik kuyruğu, bekleyen başvurular, aktif kampanyalar, son 7 gün olay özetleri; veri yoksa "Veri yok".
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-ADM-003
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: Tablolarda arama, filtre, sıralama, sayfalama, toplu işlem (onaylı + denetim kaydı), CSV dışa aktarma (yetkili roller, step-up).
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-ADM-004
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: Formlar şemadan (zod) doğrulanır; kategori şemasına göre dinamik özellik alanları; kaydetmeden çıkış uyarısı; eşzamanlı düzenleme çakışmasında (412) fark gösterimi.
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-ADM-005
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: Medya kütüphanesi: yükleme, odak noktası seçimi, alt metin (ZORUNLU, Türkçe), lisans alanları (ZORUNLU), kullanım yerleri, yeniden kullanım, lisans süresi dolan görseller için uyarı.
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-ADM-006
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: Ana sayfa düzenleyici: modül ekle/sırala/gizle, veri kaynağı (editoryal seçim/kural/kişisel/sponsorlu), görünürlük kuralları (tarih, şehir, platform), önizleme; sponsorlu sınırları aşan yapılandırma kaydedilemez.
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-ADM-007
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: SEO alanları: başlık, açıklama, canonical geçersiz kılma (yalnızca yönetici), `noindex`, OG görseli, yapılandırılmış veri önizlemesi; yönlendirme yönetimi (301/410, zincir uyarısı).
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-ADM-008
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: Panel arayüzü Türkçe; panelin kendisi de erişilebilirlik ve klavye kullanımı gereksinimlerine tabidir (Ek A18).
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-ADM-010
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: **Gelir raporu** (modül 22): kaynağa göre — sponsorluk anlaşma tutarları (elle girilen, yalnızca yönetici), affiliate komisyonu (tahmini ve onaylı ayrı; yalnızca sağlayıcı raporu/içe aktarma varsa), işletme paketleri (Faz 3); dönem filtresi, CSV; yalnızca gerçek ya da elle girilmiş veriden, kaynağı etiketli; veri yoksa "Veri yok".
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-ADM-011
- Düzey: ZORUNLU · Faz: 2 · Kaynak: v2 Ek A
- Gereksinim: **Bildirim yönetimi** (modül 20): şablonlar (işlemsel/editoryal/ticari ayrımı), hedef kitle, sıklık sınırları ve sessiz saatlerle uyum, önizleme ve test gönderimi (yalnızca personel cihazlarına); gerçek kullanıcılara gönderim C sınıfı ve ticari iletiler ayrı onaya bağlı (A17.5).
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-ADM-009
- Düzey: OLMALI · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: Editör iş akışları: bana atananlar, inceleme bekleyenler, yayın takvimi, tazelik görevleri; içerik kontrol listesi (kaynak, deneyim beyanı, menfaat beyanı, alt metin, iç bağlantı).
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._
