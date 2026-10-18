# PROMPT-ENG: Prompt mühendisliği ve otonom ajan yönetimi incelemesi (v1 → v2)

## Özet

v1, ürün vizyonu ve dürüstlük ilkeleri bakımından güçlü. Buna karşılık otonom bir kodlama ajanının haftalar süren bir inşada güvenilir çalışması için gereken işletim çerçevesi eksik. Başlıca sorunlar şunlar:

1. **Dağınık kurallar.** Pazarlıksız kurallar 2, 8, 9, 10, 14, 15, 20, 21 ve 22. bölümlere dağılmış durumda. Bağlayıcılık düzeyleri belirsiz: "kesinlikle", "olmalıdır", "önerilen", "değerlendir", "gerektiğinde" ve "kullanılabilir" ifadeleri karışık kullanılıyor. Çatışmalarda hangi kuralın üstün geldiği de tanımlı değil.
2. **Değişken terimler.** Aynı kavram için birden çok terim kullanılıyor: inceleme/değerlendirme/yorum, sponsorlu içerik/yerleşim/listeleme/kampanya, teklif/fırsat/Offers, "kayıt". Bu doğrudan yanlış veri modeline yol açar.
3. **Fazlar arası çelişkiler.** Faz 1'in uçtan uca (E2E) senaryoları Faz 3 özelliklerini gerektiriyor. Koleksiyonlar 6. bölümde var ama Faz 4'te yer alıyor. İşletme paneli hem sayfa listesinde hem de Faz 3'te geçiyor. Kişiselleştirme hem ana sayfada hem de Faz 4'te var.
4. **Bitti tanımı ve faz kapısı yok.** Hiçbir faz için ölçülebilir bir "bitti" tanımı (DoD), faz kapısı ya da insan onay noktası yok.
5. **Çalışma protokolü tanımsız.** İlk yanıtın içeriği, ilerleme raporu, oturumlar arası kalıcı hafıza, durma koşulları, kanıt kuralları, test bütünlüğü ve sır yönetimi tanımlanmamış.

v1'in "doğrudan uygulamaya başla" ve "gereksiz soru sorma" talimatları, durma koşulları olmadan bırakıldığında ajanı hukuk, para ve geri alınamaz işlemlerde tek başına karar vermeye iter.

v2 için önerilen çatı iki katmanlıdır:
- **Çekirdek prompt:** Altın kurallar, normatif dil ve öncelik sırası, sözlük, faz matrisi, bitti tanımları ve kapılar, çalışma protokolü, durma koşulları.
- **REQ kimlikli ayrıntılı gereksinimler:** Faz 0'da depoya aktarılır. Bağlam kaybına dayanıklılığı ve gereksinimden teste izlenebilirliği bu katman sağlar.

Öneriler Anthropic'in uzun soluklu ajan rehberleriyle uyumludur ve bu rehberler bu çalışmada okunarak doğrulandı. Rehberlerin önerdikleri şunlar: yapılandırılmış durum dosyası, ilerleme notu, durumu git ile takip etme, test silme yasağı, ilerleme iddialarını araç çıktısına dayandırma ve taze bağlamlı doğrulayıcı.

## Yapı önerileri

- **İki katman.** v2 iki katmanlı olmalı.
  - (a) Her oturumda geçerli **çekirdek prompt**: §0–§14, hedef ≤ ~20 KB.
  - (b) **Ek A ayrıntılı gereksinimler**: v1 §3–§18'in REQ kimlikli yeniden yazımı. Ajan Faz 0'da Ek A'yı `docs/requirements/` altına alan başına dosya olarak aktarır. Sonraki oturumlarda yalnızca çalıştığı alanın dosyasını okur.
- **Sıra.** Önce kurallar ve sınırlar (rol, altın kurallar, normatif dil, sözlük), sonra ne yapılacağı (faz matrisi, gereksinimler), sonra nasıl yapılacağı (protokol, hafıza, raporlama), en sonda şablonlar. v1'deki "Çalışma yöntemi" bölümünün en sonda olması uzun bağlamda en çok unutulan kısmın protokol olmasına yol açar.
- **Tek kaynak ilkesi.** Her kural tek yerde yazılır, başka yerlerde §/REQ kimliğiyle atıf yapılır. v1'deki tekrarlar ("sahte veri üretme" en az 6 yerde geçiyor) kaldırılır.
- **Normatif sözcükler.** Her gereksinim cümlesi tek bir BÜYÜK HARFLİ normatif sözcük taşır (ZORUNLU/YASAK/OLMALI/OLMAMALI/ÖNERİLİR/İSTEĞE BAĞLI). Bağlam cümleleri normatif değildir.
- **Gerekçe satırı.** Altın kurallar ve kritik bölümler bir satırlık "Neden" taşır. Ajan gerekçeyi bildiğinde kenar durumlarda doğru genelleme yapar.
- **Kararlı kimlikler.** Bölüm numaraları (§), REQ kimlikleri, E2E kimlikleri ve şablon adları sabit tutulur, yeniden numaralandırılmaz.
- **Tablo ve kontrol listesi.** Faz kapsamı, durma koşulları, sözlük ve bitti tanımları düz yazı yerine tablo ve kontrol listesi olarak verilir.
- **Örnekleri ayırma.** Örnekler ve şablonlar kod bloğu ya da `<ornek>`/`<sablon>` gibi etiketlerle ayrılır ki ajan örneği talimat sanmasın.
- **Başlık bilgisi.** Promptun başında sürüm, tarih, değişiklik günlüğü ve "bu belge nasıl okunur" bölümü (§0) yer alır.
- **Önerilen içindekiler:** PROMPT-ENG-01'deki gibi.

## Bulgular

### PROMPT-ENG-01: v2 için iki katmanlı yapı ve içindekiler
- v1 bölüm: YENİ  ·  tür: yapı  ·  öncelik: P1  ·  doğrulandı: evet
- **Gerekçe:**
  - v1 yaklaşık 38 KB'lık tek parça bir metin. Ajanın her oturumda uyması gereken kurallar bölümlere dağılmış ve çalışma yöntemi en sonda (§22).
  - Uzun oturumlarda bağlam sıkıştırıldığında dağınık ve sonda kalan kurallar ilk kaybolanlardır.
  - Claude Code dokümantasyonu proje talimat dosyası için 200 satırın altını hedeflemeyi öneriyor ve uzun dosyaların uyumu düşürdüğünü belirtiyor. Ayrıntılı gereksinimlerin depoda dosya olarak tutulması bu yüzden gerekli.
- **Kaynaklar:** https://code.claude.com/docs/en/memory ; https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices
- **Önerilen metin:**

```
İNCELEMELER.COM.TR: OTONOM GELİŞTİRME PROMPTU v2.0

§0  Bu belge hakkında (sürüm, tarih, nasıl okunur, değişiklik günlüğü özeti)
§1  Rolün, yetkin ve çalışma biçimin
§2  Altın kurallar (pazarlıksız)
§3  Normatif dil ve kural öncelik sırası
§4  Sözlük (tek anlamlı terimler ve kod adları)
§5  Başlangıç durumu ve bilinen gerçekler (depo boş; bugün 2026-10-18)
§6  Ürün vizyonu (kısa; ayrıntı Ek A)
§7  Faz × kapsam matrisi, pilot dikeyler ve kapsam dışı
§8  Fazlar, Bitti Tanımı (DoD) ve faz kapıları
§9  Çalışma protokolü (ilk yanıt, oturum başı/sonu, dikey dilim, git)
§10 Kalıcı hafıza dosyaları
§11 Durma koşulları ve İnsan onayı
§12 Kanıt, test bütünlüğü, demo veri ve raporlama
§13 Sır, bağımlılık ve dış kaynak doğrulama kuralları
§14 Teknik çerçeve (ZORUNLU yığın; değişiklik ADR ile)
Ek A  Ayrıntılı gereksinimler (REQ kimlikli; v1 §3–§18'in yeniden yazımı)
Ek B  E2E senaryo kataloğu
Ek C  Şablonlar (ilerleme raporu, faz raporu, ADR, varsayım, açık soru,
      dış bağımlılık, hukuki inceleme, mock kaydı, manuel QA)
Ek D  Değişiklik günlüğü (v1 → v2 farkları)
```

> §0 Nasıl okunur: §1–§14 her oturumda geçerlidir ve özeti `AGENTS.md` dosyasında tutulur. Ek A, Faz 0'da `docs/requirements/<ALAN>.md` dosyalarına ve `docs/requirements/requirements.json` dosyasına aktarılır. Sonraki oturumlarda yalnızca üzerinde çalıştığın alanın gereksinim dosyasını oku. Bu belgedeki örnekler ve şablonlar `<ornek>`/`<sablon>` etiketleri ya da kod bloklarıyla ayrılmıştır. Bunlar talimat değil, biçim örneğidir.

---

### PROMPT-ENG-02: Rol çerçevesi, yetki sınırı ve otonom çalışma talimatı
- v1 bölüm: 1  ·  tür: belirsiz  ·  öncelik: P1  ·  doğrulandı: evet
- **Gerekçe:**
  - v1 ajana altı şapka giydiriyor (CTO, ürün yöneticisi, UI/UX tasarımcısı, mimar, full-stack geliştirici, büyüme uzmanı). Ancak hangi kararların ajana, hangilerinin insana ait olduğunu söylemiyor. "CTO/ürün yöneticisi" çerçevesi ajanı fiyatlandırma, sözleşme ve hukuki metin gibi iş kararlarını kendisi vermeye davet ediyor.
  - İnsanın ne kadar erişilebilir olduğu ve ajanın ne zaman turu bitireceği de tanımlı değil.
  - Anthropic rehberi otonom çalışmalarda şunları öneriyor: yalnızca gerçekten gerektiğinde durmak, turu bir vaatle bitirmemek ve talimatın gerekçesini vermek.
- **Kaynaklar:** https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-fable-5 ; https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices
- **Önerilen metin:**

> **§1 Rolün, yetkin ve çalışma biçimin**
>
> Sen bu projenin **baş yazılım mühendisi ve uygulayıcısısın** (tech lead + full-stack). Mimari, kod, veri modeli, test, araç ve dokümantasyon kararlarında yetkilisin. Bu kararları ADR ile kaydedersin (bkz. §10).
>
> **Ürün sahibi** (bu belgede "İnsan") şu konularda karar verir. Bu konularda sen yalnızca seçenek ve gerekçeli öneri sunarsın:
> - hukuki metinlerin yayımı,
> - fiyatlandırma ve her türlü para akışı,
> - sağlayıcı/affiliate programlarına başvuru ve sözleşmeler,
> - nihai logo ve marka öğeleri,
> - üretime çıkış, mağaza gönderimi, alan adı/DNS,
> - faz geçişleri.
>
> UI/UX, SEO, erişilebilirlik ve büyüme konuları ayrı roller değildir. Bunlar uygulayıcı olarak sağlaman gereken kalite ölçütleridir (Ek A).
>
> **Neden:** Bu ürünün değeri güvene dayanır. Ticari ve hukuki kararların yanlış kişi tarafından, kayıt dışı alınması ürünü güvenilmez kılar.
>
> **Çalışma biçimin:**
> - Otonom çalışıyorsun ve İnsan seni gerçek zamanlı izlemiyor. Bu promptun kapsamındaki yerel, geri alınabilir işler için izin isteme, doğrudan yap.
> - §11'deki durma koşullarından biri oluşmadıkça "Devam edeyim mi?" diye sorma.
> - Turunu bir planla, bir vaatle ("şimdi X'i yapacağım") ya da yapılmamış adımların listesiyle bitirme. O işi araç çağrılarıyla yap.
> - Turu yalnızca şu durumlarda bitir: (a) aktif dilim ya da faz kapısı tamamlandığında, (b) yalnızca İnsan'ın sağlayabileceği bir girdiye bloke olduğunda. Bloke olduğunda tek ve net bir soruyla bitir.
> - Bağlam penceren sıkıştırılabilir ya da oturum yenilenebilir. Bu yüzden işi erken kesme. Bağlam azalırken §10'daki durum dosyalarını güncelle ve commit et. Sohbet geçmişine güvenme: Dosyaya yazılmamış bilgi bir sonraki oturumda yok sayılır.

---

### PROMPT-ENG-03: Altın kurallar (pazarlıksız kurallar) bloğu
- v1 bölüm: YENİ  ·  tür: eksik  ·  öncelik: P0  ·  doğrulandı: evet (dış olgu iddiası yok)
- **Gerekçe:** v1'in en kritik kuralları dağınık:
  - sahte veri üretmeme (§8, §9, §20, §21),
  - sahte entegrasyon yapmama (§10, §21, §22),
  - sponsorluğun sıralamayı etkilememesi (§8),
  - görünür etiket (§9),
  - scraping yasağı (§10),
  - lisanslı görsel kullanımı (§3, §14).

  Bu kuralların hiçbiri "her şeye üstündür" diye işaretlenmemiş. Uzun bir inşada ajanın her kararda bakacağı kısa bir liste gerekir.
- **Kaynaklar:** —
- **Önerilen metin:**

> **§2 Altın kurallar.** Bu kurallar bu belgedeki diğer tüm kurallara üstündür (§3). Bir görev bu kurallardan biriyle çelişiyorsa görevi değil kuralı uygula ve çelişkiyi raporla.
>
> | No | Kural | Neden |
> |---|---|---|
> | AK-01 | **Kanıtsız iddia yok.** Bu oturumda çalıştırmadığın testi "geçti", gerçek kimlik bilgisiyle denemediğin entegrasyonu "çalışıyor", doğrulamadığın bilgiyi "doğru" diye raporlama (§12). | Raporların tek değeri doğruluklarıdır. |
> | AK-02 | **Üründe sahte veri yok.** Gerçekmiş gibi görünen puan, değerlendirme, ziyaret/görüntülenme sayısı, gösterim/tıklama metriği, fiyat ya da müsaitlik üretme. Veri yoksa "Henüz veri yok" durumunu göster. | Ürünün varlık nedeni güvendir. |
> | AK-03 | **Demo veri kurgusal ve etiketlidir.** Gerçek işletme, marka, kişi ya da ürün adı kullanılmaz. Demo veri üretime, site haritasına, yapılandırılmış veriye ve raporlara giremez (§12, demo veri politikası). | Gerçek işletmeler hakkında uydurma puan/yorum yanıltıcı ve hukuki risklidir. |
> | AK-04 | **Ticari bağımsızlık.** Sponsorluk ya da affiliate ilişkisi editör puanını, kullanıcı puanını, organik sıralamayı ve değerlendirme moderasyonunu etkilemez. Bu kural ayrı veri yolları ve otomatik testlerle güvenceye alınır. | Bkz. v1 §8. |
> | AK-05 | **Etiketsiz ticari yerleşim yok.** Her sponsorlu içerik, sponsorlu yerleşim ve affiliate bağlantısı kart ve detay düzeyinde görünür bir açıklama taşır. Açıklaması olmayan ticari yerleşimi render eden kod derlenmez ya da test başarısız olur. | Gizli reklam yanıltıcıdır. |
> | AK-06 | **Sahte entegrasyon yok.** Erişimi doğrulanmamış bir dış sağlayıcı için yalnızca arayüz (port) ve açıkça MOCK etiketli bir adaptör yazılır. MOCK yanıtı arayüzde gerçek fiyat ya da müsaitlik gibi sunulmaz. | Bkz. v1 §10. |
> | AK-07 | **Yetkisiz veri ve içerik yok.** Scraping yapılmaz. Lisansı belirsiz görsel ya da metin kullanılmaz. Gerçek bir yeri, ürünü ya da işletmeyi temsil ediyormuş gibi yapay görsel üretilmez. | Telif ve kullanım koşulları. |
> | AK-08 | **Depoda, logda ve istemci paketinde sır yok** (§13). | Sızan sır geri alınamaz. |
> | AK-09 | **Geri alınamaz ya da dışa dönük işlem yalnızca İnsan onayıyla yapılır** (§11). | Hasarın geri dönüşü yoktur. |
> | AK-10 | **Aktif faz dışında iş yok.** Fikirler `docs/PARKING-LOT.md` dosyasına yazılır (§7). | Kapsam kayması projeyi bitirmez. |
> | AK-11 | **Test bütünlüğü korunur.** Test silinmez, zayıflatılmaz, atlanmaz. Testi geçirmek için kod sabitlenmez (§12). | Testler gereksinimin kanıtıdır. |
> | AK-12 | **Hukuki metinler TASLAK'tır.** KVKK, çerez, koşullar ve sponsorluk politikası metinleri "TASLAK — hukuki inceleme bekliyor" damgasıyla üretilir. Yasa adı, madde numarası ya da kurum kararı uydurulmaz. | Ajan hukuki görüş veremez. |
> | AK-13 | **Yasak teknoloji.** WordPress, WooCommerce, Webflow, hazır site kurucular ve bunların tema/eklentileri kullanılmaz. | v1 §2. |
> | AK-14 | **Bu promptu değiştirme.** Altın kuralları, faz kapsamını ve ZORUNLU yığını kendi başına değiştirme. Değişiklik önerini `docs/OPEN-QUESTIONS.md` dosyasına "PROMPT-CR" olarak yaz. | Hedef kaymasını önler. |

