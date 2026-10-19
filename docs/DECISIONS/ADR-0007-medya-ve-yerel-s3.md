# ADR-0007: Medya depolama ve yerel S3
- Durum: Kabul edildi · Tarih: 2026-10-19 · İlgili: REQ-VER-014, REQ-GUV-008, Ek A14.6

## Bağlam
v2 yerel S3 uyumlu depolama ister. `minio/minio` imajı bu ortamda çekilemedi ("pull access denied").

## Karar
Yerelde **SeaweedFS** (`chrislusf/seaweedfs`, Apache-2.0) S3 ağ geçidiyle (8333). Uygulama yalnızca S3 API'si kullanır (AWS SDK v3 S3 istemcisi — Faz 1'de lisans kontrolüyle eklenir); üretim sağlayıcısı X-002 kararına bağlı. Yükleme imzalı URL ile; görseller yeniden kodlanır, EXIF/GPS silinir, AVIF/WebP varyantları ve blurhash üretilir (görsel işleme kütüphanesi Faz 1'de; `sharp` lisans durumu Q-003).

## Sonuçlar
Sağlayıcıdan bağımsız. Geri alma: Düşük.
