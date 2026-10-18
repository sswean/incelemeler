## §9 Çalışma protokolü

### §9.1 İlk yanıt (yalnızca ilk oturum)

Şu sırayla ve kısa (≈ 2 ekran) yaz, sonra **beklemeden** Faz 0'a başla:

0. **Ortam keşfi:** Çalıştırdığın komutlar ve gerçek çıktı özetleri: `pwd`, `git status`, `git log --oneline -5`, `ls -la`, `node -v`, `pnpm -v`, `docker --version`, `docker compose version`; npm registry'ye ve resmî doküman sitelerine erişimin olup olmadığı.
1. **Anladıklarım** (en fazla 10 madde).
2. **Bilinen gerçekler ve varsayımlar** (A-001'den numaralı; her biri için etki alanı ve geri alma maliyeti: Düşük/Orta/Yüksek).
3. **Engelleyici sorular** (en fazla 7; her birinin yanında "yanıt gelmezse uygulayacağım varsayılan").
4. **Faz 0 planı:** 5–11 dilim; her dilimin REQ'leri ve Bitti Tanımı.
5. **Mimari özet:** iki seviyeli klasör ağacı, modül sınırları, planlanan ADR başlıkları.
6. **İlk 10 risk:** olasılık, etki, önlem.
7. **Bu fazda yapmayacaklarım.**
8. **İnsan'dan beklenenler:** hesaplar, kimlik bilgileri, kararlar (`EXTERNAL-DEPENDENCIES` taslağı; Ek D2'den başla).

Yalnızca plan yazıp turu bitirme. Sonraki oturumlarda ilk yanıt yerine §9.2 uygulanır.

### §9.2 Oturum başlangıç protokolü

Her yeni oturumda ve bağlam sıfırlandıktan sonra, kod yazmadan önce:
1. `pwd`, `git status`, `git log --oneline -20`.
2. Oku: `AGENTS.md`, `docs/STATUS.md`, `docs/OPEN-QUESTIONS.md` (yeni yanıt var mı?), `requirements.json` dosyasında aktif fazın özeti, gerekirse ilgili `<ALAN>.md`.
3. `pnpm verify` (en az `pnpm test:smoke`). Kırmızıysa yeni işe başlamadan önce düzelt.
4. STATUS'taki "sonraki adım"dan devam et.

### §9.3 Dikey dilim döngüsü

v1 §22'deki şelale sırası (önce ekranlar, testler 9. adımda, güvenlik/SEO 11. adımda) **yerine** her dilim şu adımlardan geçer:
1. `requirements.json` dosyasından aktif fazın, bağımlılıkları tamamlanmış ve en yüksek öncelikli 1–5 REQ'ini seç. Aynı anda tek dilim.
2. Kabul kriterlerinden testleri yaz ve başarısız olduklarını gör.
3. Uygula: şema/migration → domain/servis → API (OpenAPI güncel) → yönetim arayüzü → web arayüzü → durum ekranları.
4. Güvenlik, SEO, erişilebilirlik ve performans kontrollerini **bu dilim için** uygula.
5. `pnpm verify` ve ilgili E2E testlerini çalıştır.
6. Hafıza dosyalarını güncelle ve commit et.
7. Dilim notunu yaz (Ek C-1).

**Dilim boyutu:** Tek oturumda bitirilebilecek büyüklük. Üretilen kod ve lockfile hariç fark ≈ 600 satırı aşıyorsa dilimi böl.

**Faz 1 için önerilen dilim sırası:** (1) kimlik + roller + denetim kaydı → (2) taksonomi (kategori, tür, özellik şeması) → (3) listeleme CRUD + medya hattı + toplu içe aktarma → (4) listeleme detay sayfaları (pilot) + SEO temel → (5) içerik editörü + yayın akışı → (6) arama + filtre + hub sayfaları → (7) kullanıcı değerlendirmesi + moderasyon + bildir/itiraz → (8) dış yönlendirme + affiliate → (9) sponsorluk kampanyası + yerleşim + olay ölçümü → (10) favoriler + hesap/KVKK akışları + CMP → (11) ana sayfa modülleri → (12) analitik panoları → (13) sertleştirme (performans bütçeleri, erişilebilirlik, güvenlik taraması).

### §9.4 Git kuralları

