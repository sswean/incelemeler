# ADR-0013: Sponsorlu yerleşim — ayrı dizi, organik ölçütle alaka, bağlamsal sunum
- Durum: Kabul edildi · Tarih: 2026-10-19 · İlgili: REQ-SPN-001…013, REQ-ARA-009, REQ-GUN-004, AK-04, AK-05, ADR-0009

## Bağlam
Sponsorlu yerleşim organik sıralamayı, puanları ve moderasyonu etkilememeli (AK-04); her yerleşim etiketli olmalı
(AK-05); A8.3 sınırları panelden aşılamamalı; kampanya bitince ≤ 60 sn içinde hiçbir yüzeyde görünmemeli.

## Karar
- **Model:** `placement_slots` (render noktası kodda sabit, kataloğu panelde), `campaigns`, `campaign_placements`
  (yuva + öne çıkarılan listeleme + isteğe bağlı hedef kategori/il), `creatives` (editoryal onaylı kısa başlık),
  `sponsored_events` (SERVED/VIEWED/CLICK; ham IP yok, günlük tuzlu oturum karması; bot/önceden getirme/demo işaretli,
  `counted` CHECK ile korunur).
- **Sınırlar:** `SURFACE_CAPS` + `slotRuleErrors` (contracts) panel, API ve sunumda aynı kural; veritabanı CHECK
  yüzey başına üst sınırı ayrıca zorlar. Yalnızca düşürülebilir.
- **Ayrı dizi:** arama ve hub yanıtında `sponsored: [{ position, item, clickHref, impressionToken }]`; organik
  `data`/`listings` sponsorlu hesaplamadan önce ve ondan bağımsız üretilir. Kart DTO'sunda `commercial` zorunlu
  (`NONE | SPONSORED`); web kartı `NONE` dışında etiketi kendisi basar.
- **Alaka:** aday yerleşimler, organik sorgunun **son** ölçütleriyle (metin, il/ilçe, kategori, filtre) yalnızca aday
  belgeler içinde (`SearchCriteria.refIds`) yeniden sorgulanır; eşleşmeyen aday düşer. Benzerlik (trigram) geri
  dönüşü sponsorlu için kullanılmaz.
- **Rotasyon:** öncelik, sonra ağırlıklı rastgele anahtar (Efraimidis–Spirakis), istek başına tohum, aynı kampanya ya
  da listeleme tek kez. Sayfa sponsorlu öğeyle bitmez (pozisyondan sonra en az bir organik öğe).
- **Yayın penceresi:** sunum `status ∈ {SCHEDULED, LIVE}` **ve** `startsAt ≤ now < endsAt` koşuluna bakar; worker
  (15 sn) durumu raporlama için LIVE/COMPLETED'a çevirir. Hub sayfaları ISR yerine dinamik render (ADR-0009'un hub
  kısmını değiştirir); listeleme detayındaki rakip kutu istemcide yüklenir (sayfa ISR'de kalır).
- **Ölçüm:** görüntülenme istemcide IntersectionObserver (≥ %50, ≥ 1 sn) ile imzalı belirteçle; tıklama `/git/s/{id}`
  üzerinden. `navigator.webdriver` olan istemci bot sayılır. Rapor yalnızca `counted` olayları kullanır; dönüşüm
  verisi yoksa `conversions: null` ("Dönüşüm verisi yok").
- **Onay:** satış onayı (`campaigns.manage`) ve editoryal onay (`content.publish`) farklı kişilerden; kreatifler
  karara bağlanmadan editoryal onay verilmez; tutar yalnızca `campaigns.amount`.
- **REQ-GUN-004:** sponsor bağlantılı listelemenin (yerleşimi olan ya da kuruluşu sponsor olan) değerlendirmesini
  kaldırma `review_removal_requests` ile ikinci, farklı moderatörün onayına gider; içerik o zamana kadar yayında kalır.

## Değerlendirilen seçenekler
Sponsorlu öğeyi organik diziye karıştırmak (REQ-SPN-002 ile çelişir); hub'ları ISR'de tutup sponsorlu kısmı istemcide
eklemek (organik listenin ortasına istemci adası yerleştirmek karmaşık ve kırılgan); olay güdümlü ISR geçersiz
kılma (outbox → web) — henüz yok, D13'te yeniden değerlendirilir.

## Sonuçlar
Olumlu: organik değişmezlik testle kanıtlı (REQ-ARA-009); sınırlar üç katmanda. Olumsuz: hub sayfaları her istekte
render (performans bütçesi D13'te ölçülecek); "Sunulan" olayı sunucu tarafında UA bilmeden kaydedilir (bilgi amaçlı;
rapor görüntülenen gösterimi esas alır). Geri alma: Orta.
