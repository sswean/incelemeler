# YRL — Yerelleştirme ve UX durumları

> Ek A'dan otomatik aktarıldı (`node scripts/import-requirements.mjs`). Durumlar `requirements.json` içindedir.

### REQ-YRL-001
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: `slugifyTr`: Türkçe küçük harf → transliterasyon (ç→c, ğ→g, ı→i, İ→i, ö→o, ş→s, ü→u) → kesme işaretleri silinir → alfasayısal dışı → tire → çoklu tire tekilleşir; test seti (ör. "İzmir'in Çeşme'si" → `izmirin-cesmesi`, "IĞDIR" → `igdir`).
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-YRL-002
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: **Ek uyumu yardımcıları:** programatik başlıklarda bulunma/yönelme/ilgi ekleri ünlü uyumu, ünsüz yumuşaması/sertleşmesi ve kesme işaretiyle doğru üretilir ("İzmir'de", "Kars'ta", "Antalya'ya", "Muğla'nın"); kısaltma ve sayılarla biten adlar için test seti; çözülemeyen durumlarda ek gerektirmeyen başlık kalıbına düşülür ("Kahvaltı mekanları · İzmir").
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-YRL-003
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: Biçimler `Intl` ile ve `tr-TR`: para `1.234,56 ₺`, tarih `18.10.2026`, uzun tarih `18 Ekim 2026`, saat `14:30`, yüzde `%25`, puan `4,3`, mesafe `350 m` / `1,2 km`; göreli zaman ("3 gün önce") ve mutlak tarih birlikte (tooltip değil, erişilebilir metin). Telefon numaraları `+90 5XX XXX XX XX` biçiminde ve `tel:` bağlantılı.
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-YRL-004
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: Adres biçimi Türkiye'ye uygun: mahalle, cadde/sokak, no, ilçe, il, posta kodu.
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-YRL-005
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: **Mikro metin rehberi** (`docs/ux/metin-rehberi.md`): "sen" hitabı, kısa ve net cümleler, eylem odaklı buton metinleri ("Değerlendirme yaz", "Fiyatları gör"), suçlayıcı olmayan hata mesajları, terimler sözlükle tutarlı ("Rehber" yalnızca yazı; "Turist rehberi" kişi).
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-YRL-006
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: **Yasak karanlık örüntüler** (AK-15): sahte aciliyet/kıtlık, önceden işaretli izinler, "Hayır, tasarruf etmek istemiyorum" tarzı utandırıcı reddetme, gizlenmiş abonelikten çıkma, reddet seçeneği kabul et kadar görünür olmayan çerez banner'ı, giriş duvarı.
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._
