# Manuel QA senaryoları (MANUAL-QA)

Biçim: Ek C-9. Ortamda doğrulanamayan kontroller; durum İnsan sonucu girdiğinde TAMAM olur (§12.7).

## MQA-001: GitHub Actions CI iş akışının gerçek çalıştırıcıda yeşil olması (X-031)
- Ön koşullar: Depoda GitHub Actions etkin; `main` dal koruması ayarlı.
- Adımlar: 1) Bir PR açın. 2) `ci` iş akışının tüm adımlarının çalıştığını izleyin.
- Beklenen sonuç: Tüm adımlar yeşil; aynı commit için `pnpm ci:local` sonucu ile tutarlı.
- Sonuç: __ · Tarih: __ · Test eden: __

## MQA-002: Staging/üretim ortamlarının ayrılması (REQ-OPS-001)
- Ön koşullar: X-002 barındırma kararı verilmiş.
- Adımlar: Staging ve üretim için ayrı veritabanı, depolama ve sırların oluşturulduğunu doğrulayın; staging'in `noindex` ve temel kimlik doğrulamalı olduğunu kontrol edin.
- Beklenen sonuç: Ortamlar arası paylaşılan sır/veri yok.
- Sonuç: __ · Tarih: __ · Test eden: __

## MQA-003: İdari bölge listesinin resmî kaynakla karşılaştırılması (ADR-0011, REQ-VER-009)
- Ön koşullar: `pnpm run setup` tamam.
- Adımlar: `GET /v1/admin-areas?level=PROVINCE` (81 il, plaka kodları) ve lansman illerinin ilçelerini (`?parentId=`) İçişleri Bakanlığı/TÜİK güncel idari bölünme listesiyle karşılaştırın.
- Beklenen sonuç: Ad, yazım (ör. Hakkâri, Eyüpsultan) ve sayılar (İstanbul 39, İzmir 30, Antalya 19, Muğla 13, Nevşehir 8) birebir aynı.
- Sonuç: __ · Tarih: __ · Test eden: __
