# Runbook: Kampanya acil durdurma (REQ-OPS-009, REQ-SPN-005) — TASLAK

**Tetikleyici:** yanlış/etiketsiz yerleşim, hukuki şikâyet, sponsorla ilgili itibar riski, ölçüm hatası.

## Tüm sponsorlu yerleşimleri kapat
1. Panel › **İşletim anahtarları** → "Tüm sponsorlu yerleşimleri kapat" → gerekçe → Kaydet.
   API örneklerinde en fazla 5 sn, sayfa önbelleklerinde en fazla 60 sn içinde hiçbir yüzeyde sponsorlu öğe kalmaz
   (`sponsored` dizisi boş; organik sonuçlar etkilenmez — AK-04).
2. Doğrula: arama, hub, ana sayfa ve listeleme detayında "Sponsorlu" etiketli öğe yok.

## Tek kampanya ya da yuva
- Panel › Kampanyalar › ilgili kampanya → "Duraklat"; ya da Panel › Sponsorlu yuvalar → yuvayı kapat (denetim kayıtlı).

## Sonra
- Sponsora bilgi (C sınıfı ileti — İnsan), rapor dönemine not, kök neden; anahtar yeniden açılmadan önce düzeltme doğrulanır.
