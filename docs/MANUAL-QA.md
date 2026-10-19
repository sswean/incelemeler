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

## MQA-004: Ekran okuyucuyla kritik akışlar (REQ-ERS-010, REQ-ERS-001)
- Ön koşullar: `pnpm run setup` + `pnpm seed:demo`; web 3000, panel 3001. Araçlar: macOS/iOS VoiceOver (Safari), Android TalkBack (Chrome), Windows NVDA (Firefox ya da Chrome).
- Adımlar (her ekran okuyucuda ayrı ayrı):
  1. Ana sayfa: "İçeriğe atla" bağlantısı ilk odakta okunur; başlık hiyerarşisi (tek h1) gezilebilir.
  2. Çerez bandı: üç düğme eşit ve anlaşılır okunur; "Tercihleri yönet" ile tercih merkezine gidilir.
  3. Arama: "Ne arıyorsun?" birleşik kutusunda öneriler ok tuşlarıyla duyurulur; sonuç sayısı ve filtre çipleri okunur.
  4. Listeleme detayı: puan özeti "5 üzerinden …, … değerlendirme" biçiminde okunur, yıldız simgeleri okunmaz; "Sponsorlu"/"Ortaklık bağlantısı" etiketleri bağlantı adıyla birlikte okunur.
  5. Kayıt: alan etiketleri, 18+ beyanı ve hata iletileri alanla ilişkili okunur.
  6. Değerlendirme yaz: puan radyo grubu ok tuşlarıyla seçilir, seçili değer duyurulur; gönderim sonucu canlı bölgeden okunur.
  7. Panel girişi + 2FA: alanlar ve hata iletileri okunur; kurtarma kodları listesi okunabilir.
- Beklenen sonuç: Her adım yalnızca klavye/ekran okuyucu hareketleriyle tamamlanır; içerik ve durum değişiklikleri duyurulur; anlamsız okuma (ör. "yıldız yıldız yıldız") yok.
- Sonuç: __ · Tarih: __ · Test eden: __ · Ekran okuyucu/sürüm: __

## MQA-005: Staging'de geri yükleme tatbikatı (REQ-OPS-005)
- Ön koşullar: Staging ortamı (X-002, Q-005), yönetilen veritabanı PITR açık.
- Adımlar: [docs/ops/veritabani-geri-yukleme.md](ops/veritabani-geri-yukleme.md) "Gerçek geri yükleme" adımlarını staging'de, yeni bir örneğe uygulayın; süreleri ölçün.
- Beklenen sonuç: Geri yüklenen örnekte migration durumu güncel, duman testleri yeşil; RPO ≤ 15 dk, RTO ≤ 4 saat.
- Sonuç: __ · Tarih: __ · Test eden: __ · Ölçülen RPO/RTO: __
