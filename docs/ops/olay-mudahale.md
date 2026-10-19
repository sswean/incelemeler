# Runbook: Olay müdahalesi — TASLAK

## Önem düzeyleri
| Düzey | Örnek | İlk yanıt |
|---|---|---|
| P0 | Site/API erişilemez, veri bütünlüğü riski, güvenlik ihlali | Hemen; olay sorumlusu atanır |
| P1 | Kritik akış bozuk (giriş, arama, değerlendirme, /git/) | 1 saat |
| P2 | Kısmi bozulma, yavaşlık | İş günü |

## İlk 15 dakika
1. Olay kaydı aç (zaman, belirti, etki, sorumlu). İz kimliği (`traceId`, "Destek kodu") ile JSON loglarda ara
   (`security.*` olayları ayrı türdür — REQ-GUV-014).
2. Etkiyi sınırla: panel › İşletim anahtarları — bakım modu, değerlendirme/kayıt kapatma, sponsorlu kapatma,
   dış entegrasyonları durdurma (gerekçe yazılır, denetim kaydına girer).
3. Son dağıtımla ilişkiliyse [geri-alma.md](geri-alma.md).
4. Kişisel veri etkileniyorsa [veri-ihlali.md](veri-ihlali.md) — süre sayacı başlar.

## Kapanış
- Kök neden, düzeltme, önleyici eylem (test/izleme), `docs/LESSONS.md` kaydı; anahtarlar eski hâline getirilir.