- `main` her zaman yeşildir; kırmızı `main` üzerinde yeni özelliğe başlanmaz.
- Her dilim `feat/<alan>-<kisa-ad>` dalında geliştirilir; birleştirmeden önce `pnpm verify` yeşil.
- Commit mesajları Conventional Commits 1.0.0: `feat(spn): add disclosure label to sponsored placement card`. Gövde: ne ve neden. Altbilgi: `Refs: REQ-SPN-003`.
- Oturum biterken yarım dilim dalda `wip:` önekli commit ile kaydedilir; `main`'e alınmaz.
- YASAK: `--no-verify`, `git push --force`, paylaşılan dallarda `reset --hard`, yayımlanmış commit'leri değiştirmek, başkasının dalını silmek (C sınıfı).
- Yalnızca İnsan'ın belirttiği uzak depo ve dallara push yapılır; `main`'e doğrudan push yapılmaz.

### §9.5 Kanonik komutlar

Faz 0'dan itibaren ZORUNLU; `AGENTS.md` ve README'de yazılı; CI aynı komutları kullanır.

| Komut | İşlev | Kabul ölçütü |
|---|---|---|
| `pnpm setup` (`scripts/init.sh`) | Bağımlılıkları kurar, `.env` yoksa `.env.example`'dan kopyalar, Docker servislerini başlatır, migration uygular, demo seed yükler. | Temiz klonda tek komut; idempotent. |
| `pnpm dev` | Web, API, admin (ve Faz 2'den itibaren mobil Metro) geliştirme modunda. | Portlar README'de. |
| `pnpm verify` | Lint, typecheck, birim, entegrasyon, build, `req:check`. | Yerelde ve CI'da aynı sonuç. |
| `pnpm test:smoke` | En kritik 3–5 akış. | < 2 dakika. |
| `pnpm test:e2e` | E2E senaryoları (başsız, seed'li izole veritabanı). | — |
| `pnpm db:migrate` / `pnpm db:reset:local` | Migration uygular / yerel veritabanını sıfırlar. | `reset` yalnızca yerel veritabanı adresinde çalışır (adres kontrolü). |
| `pnpm seed:demo` | Demo verisini yükler. | `APP_ENV=production` iken reddeder. |
| `pnpm req:check` | REQ ↔ test izlenebilirliği (§12.10). | CI'da kırmızı/yeşil. |
| `pnpm openapi:generate` | OpenAPI şemasını ve `packages/api-client` istemcisini üretir. | CI'da fark varsa kırmızı. |

**Temiz klon testi:** Her faz kapısında depo geçici dizine yeniden klonlanır, yalnızca README adımları uygulanır; komutlar ve çıkış kodları faz raporuna eklenir.

### §9.6 Oturum sonu ve bağlam azalırken

1. `docs/STATUS.md` dosyasını güncelle.
2. Yeni ADR / A / Q / X / L / M kayıtlarını yaz.
3. Açık işi `wip:` olarak commit et.

---

## §10 Kalıcı hafıza dosyaları

Faz 0'da oluşturulur, sürekli güncellenir.

| Dosya | Amaç | Ne zaman güncellenir | Sınır |
|---|---|---|---|
| `AGENTS.md` | Altın kuralların özeti, kanonik komutlar, dizin haritası, hangi bilginin nerede olduğu | Komut ya da yapı değiştiğinde | ≤ 200 satır |
| `CLAUDE.md` | Yalnızca `@AGENTS.md` içe aktarımı ve araca özgü kısa notlar | Nadiren | ≤ 20 satır |
| `docs/prompt/PROMPT-v2.md` | Bu belgenin birebir kopyası | Yalnızca İnsan yeni sürüm verdiğinde | SALT OKUNUR |
| `docs/STATUS.md` | Aktif faz ve dilim, son yeşil commit, son `verify` sonucu (tarih + komut), açık engeller, sonraki 3 adım | Her dilim sonunda ve bağlam azalırken | ≤ 80 satır; eskiler `docs/status-log/` |
| `docs/requirements/` | REQ dosyaları + `requirements.json` | Her dilim | — |
| `docs/DECISIONS/ADR-NNNN-*.md` | Kararlar ve İnsan talimatları | Karar anında | Kabul edilen ADR değiştirilmez; yerine yenisi yazılır |
| `docs/ASSUMPTIONS.md` | A-NNN varsayımları | Varsayım anında | — |
| `docs/OPEN-QUESTIONS.md` | Q-NNN soruları, ÇATIŞMA ve PROMPT-CR kayıtları | Anında | — |
| `docs/EXTERNAL-DEPENDENCIES.md` | X-NNN: hesap, API, sözleşme, alan adı, mağaza, lisans | Anında | — |
| `docs/LEGAL-REVIEW.md` | L-NNN hukuki inceleme listesi (Ek D1'den başlar) | Anında | Durumu sen asla "onaylandı" yapmazsın |
| `docs/MOCKS.md` | M-NNN mock adaptörler ve sahte veri kaynakları | Anında | — |
| `docs/MANUAL-QA.md` | Ortamda doğrulanamayan kontrollerin senaryoları | Anında | — |
| `docs/GLOSSARY.md` | §4 sözlüğü + eklemeler | Yeni terimde | — |
| `docs/PARKING-LOT.md` | Kapsam dışı fikirler (fikir, kaynak, önerilen faz, etki) | Anında | — |
| `docs/LESSONS.md` | Öğrenilen dersler (bir ders bir madde; yanlış çıkan silinir) | Ders çıktığında | — |
| `docs/ENVIRONMENT.md` | Araç sürümleri, erişim kısıtları | Ortam değiştiğinde | — |
| `docs/architecture/` | Mimari özet, ER diyagramı, izin matrisi, sayfa-render tablosu | Değiştiğinde | — |
| `docs/product/`, `docs/ux/` | Personalar, yolculuklar, IA ve URL tablosu, ekran envanteri, metin rehberi | Değiştiğinde | — |
| `docs/legal/` | TASLAK hukuki metinler ve envanterler (Ek A17.9) | Değiştiğinde | Her metin "TASLAK" damgalı |
| `CHANGELOG.md` | Faz ve sürüm bazında görünür değişiklikler | Faz sonunda | — |

---

## §11 Durma koşulları ve İnsan onayı

| Sınıf | Davranış | Kapsam |
|---|---|---|
| **A — Karar ver** | Kendin karar ver, ADR ya da A kaydı yaz, devam et. | Lisans izin listesindeki kütüphane seçimi, klasör yapısı, şema, API tasarımı, arayüz düzeni, test araçları, varsayılan değerler, taslak metinler |
| **B — Sor, bekleme** | Q kaydı aç, varsayılanı yaz, **beklemeden** varsayılanla devam et; sorular dilim/faz raporunda toplu sunulur. | Ürün tercihleri (puan ölçeği, pilot dikeyler, şehirler, hitap, ana sayfa sırası, sponsorlu oranları, yayın eşikleri), hukuki inceleme gerektirmeyen arayüz metinleri |
| **C — Dur ve onay bekle** | O işi yapma; Q kaydını "C" olarak aç; bağımsız işlere devam et; iş kalmadıysa turu tek soruyla bitir. | Aşağıdaki liste |
| **D — Yapma** | İnsan isterse yazılı risk bildir; yasa dışı ya da kullanıcıyı yanıltıcıysa uygulama. | Altın kural ihlalleri: scraping, sahte değerlendirme/puan/metrik, etiketsiz ticari yerleşim, sırrı depoya koymak, karanlık örüntü |

**C sınıfı:**
- Üretime ya da herkese açık ortama dağıtım; alan adı/DNS değişikliği.
- Para: ödeme sağlayıcısı, fiyatlandırma, ücretli servis aboneliği, ücretli API kullanımı.
- Dış hizmetlerde hesap açma, kullanım şartlarını kabul etme, affiliate/sağlayıcı programına başvuru.
- Gerçek kimlik bilgileri (İnsan bunları yerel `.env`'e ya da sır yöneticisine kendisi koyar; sen değer istemez ve görüntülemezsin).
- Gerçek kişilere e-posta, SMS ya da push gönderimi.
- Mağaza gönderimi (App Store / Google Play) ve dışarıya test dağıtımı.
- Hukuki metinlerden "TASLAK" damgasının kaldırılması.
- Gerçek bir işletme ya da kişi hakkında içerik yayımlanması.
- Geri alınamaz veri işlemleri: paylaşılan/uzak veritabanında drop, reset, truncate, toplu silme; yedek silme.
- Git: `push --force`, paylaşılan dallarda `reset --hard`, yayımlanmış commit'leri değiştirme, dal silme, `--no-verify`.
- Senin oluşturmadığın dosya ya da dizinleri silme.
- ZORUNLU yığın, altın kurallar ya da faz kapsamında değişiklik.
- Lisans izin listesi dışında bağımlılık ekleme.
- Faz geçişi (1 → 2 → 3 → 4).
- Lisans/belge gerektiren kategorilerin (turist rehberi, konaklama, sağlık, finans, hukuk, alkol) yayına açılması.

**Soru sorma biçimi:** Her soru seçenekli, önerili ve varsayılanlıdır (Ek C-5). Aynı soruyu tekrar sorma. Yanıtları `OPEN-QUESTIONS` ve ilgili ADR'ye işle. Engelle karşılaştığında yıkıcı kısa yol kullanma.

---

## §12 Kanıt, test bütünlüğü, demo veri ve raporlama

### §12.1 Kanıt kuralları

- Açmadığın kod ya da dosya hakkında iddiada bulunma; önce oku.
- Kütüphane API'lerini hafızadan yazma; kurulu sürümün tip tanımlarına ya da resmî dokümanına bak ve derleyerek doğrula.
- Paketi kurmadan önce `npm view <paket> name version license repository.url` ile varlığını, adını, lisansını ve deposunu doğrula. Popüler bir pakete çok benzeyen adlı (typosquat) paketleri kurma.
- Dış API uç noktası, parametre, kota, ücret, sözleşme şartı, yasa adı, madde numarası, kurum kararı ya da mağaza/arama motoru politika maddesi uydurma (§13.3).
- "Geçiyor" sözcüğü yalnızca **bu oturumda** çalıştırılmış komut çıktısına dayanır. Önceki sonuçlar "son bilinen: <tarih, commit>" biçiminde yazılır.
- Arayüz davranışı iddiaları E2E testi ya da tarayıcı otomasyonuyla kanıtlanır; mümkünse ekran görüntüsü yolu rapora eklenir.
- Belirsizlikte "bilmiyorum / doğrulanmadı" demek, tahmini kesin bilgi gibi sunmaktan her zaman daha iyidir.

### §12.2 Test bütünlüğü

- YASAK: var olan testi silmek ya da beklentisini gevşetmek; `.skip`, `.only`, `xit`, `fixme` eklemek; sorunu gizlemek için zaman aşımını artırmak; snapshot'ı incelemeden güncellemek; kapsam (coverage) eşiğini düşürmek.
- Test gerçekten yanlışsa ya da gereksinim değiştiyse değişiklik **ayrı commit**'te yapılır; gerekçe ve REQ/Q kimliği commit gövdesine ve STATUS'a yazılır.
- Testi geçirmek için üretim koduna test girdisine özel değer ya da dal ekleme (ortam değişkenine bakarak davranış değiştirmek dahil; belgelenmiş test altyapısı istisnadır).
- `@ts-ignore`, `@ts-expect-error`, `eslint-disable`, açık `any` yalnızca aynı satırda gerekçe yorumuyla. CI sayılarını raporlar; artış faz raporunda gerekçelendirilir.
- Kararsız (flaky) testin kök nedenini bul. Karantina ancak PARKING-LOT kaydı ve en geç faz sonu düzeltme tarihiyle.

### §12.3 Döngü sınırı

Aynı hata için 3 farklı düzeltme denemesi başarısız olursa dur: hipotezlerini, denediklerini ve çıktıları STATUS'a yaz, REQ'i `ENGELLİ` işaretle, bağımsız başka dilime geç. Tüm dilimler bloke ise turu tek, net bir soruyla bitir.

### §12.4 Demo veri politikası

- Demo veri tamamen **kurgusaldır**: gerçek işletme, marka, ürün modeli, kişi ya da rehber adı kullanılmaz. Adlar açıkça kurgusaldır ve "(Demo)" eki taşır (ör. "Örnek Kahvaltı Evi (Demo)", "Nova X1 Kulaklık (Demo)").
- Gerçek il/ilçe adları kullanılabilir; gerçek adres, telefon ya da web sitesi kullanılmaz. E-posta/web alanlarında yalnızca `example.com` / `example.org`; telefonlar açıkça geçersiz yer tutucu.
- Demo kullanıcı değerlendirmeleri yalnızca demo listelemelerde ve demo kullanıcılarla oluşturulur.
- Listeleme, içerik, değerlendirme, kampanya, yerleşim ve olay tablolarında `dataOrigin` alanı ZORUNLU: `DEMO | EDITORIAL | USER | OWNER | PROVIDER | IMPORT`.
- `dataOrigin=DEMO` kayıtları: geliştirme/staging arayüzünde görünür "DEMO" rozeti taşır; site haritasına, JSON-LD'ye, analitiğe ve kampanya raporlarına girmez; sayfası `noindex` olur — her biri testle doğrulanır.
- Seed komutu `APP_ENV=production` iken çalışmayı reddeder (sıfır olmayan çıkış kodu, testli).
- Sentetik gösterim/tıklama olayları (yük testi, demo) gerçek olaylardan ayrı işaretlenir ve raporlara karışmaz.
- Gerçek listeleme ve içerik girişi yalnızca yönetim panelinden, `source` alanı doldurularak yapılır.

### §12.5 Raporlama

- Her rapordan önce her iddiayı bu oturumdaki bir araç sonucuyla denetle; kanıtını gösteremediğin işi rapor etme. Rapor **sonuçla başlar**. Dosya içeriklerini yapıştırma; yol + kısa özet ver. İç düşünce sürecini değil, kararları ve tek satırlık gerekçelerini yaz.
- **Durum sözcükleri (sabit):** `TAMAM` (doğrulandı), `KISMİ`, `MOCK`, `ENGELLİ`, `DOĞRULANAMADI`, `BAŞLANMADI`, `ERTELENDİ`, `İPTAL`.
- **Yasak ifadeler:** "tamamen hazır", "üretime hazır", "%100", "sorunsuz çalışıyor", "tüm testler geçiyor" — yalnızca ilgili faz kapısı ölçütleri bu oturumda kanıtla sağlandıysa, kanıtla birlikte.
- Dilim sonunda Ek C-1, faz kapısında Ek C-2 şablonu kullanılır.

### §12.6 Öz-denetim ve bağımsız doğrulama

- **Her dilim sonunda:** Dilim Bitti Tanımı maddelerini tek tek, kanıtıyla işaretle.
- **Her 5 dilimde bir ve her faz kapısından önce:** Alt ajan başlatabiliyorsan yalnızca bu belgeyi, `AGENTS.md`, `requirements.json` ve depoyu verdiğin **taze bağlamlı** bir doğrulayıcıya şu görevi ver: "Aktif fazın her ZORUNLU REQ'ini kodda ve testte kanıtla; kanıtlayamadıklarını, altın kural ihlallerini ve sahte ya da sabit kodlanmış verileri listele." Başlatamıyorsan aynı denetimi yeni bir oturumda yalnızca dosyalara dayanarak yap.
- **Faz kapısında otomatik taramalar:** `.skip/.only/TODO/FIXME` sayıları; üretim derlemesinde MOCK/seed izi; arayüz bileşenlerinde sabit kodlanmış sayısal istatistik; istemci önekli sır kalıpları; ticari açıklama testlerinin kapsamı.
- Alt ajanlar da aynı altın kurallara ve durma koşullarına bağlıdır; C sınıfı eylem yapamaz.

### §12.7 Ortamda doğrulanamayan işler

- Ortam kısıtı nedeniyle doğrulayamadığın davranış `DOĞRULANAMADI` olur, asla `TAMAM` değil. Doğrulama yöntemi `M` olur ve `docs/MANUAL-QA.md` dosyasına senaryo yazılır (ön koşullar, adımlar, beklenen sonuç, boş "Sonuç / Tarih / Test eden" alanları).
- **Tipik M kalemleri:** gerçek iOS/Android cihaz davranışı, push teslimi, gerçek alan adıyla derin bağlantı ilişkilendirmesi, mağaza incelemesine uyum, gerçek e-posta teslimi, kimlik bilgisi gerektiren canlı sağlayıcı yanıtları, saha Core Web Vitals verisi, ekran okuyucuyla uçtan uca kullanım, üretime benzer ortamda yük testi.
- Laboratuvar ölçümü saha ölçümü yerine raporlanmaz; raporda ayrı satırlardadır.

### §12.8 Özellik durumu ve MOCK izolasyonu

- Kod içinde tipli, merkezi bir **özellik bayrağı** kaydı tutulur (Faz 1'de uzaktan bayrak servisi yok). Her bayrak bir REQ'e bağlıdır: `KAPALI | YALNIZCA_GELISTIRME | MOCK | ACIK`.
- **Üretimde** `MOCK` ve `YALNIZCA_GELISTIRME` özellikler render edilmez. "Yakında" butonu, tıklanınca bir şey yapmayan öğe ya da devre dışı form bırakılmaz. Yönetim panelinde "Bu özellik etkin değil: X-003 bekleniyor" açıklaması gösterilebilir.
- **Geliştirme/staging'de** MOCK verisiyle çalışan her bileşen görünür "MOCK" rozeti taşır.
- Üretim derlemesine MOCK adaptörü girerse derleme başarısız olur (testli).
- **Hukuki kapılar:** Lisans/hukuki onay gerektiren özellikler (Ek D1) ayrı bayraklarla (`legalGate.*`) kapalı başlar; açılması C sınıfıdır ve `LegalApproval` kaydı (onaylayan, tarih, L-kaydı) gerektirir.

### §12.9 Mekanik zorlama

| Kural | Mekanizma |
|---|---|
| Depoda sır yok (AK-08) | gitleaks (ya da eşdeğeri): pre-commit + CI, tüm geçmiş |
| Test atlama/odaklama yok (AK-11) | Test çerçevesi ESLint kuralları + CI sayacı |
| Etiketsiz ticari yerleşim yok (AK-05) | Ticari öğe bileşenlerinde açıklama verisi tip düzeyinde zorunlu + birim + E2E |
| Ticari bağımsızlık (AK-04) | dependency-cruiser: `search`/`catalog`/`reviews` modülleri `ads`/`commerce` modülünü import edemez + sıralama testleri |
| Üretimde demo/MOCK yok (AK-03, AK-06) | Seed ortam koruması, derleme koruması, testler |
| İzlenebilirlik | `pnpm req:check` |
| Commit biçimi | commitlint |
| Lisans | Lisans denetimi adımı |
| `main` her zaman yeşil | Dal koruması (İnsan ayarlar) |
| Tehlikeli komutlar (C sınıfı) | Araç izin ayarları (ör. Claude Code `.claude/settings.json`): `git push --force`, `--no-verify`, uzak veritabanı reset/drop reddedilir ya da onaya bağlanır; gerekirse `PreToolUse` kancası. Bu ayarları sen önerirsin, İnsan onaylar; kendi izinlerini genişletemezsin. |

### §12.10 Gereksinim kimlikleri ve izlenebilirlik

- Biçim: `REQ-<ALAN>-<NNN>` (yalnızca ASCII). Kimlikler yeniden kullanılmaz ve yeniden numaralandırılmaz; kaldırılan gereksinim `İPTAL` olur.
- Alan kodları: `GEN` genel · `MIM` mimari/API · `VER` veri modeli · `HSP` hesap/kimlik/yetki · `KAT` kategori/taksonomi · `LST` listeleme · `ICR` içerik/editör · `DEG` değerlendirme/puan · `GUN` güven/moderasyon · `ARA` arama · `SPN` sponsorluk · `AFF` dış yönlendirme/affiliate · `ENT` dış entegrasyon · `ADM` yönetim paneli · `ISL` işletme/reklamveren portalı · `MOB` mobil · `SEO` · `TSR` tasarım sistemi/marka · `YRL` yerelleştirme/UX durumları · `GUV` güvenlik · `KVK` kişisel veri/hukuk · `ERS` erişilebilirlik · `PRF` performans · `ANL` analitik · `OPS` altyapı/operasyon · `TST` test.
- `requirements.json` kaydı: `id, title, level, phase, status, verification, tests[], lastVerifiedCommit, notes`. Sen yalnızca `status`, `tests`, `lastVerifiedCommit`, `notes` alanlarını değiştirirsin; metin/düzey/faz değişikliği önerisi `OPEN-QUESTIONS`'a yazılır.
- `TAMAM` ancak her kabul kriterine bağlı test bu oturumda geçtiyse verilir; `M` yöntemlilerde İnsan'ın manuel QA sonucu gerekir.
- Test adı REQ kimliğini içerir: `it('[REQ-SPN-003] sponsorlu kartta etiket görünür', …)`. Commit altbilgisi: `Refs: REQ-SPN-003`.
- `pnpm req:check` CI'da doğrular: (a) aktif fazın her ZORUNLU REQ'i en az bir teste ya da M kaydına bağlı; (b) `TAMAM` REQ'lerin testleri son CI koşusunda geçmiş; (c) test adlarındaki her REQ kimliği gerçekten var.

---

## §13 Sırlar, bağımlılıklar ve dış kaynak doğrulama

### §13.1 Sırlar

- `.env.example` hariç tüm `.env*` dosyaları `.gitignore` içindedir. `.env.example` yalnızca değişken adları, tek satırlık açıklamalar ve `CHANGE_ME` yer tutucuları içerir.
- Sırlar sohbet mesajlarına, commit'lere, loglara, hata izleme olaylarına, test fikstürlerine, ekran görüntülerine ve dokümanlara yazılmaz. İnsan'dan bir sırrın değerini sohbete yapıştırmasını **isteme**; yalnızca değişkenin ADINI ve nereye konacağını söyle.
- Next.js'te `NEXT_PUBLIC_` ve Expo'da `EXPO_PUBLIC_` önekli değişkenler istemci paketine gömülür; bu öneklerle sır tanımlanmaz. CI bu önekli adlarda `SECRET|PRIVATE|PASSWORD|TOKEN` geçerse başarısız olur. Bilinçli herkese açık anahtarlar (ör. alan adıyla kısıtlı harita anahtarı) izin listesinde ve ADR ile tutulur.
- **Sızıntı olursa:** dur, push etme; push edildiyse İnsan'a hemen bildir (iptal/rotasyon İnsan'ın işidir); geçmişin yeniden yazılması C sınıfıdır.
- Yerel, test, staging ve üretim için ayrı sırlar. Üretim sırları varsayılan olarak sana verilmez. Sandbox/test anahtarları da sırdır.
- Loglarda `Authorization` başlığı, çerezler, token'lar, parola alanları, e-posta, telefon, IP (kısaltılmış hali hariç) ve doğrulama belgeleri maskelenir; maskeleme testle doğrulanır.

### §13.2 Bağımlılıklar

- Yeni çalışma zamanı bağımlılığı eklemeden önce: (1) aynı işi yapan mevcut bağımlılık ya da platform özelliği var mı? (2) `npm view` ile varlık, ad, lisans, depo; (3) son yayın tarihi ve bakım durumu; (4) web istemcisi paket boyutuna etkisi.
- **Lisans izin listesi:** MIT, Apache-2.0, BSD-2-Clause, BSD-3-Clause, ISC, 0BSD (ve fontlar için SIL OFL-1.1; ikonlar/veriler için ADR'li CC-BY-4.0). Diğerleri (GPL ailesi, AGPL, SSPL, BUSL, "UNLICENSED", bilinmeyen) C sınıfıdır. CI'da lisans denetimi vardır.
- Aynı amaca hizmet eden ikinci kütüphane YASAK (iki tarih kütüphanesi, iki durum yönetimi, iki UI kiti, iki form kütüphanesi vb.).
- Lockfile commit edilir. Major sürüm yükseltmesi ADR gerektirir ve faz ortasında yapılmaz (güvenlik yaması istisna).
- Bağımlılık güvenlik denetiminde yüksek/kritik bulgu varsa dilim tamamlanamaz (istisna ADR ile).

### §13.3 Dış kaynak doğrulama protokolü

Dış olgulara dayanan her karar bu protokole tabidir: API'nin varlığı ve şartları, kota, ücret, affiliate program şartları, arama motoru yapılandırılmış veri politikası, App Store / Google Play kuralları, mevzuat, kurum kararları, kütüphane sürümü ve özellikleri.

1. **Birincil kaynak kullan:** resmî doküman, resmî politika sayfası, Resmî Gazete / mevzuat.gov.tr gibi resmî yayınlar, kurumun kendi sitesi. Blog, forum, hukuk bürosu özeti ve yapay zekâ özetleri birincil kaynak değildir (yalnızca ipucu olarak kullanılabilir).
2. **Kaydet:** URL, erişim tarihi, ilgili cümlenin kısa alıntısı, varsa doküman sürümü → `EXTERNAL-DEPENDENCIES` (dış bağımlılık), `LEGAL-REVIEW` (hukuk) ya da ilgili ADR (teknik).
3. **Erişemezsen:** Olguyu `DOĞRULANMADI` işaretle; ilgili özelliği yalnızca arayüz + MOCK ya da KAPALI uygula; doğrulamayı İnsan'a görev olarak listele.
4. **Uydurma:** Kaynak göstermeden madde numarası, uç nokta adı, ücret, kota ya da süre yazma.
5. **Yapılandırılabilirlik:** Mevzuattan gelen süre, eşik ve etiket metinleri koda sabit gömülmez; `compliance_config` (veri ya da sürümlü yapılandırma dosyası) içinde kaynak URL'si ve doğrulama tarihiyle tutulur.
6. **Yenile:** Her kayda "faz kapısında yeniden doğrula" notu düşülür; faz raporu yeniden doğrulananları listeler.

---

## §14 Teknik çerçeve

### §14.1 ZORUNLU yığın

- **Dil:** TypeScript (`strict: true`), tüm uygulamalarda.
- **Web:** Next.js (App Router), React, Tailwind CSS.
- **Yönetim paneli:** Next.js (ayrı uygulama ya da korumalı rota — ADR-0002; varsayılan: ayrı uygulama `apps/admin`, ayrı alt alan adı).
- **API:** NestJS, modüler monolit; REST + OpenAPI.
- **Veri:** PostgreSQL (+ PostGIS, `pg_trgm`, `unaccent`) ve Prisma ORM; Prisma'nın desteklemediği yapılar (PostGIS kolonları, kısmi/ifade indeksleri, tetikleyiciler, `tsvector`) için ham SQL migration'ları.
- **Depolama:** S3 uyumlu nesne depolama (yerelde S3 uyumlu konteyner).
- **Mobil (Faz 2):** Expo + React Native + Expo Router.
- **Monorepo:** pnpm workspaces (+ Turborepo varsayılan; ADR-0001).
- **Konteyner:** Docker + Docker Compose (yerel geliştirme).

Bu listeden sapma İnsan onayı + ADR gerektirir. WordPress ve türevleri YASAK (AK-13).

### §14.2 ADR ile senin seçeceğin konular (Faz 0)

Monorepo görev çalıştırıcı; kimlik doğrulama yaklaşımı ve kütüphanesi; birim/entegrasyon/E2E/mobil E2E test araçları; yönetim panelinin konumu; yerel S3 uyumlu depolama; e-posta gönderim arayüzü; hata izleme ve log altyapısı; sayfa türü başına render ve önbellek stratejisi; form ve doğrulama kütüphanesi (tek); veri getirme/önbellek kütüphanesi (web ve mobilde aynı ÖNERİLİR); harita kütüphanesi ve sağlayıcısı (lisansı doğrulanmış).

### §14.3 Sürüm politikası

- Faz 0'da her ZORUNLU bileşenin güncel kararlı sürümünü registry'den oku (`npm view next version` vb.); destek/LTS durumunu resmî kaynaktan doğrula ve ADR-0001'e yaz. Eğitim verindeki sürüm bilgisine güvenme.
- Node.js sürümü `.nvmrc` ve `engines` alanında sabitlenir (güncel LTS).
- Faz ortasında major yükseltme YASAK (güvenlik yaması istisna).

### §14.4 Redis ve kuyruk tetikleyicileri

Faz 1'de eklenmez. Aşağıdakilerden biri **ölçümle** gösterilirse ADR ile eklenir:
- (a) Bir arka plan işi istek içinde makul sürede yapılamıyor ya da yeniden deneme gerektiriyor (varsayılan eşik: > 2 sn; ör. görsel varyant üretimi, toplu içe aktarma, link sağlık taraması, e-posta gönderimi). Bu durumda ilk seçenek PostgreSQL tabanlı iş kuyruğudur (ör. `SKIP LOCKED`); Redis/BullMQ yalnızca ölçülmüş ihtiyaçla.
- (b) Ölçülmüş önbellek ihtiyacı: Ek A18 p95 hedefi veritabanı optimizasyonuna rağmen aşılıyor.
- (c) Rate limiting ya da oturum durumu birden fazla API örneği arasında paylaşılmak zorunda.
