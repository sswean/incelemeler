# ISL — İşletme ve reklamveren portalı

> Ek A'dan otomatik aktarıldı (`node scripts/import-requirements.mjs`). Durumlar `requirements.json` içindedir.

### REQ-ISL-001
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: **Hesapsız işletme başvuru formu** (`/isletmeni-ekle`): işletme adı, tür/kategori, adres ya da hizmet bölgesi, iletişim, başvuran adı ve görevi, kurumsal e-posta, (isteğe bağlı) belge yükleme, KVKK aydınlatma bağlantısı ve gerekli onaylar; e-posta doğrulaması; yönetici inceleme kuyruğu (onay → listeleme taslağı / ret + gerekçe). E2E-007.
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-ISL-002
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: **Hesapsız reklam/sponsorluk başvuru formu** (`/reklam-ve-sponsorluk`): kuruluş, iletişim, ilgilenilen ürünler (A8.1), hedef şehir/kategori, bütçe aralığı (isteğe bağlı), mesaj; ticari ileti izni ayrı ve isteğe bağlı kutu; yönetici kuyruğu.
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-ISL-003
- Düzey: ZORUNLU · Faz: 3 · Kaynak: v2 Ek A
- Gereksinim: İşletme hesabı: sahiplenme (`/isletmeni-sahiplen/{slug}`) + doğrulama (REQ-GUN-011); profil bilgisi güncelleme **önerisi** (editör onayıyla yayımlanır); fotoğraf ve belge gönderme (lisans beyanıyla); değerlendirmelere yanıt; soru-cevap yanıtları; basit istatistikler (görüntüleme, dış yönlendirme tıklamaları — yalnızca gerçek veri).
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-ISL-004
- Düzey: ZORUNLU · Faz: 3 · Kaynak: v2 Ek A
- Gereksinim: Reklamveren portalı: kampanya başvurusu oluşturma, başvuru durumunu takip, onaylanan kampanyaların performansını görüntüleme (REQ-SPN-011), sözleşme/fatura belgelerini görüntüleme (manuel yüklenen). Kampanya satın alma ve ödeme: kapsam dışı (`PaymentPort` yalnızca arayüz).
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-ISL-005
- Düzey: ZORUNLU · Faz: 3 · Kaynak: v2 Ek A
- Gereksinim: İşletme paketleri (ücretsiz/ücretli seviyeler) yönetim panelinden tanımlanır; **hiçbir paket** puanı, organik sıralamayı, değerlendirme görünürlüğünü ya da moderasyonu etkileyemez (AK-04) — paket özellikleri sözleşme dilinde ve testle sınırlanır.
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-ISL-006
- Düzey: ZORUNLU · Faz: 3 · Kaynak: v2 Ek A
- Gereksinim: İşletme tarafından gönderilen içerik, doğrulama ve editoryal onaydan geçmeden yayımlanmaz; `dataOrigin=OWNER`, `commercialRelation=OWNER_PROVIDED` olarak işaretlenir ve "İşletme tarafından sağlandı" ibaresiyle gösterilir.
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-ISL-007
- Düzey: ZORUNLU · Faz: 3 · Kaynak: v2 Ek A
- Gereksinim: Kuruluş üyeliği davetle; roller OWNER/MANAGER/AD_MANAGER; erişim kuruluş kapsamlı (REQ-HSP-010).
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._
