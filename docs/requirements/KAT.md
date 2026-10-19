# KAT — Kategori ve taksonomi

> Ek A'dan otomatik aktarıldı (`node scripts/import-requirements.mjs`). Durumlar `requirements.json` içindedir.

### REQ-KAT-001
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: Yönetici kod değiştirmeden kategori, alt kategori, özellik şeması, değerlendirme kriteri ve koleksiyon sayfası ekleyebilir, sıralayabilir, gizleyebilir. **Kabul:** E2E'de yönetici "Glamping alanları" kategorisini (kind=LODGING) ve 3 özellik (`hasPrivateBathroom: bool`, `tentType: enum`, `maxGuests: int`) oluşturur, bir listeleme ekler, yayımlar ve bu özelliklere göre filtreler — deploy gerekmez.
- Kabul kriterleri: E2E'de yönetici "Glamping alanları" kategorisini (kind=LODGING) ve 3 özellik (`hasPrivateBathroom: bool`, `tentType: enum`, `maxGuests: int`) oluşturur, bir listeleme ekler, yayımlar ve bu özelliklere göre filtreler — deploy gerekmez.

### REQ-KAT-002
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: Aynı listeleme iki kategori düğümünde ayrı listeleme olarak bulunmaz; "Aile dostu" bir kategori değil, özellik + koleksiyon olarak çalışır.
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-KAT-003
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: Kategori durumları `TASLAK → GİZLİ (yalnızca personel) → YAYINDA`; yayın eşiği (§7.2) altındaki kategori/hub menüde, site haritasında ve aramada önerilmez.
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-KAT-004
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: **YMYL ve lisanslı kategoriler:** sağlık, finans, hukuk gibi güven gereksinimi yüksek kategoriler ve lisans gerektiren kategoriler (turist rehberi, konaklama, seyahat acentesi/tur operatörü, alkol servisi olan mekan tanıtımı) kategori bayraklarıyla işaretlenir. Bu kategorilerde: uzman incelemesi zorunlu, sponsorluk varsayılan kapalı; yayın **üretim ortamında ve `dataOrigin≠DEMO` listelemelerde** `legalGate` arkasındadır ve açılması C sınıfıdır (Ek D1). Yerel/test/staging ortamlarında `dataOrigin=DEMO` listelemeler için kapı, yalnızca bu ortamlarda yüklenen bir test fikstürüyle (`LegalApproval`, onaylayan=`TEST-FIXTURE`) açılır; fikstür üretim derlemesine giremez (E2E-020). Demo konaklamada belge no açıkça geçersiz bir yer tutucudur (`DEMO-0000`) ve "doğrulandı" ibaresi gösterilmez.
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-KAT-005
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: Navigasyon: üst menüde en fazla 7 öğe (öneri: Seyahat, Konaklama, Yeme-İçme, Ürünler, Hizmetler, Rehberler, Fırsatlar); mega menü en fazla 2 seviye; mobil "Keşfet" sekmesinde en fazla 12 kategori kutucuğu. Menü yönetim panelinden düzenlenir.
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._
