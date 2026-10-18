# İncelemeler.com.tr — Master Prompt

Bu klasör, incelemeler.com.tr platformunu (web, özel yönetim paneli, API, iOS/Android uygulaması) geliştirecek otonom yapay zekâ kodlama ajanına verilecek talimatı içerir.

| Dosya | Ne işe yarar |
|---|---|
| [`INCELEMELER-MASTER-PROMPT-v2.md`](INCELEMELER-MASTER-PROMPT-v2.md) | **Ajana verilecek tek dosya.** `v2/` parçalarından `build.sh` ile üretilir; doğrudan düzenleme. |
| [`v2/`](v2/) | v2'nin kaynak parçaları: `00–03` çekirdek (§0–§14), `10–14` Ek A gereksinimler, `20–23` Ek B–E. |
| [`build.sh`](build.sh) | Parçaları birleştirir: `./prompts/build.sh` |
| [`arsiv/v1-orijinal.md`](arsiv/v1-orijinal.md) | Kullanıcının ilk promptu (v1). |
| [`arastirma-notlari/`](arastirma-notlari/) | v2 hazırlanırken yapılan uzman analizlerinin ham notları ve kaynak URL'leri (talimat değildir). |

## v2'de neler değişti (özet)

v1'in vizyonu, kategori listesi, sayfa ve modül listeleri, sponsorluk/affiliate kuralları ve güven ilkeleri **tamamen korundu**. Ek E2'deki tabloda her v1 bölümünün v2'deki karşılığı yer alıyor. Bunların üzerine eklenenler:

- **Ajanın uzun süre güvenilir çalışması için işletim çerçevesi**
  - 15 pazarlıksız altın kural.
  - Normatif dil (ZORUNLU / YASAK / OLMALI…) ve kurallar çatıştığında hangisinin geçerli olacağını belirleyen öncelik sırası.
  - Terim sözlüğü.
  - İlk yanıt sözleşmesi ve oturum protokolü.
  - Kalıcı hafıza dosyaları.
  - Durma koşulları (ajan neyi tek başına yapar, neyi sana sorar).
  - Kanıt ve test bütünlüğü kuralları, rapor şablonları.
- **v1'deki 15 çelişkinin çözümü**, ayrıca faz × kapsam matrisi, Faz 0, pilot dikeyler ve İnsan onaylı faz kapıları.
- **~280 REQ kimlikli, ölçülebilir gereksinim** ve **27 uçtan uca test senaryosu** (v1'de 8 senaryo vardı).
- **Türkiye'ye özgü katman**
  - KVKK ve çerez onayı altyapısı, ticari ileti kuralları.
  - Lisans gerektiren sektörler için "hukuki kapı"lar: konaklama belgesi, turist rehberi ruhsatı, tur satışı.
  - Türkçe arama normalizasyonu, slug kuralları, ek uyumu ve biçim kuralları.
  - 24 maddelik hukuki inceleme listesi.
- **Tasarım düzeltmesi.** v1'deki turuncu vurgu rengi `#FF8A45` beyaz üzerinde 2,34:1 kontrast veriyor, kenarlık rengi `#E7E9EE` ise 1,21:1. İkisi de WCAG'ı geçmiyor. v2'de erişilebilir bir token tablosu ve "Sponsorlu" etiket rengi tanımlandı.

## Nasıl kullanılır?

1. `INCELEMELER-MASTER-PROMPT-v2.md` dosyasının tamamını ajana ilk mesaj olarak ver. Claude Code gibi bir ajansa dosyayı depoya koyup "Bu dosyadaki talimatları uygula" demen de yeterli.
2. Ajan §9.1'e göre önce kısa bir ilk yanıt yazar: ortam keşfi, varsayımlar, en fazla 7 soru ve varsayılanları. Ardından beklemeden Faz 0'a başlar.
3. Faz 0 raporunda sana sunulan **B sınıfı varsayılanları** gözden geçir: pilot dikeyler, lansman şehirleri, puan ölçekleri, hitap, yayın eşikleri. İtirazın yoksa ajan devam eder.
4. Her faz sonunda ajan **durur** ve faz raporu sunar. Yazılı onay vermeden sonraki faza geçmez.
5. Sana ait işler `docs/EXTERNAL-DEPENDENCIES.md` (hesaplar, API anahtarları, sözleşmeler) ve `docs/LEGAL-REVIEW.md` (hukukçu onayları) dosyalarında birikir.

## Önemli uyarılar

- **Hukuki içerik.** Ek D1'deki mevzuat atıfları, özellikle 2024–2026 değişikliklerine ilişkin olanlar, ikincil kaynaklardan derlendi ve **resmî kaynaktan doğrulanmadı**. Ajana bunları doğrulaması, doğrulayamazsa en kısıtlayıcı yorumu uygulaması talimatı verildi. Yayına çıkmadan önce bir hukukçuya mutlaka danış.
- **Promptun kendisi.** Prompt ajanın hukuki metinleri yalnızca "TASLAK" olarak üretmesini, para, hesap açma, yayına çıkış ve mağaza gönderimi gibi işlemleri ise yalnızca senin onayınla yapmasını şart koşuyor.
- **Prompt üzerinde değişiklik.** Değişiklikleri `v2/` parçalarında yap, sonra `./prompts/build.sh` çalıştır ve §0.4'e göre sürüm numarasını artır.
