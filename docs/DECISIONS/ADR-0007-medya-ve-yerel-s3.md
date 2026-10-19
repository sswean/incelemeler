# ADR-0007: Medya depolama ve yerel S3
- Durum: Kabul edildi · Tarih: 2026-10-19 · İlgili: REQ-VER-014, REQ-GUV-008, Ek A14.6

## Bağlam
v2 yerel S3 uyumlu depolama ister. `minio/minio` imajı bu ortamda çekilemedi ("pull access denied").

## Karar
Yerelde **SeaweedFS** (`chrislusf/seaweedfs`, Apache-2.0) S3 ağ geçidiyle (8333). Uygulama yalnızca S3 API'si kullanır (AWS SDK v3 S3 istemcisi — Faz 1'de lisans kontrolüyle eklenir); üretim sağlayıcısı X-002 kararına bağlı. Yükleme imzalı URL ile; görseller yeniden kodlanır, EXIF/GPS silinir, AVIF/WebP varyantları ve blurhash üretilir (görsel işleme kütüphanesi Faz 1'de; `sharp` lisans durumu Q-003).

## Sonuçlar
Sağlayıcıdan bağımsız. Geri alma: Düşük.

## Uygulama notları (Faz 1 dilim 3c)
- S3 istemcisi: `@aws-sdk/client-s3` (Apache-2.0). Yerel SeaweedFS kimlik doğrulamasız çalışır (yalnız geliştirme); kova yerel/testte ilk yazımda oluşturulur, üretimde önceden hazırlanır.
- `sharp` doğrudan bağımlılık olarak **eklenmedi** (libvips LGPL — Q-003, C sınıfı). Hat saf JS ve izin listesindeki lisanslarla: tür tespiti sihirli baytlarla; meta veri silme (JPEG APP1/APP13/COM, PNG eXIf/tEXt/zTXt/iTXt/tIME, WebP EXIF/XMP + VP8X bayrakları) kendi kodumuz; boyut `image-size` (MIT); blurhash `jpeg-js` (BSD-3) + `pngjs` (MIT) + `blurhash` (MIT). WebP için blurhash üretilmez.
- Boyut/biçim varyantları (AVIF/WebP, `srcset`) teslimde Next.js görüntü iyileştiricisiyle üretilecek (D4); özgün dosya meta verisi silinmiş hâliyle saklanır.
- Sıkıştırma bombası koruması: ≤ 10 MB, kenar ≤ 12 000 px, ≤ 50 MP (çözümlemeden önce başlıktan).
- Kötü amaçlı içerik taraması yapılmıyor (X-010); HEIC desteklenmiyor (libheif LGPL).
