# Mikro metin rehberi (REQ-YRL-005)

Arayüz metinleri yalnızca `packages/i18n/src/tr.ts` içinde tutulur; bu rehber o katalog için yazım kurallarıdır.
Hitap kararı: A-004 (B sınıfı, ADR ile değiştirilebilir). Terimler: `docs/GLOSSARY.md`.

## Hitap ve ton
- **"Sen" dili**, sıcak ama abartısız: "Değerlendirme yaz", "Aradığın sayfa artık yayında değil."
- "Siz" çekimi (-iniz/-ınız/-unuz/-ünüz) kullanılmaz — `tr.test.ts` denetler.
- Ünlem ve büyük harfle vurgu yok; emoji yok.

## Düğmeler ve bağlantılar
- Eylem odaklı fiil + nesne: "Kaydet", "Filtreleri uygula", "Verilerimi indir". "Tamam", "Gönder" tek başına yalnızca bağlam açıksa.
- Dış siteye giden bağlantı nereye gittiğini söyler: "{Sağlayıcı}'da fiyatları gör". Rezervasyonun tamamlandığı iddia edilmez (REQ-ENT-014).
- Ret ve onay seçenekleri eşit ağırlıkta ve tarafsız: "Tümünü reddet" / "Tümünü kabul et".

## Hata ve boş durumlar
- Suçlamayan, çözüm gösteren dil: "Bu alan zorunlu" değil "E-posta adresini yaz"; "Hatalı giriş" değil "E-posta ya da parola eşleşmedi."
- Teknik ayrıntı gösterilmez; destek için "Destek kodu" (traceId) verilir.
- Boş durum ne olduğunu ve sonraki adımı söyler: "Henüz değerlendirme yok · İlk değerlendirmeyi sen yaz".

## Yasak örüntüler (REQ-YRL-006, AK-15)
- Sahte aciliyet ve kıtlık: "Acele et", "Tükeniyor", "Son 2 oda", "Şu an 12 kişi bakıyor" — gerçek ve doğrulanmış veri olmadan asla.
- Utandırıcı ret: "Hayır, tasarruf etmek istemiyorum" gibi metinler.
- Önceden işaretli onay kutusu, gizli abonelikten çıkma, eşit olmayan çerez düğmeleri, içerik görmek için zorunlu giriş.
- `tr.test.ts` bu kalıpları katalogda arar; yeni kalıp eklemek serbesttir, çıkarmak AK-11 kapsamındadır.

## Terimler (sözlükten)
- "Değerlendirme" (kullanıcı) ile "İnceleme" (editör) karıştırılmaz; puanlar ayrı etiketlenir ("Kullanıcılar", "Editör").
- "Sponsorlu", "Ortaklık bağlantısı", "Reklam" etiketleri sözlükteki biçimiyle, kısaltmadan kullanılır (REQ-SPN-003).
- "Turist rehberi" (kişi) ile "Rehber" (içerik türü) ayrıdır.

## Biçim
- Sayı ve tarih yalnızca `@incelemeler/utils` biçimleyicileriyle (ondalık virgül: 4,3; "19 Ekim 2026").
- Büyük/küçük harf dönüşümü yalnızca `lowerTr`/`upperTr` ile (İ/ı).
