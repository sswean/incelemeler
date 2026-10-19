# ADR-0004: İçerik çekirdeği ve veri modeli
- Durum: Kabul edildi · Tarih: 2026-10-19 · İlgili: Ç-11, Ek A2, REQ-VER-001…025

## Bağlam
v1 hem "kategori kod yazmadan eklenir" hem de dikeye özel tablolar istiyordu.

## Karar
**Kategori = veri, tür (kind) = kod.** Hibrit model: `listings` ortak tablo (Faz 0'da kuruldu) + 1:1 tür uzantı tabloları (Faz 1: `listing_place`, `listing_lodging`, `listing_product` …) + `attributes JSONB` (kategoriye bağlı, sürümlü `attribute_definitions` şemasına karşı uygulama katmanında zod ile doğrulanır). Saf EAV yok. Editör puanı (`editorial_verdicts`) ve kullanıcı puanı (`user_reviews` → `rating_stats`) ayrı tablolardır ve hiçbir sorguda birleştirilmez. Kimlikler UUIDv7 (`uuid(7)`), zaman damgaları `timestamptz`, para tamsayı kuruş. Tüm ilişkiler FK'li; varsayılan `ON DELETE RESTRICT`. `audit_log` tetikleyiciyle değiştirilemez. Prisma'nın ifade edemediği kısıtlar (CHECK, PostGIS, tetikleyici, `tsvector`) ham SQL migration'larıyla.

## Değerlendirilen seçenekler
- Tablo-başına-tür: yeni kategori/tür ekleme maliyeti → reddedildi.
- Saf EAV: sorgu ve tip güvenliği zayıf → reddedildi.

## Sonuçlar
Olumlu: kod değiştirmeden kategori; tip güvenli ortak alanlar. Olumsuz: JSONB filtreleri için facet projeksiyonu gerekebilir (Faz 1). Geri alma: Yüksek.
