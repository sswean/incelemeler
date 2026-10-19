# ERS — Erişilebilirlik

> Ek A'dan otomatik aktarıldı (`node scripts/import-requirements.mjs`). Durumlar `requirements.json` içindedir.

### REQ-ERS-001
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: Hedef: **WCAG 2.2 AA** (web + panel); Türkiye'deki güncel erişilebilirlik düzenlemeleri doğrulanır (Ek D1).
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-ERS-002
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: Otomatik denetim (axe-core) her E2E sayfa ziyaretinde; **ciddi/kritik ihlal sayısı 0** (CI kırmızı).
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-ERS-003
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: Klavye ile tam kullanım: görünür odak halkası (token), mantıklı odak sırası, "İçeriğe atla" bağlantısı, modal/bottom sheet'te odak tuzağı ve Esc ile kapanma, menü ve combobox ARIA kalıpları.
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-ERS-004
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: Anlamlı HTML: tek `h1`, başlık hiyerarşisi, landmark'lar, liste/tablo semantiği, form etiketleri, hata mesajlarının alanla ilişkilendirilmesi (`aria-describedby`) ve canlı bölgeyle duyurulması.
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-ERS-005
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: Renk kontrastı token düzeyinde testli (A14.2); bilgi yalnızca renkle verilmez.
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-ERS-006
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: **Puan bileşenleri:** görsel yıldızlar `aria-hidden`; metin alternatifi "5 üzerinden 4,3 puan, 128 değerlendirme"; puan girişi radyo grubu olarak klavye ve ekran okuyucuyla kullanılabilir.
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-ERS-007
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: **Harita:** harita içeriğinin eşdeğeri liste olarak erişilebilir; harita kontrolleri klavyeyle kullanılabilir ya da atlanabilir. **Karusel:** otomatik oynatma yok; önceki/sonraki butonları etiketli.
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-ERS-008
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: Dokunma hedefleri ≥ 24×24 CSS px (WCAG 2.2 asgari) ve birincil eylemlerde ≥ 44×44; 320 px genişlikte ve %200 yakınlaştırmada yatay kaydırma yok; `prefers-reduced-motion` desteği.
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-ERS-009
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: Görsellerde anlamlı Türkçe alt metin (yönetim panelinde ZORUNLU alan); dekoratif görselde boş alt.
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._

### REQ-ERS-010
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A
- Gereksinim: Ekran okuyucuyla (VoiceOver, TalkBack, NVDA) kritik akışların uçtan uca kontrolü `M` yöntemli, `MANUAL-QA` içinde.
- Kabul kriterleri: _Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._