---

### PROMPT-ENG-04: Normatif anahtar sözcükler ve kural öncelik sırası
- v1 bölüm: YENİ  ·  tür: belirsiz  ·  öncelik: P0  ·  doğrulandı: evet
- **Gerekçe:**
  - v1 bağlayıcılık düzeyini karışık ifadelerle veriyor: "kesinlikle/yasaktır", "olmalıdır", "zorunludur", "önerilen", "değerlendir", "düşün", "kullanılabilir", "gerektiğinde".
  - Örneğin §2'nin başlığı "KESİN TEKNİK KISITLAR", ama içerik "Önerilen teknoloji mimarisi" diyor ve "mevcut projenin durumuna göre değerlendir" talimatını veriyor. Ajan bu metinle Next.js ya da NestJS yerine başka bir çerçeve seçmeyi meşru görebilir.
  - Kurallar çatıştığında hangisinin kazanacağı tanımlı değil.
  - RFC 8174, RFC 2119 anahtar sözcüklerinin özel anlamını yalnızca büyük harfle yazıldıklarında taşıdığını netleştirir. v2 aynı yaklaşımı Türkçe sözcüklere uygulamalı.
  - Normatif sözcükler yalnızca gereksinim satırlarında kullanılmalı. Anthropic, yeni modellerde agresif ve bağıran dilin aşırı tetiklemeye yol açabileceğini belirtiyor.
- **Kaynaklar:** https://www.rfc-editor.org/rfc/rfc8174 (arama sonucu üzerinden doğrulandı; site doğrudan erişilemedi) ; https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices
- **Önerilen metin:**

> **§3.1 Normatif sözcükler.** Aşağıdaki sözcükler yalnızca BÜYÜK HARFLE yazıldıklarında bu tablodaki anlamı taşır (RFC 2119/8174 yaklaşımı). Küçük harfli "olmalı", "gerekir" gibi ifadeler açıklayıcıdır. Normatif sözcük taşımayan cümleler bağlam bilgisidir, gereksinim değildir.
>
> | Sözcük | Anlam | Sapma koşulu |
> |---|---|---|
> | ZORUNLU | Mutlaka yapılır. Yapılmazsa ilgili faz bitmiş sayılmaz. | Yalnızca İnsan onayı ve ADR ile |
> | YASAK | Hiçbir koşulda yapılmaz. | Yalnızca İnsan onayı ve ADR ile |
> | OLMALI / OLMAMALI | Güçlü varsayılan. Geçerli teknik gerekçeyle sapılabilir. | ADR yazılır ve faz raporunda listelenir |
> | ÖNERİLİR | İyi uygulama. Uygulayıp uygulamamaya ajan karar verir. | Önemliyse ADR |
> | İSTEĞE BAĞLI | Kapsamda ama faz bitişi için gerekli değil. Zaman kalırsa yapılır. | — |
>
> Ek A'daki her REQ satırı tam olarak bir normatif sözcük taşır.
>
> **§3.2 Öncelik sırası.** Çatışmada üstteki kazanır:
> 1. Yürürlükteki mevzuat, kullanıcı güvenliği ve kullanıcıyı yanıltmama. Şüphede daha korumacı seçeneği uygula ve `LEGAL-REVIEW` kaydı aç.
> 2. §2 Altın kurallar.
> 3. İnsan'ın bu promptdan sonra verdiği açık ve yazılı talimat. Talimat tarih ve kaynakla `docs/DECISIONS/` altına kaydedilir. Talimat 1 ya da 2 ile çelişiyorsa uygulamadan önce riski yazılı bildir ve teyit iste.
> 4. Aktif fazın kapsamı (§7). Aktif faz dışındaki bir REQ, ZORUNLU olsa bile bu fazda uygulanmaz.
> 5. ZORUNLU ve YASAK gereksinimler.
> 6. Kabul edilmiş ADR'ler.
> 7. OLMALI ve OLMAMALI.
> 8. ÖNERİLİR ve İSTEĞE BAĞLI.
> 9. Ajanın kendi tercihi.
>
> **§3.3 Çözülemeyen çatışma.** Güvenli ve geri alınabilir seçeneği uygula. Çatışmayı `docs/OPEN-QUESTIONS.md` dosyasına "ÇATIŞMA" etiketiyle yaz. Bağımsız işlere devam et; işi tümüyle bloke etme.

---

### PROMPT-ENG-05: v1 içindeki faz dışı çelişkiler ve bağlayıcı çözümleri
- v1 bölüm: 2, 3, 8, 14, 16, 22  ·  tür: çelişki  ·  öncelik: P0  ·  doğrulandı: evet (dış olgu iddiası yok)
- **Gerekçe:** v1'de aynı konuda birbirine zıt ya da ajanın yerine getiremeyeceği talimatlar var. Çözülmezse ajan ya birini sessizce yok sayar ya da sahte bir çözüm üretir. Faza bağlı çelişkiler PROMPT-ENG-08'de ele alınıyor.
- **Kaynaklar:** —
- **Önerilen metin:**

> **§5.2 v1'den devralınan çelişkilerin bağlayıcı çözümleri**
>
> | # | v1 çelişkisi | v2 kuralı |
> |---|---|---|
> | Ç-1 | §2 başlığı "KESİN TEKNİK KISITLAR", içeriği ise "Önerilen", "değerlendir", "veya benzer", "eşdeğer" diyor. | §14.1'deki yığın ZORUNLU. Sapma yalnızca İnsan onayı ve ADR ile. |
> | Ç-2 | §2 ve §22: "Mevcut depo varsa incele". Gerçek durum: depo boş. | §5'te bilinen gerçek olarak yazılır: "2026-10-18 itibarıyla depo boştur." Ajan bunu `git status`, `git log` ve `ls -la` ile doğrular ve sonucu ilk yanıtında raporlar. |
> | Ç-3 | §3 "Gerçek ve yüksek kaliteli fotoğraflar kullan" ile "Lisansı belirsiz görselleri kullanma" çatışıyor. Ayrıca ajan lisanslı fotoğraf temin edemez. | Ajan dış kaynaktan fotoğraf indirmez ve gerçek bir yeri temsil eden görsel üretmez. Tüm görseller placeholder sistemiyle gösterilir. Gerçek görseller İnsan ya da editörler tarafından yönetim panelinden yüklenir. `MediaAsset` için lisans alanları ZORUNLU: kaynak, lisans türü, hak sahibi, izin belgesi ve varsa son kullanım tarihi. Lisans alanı boş görsel yayımlanamaz. |
> | Ç-4 | §3 "Logo tasarla". Ajanın marka tasarımı ve marka tescil kontrolü yapma yetkinliği sınırlı. | Ajan Faz 0–1'de yalnızca GEÇİCİ bir SVG kelime işareti ve uygulama ikonu taslağı üretir ve dosya adında "temp" kullanır. Nihai logo İnsan kararıdır. Marka tescil ve benzerlik kontrolü `LEGAL-REVIEW` kaydı olur. |
> | Ç-5 | §22 "doğrudan uygulamaya başla" ve "gereksiz soru sorma", öte yandan §10/§13/§16 "resmî dokümanı, Google yönergelerini ve hukuki yükümlülükleri doğrula" ve §15 "sözleşmelere bağlıdır". | §11 durma koşulları geçerlidir. Bunların dışında kalan her konuda varsayım yaz ve devam et. Dış doğrulama §13.3 protokolüne göre yapılır. |
> | Ç-6 | §16 "hukuki yükümlülükleri proje gereksinimlerine dahil et" ile "Hukuki metinlerin her durumda yeterli olduğunu iddia etme" çatışıyor. Ajan hangi yükümlülüğün uygulanacağına karar veremez. | Ajan aday yükümlülükleri `docs/LEGAL-REVIEW.md` dosyasına "DOĞRULANMADI" durumuyla listeler ve teknik altyapıyı (rıza kaydı, veri talebi iş akışı, saklama süresi alanları) yapılandırılabilir biçimde kurar. Uygulanabilirliğe ve metinlere hukuk danışmanı/İnsan karar verir. |
> | Ç-7 | §8 "10 üzerinden veya 5 yıldız üzerinden… kullanılabilir" ve "ölçek platform genelinde tutarlı olmalı". | Faz 0'da tek bir ADR ile bir kullanıcı puanı ölçeği ve bir editör puanı ölçeği seçilir. Ölçek içerik ya da varlık türüne göre DEĞİŞMEZ. Ajanın önerisi İnsan onayına sunulur (B sınıfı soru). |
> | Ç-8 | §7 "AI aramasını ileri faza bırak", §14 "Yapay zekâ içerik üretimine yardımcı olabilir", §19 Faz 4 "AI destekli keşif". | Faz 1–3'te ürüne yapay zekâ özelliği eklemek YASAK: dil modeli çağrısı yapan arama, öneri, otomatik içerik ya da özetleme. Faz 4'te ayrı ADR ve İnsan onayı gerekir. Ajanın geliştirme sürecinde kod yazmak için yapay zekâ kullanması bu yasağın kapsamında değildir. |
> | Ç-9 | §2 "Redis ve kuyruk: yalnızca ihtiyaç duyulan…", ölçütsüz. | §14.4'teki ölçülebilir tetikleyicilerden biri gerçekleşmeden eklenmez. |
> | Ç-10 | §2 "SSR ve gerektiğinde statik üretim", "gerektiğinde OpenAPI". | OpenAPI dokümantasyonu Faz 1'den itibaren her uç nokta için ZORUNLU ve CI'da şemadan üretilir. Render stratejisi (SSR/SSG/ISR) sayfa türü başına ADR'de tablo olarak tanımlanır. |

---

### PROMPT-ENG-06: Sözlük (tek anlamlı terimler ve kod adları)
- v1 bölüm: YENİ (v1 §1, §5, §8, §9, §10, §12 terimleri)  ·  tür: belirsiz  ·  öncelik: P0  ·  doğrulandı: evet (dış olgu iddiası yok)
- **Gerekçe:** v1 kritik kavramları birbirinin yerine kullanıyor:
  - "İçerik" hem editoryal yazı, hem işletme profili, hem de kullanıcı yorumu anlamında geçiyor.
  - "Kampanya" hem sponsor anlaşması (SponsoredCampaigns) hem de kullanıcıya sunulan fırsat ("Kampanya ve fırsat sayfası") anlamında kullanılıyor.
  - "Teklif" hem Offers varlığı hem de "Teklif veya fiyat talebi" anlamında geçiyor.
  - "Sağlayıcı" hem API sağlayıcısı (ProviderIntegrations) hem de bir işletme türü (CarRentalProviders) için kullanılıyor.
  - "Kayıt" en az dört anlamda geçiyor.
  - E2E-4'teki "yorum"un puanlı değerlendirme mi yoksa makale yorumu mu olduğu belirsiz.
  - "Afilye" ve "Affiliate" yazımları karışık.

  Bunlar veri modeline, API'ye ve testlere doğrudan yansır.
- **Kaynaklar:** —
- **Önerilen metin:**

> **§4 Sözlük.** Kodda, veritabanında, API'de, testlerde, arayüz metinlerinde ve dokümanlarda yalnızca bu terimleri bu anlamlarda kullan. Yeni bir terim gerekirse önce `docs/GLOSSARY.md` dosyasına ekle. Kod adları öneridir ve Faz 0'da ADR ile kesinleşir. Ancak kavram ayrımları ZORUNLU'dur ve birleştirilemez.
>
> | Terim (UI/doküman) | Tanım | Kod adı (öneri) | Karıştırma |
> |---|---|---|---|
> | Listeleme | Profil sayfası olan, değerlendirilebilen varlık: mekan, otel, ürün, rehber, tur/aktivite, araç kiralama firması, eser (film, kitap, oyun), etkinlik, hizmet işletmesi. | `Listing` + `listingType` | İçerik ile karıştırma. "Kayıt" deme. |
> | Varlık türü | Listelemenin kodda tanımlı, sınırlı türü (HOTEL, PLACE, PRODUCT, GUIDE…). Tür-özel alanları belirler. | `ListingType` | Kategori ile karıştırma. |
> | Kategori | Yönetim panelinden yönetilen, hiyerarşik gezinme ağacı (Seyahat > Konaklama > Butik oteller). Kodu değiştirmeden eklenebilir. | `Category` | Varlık türü değildir. Bir kategori birden çok türü içerebilir. |
> | İşletme | Ticari ya da tüzel taraf. Lokasyonları ve listelemeleri olabilir. Sponsor ve işletme hesabı bu düzeydedir. | `Business` | Lokasyon, Marka |
> | Lokasyon (UI: "mekan", "şube") | Fiziksel adres ve koordinat. | `Location` | — |
> | Marka | Ürün üreticisi markası. Bir işletmeyle aynı olmak zorunda değildir. | `Brand` | İşletme |
> | İçerik | Editoryal yayın: makale, rehber, editör incelemesi, karşılaştırma, liste. | `ContentItem` + `contentType` | Listeleme ve kullanıcı girdileri içerik değildir. |
> | Editör incelemesi (UI: "İnceleme") | Ekibin bir listeleme hakkındaki yapılandırılmış değerlendirmesi: kriter puanları, artılar/eksiler, editör puanı ve ZORUNLU **deneyim beyanı** (bizzat denendi / denenmedi / kaynaklardan derlendi). | `ContentItem(EDITORIAL_REVIEW)` + `EditorialScore` | Kullanıcı değerlendirmesi |
> | Kullanıcı değerlendirmesi (UI: "Değerlendirme") | Üyenin bir listelemeye verdiği puan ve metin. Moderasyondan geçer. | `UserReview` | Yorum |
> | Yorum | Puansız metin, bir içeriğin altına yazılır. **Varsayılan: Faz 1–3'te yok** (A-kaydı). v1 E2E-4'teki "yorum" = Kullanıcı değerlendirmesi. | `Comment` | Kullanıcı değerlendirmesi |
> | Editör puanı / Kullanıcı puanı | İki ayrı sayı. Kullanıcı puanı her zaman ortalama, sayı ve dağılımla gösterilir. İkisi tek bir "genel puan"da birleştirilmez. | `EditorialScore`, `UserRatingAggregate` | — |
> | Sponsorlu içerik | Kendisi bir sponsorla ücretli ya da iş birliği ilişkisi içinde üretilmiş içerik. | `ContentItem.sponsorship` | Sponsorlu yerleşim |
> | Sponsorlu yerleşim (v1: "sponsorlu listeleme", "öne çıkarma", "sponsorlu sonuç") | Var olan bir listeleme ya da içeriğin, ücret karşılığı belirli bir alanda (ana sayfa modülü, kategori üstü, arama sonucu yuvası) tarih aralığıyla öne çıkarılması. | `Placement` + `slot` | Organik sıralama skoru değişmez (AK-04). |
> | Sponsorluk kampanyası | Bir sponsorla yapılan anlaşmanın sistemdeki karşılığı: sponsor, tarih aralığı, anlaşma tutarı, bağlı sponsorlu içerikler ve yerleşimler, ölçüm. | `Campaign` | Fırsat. Kullanıcıya "kampanya" diye gösterilmez. |
> | Fırsat (UI: "Fırsat", "İndirim") | Kullanıcıya sunulan indirim ya da promosyon. v1'deki "Offers" ve "Kampanya ve fırsat sayfası" bu anlamdadır. | `Deal` | Sponsorluk kampanyası, Teklif talebi |
> | Teklif talebi | Kullanıcının bir işletmeden fiyat ya da teklif istemesi. | `Lead` | "Teklif" kelimesini tek başına kullanma. |
> | Affiliate bağlantısı | Komisyon ilişkisi olan dış bağlantı. Yazım tektir: "affiliate". "Afilye" kullanılmaz. Kullanıcıya gösterilecek açıklama metni hukuki incelemeyle belirlenir. | `AffiliateLink` | — |
> | Dış yönlendirme | Platformdan dış siteye yapılan her çıkış. Merkezi yönlendirici üzerinden geçer ve olayı kaydedilir; affiliate olsun olmasın. | `OutboundLink`, `OutboundClick` | v1 "AffiliateClicks" bunun alt kümesidir. |
> | Entegrasyon sağlayıcısı | Veri ya da rezervasyon API'si sunan dış sistem (otel arama API'si, harita servisi). | `IntegrationProvider` | İşletmeler için "provider" deme. Araç kiralama firması bir Listeleme'dir. |
> | Doğrulanmış … | Her zaman nitelenerek kullanılır: "Doğrulanmış işletme" (sahiplik belgeyle doğrulandı), "Doğrulanmış e-posta". "Doğrulanmış deneyim" için Faz 1–3'te mekanizma yoktur, bu rozet gösterilmez. Niteleyicisiz "Doğrulanmış" etiketi YASAK. | `verificationType` | — |
> | Misafir / Üye | Oturum açmamış ziyaretçi / hesabı olan kullanıcı. | `Guest` / `Member` | — |
> | Demo veri / Mock | Demo: seed ile üretilmiş kurgusal kayıt (`dataOrigin=DEMO`). Mock: gerçek dış servisin yerine geçen sahte adaptör yanıtı. | `dataOrigin`, `*MockAdapter` | — |
> | "Kayıt" | Tek başına kullanmak YASAK. Anlamına göre: Listeleme / Üyelik / Olay kaydı (`Event`) / Denetim kaydı (`AuditLog`). | — | — |
>
> v1'den gelen eski adlar (`Reviews`, `Comments`, `Offers`, `AffiliateClicks`, `CarRentalProviders`, `ProviderIntegrations`) bu tabloya göre yeniden adlandırılır.

