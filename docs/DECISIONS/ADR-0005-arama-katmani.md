# ADR-0005: Arama katmanı soyutlaması
- Durum: Kabul edildi (uygulama Faz 1 dilim 6) · Tarih: 2026-10-19 · İlgili: Ek A7, REQ-ARA-001…006

## Karar
Uygulama kodu yalnızca `SearchEngine` arayüzünü görür (`upsert`, `delete`, `query`, `suggest`). İlk uygulama PostgreSQL: `search_documents` okuma modeli (outbox ile güncellenir), `tsvector` (özel yapılandırma: `turkish` + IMMUTABLE `unaccent` sarmalayıcısı; ağırlıklar A–D), `pg_trgm` bulanık eşleşme, uygulama ve SQL'de birebir aynı `normalizeTr` kuralları (Faz 0'da `packages/utils` içinde testli). Doğal dil sorguları yapay zekâ olmadan gazetteer + niyet/özellik eşleme tablosuyla yapılandırılmış filtreye çevrilir. Faz 0'da `pg_trgm` ve `unaccent` eklentileri migration ile kuruldu. `turkish` metin arama yapılandırmasının varlığı Faz 1'de `\dF` ile doğrulanıp bu ADR'ye eklenecek.

## Sonuçlar
Meilisearch/Typesense geçişi yalnızca yeni adaptör gerektirir. Geri alma: Düşük.
