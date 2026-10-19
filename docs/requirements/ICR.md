# ICR — İçerik ve editör

> Ek A'dan otomatik aktarıldı (`node scripts/import-requirements.mjs`). Durumlar `requirements.json` içindedir.

### REQ-ICR-001
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: **Blok tabanlı içerik editörü** (özel geliştirme; çekirdek editör kütüphanesi lisans izin listesinden seçilebilir — ADR). İçerik JSON blok dizisi olarak saklanır; her blok tipinin zod şeması `packages/contracts` içindedir; web ve mobil aynı blokları render eder.
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-ICR-002
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: **Blok tipleri (Faz 1):** başlık, paragraf (zengin metin: kalın, italik, bağlantı, liste), görsel, galeri, tablo, **listeleme kartı** (canlı veriye bağlı), **karşılaştırma tablosu** (listelemelerden/özelliklerden beslenir), harita (listeleme seçimi), bilgi kutusu (ipucu/uyarı), artılar–eksiler, puan kutusu (yalnızca `EditorialVerdict` bağlıysa), SSS, alıntı, **CTA** (dış yönlendirme servisine bağlı), **ticari açıklama bloğu** (sponsorlu/affiliate içerikte otomatik eklenir, silinemez), **sponsorlu yuva bloğu** (v1 "sponsorlu alan"; bir `PlacementSlot`'a bağlıdır, etiket zorunlu, A8.3 sınırlarına tabi; Liste, Karşılaştırma ve İnceleme içeriklerinde YASAK), içindekiler. Ham HTML bloğu YASAK.
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-ICR-003
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: Gömülü listeleme kartları **canlı** veriden render edilir (ad, puan, fiyat durumu, açık/kapalı); listeleme kapanırsa içerikte "Kalıcı olarak kapandı" görünür ve editörün panel iş listesine (REQ-ADM-009) görev düşer.
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-ICR-004
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: İçerik türleri ve şablonları: **Rehber** (destinasyon/konu; içindekiler, harita, pratik bilgi), **Liste** ("En iyi N"; seçim yöntemi kutusu ZORUNLU; sıra editoryal ve sponsorluktan bağımsız; içinde sponsorlu öğe YASAK), **Karşılaştırma** (A vs B; kriter tablosu; kazanan ancak test edildiyse), **İnceleme** (uzun test yazısı; `EditorialVerdict`'e bağlı), **Haber** (tarihli), **Sponsorlu içerik** (ticari ilişki ZORUNLU; puanlama blokları kullanılamaz).
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-ICR-005
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: **Yayın akışı:** `TASLAK → İNCELEMEDE → ONAYLANDI → ZAMANLANDI → YAYINDA → GÜNCELLENİYOR → ARŞİV`. Yazar yayımlayamaz; editör onaylar. Sponsorlu içerik ek olarak **ticari açıklama kontrolü** adımından geçer (yönetici/hukuk kontrol listesi). Önizleme bağlantısı (imzalı, süreli, `noindex`). Zamanlanmış yayın `Europe/Istanbul`'a göre.
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-ICR-006
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: Her içerikte: yazar (yazar sayfası bağlantılı), editör, **yayın tarihi**, **son güncelleme tarihi**, güncellemede kısa değişiklik notu ("Güncelleme notları"), kaynaklar bölümü (fiyat/saat/kural gibi olgular için), ticari ilişki beyanı. "Son güncelleme" yalnızca anlamlı içerik değişikliğinde değişir (yazım düzeltmesi tarih yenilemez).
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-ICR-007
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: **Deneyim beyanı** (v1 §14): her İnceleme/editör değerlendirmesinde ZORUNLU ve görünür: "Bizzat test edildi ({süre}, {koşullar})", "Yerinde ziyaret edildi ({ay yıl})", "Konaklandı", "Uzun süreli kullanıldı", "Kaynaklardan derlendi — denenmedi". Derlemelerde editör puanı verilemez. Gerçekleşmemiş testi yapılmış gibi, ziyaret edilmemiş mekanı deneyimlenmiş gibi anlatmak YASAK.
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-ICR-008
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: **Menfaat beyanı:** yayın formunda "Bu içerik için ücretsiz ürün/konaklama/davet ya da ödeme alındı mı?" sorusu ZORUNLU; evetse `commercialRelation=GIFTED/SPONSORED` ve etiket otomatik basılır (Ek A8.2).
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-ICR-009
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: Düzeltme politikası: yayımlanmış içerikteki olgusal hata düzeltmesi sayfada görünür "Düzeltme: {tarih} — {ne düzeltildi}" notuyla yapılır; denetim kaydına girer.
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-ICR-010
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: İçerik ve tasarım ayrıdır: editör yeni bir rehber, liste ya da koleksiyon sayfası hazırlamak için kod değiştirmez.
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-ICR-011
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: Yazar/editör profili sayfası: ad, unvan, uzmanlık alanları, yazdığı içerikler, kısa biyografi, (isteğe bağlı) sosyal bağlantılar, etik beyanı.
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-ICR-012
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: Editoryal metodoloji sayfaları: `/nasil-degerlendiriyoruz` (puan ölçekleri, Bayes formülü, deneyim beyanı türleri, test yöntemleri), `/editoryal-bagimsizlik`, `/sponsorlu-icerik-politikasi`, `/duzeltme-politikasi`. Metinler TASLAK damgalı (AK-12).
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._