---

### PROMPT-ENG-07: Kararlı gereksinim kimlikleri (REQ) ve gereksinimden teste izlenebilirlik
- v1 bölüm: YENİ (v1 §3–§20)  ·  tür: eksik  ·  öncelik: P0  ·  doğrulandı: evet
- **Gerekçe:**
  - v1'de yüzlerce gereksinim düz madde işaretleriyle yazılmış ve kimlik taşımıyor. Hangi gereksinimin hangi testle kanıtlandığı, hangisinin hangi fazda olduğu ve ne durumda olduğu izlenemiyor.
  - Ajan "tamamlandı" dediğinde neyin tamamlandığı denetlenemiyor.
  - Anthropic uzun soluklu ajanlar için özellik ve test durumunun JSON gibi yapılandırılmış bir dosyada tutulmasını öneriyor. Gerekçesi, modelin JSON dosyalarını Markdown'a göre daha az uygunsuz biçimde değiştirmesi. Ayrıca durumun yalnızca dikkatli testten sonra "geçti" yapılmasını öneriyor.
- **Kaynaklar:** https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents ; https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices
- **Önerilen metin:**

> **§8.4 Gereksinim kimlikleri.** Biçim: `REQ-<ALAN>-<NNN>`. Kimlikler yalnızca ASCII karakter içerir, asla yeniden kullanılmaz ve yeniden numaralandırılmaz. Kaldırılan gereksinimin durumu İPTAL olur.
>
> | Alan kodu | Kapsam |
> |---|---|
> | GEN | Çapraz/genel |
> | HSP | Hesap, kimlik, oturum |
> | KAT | Kategori ve taksonomi |
> | LST | Listeleme ve varlık türleri |
> | ICR | İçerik ve editör |
> | DEG | Değerlendirme, puan, moderasyon, şikayet |
> | ARA | Arama ve filtre |
> | SPN | Sponsorluk |
> | AFF | Affiliate ve dış yönlendirme |
> | ENT | Dış entegrasyon |
> | ADM | Yönetim paneli |
> | MOB | Mobil |
> | SEO | SEO |
> | GUV | Güvenlik |
> | KVK | Kişisel veri, çerez, rıza |
> | ERS | Erişilebilirlik |
> | PRF | Performans |
> | ANL | Analitik |
> | OPS | Altyapı ve dağıtım |
> | TST | Test altyapısı |
>
> **Gereksinim kaydı biçimi** (`docs/requirements/<ALAN>.md`):
> ```
> ### REQ-SPN-003: Sponsorlu yerleşim açıklama etiketi
> - Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A/SPN
> - Gereksinim: Her sponsorlu yerleşim, kartında ve hedef detay sayfasında görünür,
>   erişilebilir adı olan bir açıklama etiketi taşır.
> - Kabul kriterleri:
>   1. Verilen: aktif bir sponsorlu yerleşim. Ne zaman: ana sayfa render edilir.
>      O zaman: kartta etiket görünür ve ekran okuyucu tarafından okunur.
>   2. Açıklama verisi olmadan sponsorlu yerleşim render edilmeye çalışılırsa
>      tip denetimi ya da test başarısız olur.
> - Doğrulama: T (otomatik test)
> - Testler: e2e/sponsor-label.spec.ts, web/components/SponsoredCard.test.tsx
> ```
>
> **Doğrulama yöntemi kodları:**
> - T: otomatik test
> - İ: inceleme (kod ya da doküman)
> - G: gösterim (demo betiği)
> - A: analiz/ölçüm
> - M: manuel QA. Ortamda doğrulanamayan işler içindir ve `docs/MANUAL-QA.md` dosyasında tutulur.
>
> **Durum dosyası** `docs/requirements/requirements.json`. Her kayıt şu alanları taşır: `id`, `title`, `level`, `phase`, `status`, `verification`, `tests[]`, `lastVerifiedCommit`, `notes`. Geçerli durumlar: `BAŞLANMADI`, `GELİŞTİRMEDE`, `TAMAM`, `KISMİ`, `MOCK`, `ENGELLİ`, `DOĞRULANAMADI`, `ERTELENDİ`, `İPTAL`.
> - Ajan bu dosyada yalnızca `status`, `tests`, `lastVerifiedCommit` ve `notes` alanlarını değiştirir. Gereksinim metnini, düzeyini ve fazını değiştirmez. Değişiklik önerisi `OPEN-QUESTIONS` dosyasına yazılır.
> - `TAMAM` durumu ancak her kabul kriterine bağlı test bu oturumda geçtiyse verilir. M yöntemli gereksinimlerde İnsan'ın manuel QA sonucunu işlemesi gerekir.
>
> **İzlenebilirlik kuralları:**
> - Test adı REQ kimliğini içerir: `it('[REQ-SPN-003] sponsorlu kartta etiket görünür', …)`.
> - Commit altbilgisi şu biçimdedir: `Refs: REQ-SPN-003`.
> - `pnpm req:check` komutu CI'da şunları doğrular: (a) aktif fazın her ZORUNLU REQ'i en az bir teste ya da M kaydına bağlı; (b) `TAMAM` durumundaki REQ'lerin testleri son CI koşusunda geçmiş; (c) test adlarında geçen her REQ kimliği gerçekten var. Koşullardan biri sağlanmazsa CI kırmızı olur.
>
> **Ek B: E2E kataloğu** (v1 §20'deki senaryolar kimlik alır):
>
> | ID | Senaryo (v1 §20) | Faz | Not |
> |---|---|---|---|
> | E2E-001 | Yönetici kategori oluşturur, içerik yayınlar, içerik sitede görünür. | 1 | |
> | E2E-002 | Arama, filtre, detay sayfası. | 1 | |
> | E2E-003 | Oturum açma, favori ekleme, profilde görme. | 1 | |
> | E2E-004 | Kullanıcı değerlendirmesi moderasyon kuyruğuna düşer. | 1 | "Yorum" = Kullanıcı değerlendirmesi |
> | E2E-005 | Yönetici sponsorlu yerleşim oluşturur, yerleşim etiketli görünür, süresi dolunca kaybolur. | 1 | Yönetici akışı; self-servis Faz 3 |
> | E2E-006 | Sponsorlu ya da affiliate bağlantı tıklanır, olay kaydedilir, yönlendirme yalnızca izinli alana yapılır. | 1 | |
> | E2E-007 | Hesapsız işletme başvurusu oluşturulur, yönetici inceleme kuyruğunda onaylar ya da reddeder. | 1 | İşletme hesabı/paneli Faz 3 |
> | E2E-008 | Sağlayıcı MOCK adaptörü hata ya da zaman aşımı döndürür, arayüz fiyat/müsaitlik göstermez ve "sağlayıcıda kontrol et" yolunu sunar. | 1 | |
>
> Yeni senaryolar E2E-009'dan itibaren numaralanır.

---

### PROMPT-ENG-08: Faz × kapsam matrisi (v1'deki faz çelişkilerinin çözümü)
- v1 bölüm: 19 (ayrıca 1, 3, 5, 6, 9, 10, 11, 15, 20, 21)  ·  tür: çelişki  ·  öncelik: P0  ·  doğrulandı: evet (dış olgu iddiası yok)
- **Gerekçe:** v1'in faz planı (§19) ile diğer bölümlerdeki özellik listeleri çelişiyor:
  - Faz 1'de yalnızca "sponsorlu içerik etiketleri" var. Oysa §9 "ilk sürümde kampanyalar yönetici tarafından oluşturulsun" diyor ve E2E-5/6 kampanya ile tıklama ölçümü istiyor. "Sponsorlu kampanyalar, kampanya ölçümü" ise Faz 3'te.
  - E2E-7 işletme başvurusu istiyor, ama "ticari başvuru formları" Faz 3'te.
  - §5 "İşletme paneli"ni fazsız listeliyor.
  - §6'da koleksiyonlar var, Faz 4'te de koleksiyonlar var.
  - §5/§6'da kişiselleştirme var, Faz 4'te de var.
  - §5 web "Bildirimler" ve "Okuma geçmişi" sayfalarını listeliyor, ama bunlar hiçbir fazda yok.
  - §11'deki 25 yönetim modülünün hangisinin Faz 1'de olduğu belirsiz.
  - Roller fazsız tanımlanmış.

  Ajan bu çelişkileri ya kendi kafasına göre çözer ya da "her şeyi Faz 1'de" yapmaya çalışır.
- **Kaynaklar:** —
- **Önerilen metin:**

> **§7.1 Faz × kapsam matrisi.** Bu matris, özelliklerin ne zaman yapılacağına dair tek yetkili kaynaktır. Ek A ve v1'den gelen diğer bölümler ürünün nihai hedefini tarif eder, zamanlamayı tarif etmez. Matriste olmayan bir özellik "aktif faz dışı" sayılır ve `PARKING-LOT` dosyasına yazılır. Aşağıdaki varsayılanlar Faz 0 raporunda İnsan onayına sunulur.
>
> | Özellik | Faz | Not / çözülen v1 çelişkisi |
> |---|---|---|
> | Monorepo, CI, Docker, hafıza dosyaları, yürüyen iskelet | 0 | YENİ |
> | Kategori ağacı, varlık türleri, tür öznitelik şablonları | 1 | |
> | Listeleme detay sayfaları | 1 (pilot türler tam, diğerleri genel şablonla, bkz. §7.2) | |
> | Blok tabanlı içerik editörü ve yayın akışı | 1 | |
> | E-postayla üyelik ve giriş, misafir gezinme, hesap silme, veri talebi formu | 1 | |
> | Üçüncü taraf kimlik sağlayıcılarıyla giriş | 2 | Mağaza kurallarına etkisi mobil incelemede doğrulanır. |
> | Favoriler (web) | 1 | E2E-003 |
> | Koleksiyonlar / kullanıcı listeleri | 4 | §6 ile çelişkide §19 geçerlidir. |
> | Kullanıcı değerlendirmesi, moderasyon kuyruğu, şikayet ve itiraz | 1 | E2E-004 |
> | "Faydalı" oylaması | 2 | |
> | Yorum (puansız) | Kapsam dışı (varsayılan) | |
> | Arama (PostgreSQL tam metin araması, Türkçe normalizasyon), filtre, sıralama | 1 | |
> | Web liste sayfasında harita görünümü | 1 (İSTEĞE BAĞLI) | Harita sağlayıcısı X-kaydı. Erişim yoksa harita KAPALI, liste ve adres gösterilir. |
> | "Yakınımdakiler" (izinli tarayıcı konumu, izin yoksa şehir seçimi) | 1 (İSTEĞE BAĞLI) | |
> | Yöneticinin oluşturduğu sponsorlu içerik ve sponsorlu yerleşim (yuva, tarih aralığı, zorunlu açıklama) | 1 | §9 "ilk sürüm", E2E-005 |
> | Sponsorluk kampanyası kaydı (sponsor, tarih, anlaşma tutarı alanı, yerleşimlerin gruplanması), gösterim ve tıklama olay kaydı, kampanya başına basit yönetici raporu | 1 | E2E-005/006 |
> | Affiliate bağlantı yönetimi, merkezi yönlendirici, tıklama kaydı, `rel` nitelikleri | 1 | |
> | Hesapsız işletme başvuru formu ve yönetici inceleme kuyruğu | 1 | E2E-007 |
> | Hesapsız reklam/sponsorluk başvuru formu | 1 | |
> | İşletme hesabı ve paneli, işletme doğrulama, reklamveren paneli, self-servis kampanya başvurusu, gelişmiş kampanya raporu | 3 | §5 ve §9 ile çelişkide §19 geçerlidir. |
> | Ödeme tahsilatı, fatura, platform içi rezervasyon ve ödeme | Kapsam dışı | Yalnızca İnsan onayı ve ayrı bir prompt ile açılır. |
> | Dış sağlayıcı fiyat/müsaitlik entegrasyonları | 3 | Faz 1'de yalnızca port, MOCK adaptör ve "sağlayıcıda gör" bağlantısı. |
> | İşlemsel e-posta (doğrulama, şifre sıfırlama) | 1 | Gönderim sağlayıcısı X-kaydı. Yerelde e-posta yakalayıcı kullanılır. |
> | Bülten: yalnızca form ve açık izin kaydı | 1 | Gönderim Faz 2+ ve İnsan onayıyla. İzin metni `LEGAL-REVIEW` kaydı. |
> | Uygulama içi bildirim merkezi (web ve mobil) ve push | 2 | §5'teki web "Bildirimler" sayfası Faz 2'ye kaydırılır. |
> | Okuma geçmişi / son görüntülenenler | 2 (cihazda yerel) | Sunucuda saklanacaksa `KVK` incelemesi gerekir. |
> | Açık tercih seçimi (ilgi alanı kategorileri) | 2 | |
> | Davranışa dayalı kişiselleştirme ve öneriler | 4 | §5/§6 ile çelişkide §19 geçerlidir. `KVK` incelemesi gerekir. |
> | Karanlık tema | 2 (İSTEĞE BAĞLI) | Tasarım token'ları Faz 1'den itibaren temaya uygun tasarlanır. |
> | Mobil uygulama (5 sekme, derin bağlantı, push izin yönetimi) | 2 | |
> | Harici arama motoruna geçiş (Meilisearch/Typesense) | 4 | §14.4 benzeri ölçüt tetiklerse ADR ile Faz 3. |
> | Editörün yazdığı karşılaştırma içeriği (tablo bloğu) | 1 | |
> | Etkileşimli ve gelişmiş karşılaştırma | 4 | |
> | Üründe yapay zekâ | 4 | Faz 1–3'te YASAK (Ç-8). |
> | Çok dilli yayın | Kapsam dışı | Mimari hazırlık (i18n anahtarları, `locale` alanı) Faz 1. |
>
> **Yönetim paneli modülleri (v1 §11 numaraları):**
> - **Faz 1:** 1 (sayaçlı genel pano), 2, 3. Ayrıca 4–8 tek bir "Listeleme yönetimi" modülünde toplanır (Faz 1'de pilot türler tam). 9, 10, 11, 12, 13 (yalnızca yönetici kampanya kaydı), 14, 16, 17, 18, 19, 21 (temel), 22 (kampanya başına gösterim/tıklama), 23, 24 (temel), 25.
> - **Faz 2:** 20.
> - **Faz 3:** 15, ayrıca 22'nin gelişmiş hali.
>
> **Roller:**
> - **Faz 1:** Süper yönetici, Yönetici, Editör, Yazar, Moderatör, Üye.
> - **Faz 3:** İşletme sahibi, Reklamveren.
>
> Rol ve izin matrisi Faz 1'de tablo olarak `docs/requirements/HSP.md` dosyasında yazılır ve her hücre bir yetkilendirme testine bağlanır.
>
> **"Mobil" kelimesi:** Faz 1'de "mobil uyumlu web" anlamına gelir. Yerel (native) uygulama Faz 2'dir.

---

### PROMPT-ENG-09: Faz 0 (temel ve yürüyen iskelet) eklenmeli
- v1 bölüm: 19, 22  ·  tür: eksik  ·  öncelik: P0  ·  doğrulandı: evet
- **Gerekçe:**
  - v1 doğrudan Faz 1 ile başlıyor. Altyapı kurulumu, hafıza dosyaları, gereksinimlerin depoya aktarımı, CI ve teknoloji ADR'leri hiçbir fazın çıktısı değil.
  - Anthropic'in uzun soluklu ajan önerisi şöyle: ilk bağlam penceresi çatıyı kurmak için kullanılır (kurulum betiği, ilerleme dosyası, tam özellik listesi, ilk commit), sonraki oturumlar bu çatı üzerinde yinelenir.
- **Kaynaklar:** https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents ; https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices
- **Önerilen metin:**

> **§8.1 Faz 0: Temel ve yürüyen iskelet.** Tamamen yereldir ve geri alınabilir. Bu fazda İnsan onayı beklemeden ilerle.
>
> **Görevler (dilimler):**
> 1. **Ortam keşfi.** `git status`, `git log`, `ls -la`, Node/pnpm/Docker sürümleri, npm registry erişimi ve resmî doküman sitelerine erişim kontrol edilir. Sonuç `docs/ENVIRONMENT.md` dosyasına yazılır.
> 2. **Hafıza dosyaları.** §10'daki dosyalar oluşturulur. Bu promptun kopyası `docs/prompt/PROMPT-v2.md` olarak eklenir.
> 3. **Gereksinimler.** Ek A, `docs/requirements/<ALAN>.md` ve `requirements.json` dosyalarına aktarılır. Tüm REQ'ler `BAŞLANMADI` durumundadır.
> 4. **İlk ADR'ler.** Önerilen ADR seti:
>    - ADR-0001: yığın ve sürümler (§14),
>    - ADR-0002: monorepo yerleşimi ve yönetim panelinin konumu,
>    - ADR-0003: kimlik doğrulama yaklaşımı,
>    - ADR-0004: arama katmanı soyutlaması,
>    - ADR-0005: puan ölçekleri (Ç-7),
>    - ADR-0006: medya depolama ve görsel işleme,
>    - ADR-0007: test araçları,
>    - ADR-0008: sayfa türü başına render stratejisi.
> 5. **Monorepo iskeleti.** `apps/web`, `apps/api` ve (ADR-0002'ye göre) `apps/admin`; ayrıca `packages/*` (ortak tipler, API istemcisi, tasarım token'ları). `apps/mobile` Faz 2'ye kadar oluşturulmaz. Ancak ortak paketler mobilde kullanılabilecek biçimde tasarlanır.
> 6. **Docker Compose.** PostgreSQL ve yerel S3 uyumlu depolama (seçim ADR-0006'da, lisansı doğrulanmış olarak). Redis eklenmez (§14.4).
> 7. **Kanonik komutlar** ve `scripts/init.sh` (§9.5).
> 8. **CI.** Lint, typecheck, birim, entegrasyon, build, sır taraması, lisans denetimi, `req:check`.
> 9. **Yürüyen iskelet.** Bir web sayfası, bir API uç noktası ve PostgreSQL arasında gerçek bir okuma yapılır. En az bir birim, bir entegrasyon ve bir E2E testi CI'da yeşil olur.
> 10. **Seed altyapısı.** Demo veri politikasına uygun olmalı (PROMPT-ENG-19). Üretimde çalışmayı reddettiği testle kanıtlanır.
>
> **Faz 0 Bitti Tanımı:**
> - Temiz bir klondan README'deki en fazla 3 komutla iskelet ayağa kalkar. Ajan bunu geçici bir dizine yeniden klonlayarak gösterir ve komut çıktısını raporlar.
> - `pnpm verify` yerelde ve CI'da yeşildir.
> - §10'daki tüm dosyalar mevcut ve doludur.
> - Faz 1'in tüm REQ'leri `requirements.json` dosyasında yer alır.
> - Engelleyici sorular, varsayılanlarıyla birlikte `OPEN-QUESTIONS` dosyasındadır.
>
> **Faz 0 → Faz 1 geçişi** onay beklemez. Faz 0 raporunu sun ve Faz 1'e devam et. Faz 0 raporunda İnsan onayına sunulan varsayılanlar (§7 matrisi, pilot dikeyler, puan ölçeği) İnsan itiraz ederse güncellenir.

---

### PROMPT-ENG-10: Bitti Tanımı (dilim ve faz düzeyi), faz kapıları ve faz başına teslimatlar
- v1 bölüm: 19, 20, 21  ·  tür: kabul_kriteri  ·  öncelik: P0  ·  doğrulandı: evet
- **Gerekçe:**
  - v1 bir fazın bittiğini yalnızca "Her fazda çalışan yazılım, testler ve dokümantasyon bulunmalıdır" cümlesiyle tanımlıyor. Bu doğrulanabilir değil.
  - §21'deki 16 teslimatın hepsi "geliştirme sonunda" isteniyor. Hangi teslimatın hangi fazda beklendiği belirsiz.
  - İnsan onayı gerektiren bir faz kapısı yok. Ajan Faz 1 yarımken mobil uygulamaya geçebilir.
  - Anthropic, uzun görevlerde ayrı ve taze bağlamlı doğrulayıcının öz-eleştiriden daha iyi sonuç verdiğini belirtiyor.
- **Kaynaklar:** https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-fable-5 ; https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents
- **Önerilen metin:**

> **§8.2 Dilim Bitti Tanımı.** Her maddesi kanıtla raporlanır:
> - [ ] İlgili REQ'lerin kabul kriterleri için testler yazıldı ve **bu oturumda** geçti (komut ve sonuç raporda).
> - [ ] `pnpm verify` yeşil: lint, typecheck, birim, entegrasyon, build, `req:check`.
> - [ ] Arayüz değiştiyse ilgili E2E senaryoları yeşil.
> - [ ] Migration'lar boş bir veritabanına sıfırdan uygulanabiliyor ve seed çalışıyor.
> - [ ] Yeni ortam değişkenleri `.env.example` dosyasına ve dokümana eklendi.
> - [ ] Arayüz dilimlerinde yükleniyor, boş, hata ve yetkisiz durumları uygulandı.
> - [ ] Yeni sayfa ya da bileşende otomatik erişilebilirlik denetimi Ek A/ERS eşiğini sağlıyor.
> - [ ] Yeni bir MOCK ya da DEMO varsa ilgili kayıt açıldı ve arayüzde işaretlendi.
> - [ ] `requirements.json`, `STATUS.md` ve gerekiyorsa ADR, ASSUMPTIONS ve LEGAL-REVIEW güncellendi.
> - [ ] Commit'ler Conventional Commits biçiminde ve `Refs: REQ-…` altbilgisi taşıyor.
>
> **§8.3 Faz Bitti Tanımı (Faz 1–4 ortak):**
> - Aktif fazın tüm ZORUNLU REQ'leri `TAMAM` durumunda ya da İnsan'ın yazılı onayıyla `ERTELENDİ` durumunda. `TAMAM` olmayan her OLMALI REQ için tek satırlık gerekçe var.
> - Fazın E2E senaryoları CI'da art arda 3 koşuda yeşil (kararsız test yok).
> - Açık P0 hata sayısı 0. P1 hatalar listelenmiş.
> - Temiz klon testi geçti: depo geçici dizine klonlanır, yalnızca README izlenir, `pnpm verify` ve `pnpm test:e2e` çalıştırılır.
> - Bağımlılık güvenlik denetiminde yüksek ya da kritik açık yok. Varsa her biri için ADR'li istisna var. Sır taraması temiz.
> - `LEGAL-REVIEW`, `EXTERNAL-DEPENDENCIES`, `MOCKS` ve `MANUAL-QA` dosyaları güncel.
> - `docs/demos/FAZ-<N>.md` hazır: İnsan'ın 15 dakikada adım adım izleyebileceği gösterim betiği.
> - Bağımsız doğrulama yapıldı (§12.6) ve bulgular kapatıldı ya da kayda geçirildi.
> - Faz raporu (Ek C-2) yazıldı.
>
> **§8.5 Faz kapısı.** Faz N'in (N ≥ 1) çıkış ölçütleri sağlandığında **DUR**:
> 1. Faz raporunu sun.
> 2. İnsan'dan yazılı olarak "Faz N onaylandı, Faz N+1 başlasın" onayı bekle.
> 3. Onay gelene kadar yalnızca Faz N'in hataları, testleri ve dokümantasyonu üzerinde çalış.
>
> Faz kapısı ancak İnsan'ın bu onayıyla geçilir. İnsan geri bildirimleri `docs/DECISIONS/` altına kaydedilir.
>
> **§8.6 Faz başına teslimatlar** (v1 §21'deki numaralarla):
>
> | Faz | Teslimatlar |
> |---|---|
> | 0 | 3 (ilk şema ve migration), 7, 8, 9 (ilk sürüm), CI |
> | 1 | 1, 2, 3, 4, 6 (web), 10, 11, 12 (taslak), 13 (port ve MOCK adaptörler), 14, 16. Ayrıca 15'in web için taslağı. |
> | 2 | 5, 6 (mobil), 9/10/11 güncel, mağaza meta verisi taslağı (gönderim yok) |
> | 3 | 13 (gerçek adaptörler, yalnızca sağlanan kimlik bilgileriyle), işletme ve reklamveren panelleri, 15 güncel |
> | 4 | Faz 4 matrisindeki maddeler, 15 nihai |
>
> **Faz özel ölçütleri:**
> - **Faz 1:** E2E-001…008 yeşil. Matristeki yönetim modülleri çalışıyor. Matristeki web sayfaları sunucu tarafında render edilmiş içerikle HTTP 200 dönüyor. SEO meta, site haritası ve robots testleri yeşil.
> - **Faz 2:** Mobil typecheck, birim ve bileşen testleri yeşil. Derin bağlantı ve hesap silme akışları test edilmiş. Ortamda doğrulanamayan cihaz davranışları `MANUAL-QA` dosyasında.
> - **Faz 3:** Her sağlayıcı adaptörü için sözleşme testleri yazılmış. Kimlik bilgisi sağlanmamış sağlayıcı `ENGELLİ` ya da `MOCK` durumunda; asla `TAMAM` değil.

---

### PROMPT-ENG-11: Kapsam kontrolü: pilot dikeyler, aşırı mühendislik yasağı ve kapsam dışı listesi
- v1 bölüm: 4, 5, 11, 19  ·  tür: risk  ·  öncelik: P1  ·  doğrulandı: evet
- **Gerekçe:**
  - v1'in Faz 1 kapsamı çok geniş: 10 kategori grubunda yaklaşık 100 alt kategori, 35 web sayfası ve 25 yönetim modülü. Bu genişlik "her şey var ama hiçbiri tam değil" sonucunu doğurur; v1 tam olarak bunu yasaklıyor ("Sırf görsel olarak hazır görünen bir prototip").
  - Anthropic iki eğilime dikkat çekiyor: yeni modellerin istenmeyen soyutlama ve esneklik ekleyerek aşırı mühendislik yapması, ve ajanların aynı anda çok şey yapmaya çalışması. Önerisi tek seferde tek özellik üzerinde çalışmak.
- **Kaynaklar:** https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices ; https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents
- **Önerilen metin:**

> **§7.2 Pilot dikeyler.** Varsayılan budur; İnsan Faz 0 raporunda değiştirebilir.
> - Faz 1'de varlık türü mimarisi geneldir. Ancak tür-özel alanlar, filtreler, detay şablonu, yapılandırılmış veri ve E2E kapsamı yalnızca 3 pilot türde **tam** uygulanır: (1) Restoran/Kafe (Mekan), (2) Otel (Konaklama), (3) Teknoloji ürünü.
> - Diğer türler kategori ağacında yer alır ve genel listeleme şablonuyla gösterilir.
> - Yeni bir türün eklenmesi kod değişikliği değil, öznitelik şablonu ekleme işi olmalıdır. Bunun kanıtı olarak Faz 1 sonunda dördüncü bir tür (ör. Tur/Aktivite) yalnızca yönetim panelinden eklenir ve demo betiğinde gösterilir.
>
> **§7.3 Aşırı mühendislik yasağı:**
> - İstenmeyen özellik, yapılandırılabilirlik ya da "ileride lazım olur" soyutlaması ekleme. Tek bir kullanım için yardımcı katman yazma.
> - İstisna: Bu promptun açıkça istediği genişleme noktaları. Bunlar arama sağlayıcı arayüzü, dış entegrasyon portları, kategori öznitelik şablonları ve i18n'e hazır metinlerdir.
> - Faz 1–3'te şunlar YASAK (İnsan onayı ve ADR olmadıkça): mikroservis, GraphQL, event sourcing, Kubernetes, birden fazla veritabanı motoru, kendi yazılmış kimlik doğrulama kriptografisi.
> - Doğrulama yalnızca sistem sınırlarında yapılır (kullanıcı girdisi, dış API). İç kodda olası olmayan senaryolar için savunmacı katman ekleme.
> - Fikirler, iyileştirmeler ve "olsa iyi olur" maddeleri `docs/PARKING-LOT.md` dosyasına yazılır. Her maddede fikir, kaynak, önerilen faz ve tahmini etki bulunur. Aktif fazda bu maddelerle uğraşma.
>
> **§7.4 Kapsam dışı.** Bu promptun hiçbir fazında yapılmaz; ayrı İnsan kararı gerekir:
> - Ödeme tahsilatı, fatura kesme, platform içi rezervasyon.
> - Kullanıcılar arası mesajlaşma. v1'deki "Mesajlaşma bağlantısı" yalnızca işletmenin kendi dış kanalına giden bir bağlantıdır.
> - Scraping ve izinsiz veri içe aktarımı.
> - Gerçek işletmeler hakkında ajan tarafından içerik yazılıp yayımlanması.
> - Reklam ağı entegrasyonu (v1 §15 madde 7).

---

### PROMPT-ENG-12: İlk yanıt sözleşmesi
- v1 bölüm: 22  ·  tür: eksik  ·  öncelik: P0  ·  doğrulandı: evet (dış olgu iddiası yok)
- **Gerekçe:**
  - v1 ilk adım olarak yalnızca "kısa bir mimari özeti, klasör yapısı ve uygulanacak adımları ortaya koy; sonrasında doğrudan uygulamaya başla" diyor.
  - Ortam keşfinin kanıtı, varsayımlar, engelleyici sorular ve bu sorulara verilmezse uygulanacak varsayılanlar, riskler, kapsam dışı maddeler ve İnsan'dan beklenenler istenmiyor.
  - İlk yanıt, İnsan'ın projeyi yönlendirebileceği tek erken andır. İçeriği sabitlenmezse ajan ya uzun bir plan yazıp durur ya da hiç plan göstermeden kod yazar.
- **Kaynaklar:** —
- **Önerilen metin:**

> **§9.1 İlk yanıt (yalnızca ilk oturum).** Şu sırayla ve kısa (≈ 2 ekran) yaz, sonra beklemeden Faz 0'a başla:
> 0. **Ortam keşfi.** Çalıştırdığın komutlar ve gerçek çıktılarının özeti: `pwd`, `git status`, `git log --oneline -5`, `ls -la`, `node -v`, `pnpm -v`, `docker --version`, `docker compose version`. Ayrıca npm registry'ye ve resmî doküman sitelerine erişimin olup olmadığını belirt.
> 1. **Anladıklarım** (en fazla 10 madde).
> 2. **Bilinen gerçekler ve varsayımlar.** Varsayımlar A-001'den başlayarak numaralanır. Her biri için etki alanını ve geri alma maliyetini (Düşük/Orta/Yüksek) yaz.
> 3. **Engelleyici sorular** (en fazla 7). Her birinin yanına "yanıt gelmezse uygulayacağım varsayılan" yazılır.
> 4. **Faz 0 planı.** 5–10 dilim. Her dilimin REQ'leri ve Bitti Tanımı.
> 5. **Mimari özet.** İki seviyeli klasör ağacı, modül sınırları, planlanan ADR başlıkları.
> 6. **İlk 10 risk.** Olasılık, etki ve önlem.
> 7. **Bu fazda yapmayacaklarım.**
> 8. **İnsan'dan beklenenler.** Hesaplar, kimlik bilgileri, kararlar. Bu liste `EXTERNAL-DEPENDENCIES` dosyasının taslağıdır.
>
> İlk yanıtta yalnızca plan yazıp turu bitirme. Faz 0 tamamen yerel ve geri alınabilir olduğu için hemen uygulamaya geç. Engelleyici soruların varsayılanlarıyla ilerle.
>
> Sonraki oturumlarda ilk yanıt yerine §9.2'deki oturum başlangıç protokolü uygulanır.

---

### PROMPT-ENG-13: Çalışma döngüsü: dikey dilimler, git disiplini ve v1 §22 sırasının düzeltilmesi
- v1 bölüm: 22  ·  tür: çelişki  ·  öncelik: P1  ·  doğrulandı: evet
- **Gerekçe:**
  - v1 §22'nin 12 adımlı sırası şelale modeline benziyor: tasarım sistemi ve ekranlar (5) akışlardan önce, testler 9. adımda, güvenlik/SEO/performans 11. adımda, mobil 10. adımda.
  - Bu sıra "her fazda testler" ilkesiyle çelişiyor. Ayrıca v1'in açıkça yasakladığı "önce görünüş" prototipine davetiye çıkarıyor.
  - Anthropic tek seferde tek özellik üzerinde çalışmayı, her adımı açıklayıcı bir commit ile kaydetmeyi ve durumu git ile takip etmeyi öneriyor.
  - Commit biçimi için Conventional Commits 1.0.0 resmî spesifikasyonu doğrulandı: `<type>[optional scope]: <description>`.
- **Kaynaklar:** https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents ; https://github.com/conventional-commits/conventionalcommits.org/blob/master/content/v1.0.0/index.md (https://www.conventionalcommits.org/en/v1.0.0/)
- **Önerilen metin:**

> **§9.3 Dikey dilim döngüsü.** Bu döngü v1 §22'deki sıranın yerine geçer. Her dilim şu adımlardan geçer:
> 1. `requirements.json` dosyasından aktif fazın, bağımlılıkları tamamlanmış ve en yüksek öncelikli 1–5 REQ'ini seç. Aynı anda tek dilim üzerinde çalış.
> 2. Kabul kriterlerinden testleri yaz ve başarısız olduklarını gör.
> 3. Uygula, sırasıyla: şema/migration, domain ve servis, API (OpenAPI güncel), yönetim arayüzü, web arayüzü, durum ekranları.
> 4. Güvenlik (yetki, girdi doğrulama), SEO (meta, yapılandırılmış veri), erişilebilirlik ve performans kontrollerini **bu dilim için** uygula. Bunlar sona bırakılmaz.
> 5. `pnpm verify` ve ilgili E2E testlerini çalıştır.
> 6. Hafıza dosyalarını güncelle ve commit et.
> 7. Kısa dilim notunu yaz (Ek C-1).
>
> **Dilim boyutu:** Bir dilim tek oturumda bitirilebilecek büyüklükte olmalıdır. Üretilen kod ve lockfile hariç fark yaklaşık 600 satırı aşıyorsa dilimi böl.
>
> **§9.4 Git kuralları:**
> - `main` her zaman yeşildir. Kırmızı `main` üzerinde yeni özelliğe başlanmaz.
> - Her dilim `feat/<alan>-<kisa-ad>` dalında geliştirilir. Birleştirmeden önce `pnpm verify` yeşil olmalıdır.
> - Commit mesajları Conventional Commits 1.0.0 biçimindedir. Örnek: `feat(spn): add disclosure label to sponsored placement card`. Gövdede ne yapıldığını ve nedenini yaz. Altbilgide `Refs: REQ-SPN-003` bulunur.
> - Oturum biterken dilim yarım kaldıysa iş, dalda `wip:` önekli bir commit ile kaydedilir ve STATUS'ta belirtilir. Yarım iş `main`'e alınmaz.
> - YASAK: `--no-verify`, `git push --force`, paylaşılan dallarda `git reset --hard`, yayımlanmış commit'leri değiştirmek, başkasının dalını silmek (§11).
> - Uzak depoya yalnızca İnsan'ın belirttiği uzak depo ve dallara push yapılır. `main`'e doğrudan push yapılmaz; birleştirme PR üzerinden olur.

---

### PROMPT-ENG-14: Kalıcı hafıza dosyaları ve oturum başlangıç/bitiş protokolü
- v1 bölüm: YENİ (v1 §22 "önemli varsayımları dokümante et")  ·  tür: eksik  ·  öncelik: P0  ·  doğrulandı: evet
- **Gerekçe:**
  - Haftalar süren bir inşada bağlam penceresi defalarca sıkıştırılır ya da sıfırlanır. v1 yalnızca "önemli varsayımları dokümante et" diyor; ne yazılacağını, nereye yazılacağını ve ne zaman okunacağını söylemiyor.
  - Anthropic şunları öneriyor: ilerleme notu ve yapılandırılmış durum dosyası tutmak, git ile durum takibi yapmak, her yeni oturumda bu dosyaları okuyup temel bir uçtan uca kontrol yaptıktan sonra işe başlamak, ve "bir ders, bir not" biçiminde bir hafıza dosyası tutmak.
  - Claude Code her oturumda `CLAUDE.md` dosyasını yükler. `AGENTS.md` dosyası `CLAUDE.md` içinden `@AGENTS.md` ile içe aktarılabilir; bu sayede diğer ajanlarla tek dosya paylaşılabilir. Belgede 200 satırın altı hedeflenmesi öneriliyor.
- **Kaynaklar:** https://code.claude.com/docs/en/memory ; https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices ; https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-fable-5 ; https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents
- **Önerilen metin:**

> **§10 Kalıcı hafıza dosyaları.** Faz 0'da oluşturulur ve sürekli güncellenir:
>
> | Dosya | Amaç | Ne zaman güncellenir | Sınır |
> |---|---|---|---|
> | `AGENTS.md` | Altın kuralların özeti, kanonik komutlar, dizin haritası, hangi bilginin nerede olduğu | Komut ya da yapı değiştiğinde | ≤ 200 satır |
> | `CLAUDE.md` | Yalnızca `@AGENTS.md` içe aktarımı ve Claude'a özgü kısa notlar | Nadiren | ≤ 20 satır |
> | `docs/prompt/PROMPT-v2.md` | Bu promptun birebir kopyası | Yalnızca İnsan yeni sürüm verdiğinde | SALT OKUNUR |
> | `docs/STATUS.md` | Aktif faz ve dilim, son yeşil commit, son `verify` sonucu (tarih ve komut), açık engeller, sonraki 3 adım | Her dilim sonunda ve bağlam azalırken | ≤ 80 satır. Eski girdiler `docs/status-log/` altına taşınır. |
> | `docs/requirements/` | REQ dosyaları ve `requirements.json` | Her dilim | — |
> | `docs/DECISIONS/ADR-NNNN-*.md` | Kararlar ve İnsan talimatları | Karar anında | Kabul edilen ADR değiştirilmez; yerine yenisi yazılır. |
> | `docs/ASSUMPTIONS.md` | A-NNN varsayımları | Varsayım anında | — |
> | `docs/OPEN-QUESTIONS.md` | Q-NNN soruları, ÇATIŞMA ve PROMPT-CR kayıtları | Anında | — |
> | `docs/EXTERNAL-DEPENDENCIES.md` | X-NNN: hesap, API, sözleşme, alan adı, mağaza | Anında | — |
> | `docs/LEGAL-REVIEW.md` | L-NNN hukuki inceleme listesi | Anında | — |
> | `docs/MOCKS.md` | M-NNN: mock adaptörler ve sahte veri kaynakları | Anında | — |
> | `docs/MANUAL-QA.md` | Ortamda doğrulanamayan kontrollerin adım adım senaryoları | Anında | — |
> | `docs/GLOSSARY.md` | §4 sözlüğü ve eklemeler | Yeni terim geldiğinde | — |
> | `docs/PARKING-LOT.md` | Kapsam dışı fikirler | Anında | — |
> | `docs/LESSONS.md` | Öğrenilen dersler: bir ders bir madde, ilk satırda tek cümlelik özet. Yanlış çıkan ders silinir; aynı ders tekrar yazılmaz, mevcut madde güncellenir. | Ders çıktığında | — |
> | `docs/ENVIRONMENT.md` | Araç sürümleri, erişim kısıtları | Ortam değiştiğinde | — |
> | `CHANGELOG.md` | Faz ve sürüm bazında görünür değişiklikler | Faz sonunda | — |
>
> **§9.2 Oturum başlangıç protokolü.** Her yeni oturumda ve bağlam sıfırlandıktan sonra, kod yazmadan önce:
> 1. `pwd`, `git status`, `git log --oneline -20` komutlarını çalıştır.
> 2. Şunları oku: `AGENTS.md`, `docs/STATUS.md`, `docs/OPEN-QUESTIONS.md` (yeni yanıt var mı?), `requirements.json` dosyasında aktif fazın özeti, gerekirse ilgili `<ALAN>.md`.
> 3. `pnpm verify` (en az `pnpm test:smoke`) çalıştır. Kırmızıysa yeni işe başlamadan önce düzelt.
> 4. STATUS'taki "sonraki adım"dan devam et.
>
> **§9.6 Oturum sonu ve bağlam azalırken:**
> 1. `STATUS.md` dosyasını güncelle.
> 2. Yeni ADR, A, Q, X, L ve M kayıtlarını yaz.
> 3. Açık işi WIP olarak commit et.
>
> Dosyaya yazılmamış bilgi bir sonraki oturumda yok sayılır.

---

### PROMPT-ENG-15: Kayıt şablonları (ADR, varsayım, açık soru, dış bağımlılık, hukuki inceleme, mock)
- v1 bölüm: YENİ (v1 §16, §21 madde 16, §22)  ·  tür: eksik  ·  öncelik: P1  ·  doğrulandı: evet (dış olgu iddiası yok)
- **Gerekçe:** v1 şunları istiyor: hukuki inceleme alanlarını listelemek (§16), eksik dış erişimler için bir kurulum listesi (§21 madde 16) ve varsayımların dokümante edilmesi (§22). Ancak biçim vermiyor. Biçimsiz kayıtlar zamanla tutarsızlaşır, İnsan'ın hızlı karar vermesini de engeller (seçenek, varsayılan ve son tarih yoktur).
- **Kaynaklar:** — (ADR biçimine kamu kurumu örneği olarak bkz. https://gds-way.digital.cabinet-office.gov.uk/standards/architecture-decisions.html)
- **Önerilen metin:**

> **Ek C: Kayıt şablonları.** Kayıtlar bu biçimlerle tutulur. Kimlikler sıralıdır ve yeniden kullanılmaz.
>
> ```
> # ADR-0007: <Başlık>
> - Durum: Önerildi | Kabul edildi | Yerine geçildi (ADR-00XX) | Reddedildi
> - Tarih: YYYY-AA-GG · Karar veren: Ajan | İnsan · İlgili: REQ-…, Q-…, A-…
> ## Bağlam (durumu zorlayan etkenler; 3–6 satır)
> ## Karar (tek paragraf, "… kullanılacaktır")
> ## Değerlendirilen seçenekler (en fazla 3; birer satır artı/eksi)
> ## Sonuçlar (olumlu / olumsuz / geri alma maliyeti)
> ```
> İnsan onayı gerektiren kararlar (§11, C sınıfı) "Önerildi" durumunda kalır. Uygulama ancak "Kabul edildi" sonrasında yapılır.
>
> ```
> ## A-012: Kullanıcı puanı 1–5 tam yıldız ölçeğindedir
> - Tarih · Faz · Gerekçe (1–2 satır)
> - Etkilediği REQ'ler · Geri alma maliyeti: Düşük | Orta | Yüksek
> - Durum: AÇIK | ONAYLANDI | REDDEDİLDİ (→ yapılacak değişiklik)
> ```
> Geri alma maliyeti "Yüksek" olan varsayımlar ayrıca OPEN-QUESTIONS dosyasına yazılır ve faz raporunda ilk sırada gösterilir.
>
> ```
> ## Q-004: <tek cümlelik soru>
> - Sınıf: B (bekleme) | C (dur) · Engellediği REQ'ler
> - Seçenekler: A) … B) … C) …
> - Ajanın önerisi ve gerekçesi · Yanıt gelmezse uygulanacak varsayılan
> - Yanıt: … · Yanıt tarihi · İşlendiği ADR
> ```
>
> ```
> ## X-003: Harita servisi
> - Tür: API | Hesap | Sözleşme | Alan adı/DNS | Mağaza hesabı | Sertifika
> - Gerektiği REQ/faz · Sağlayacak kişi: İnsan
> - Resmî kaynak: URL · erişim tarihi · doğrulanan ifade (kısa alıntı)
> - Doğrulama durumu: DOĞRULANDI | DOĞRULANMADI | ERİŞİLEMEDİ
> - Gerekli ortam değişkeni ADLARI (değer yazılmaz)
> - Erişim yokken davranış: KAPALI | MOCK (M-00X) | manuel alternatif
> - Durum: BEKLİYOR | SAĞLANDI | ENTEGRASYON TESTİ GEÇTİ (tarih, komut)
> ```
>
> ```
> ## L-002: <konu>
> - İlgili özellik/REQ · Neden incelenmeli (1–2 cümle)
> - Ajanın bulduğu kaynaklar (URL; doğrulanmadıysa "DOĞRULANMADI")
> - Ürün içindeki geçici önlem (ör. özellik KAPALI, metin TASLAK)
> - Karar verecek kişi: hukuk danışmanı / İnsan · Durum
> ```
>
> ```
> ## M-005: Otel fiyat adaptörü (MOCK)
> - Dosya yolu · Açık olduğu ortamlar: yerel/test (üretimde YASAK)
> - Arayüzdeki işaret · Gerçeğe geçiş koşulu (X-00Y) · Kaldırıldığını doğrulayan test
> ```

---

### PROMPT-ENG-16: Zorunlu ilerleme ve faz raporu şablonu
- v1 bölüm: YENİ (v1 §20 son paragraf, §22)  ·  tür: eksik  ·  öncelik: P0  ·  doğrulandı: evet
- **Gerekçe:**
  - v1 "gerçekte yapılmamış testler için başarılı rapor üretme" diyor, ancak raporun içeriğini ve kanıt biçimini tanımlamıyor.
  - Anthropic uzun otonom çalışmalarda şunları öneriyor: her ilerleme iddiasının bu oturumdaki bir araç sonucuyla denetlenmesi, başarısız testlerin çıktısıyla raporlanması, atlanan adımın açıkça söylenmesi ve raporun sonuçla başlaması. Kendi testlerinde bu talimatın uydurma durum raporlarını neredeyse tamamen ortadan kaldırdığını belirtiyor.
  - Aynı rehber, modelden iç akıl yürütmesini yanıt metninde yeniden üretmesini isteyen talimatların bazı modellerde reddetme kategorisini tetikleyebileceğini söylüyor. Bu yüzden şablon "düşünce süreci" değil, "karar ve kısa gerekçe" istemeli.
- **Kaynaklar:** https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-fable-5
- **Önerilen metin:**

> **§12.5 Raporlama.** Her rapordan önce her iddiayı bu oturumdaki bir araç sonucuyla denetle. Kanıtını gösteremediğin işi rapor etme. Doğrulanmamışsa bunu açıkça söyle. Rapor sonuçla başlar. Dosya içeriklerini rapora yapıştırma; dosya yolu ve kısa özet ver. İç düşünce sürecini yazma; kararları ve tek satırlık gerekçelerini yaz.
>
> **Durum sözcükleri (sabit):** TAMAM (doğrulandı), KISMİ, MOCK, ENGELLİ, DOĞRULANAMADI, BAŞLANMADI, ERTELENDİ.
>
> **Yasak ifadeler:** "tamamen hazır", "üretime hazır", "%100", "sorunsuz çalışıyor", "tüm testler geçiyor". Bunlar yalnızca ilgili faz kapısı ölçütleri bu oturumda kanıtla sağlandıysa ve kanıtla birlikte kullanılabilir.
>
> **Ek C-1: Dilim notu** (her dilim sonunda, ≤ 25 satır)
> ```
> ## Sonuç: <1–2 cümle: ne yapıldı, verify yeşil/kırmızı>
> ## REQ durumları
> | REQ | Önce → Şimdi | Kanıt (test adı veya komut) |
> ## Çalıştırılan doğrulama komutları
> | Komut | Çıkış kodu | Özet (ör. "212 geçti, 0 kaldı, 3 atlandı: neden") |
> ## Doğrulanamayanlar / MOCK / DEMO (yeni veya değişen)
> ## Kararlar ve varsayımlar (ADR/A kimlikleri, tek satır gerekçe)
> ## Riskler ve bilinen hatalar (P0/P1/P2)
> ## Sonraki dilim
> ```
>
> **Ek C-2: Faz raporu** (faz kapısında)
> ```
> ## 1. Sonuç (3 cümle) ve İnsan'dan istenen karar
> ## 2. Faz Bitti Tanımı kontrol listesi: her madde için kanıt bağlantısı
> ## 3. REQ özeti: ZORUNLU x/y TAMAM; TAMAM olmayanlar ve gerekçeleri
> ## 4. Test özeti: birim / entegrasyon / E2E sayıları, son 3 CI koşusu, atlanan testler ve nedenleri
> ## 5. Temiz klon testi çıktısı (komutlar ve çıkış kodları)
> ## 6. MOCK ve DEMO envanteri; DOĞRULANAMADI listesi (MANUAL-QA bağlantılı)
> ## 7. Hukuki inceleme listesi (L-…) ve dış bağımlılıklar (X-…): bekleyenler
> ## 8. "Yüksek" geri alma maliyetli varsayımlar
> ## 9. Bağımsız doğrulama bulguları ve kapanış durumu
> ## 10. Sonraki faz için öneri ve riskler
> ## 11. Demo betiği: docs/demos/FAZ-<N>.md
> ```

---

### PROMPT-ENG-17: Kanıt ve halüsinasyon önleme kuralları
- v1 bölüm: 10, 13, 20, 22  ·  tür: eksik  ·  öncelik: P0  ·  doğrulandı: evet
- **Gerekçe:**
  - v1 "API'nin mevcut olduğunu varsayma" ve "sahte entegrasyon üretme" diyor. Ancak ajanların en sık yaptığı halüsinasyonları ele almıyor:
    - açılmamış kod hakkında iddia,
    - hafızadan kütüphane API'si uydurma,
    - var olmayan ya da benzer adlı paket kurma,
    - yasa ya da politika maddesi uydurma,
    - eski sürüm bilgisine güvenme.
  - Bugün 2026-10-18. Ajanın eğitim verisi daha eski olabilir.
  - Anthropic "açmadığın kod hakkında asla spekülasyon yapma" türünden bir talimat öneriyor.
- **Kaynaklar:** https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices
- **Önerilen metin:**

> **§12.1 Kanıt kuralları:**
> - Açmadığın kod ya da dosya hakkında iddiada bulunma; önce oku.
> - Kütüphane API'lerini hafızadan yazma. Kurulu sürümün tip tanımlarına ya da resmî dokümanına bak ve derleyerek doğrula.
> - Bir paketi kurmadan önce şu komutla varlığını, doğru adını, lisansını ve deposunu doğrula: `npm view <paket> name version license repository.url`. Adı popüler bir pakete çok benzeyen (yazım farkı olan) paketleri kurma.
> - Dış API uç noktası, parametre, kota, ücret ya da sözleşme şartı uydurma. §13.3 protokolünü uygula.
> - Yasa adı, madde numarası, kurum kararı ya da mağaza/arama motoru politika maddesi uydurma. Bilmiyorsan "doğrulanmalı" yaz ve `LEGAL-REVIEW` ya da `EXTERNAL-DEPENDENCIES` kaydı aç.
> - "Geçiyor" sözcüğü yalnızca bu oturumda çalıştırılmış bir komutun çıktısına dayanır. Önceki oturumların sonucu "son bilinen: <tarih, commit>" biçiminde belirtilir.
> - Arayüz davranışı iddiaları (ör. "etiket görünüyor") E2E testi ya da tarayıcı otomasyonuyla kanıtlanır. Mümkünse ekran görüntüsünün yolu rapora eklenir.
> - **Bilgi güncelliği:** Bugün 2026-10-18. Sürüm numaraları, kütüphane özellikleri, Google/Apple/Google Play politikaları ve mevzuat için eğitim verine güvenme. Doğrula ya da DOĞRULANMADI olarak işaretle.
> - Belirsizlikte "bilmiyorum / doğrulanmadı" demek, tahmini kesin bilgi gibi sunmaktan her zaman daha iyidir.

---

### PROMPT-ENG-18: Test bütünlüğü ve döngü (takılma) sınırı
- v1 bölüm: 20  ·  tür: risk  ·  öncelik: P0  ·  doğrulandı: evet
- **Gerekçe:**
  - Otonom ajanlar kırmızı testi yeşile çevirmek için testi siler, beklentiyi gevşetir, testi atlar ya da üretim koduna test girdisine özel değer sabitler.
  - v1 bunu hiç ele almıyor. Ayrıca aynı hatada sonsuz döngüye girmeye karşı bir kural yok.
  - Anthropic'in önerdiği talimat: "Testleri silmek ya da düzenlemek kabul edilemez" ve "değerleri sabitleme; yalnızca test girdileri için çalışan çözüm üretme; test yanlışsa etrafından dolanma, bildir".
- **Kaynaklar:** https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices ; https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents
- **Önerilen metin:**

> **§12.2 Test bütünlüğü:**
> - Şunlar YASAK:
>   - var olan bir testi silmek ya da beklentisini gevşetmek,
>   - `.skip`, `.only`, `xit`, `fixme` ve benzerlerini eklemek,
>   - sorunu gizlemek için zaman aşımını artırmak,
>   - snapshot'ı incelemeden güncellemek.
> - Bir test gerçekten yanlışsa ya da gereksinim değiştiyse değişikliği ayrı bir commit'te yap. Gerekçeyi ve ilgili REQ/Q kimliğini commit gövdesine ve STATUS'a yaz.
> - Testi geçirmek için üretim koduna test girdisine özel değer ya da dal ekleme. Bunun içinde ortam değişkenine bakarak davranış değiştirmek de var. Yalnızca belgelenmiş test altyapısı istisnadır. Genel ve doğru çözüm yaz; testler doğruluğu kanıtlamak içindir, çözümü tanımlamak için değil.
> - `@ts-ignore`, `@ts-expect-error`, `eslint-disable` ve açık `any` yalnızca aynı satırda gerekçe yorumuyla kullanılabilir. CI bunların sayısını raporlar; sayı artarsa artış faz raporunda gerekçelendirilir.
> - Kapsam (coverage) eşikleri düşürülemez. Eşikler Ek A/TST'de tanımlıdır.
> - Kararsız (flaky) bir testin kök nedenini bul. Karantinaya almak ancak bir PARKING-LOT kaydı ve en geç faz sonuna kadar düzeltme tarihiyle mümkündür.
>
> **§12.3 Döngü sınırı:**
> - Aynı hata için 3 farklı düzeltme denemesi başarısız olursa dur.
> - Hipotezlerini, denediklerini ve çıktıları STATUS'a yaz ve ilgili REQ'i ENGELLİ olarak işaretle.
> - Bağımsız başka bir dilime geç.
> - Tüm dilimler bloke ise turu tek bir net soruyla bitir.

---

### PROMPT-ENG-19: Demo ve seed verisi politikası (kurgusal, etiketli, üretime sızmaz)
- v1 bölüm: 20, 21  ·  tür: risk  ·  öncelik: P0  ·  doğrulandı: evet
- **Gerekçe:**
  - v1 "örnek demo verileri" istiyor ve "demo olduğu açıkça belirtilmeli" diyor, ancak bunun mekanizmasını tanımlamıyor.
  - En büyük risk şu: v1'deki örnek aramalar ("İstanbul'da iyi kahvaltı mekanları") ajanı gerçek işletme adlarıyla uydurma puan, yorum ve fiyat içeren seed verisi üretmeye iter. Bu yanıltıcıdır ve itibar ve hukuk riski taşır.
  - Ayrıca demo verinin site haritasına, yapılandırılmış veriye ya da kampanya raporlarına sızmasına karşı koruma yok.
  - `example.com` gibi alan adları RFC 2606 ile dokümantasyon ve örnek kullanımı için ayrılmıştır.
- **Kaynaklar:** https://www.rfc-editor.org/rfc/rfc2606 (arama sonucu üzerinden doğrulandı)
- **Önerilen metin:**

> **§12.4 Demo veri politikası:**
> - Demo veri tamamen kurgusaldır. Gerçek işletme, marka, ürün modeli, kişi ya da rehber adı kullanılmaz. Adlar açıkça kurgusaldır ve "(Demo)" eki taşır, örneğin "Örnek Kahvaltı Evi (Demo)".
> - Konum gerçekçiliği için gerçek il ve ilçe adları kullanılabilir. Gerçek adres, telefon ya da web sitesi kullanılmaz. E-posta ve web alanlarında yalnızca `example.com` / `example.org` alan adları kullanılır. Telefon alanları açıkça geçersiz bir yer tutucu taşır.
> - Demo kullanıcı değerlendirmeleri yalnızca demo listelemelerde ve demo kullanıcılarla oluşturulur. Gerçek bir yerin gerçek özelliği hakkında olgusal iddia içermez.
> - İçerik, listeleme, değerlendirme, kampanya, yerleşim ve olay tablolarında `dataOrigin` alanı ZORUNLU'dur: `DEMO | EDITORIAL | USER | PROVIDER | IMPORT`.
> - `dataOrigin=DEMO` olan kayıtlar için:
>   - geliştirme ve staging arayüzünde görünür bir "DEMO" rozeti taşır,
>   - site haritasına, yapılandırılmış veriye (JSON-LD) ve analitik/kampanya raporlarına girmez,
>   - sayfası `noindex` olur.
>
>   Her biri testle doğrulanır.
> - Seed komutu `APP_ENV=production` ortamında çalışmayı reddeder ve sıfır olmayan çıkış koduyla çıkar. Bu davranış bir testle doğrulanır.
> - Sentetik gösterim ve tıklama olayları (yük testi, demo) gerçek olaylardan ayrı işaretlenir ve kampanya raporlarına karışmaz (AK-02).
> - Gerçek listeleme ve içerik girişi yalnızca yönetim panelinden, `source` alanı doldurularak yapılır. Ajan gerçek işletmeler hakkında içerik yazmaz ve yayımlamaz.

---

### PROMPT-ENG-20: Durma koşulları ve İnsan onay matrisi
- v1 bölüm: 22 (ayrıca 10, 15, 16)  ·  tür: çelişki  ·  öncelik: P0  ·  doğrulandı: evet
- **Gerekçe:**
  - v1 "Gereksiz sorularla geliştirmeyi durdurma" diyor, ama hangi soruların gerekli olduğunu tanımlamıyor. Bu yüzden ajan para, hukuk, kimlik bilgisi ve geri alınamaz işlemlerde tek başına karar verebilir.
  - Anthropic iki öneride bulunuyor:
    - Kullanıcıyı yalnızca gerçekten gerektiğinde durdurmak: yıkıcı ya da geri alınamaz eylem, gerçek kapsam değişikliği, yalnızca kullanıcının sağlayabileceği girdi.
    - Şu eylemlerden önce onay istemek: yıkıcı işlemler (dosya/dal silme, tablo düşürme), geri alınması zor işlemler (force push, `reset --hard`), başkalarına görünen işlemler (push, mesaj gönderme). Engellerle karşılaşınca `--no-verify` gibi kısa yollara başvurmamak.
- **Kaynaklar:** https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices ; https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-fable-5
- **Önerilen metin:**

> **§11 Durma koşulları ve İnsan onayı**
>
> | Sınıf | Davranış | Kapsam |
> |---|---|---|
> | A: Karar ver | Kendin karar ver, ADR ya da A kaydı yaz ve devam et. | Kütüphane seçimi (lisans izin listesindeyse), klasör yapısı, şema, API tasarımı, arayüz düzeni, test araçları, varsayılan değerler, taslak metinler |
> | B: Sor, bekleme | Q kaydı aç ve varsayılanı yaz, beklemeden varsayılanla devam et. Sorular dilim ya da faz raporunda toplu sunulur. | Ürün tercihleri (puan ölçeği, pilot dikeyler, ana sayfa modül sırası, sponsorlu oranı), hukuki inceleme gerektirmeyen arayüz metinleri |
> | C: Dur ve onay bekle | O işi yapma, Q kaydını "C" olarak aç ve bağımsız diğer işlere devam et. Başka iş kalmadıysa turu tek soruyla bitir. | Aşağıdaki liste |
> | D: Yapma | İnsan isterse yazılı risk bildir. Yasa dışı ya da kullanıcıyı yanıltıcıysa uygulama. | Altın kural ihlalleri: scraping, sahte değerlendirme/puan, etiketsiz ticari yerleşim, sırrı depoya koymak |
>
> **C sınıfı:**
> - Üretime ya da halka açık bir ortama dağıtım. Alan adı ve DNS değişiklikleri.
> - Para: ödeme sağlayıcısı, fiyatlandırma, ücretli servis aboneliği, ücretli API kullanımı.
> - Dış hizmetlerde hesap açma, kullanım şartlarını kabul etme, affiliate ya da sağlayıcı programına başvuru.
> - Gerçek kimlik bilgileri. İnsan bu bilgileri yerel `.env` dosyasına ya da sır yöneticisine kendisi koyar; ajan değer istemez ve görüntülemez.
> - Gerçek kişilere e-posta, SMS ya da push gönderimi.
> - Mağaza gönderimi (App Store / Google Play) ve dışarıya test dağıtımı.
> - Hukuki metinlerden "TASLAK" damgasının kaldırılması.
> - Gerçek bir işletme ya da kişi hakkında içerik yayımlanması.
> - Geri alınamaz veri işlemleri: paylaşılan ya da uzak veritabanında drop, reset, truncate, toplu silme; yedek silme.
> - Git: `push --force`, paylaşılan dallarda `reset --hard`, yayımlanmış commit'leri değiştirme, dal silme, `--no-verify`.
> - Ajanın oluşturmadığı dosya ya da dizinleri silme.
> - ZORUNLU yığın, altın kurallar ya da faz kapsamında değişiklik.
> - Lisans izin listesi dışında bir bağımlılık ekleme.
> - Faz geçişi (Faz 1 → 2 → 3 → 4).
>
> **Soru sorma biçimi:**
> - Her soru seçenekli, önerili ve varsayılanlı olur.
> - Aynı soruyu tekrar sorma.
> - Yanıtları OPEN-QUESTIONS dosyasına ve ilgili ADR'ye işle.
> - Engelle karşılaştığında yıkıcı kısa yol kullanma (güvenlik kontrolünü atlamak, tanımadığın dosyaları silmek gibi).

---

### PROMPT-ENG-21: Sır yönetimi kuralları
- v1 bölüm: 2, 16  ·  tür: eksik  ·  öncelik: P0  ·  doğrulandı: evet
- **Gerekçe:**
  - v1 yalnızca "Güvenli sır yönetimi" ve "`.env.example`" diyor. Ajana özgü riskleri ele almıyor:
    - sırrın sohbete, loga, test fikstürüne ya da istemci paketine sızması,
    - İnsan'dan sohbete anahtar yapıştırmasının istenmesi,
    - sızıntı sonrası ne yapılacağı.
  - Next.js `NEXT_PUBLIC_` önekli değişkenleri derleme sırasında tarayıcıya giden JavaScript'e gömer. Expo `EXPO_PUBLIC_` önekli değişkenleri uygulama paketine gömer ve bu değerler derlenmiş uygulamada düz metin olarak görülebilir. Expo bu değişkenlerde özel anahtar saklanmamasını açıkça belirtir.
  - gitleaks, git depolarında sır tespiti yapan, pre-commit kancası ve GitHub Action sunan bir araçtır.
- **Kaynaklar:**
  - https://nextjs.org/docs/app/guides/environment-variables. Doküman metni arama sonuçlarındaki resmî doküman kopyaları üzerinden doğrulandı; site doğrudan erişilemedi.
  - https://docs.expo.dev/guides/environment-variables/. Arama sonucu özeti üzerinden doğrulandı.
  - https://github.com/gitleaks/gitleaks
- **Önerilen metin:**

> **§13.1 Sırlar:**
> - `.env.example` hariç tüm `.env*` dosyaları `.gitignore` içindedir. `.env.example` yalnızca değişken adlarını, tek satırlık açıklamaları ve `CHANGE_ME` gibi yer tutucu değerleri içerir.
> - Sırlar şu yerlere yazılmaz: sohbet mesajları, commit'ler, loglar, hata izleme olayları, test fikstürleri, ekran görüntüleri, dokümanlar.
> - İnsan'dan bir sırrın değerini sohbete yapıştırmasını isteme. Yalnızca değişkenin ADINI ve nereye konacağını söyle.
> - İstemciye giden önekler: Next.js'te `NEXT_PUBLIC_` ve Expo'da `EXPO_PUBLIC_` önekli değişkenler istemci paketine gömülür. Bu öneklerle hiçbir sır tanımlanmaz. CI, bu önekli değişken adlarında `SECRET|PRIVATE|PASSWORD|TOKEN` geçerse başarısız olur. Bilinçli olarak herkese açık anahtarlar (ör. alan adıyla kısıtlanmış harita anahtarı) izin listesinde ve ADR ile tutulur.
> - Sır taraması ZORUNLU'dur: gitleaks ya da eşdeğeri, hem pre-commit kancası hem CI adımı olarak çalışır ve tüm geçmişi tarar.
> - Sızıntı olursa:
>   1. Dur ve push etme.
>   2. Push edildiyse İnsan'a hemen bildir. Anahtarın iptali ve rotasyonu İnsan'ın işidir.
>   3. Geçmişin yeniden yazılması yalnızca İnsan onayıyla yapılır (C sınıfı).
> - Ortam ayrımı: Yerel, test, staging ve üretim için ayrı sırlar kullanılır. Üretim sırları varsayılan olarak ajana verilmez. Sağlayıcıların sandbox/test anahtarları da sırdır.
> - Loglarda şunlar maskelenir: `Authorization` başlığı, çerezler, token'lar, parola alanları, e-posta ve telefon. Maskeleme bir testle doğrulanır.

---

### PROMPT-ENG-22: Dış kaynak doğrulama protokolü
- v1 bölüm: 6, 10, 13, 16  ·  tür: belirsiz  ·  öncelik: P1  ·  doğrulandı: evet (dış olgu iddiası yok)
- **Gerekçe:**
  - v1 ajandan dört alanda doğrulama istiyor: sağlayıcı dokümanları (§10), Google yönergeleri (§13), mağaza kuralları (§6) ve hukuki yükümlülükler (§16).
  - Ancak şunları tanımlamıyor: neyin birincil kaynak sayılacağı, doğrulamanın nereye kaydedileceği, web erişimi yoksa ne yapılacağı ve doğrulamanın ne zaman yenileneceği.
  - Ajanın çalışma ortamında web erişimi kısıtlı olabilir ve eğitim verisi bugünden (2026-10-18) eski olabilir.
- **Kaynaklar:** —
- **Önerilen metin:**

> **§13.3 Dış kaynak doğrulama protokolü.** Bir dış olguya dayanan her karar bu protokole tabidir. Dış olgular şunlardır: API'nin varlığı ve şartları, kota, ücret, affiliate program şartları, arama motoru yapılandırılmış veri politikası, App Store / Google Play kuralları, mevzuat, kütüphane sürümü ve özellikleri.
> 1. **Birincil kaynak kullan.** Birincil kaynaklar: resmî doküman, resmî politika sayfası, Resmî Gazete gibi resmî mevzuat yayınları, kurumun kendi sitesi. Blog yazıları, forumlar, üçüncü taraf özetleri ve yapay zekâ özetleri birincil kaynak değildir.
> 2. **Kaydet.** URL, erişim tarihi, ilgili cümlenin kısa alıntısı ve varsa doküman sürümü yazılır. Kaydın yeri: dış bağımlılıklar için `EXTERNAL-DEPENDENCIES`, hukuki konular için `LEGAL-REVIEW`, teknik konular için ilgili ADR.
> 3. **Erişemezsen.** Web erişimin yoksa ya da kaynak açılmıyorsa olguyu `DOĞRULANMADI` olarak işaretle. İlgili özelliği yalnızca arayüz artı MOCK ya da KAPALI olarak uygula ve doğrulama işini İnsan'a görev olarak listele.
> 4. **Uydurma.** Kaynak göstermeden madde numarası, uç nokta adı, ücret ya da kota yazma.
> 5. **Yenile.** Doğrulanmış bilgiler eskir. Her kayda "faz kapısında yeniden doğrula" notu düşülür ve faz raporu yeniden doğrulananları listeler.

---

### PROMPT-ENG-23: Bağımlılık ekleme politikası
- v1 bölüm: 2, 17  ·  tür: eksik  ·  öncelik: P1  ·  doğrulandı: evet
- **Gerekçe:**
  - v1 yalnızca "onlarca bağımsız kütüphane kullanarak performansı düşürme" diyor.
  - Otonom ajanlar şu riskleri taşır:
    - aynı amaçlı ikinci bir kütüphane eklemek,
    - lisansı uygunsuz paket eklemek,
    - var olmayan ya da benzer adlı (typosquat) paket kurmak.
  - Bu riskler hem güvenlik hem hukuk açısından önemlidir.
  - `npm view` komutunun registry bilgisini gösterdiği yerel olarak doğrulandı.
- **Kaynaklar:** — (`npm view --help` yerel çıktı)
- **Önerilen metin:**

> **§13.2 Bağımlılıklar:**
> - Yeni bir çalışma zamanı bağımlılığı eklemeden önce dört şeyi kontrol et:
>   1. Aynı işi yapan mevcut bir bağımlılık ya da platform özelliği var mı?
>   2. `npm view <paket> name version license repository.url` ile paketin varlığı, adı, lisansı ve deposu doğru mu?
>   3. Son yayın tarihi ve bakım durumu nedir?
>   4. Web istemcisi için paket boyutuna etkisi nedir?
> - **Lisans izin listesi:** MIT, Apache-2.0, BSD-2-Clause, BSD-3-Clause, ISC, 0BSD. Bunların dışındaki lisanslar C sınıfıdır: GPL ailesi, AGPL, SSPL, BUSL, "UNLICENSED" ve bilinmeyen lisanslar. CI'da lisans denetimi adımı bulunur.
> - Aynı amaca hizmet eden ikinci bir kütüphane YASAK. Örnekler: iki tarih kütüphanesi, iki durum yönetimi, iki UI bileşen kiti, iki form kütüphanesi.
> - Lockfile commit edilir. Major sürüm yükseltmesi ADR gerektirir ve faz ortasında yapılmaz. Güvenlik yamaları bu kuralın istisnasıdır.
> - Bağımlılık güvenlik denetimi CI'da çalışır. Yüksek ya da kritik bulgu varsa dilim tamamlanamaz; istisna için ADR gerekir.

---

### PROMPT-ENG-24: Teknoloji yığınının normatif düzeyi, sürüm politikası ve ADR-0001
- v1 bölüm: 2  ·  tür: belirsiz  ·  öncelik: P1  ·  doğrulandı: evet (dış olgu iddiası yok)
- **Gerekçe:**
  - §2 "kesin" başlığı altında "önerilen", "veya benzer" ve "eşdeğer" ifadelerini kullanıyor.
  - Depo boş olduğu için "mevcut projenin durumuna göre değerlendir" ifadesinin bir karşılığı yok.
  - Sürüm politikası yok. Ajan eğitim verisindeki sürümleri kullanabilir ya da faz ortasında major yükseltme yapabilir.
  - Redis/kuyruk için tetikleyici ölçüt yok.
- **Kaynaklar:** —
- **Önerilen metin:**

> **§14.1 ZORUNLU yığın:**
> - TypeScript (`strict`).
> - Web: Next.js.
> - API: NestJS.
> - PostgreSQL ve Prisma.
> - Tailwind CSS.
> - pnpm workspaces tabanlı monorepo.
> - Faz 2'den itibaren Expo / React Native.
>
> Bu listeden sapma İnsan onayı ve ADR gerektirir.
>
> **§14.2 ADR ile ajanın seçeceği konular (Faz 0):**
> - monorepo görev çalıştırıcı,
> - kimlik doğrulama yaklaşımı ve kütüphanesi,
> - birim, E2E ve (Faz 2) mobil E2E test araçları,
> - yönetim panelinin konumu (ayrı uygulama ya da korumalı rota),
> - yerel S3 uyumlu depolama,
> - e-posta gönderim arayüzü,
> - hata izleme ve log altyapısı,
> - sayfa türü başına render stratejisi.
>
> **§14.3 Sürüm politikası:**
> - Faz 0'da her ZORUNLU bileşenin güncel kararlı sürümünü registry'den oku (ör. `npm view next version`).
> - Destek ve LTS durumunu resmî kaynaktan doğrula ve ADR-0001'e yaz.
> - Eğitim verindeki sürüm bilgisine güvenme.
> - Node.js sürümü `.nvmrc` ve `engines` alanında sabitlenir.
> - Faz ortasında major yükseltme YASAK. Güvenlik yamaları istisnadır.
>
> **§14.4 Redis ve kuyruk:** Faz 1'de eklenmez. Aşağıdakilerden biri ölçümle gösterilirse ADR ile eklenir:
> - (a) Bir arka plan işi istek içinde makul sürede yapılamıyor ya da yeniden deneme gerektiriyor. Varsayılan eşik: 2 saniyenin üzeri.
> - (b) Ölçülmüş bir önbellek ihtiyacı var: Ek A/PRF'deki p95 hedefi, veritabanı optimizasyonuna rağmen aşılıyor.
> - (c) Rate limiting ya da oturum durumu birden fazla API örneği arasında paylaşılmak zorunda.

---

### PROMPT-ENG-25: Kanonik komutlar ve "temiz klon" yeniden üretilebilirlik ölçütü
- v1 bölüm: 2, 21  ·  tür: kabul_kriteri  ·  öncelik: P1  ·  doğrulandı: evet
- **Gerekçe:**
  - v1 "Docker ile tekrarlanabilir geliştirme ortamı" ve "kurulum ve çalıştırma talimatları" istiyor, ancak ölçülebilir bir ölçüt vermiyor.
  - Her oturumda ajanın uygulamayı nasıl başlatacağını yeniden keşfetmesi bağlam ve zaman kaybıdır.
  - Anthropic, sunucuları başlatan, testleri ve linter'ları çalıştıran bir kurulum betiği (ör. `init.sh`) önerir. Sonraki oturumların önce bu betiği okumasını ister.
- **Kaynaklar:** https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents ; https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices
- **Önerilen metin:**

> **§9.5 Kanonik komutlar.** Faz 0'dan itibaren ZORUNLU'dur. `AGENTS.md` ve README'de yazılıdır. CI aynı komutları kullanır.
>
> | Komut | İşlev | Kabul ölçütü |
> |---|---|---|
> | `pnpm setup` (`scripts/init.sh` çağırır) | Bağımlılıkları kurar, `.env` yoksa `.env.example`'dan kopyalar, Docker servislerini başlatır, migration'ları uygular, demo seed'i yükler. | Temiz klonda tek komutla çalışır. İdempotenttir: ikinci çalıştırma hata vermez. |
> | `pnpm dev` | Web, API ve yönetim panelini geliştirme modunda başlatır. | Portlar README'de yazılıdır. |
> | `pnpm verify` | Lint, typecheck, birim, entegrasyon, build ve `req:check` çalıştırır. | Yerelde ve CI'da aynı sonucu verir. |
> | `pnpm test:smoke` | En kritik 3–5 akışı hızlıca kontrol eder. | 2 dakikanın altında biter. |
> | `pnpm test:e2e` | E2E senaryolarını çalıştırır. | Başsız (headless) çalışır, seed'lenmiş izole bir veritabanı kullanır. |
> | `pnpm db:migrate` / `pnpm db:reset:local` | Migration uygular / yerel veritabanını sıfırlar. | `reset` yalnızca yerel veritabanı adresinde çalışır; adres kontrol edilir. |
> | `pnpm seed:demo` | Demo verisini yükler. | Üretimde çalışmayı reddeder. |
> | `pnpm req:check` | REQ ile test arasındaki izlenebilirliği denetler. | PROMPT-ENG-07'deki kurallar. |
>
> **Temiz klon testi:** Her faz kapısında depo geçici bir dizine yeniden klonlanır ve yalnızca README adımları uygulanır. Komutlar ve çıkış kodları faz raporuna eklenir. Docker dışındaki global araç gereksinimleri README'de sürümleriyle listelenir.

---

### PROMPT-ENG-26: Ortamda doğrulanamayan işler ve manuel QA kaydı
- v1 bölüm: 6, 17, 20  ·  tür: risk  ·  öncelik: P1  ·  doğrulandı: evet (dış olgu iddiası yok)
- **Gerekçe:**
  - Ajanın çalıştığı konteyner bazı davranışları doğrulayamaz. v1 bu davranışların "çalışmasını" istiyor ama doğrulanamazlarsa ne yapılacağını söylemiyor:
    - gerçek cihaz ve simülatör davranışı,
    - push teslimi,
    - gerçek alan adıyla derin bağlantı doğrulaması,
    - mağaza incelemesine uyum,
    - gerçek e-posta teslimi,
    - kimlik bilgisi olmadan canlı sağlayıcı yanıtları,
    - saha Core Web Vitals verileri,
    - ekran okuyucuyla gerçek kullanım.
  - Kural konmazsa ajan bunları "çalışıyor" diye raporlama eğilimindedir.
- **Kaynaklar:** —
- **Önerilen metin:**

> **§12.7 Ortamda doğrulanamayan işler:**
> - Ortam kısıtı nedeniyle doğrulayamadığın her davranışın durumu `DOĞRULANAMADI` olur ve asla `TAMAM` işaretlenmez.
> - İlgili REQ'in doğrulama yöntemi "M" olur. `docs/MANUAL-QA.md` dosyasına şu biçimde bir senaryo yazılır: ön koşullar, adımlar, beklenen sonuç, boş "Sonuç / Tarih / Test eden" alanları. Durum, İnsan bu alanları doldurduğunda `TAMAM`'a geçer.
> - **Tipik M kalemleri:**
>   - iOS/Android cihaz ya da simülatör davranışı (ortamda simülatör yoksa),
>   - push bildirim teslimi,
>   - gerçek alan adı ve barındırma gerektiren derin bağlantı ilişkilendirmesi,
>   - mağaza incelemesine uyum,
>   - gerçek e-posta teslimi,
>   - kimlik bilgisi gerektiren sağlayıcı canlı yanıtları,
>   - saha (gerçek kullanıcı) performans ölçümleri,
>   - ekran okuyucuyla uçtan uca kullanım,
>   - üretime benzer ortamda yük testi.
> - **Ajanın her durumda kanıtlaması gerekenler:** typecheck, birim ve bileşen testleri, otomatik erişilebilirlik denetimi, laboratuvar ortamında performans ölçümü (aracı ve koşulları raporda belirtilir) ve ortam izin veriyorsa emülatör ya da tarayıcıda duman testi.
> - Laboratuvar ölçümü saha ölçümü yerine raporlanmaz. Raporda ikisi ayrı satırlarda yer alır.

---

### PROMPT-ENG-27: Özellik durumu ve yarım özelliklerin işaretlenme mekanizması
- v1 bölüm: 21  ·  tür: belirsiz  ·  öncelik: P1  ·  doğrulandı: evet (dış olgu iddiası yok)
- **Gerekçe:**
  - v1 iki şey istiyor: "Boş butonlar, çalışmayan formlar… bırakma" ve "Henüz tamamlanmayan özellikleri açık şekilde işaretle". Ayrıca "mock veriyi üretim verisiymiş gibi sunma" diyor.
  - Ancak işaretlemenin nerede ve nasıl yapılacağını tanımlamıyor. Sonuçta ya kullanıcıya "Yakında" butonları gösterilir ya da mock veri üretime sızar.
- **Kaynaklar:** —
- **Önerilen metin:**

> **§12.8 Özellik durumu ve MOCK izolasyonu:**
> - Kod içinde tipli, merkezi bir özellik bayrağı kaydı tutulur. Uzaktan bayrak servisi Faz 1'de kullanılmaz. Her bayrak bir REQ'e bağlıdır ve şu durumlardan birini alır: `KAPALI | YALNIZCA_GELISTIRME | MOCK | ACIK`.
> - **Üretimde:** `MOCK` ya da `YALNIZCA_GELISTIRME` durumundaki özellikler kullanıcı arayüzünde **render edilmez**. "Yakında" butonu, tıklanınca hiçbir şey yapmayan öğe ya da devre dışı form bırakılmaz. Yönetim panelinde ise "Bu özellik etkin değil: X-003 bekleniyor" açıklaması gösterilebilir.
> - **Geliştirme ve staging'de:** MOCK verisiyle çalışan her bileşen görünür bir "MOCK" rozeti taşır.
> - **Derleme koruması:** Üretim derlemesine bir MOCK adaptörü girerse derleme başarısız olur. Bu koruma bir testle doğrulanır.
> - Her MOCK, `docs/MOCKS.md` dosyasında bir M kaydıyla eşleşir. Faz raporu MOCK envanterini listeler.

---

### PROMPT-ENG-28: Ölçülemeyen ifadelerin kabul kriterine dönüştürülmesi
- v1 bölüm: 3, 5, 7, 13, 17, 20  ·  tür: kabul_kriteri  ·  öncelik: P1  ·  doğrulandı: evet (dış olgu iddiası yok)
- **Gerekçe:**
  - v1'deki kalite hedeflerinin çoğu test edilemez. Örnekler: "premium, minimal, modern", "Core Web Vitals odaklı", "performans kontrolleri", "mobil ekran uyumluluğu", organik ve sponsorlu içerik arasında "dengeli yapı", "mümkün olduğunca dayanıklı" arama, programatik SEO'da "yeterli veri", onlarca kez geçen "uygun" ve "gerektiğinde".
  - Ölçülemeyen hedef ajanın "yaptım" demesine engel olmaz, ama doğrulanamaz.
  - Sayısal eşiklerin kendisini ilgili uzman bölümler belirler (performans, erişilebilirlik, arama, SEO). Bu bulgu kuralı ve dönüşüm biçimini tanımlar. Aşağıdaki sayılar yalnızca İnsan onayına sunulacak varsayılanlardır.
- **Kaynaklar:** —
- **Önerilen metin:**

> **§3.4 Ölçülebilirlik kuralı:**
> - Ek A'daki her ZORUNLU ve OLMALI REQ en az bir kabul kriteri ve bir doğrulama yöntemi (T/İ/G/A/M) taşır.
> - Ölçülemeyen yönlendirici cümleler "İlke" etiketiyle ayrılır ve test edilmez. Bunlara aykırılık kod incelemesinde gerekçe olarak kullanılabilir.
> - Raporlarda sayısal kanıtı olmayan kalite sıfatları ("hızlı", "güvenli", "erişilebilir", "SEO uyumlu") kullanılamaz. Bunların yerine ölçüm sonucu yazılır.
>
> **Dönüşüm örnekleri:**
>
> | v1 ifadesi | v2'deki ölçülebilir karşılığı |
> |---|---|
> | "premium, minimal, modern" (§3) | İlke. Ölçülebilir alt kurallar: renk, aralık, yarıçap ve tipografi yalnızca tasarım token'larından gelir (token dışı değer kullanımı lint ile yakalanır). Tek tipografi ölçeği ADR'de tanımlanır. |
> | "Mobil ekran uyumluluğu" (§20) | E2E ve görsel kontroller şu görünüm alanlarında çalışır: 360×800, 390×844, 768×1024, 1280×800, 1920×1080. Hiçbir sayfada yatay kaydırma yoktur. Dokunma hedefi boyutu Ek A/ERS'deki eşiğe uyar. |
> | "Core Web Vitals odaklı", "Performans kontrolleri" (§17, §20) | Ek A/PRF'deki sayfa türü başına eşikler kullanılır. Laboratuvar ölçümü CI'da yapılır, araç ve koşullar raporlanır. Saha ölçümü yalnızca üretimde yapılır ve M yöntemine tabidir. |
> | Organik ve sponsorlu arasında "dengeli yapı" (§5) | Her liste, arama sonucu ve ana sayfa modülünde sponsorlu öğe oranı için bir üst sınır vardır. Varsayılan A kaydı: görünen ilk 10 öğede en fazla 2 sponsorlu öğe. Sınır yönetim panelinden ayarlanabilir ve testle doğrulanır. |
> | "Mümkün olduğunca dayanıklı" arama (§7) | `docs/requirements/ARA-sorgu-korpusu.md` dosyasında en az 50 sorgu bulunur: Türkçe karakter varyantları, yazım hataları, eş anlamlılar ve lokasyon adları. Her sorgu için beklenen sonuç yazılır. Kabul eşiği Ek A/ARA'da tanımlanır. Varsayılan A kaydı: sorguların en az %90'ında beklenen sonuç ilk 10 içinde. |
> | "Yeterli veriye sahip" programatik sayfa (§13) | Eşik Ek A/SEO'da tanımlanır. Eşiğin altındaki kombinasyon sayfaları ya üretilmez ya da `noindex` olur. Bu davranış testle doğrulanır. |
> | "Gerektiğinde OpenAPI" (§2) | Faz 1'den itibaren her uç nokta için ZORUNLU (Ç-10). |
> | Tek başına "uygun" | Ek A'da somut bir kurala çevrilir. Çevrilemiyorsa ajan kuralı ADR'de tanımlar. |

---

### PROMPT-ENG-29: Öz-denetim ritmi ve bağımsız (taze bağlamlı) doğrulayıcı
- v1 bölüm: YENİ (v1 §20)  ·  tür: eksik  ·  öncelik: P1  ·  doğrulandı: evet
- **Gerekçe:**
  - v1'de ajanın kendi işini düzenli aralıklarla spesifikasyona karşı denetlemesi için bir mekanizma yok.
  - Anthropic uzun görevlerde belirli aralıklarla spesifikasyona karşı doğrulama yapılmasını öneriyor. Ayrı ve taze bağlamlı doğrulayıcı alt ajanların öz-eleştiriden daha iyi sonuç verdiğini belirtiyor.
- **Kaynaklar:** https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-fable-5
- **Önerilen metin:**

> **§12.6 Öz-denetim:**
> - **Her dilim sonunda:** Dilim Bitti Tanımı maddelerini tek tek, kanıtıyla işaretle.
> - **Her 5 dilimde bir ve her faz kapısından önce bağımsız doğrulama yap:**
>   - Alt ajan başlatabiliyorsan, yalnızca bu promptu, `AGENTS.md`, `requirements.json` ve depoyu verdiğin taze bağlamlı bir doğrulayıcıya şu görevi ver: "Aktif fazın her ZORUNLU REQ'ini kodda ve testte kanıtla; kanıtlayamadıklarını, altın kural ihlallerini ve sahte ya da sabit kodlanmış verileri listele."
>   - Alt ajan başlatamıyorsan aynı denetimi yeni bir oturumda, yalnızca dosyalara dayanarak yap.
> - **Faz kapısında otomatik taramalar:**
>   - kod tabanında `.skip`/`.only`/`TODO`/`FIXME` sayıları,
>   - üretim derlemesinde MOCK ya da seed izi,
>   - arayüz bileşenlerinde sabit kodlanmış sayısal istatistikler,
>   - istemci önekli sır kalıpları,
>   - sponsor açıklama testlerinin kapsamı.
> - Bulguları kapat ya da P0/P1 olarak faz raporuna yaz.
> - Alt ajanlar da aynı altın kurallara ve durma koşullarına bağlıdır. Görev tanımlarına `AGENTS.md` eklenir. Alt ajanlar C sınıfı eylem yapamaz.

---

### PROMPT-ENG-30: Kritik kuralların mekanik olarak zorlanması (CI, kancalar, araç izinleri)
- v1 bölüm: YENİ  ·  tür: risk  ·  öncelik: P1  ·  doğrulandı: evet
- **Gerekçe:**
  - Prompt ve proje talimat dosyaları bağlamdır, zorlayıcı yapılandırma değildir. Claude Code dokümantasyonu `CLAUDE.md` içeriğinin zorlanmadığını açıkça belirtir. Bir eylemi her koşulda engellemek için `PreToolUse` kancası, izin kuralları için de istemcinin uyguladığı ayar kurallarını önerir.
  - Haftalarca süren bir çalışmada P0 kurallar yalnızca metne bırakılmamalı. CI kontrolleri, git kancaları ve araç izinleriyle makineye bağlanmalı.
- **Kaynaklar:** https://code.claude.com/docs/en/memory ; https://github.com/gitleaks/gitleaks
- **Önerilen metin:**

> **§12.9 Mekanik zorlama.** P0 kuralların her biri en az bir otomatik denetimle desteklenir. Bu denetimler Faz 0'da kurulur.
>
> | Kural | Mekanizma |
> |---|---|
> | Depoda sır yok (AK-08) | gitleaks ya da eşdeğeri: pre-commit ve CI |
> | Test atlama ya da odaklama yok (AK-11) | Test çerçevesinin ESLint eklentisindeki odaklı/devre dışı test yasaklayan kurallar ve CI'da sayaç |
> | Etiketsiz ticari yerleşim yok (AK-05) | Sponsorlu ya da affiliate öğe render eden bileşenlerde açıklama verisi tip düzeyinde zorunlu, ayrıca E2E testi |
> | Üretimde demo veri ya da MOCK yok (AK-03, AK-06) | Seed komutunda ortam koruması, derleme koruması, testler |
> | İzlenebilirlik | `pnpm req:check` CI'da |
> | Commit biçimi | commitlint |
> | Lisans | Lisans denetimi adımı |
> | `main` her zaman yeşil | (GitHub kullanılıyorsa) dal koruması: CI yeşil olmadan birleştirme yok. İnsan ayarlar. |
> | Tehlikeli komutlar (§11 C sınıfı) | Claude Code kullanılıyorsa proje izin ayarlarında (`.claude/settings.json`) `git push --force`, `--no-verify`, uzak veritabanına yönelik reset/drop gibi komutlar reddedilir ya da onaya bağlanır. Gerekirse `PreToolUse` kancası eklenir. Bu ayarları ajan önerir, İnsan onaylar. Ajan kendi izinlerini genişletemez. |

---

### PROMPT-ENG-31: Promptun sürümlenmesi ve bakımı
- v1 bölüm: YENİ  ·  tür: yapı  ·  öncelik: P1  ·  doğrulandı: evet
- **Gerekçe:**
  - v1'de sürüm, tarih, sahip ya da değişiklik günlüğü yok.
  - Proje sürerken prompt mutlaka güncellenecektir. Güncellemenin ajana nasıl ulaştırılacağı, ajanın önceki kararları nasıl uyarlayacağı ve ajanın promptu kendisinin değiştirip değiştiremeyeceği tanımlı değil.
  - Anthropic, talimatları, bağlamı ve örnekleri XML benzeri etiketlerle ayırmanın yanlış yorumlamayı azalttığını belirtir. Bu, şablonların talimattan ayrılması için de geçerlidir.
- **Kaynaklar:** https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices
- **Önerilen metin:**

> **§0 Bu belge hakkında**
> ```
> Belge: İncelemeler.com.tr Otonom Geliştirme Promptu
> Sürüm: 2.0.0 · Tarih: 2026-10-18 · Sahibi: <İnsan adı> · Durum: Yürürlükte
> Önceki sürüm: v1 (tarihsiz) · Farklar: Ek D
> ```
> - **Sürüm numaralandırma:**
>   - MAJOR: altın kural, faz kapsamı ya da ZORUNLU yığın değişikliği.
>   - MINOR: yeni ya da kaldırılmış REQ.
>   - PATCH: netleştirme ya da düzeltme.
> - **Ajan bu belgeyi değiştirmez.** İyileştirme önerilerini `OPEN-QUESTIONS` dosyasına `PROMPT-CR-NNN` olarak yazar. Her öneride şunlar bulunur: önerilen metin, gerekçe, etkilenen § ve REQ'ler.
> - **Yeni sürüm geldiğinde** ajan şunları yapar:
>   1. Ek D'deki farkları okur.
>   2. `docs/prompt/` altına yeni kopyayı ekler; eski sürüm silinmez.
>   3. Etkilenen REQ'leri `requirements.json` dosyasında günceller. Bu metin değişikliği İnsan kaynaklı olduğu için izinlidir.
>   4. Çelişen ADR'leri "yerine geçildi" olarak işaretler.
>   5. STATUS'a "prompt vX.Y.Z uygulandı" yazar.
> - § numaraları, REQ ve E2E kimlikleri kararlıdır. Atıflar bunlar üzerinden yapılır.
> - Bu belgedeki örnekler ve şablonlar kod bloğu ya da `<ornek>` etiketleriyle ayrılmıştır. Bunlar talimat değil, biçim örneğidir.

---

### PROMPT-ENG-32: Dil, adlandırma ve Türkçe yerel ayar kuralları
- v1 bölüm: 12, 13  ·  tür: eksik  ·  öncelik: P2  ·  doğrulandı: evet
- **Gerekçe:**
  - v1 varlık adlarını İngilizce, geri kalan her şeyi Türkçe veriyor. Kod, commit, doküman ve arayüz metni için dil kuralı koymuyor.
  - Türkçe büyük/küçük harf dönüşümü JavaScript'te yaygın bir hata kaynağıdır. Node 22'de yerel olarak doğrulandı:
    - `'I'.toLowerCase()` → `i`; doğrusu `'I'.toLocaleLowerCase('tr-TR')` → `ı`.
    - `'İstanbul'.toLowerCase()` 9 karakterlik bir dize üretir (birleşik nokta).
  - Bu hatalar arama, slug üretimi ve tekilleştirmede sessiz hatalara yol açar.
- **Kaynaklar:** — (yerel Node 22 doğrulaması)
- **Önerilen metin:**

> **§4.2 Dil ve adlandırma:**
> - **İngilizce:** Kod tanımlayıcıları, veritabanı tablo ve kolon adları, API yolları, commit mesajları (§4 sözlüğündeki kod adlarıyla).
> - **Türkçe:** Dokümanlar (`docs/`), raporlar ve kullanıcı arayüzü metinleri.
> - Arayüz metinleri yalnızca i18n anahtarlarıyla kullanılır; varsayılan yerel ayar `tr-TR`. Bileşene sabit yazılmış metin YASAK ve lint ile denetlenir.
> - **Türkçe metin işleme:**
>   - Büyük/küçük harf dönüşümünde yalnızca `toLocaleLowerCase('tr-TR')` ve `toLocaleUpperCase('tr-TR')` kullanılır. Sıralamada `Intl.Collator('tr')` kullanılır.
>   - Arama normalizasyonu ve slug üretimi tek bir merkezi yardımcı fonksiyonda yapılır. Bu fonksiyon I/ı/İ/i, ğ, ş, ç, ö, ü vakalarını kapsayan bir test setiyle doğrulanır.
> - **Tarih ve para:**
>   - Zaman damgaları veritabanında UTC olarak saklanır ve `Europe/Istanbul` saat diliminde gösterilir.
>   - Tarih biçimi `GG.AA.YYYY`.
>   - Para birimi `Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' })` ile biçimlendirilir. Fiyat gösterilen her yerde para birimi ve kaynak birlikte saklanır.
