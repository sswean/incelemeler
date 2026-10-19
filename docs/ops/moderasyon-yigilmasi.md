# Runbook: Moderasyon kuyruğu yığılması (REQ-GUN-001…004) — TASLAK

**Tetikleyici:** panel genel panosunda bekleyen moderasyon sayısı hedefi aşar ya da sahte değerlendirme dalgası.

## Adımlar
1. Panel › Moderasyon: kuyruklar (incelemede, yayın sonrası, bildirimler, itirazlar, ikinci onay) yaşa ve risk puanına göre.
2. Saldırı/dalga şüphesi: Panel › İşletim anahtarları → "Değerlendirme gönderimini kapat" (gerekçeli; mevcut
   değerlendirmeler yayında kalır, yeni gönderim 503 alır).
3. Koordineli sahte değerlendirmeler: Panel › Yaptırımlar › "Olağan dışı değerlendirme etkinliği" — seçilen
   değerlendirmeler kaldırılır, ortalamadan çıkar, listelemede tarihli bildirim görünür; ilgili hesaplara basamaklı
   yaptırım (REQ-GUN-007).
4. Ek moderatör görevlendir (rol atama step-up gerektirir); moderatör kendi değerlendirmesini ve sponsor bağlantılı
   kaldırmayı tek başına sonuçlandıramaz.
5. Kuyruk normale dönünce gönderimi yeniden aç; olay kaydına süreler.
