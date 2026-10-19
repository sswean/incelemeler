# ADR-0012: Arama — PostgreSQL adaptörü, Türkçe normalizasyon ve sorgu ayrıştırıcı
- Durum: Kabul edildi · Tarih: 2026-10-19 · İlgili: REQ-ARA-001…014, REQ-SEO-005, AK-04

## Bağlam
Faz 1 aramasının ek bir altyapı bileşeni olmadan (§7.3 aşırı mühendislik yasağı) Türkçe sorguları (ekli yer adları,
İ/ı, aksansız yazım, yazım hataları) ve A7.1'deki doğal dil örneklerini karşılaması gerekiyor. Harici motora geçiş
(REQ-ARA-016) yalnızca yeni adaptör gerektirmeli.

## Karar
- **Port:** `SearchPort` (`upsert`, `delete`, `query`, `suggest`); uygulama kodu yalnızca bunu görür.
  İlk adaptör `PostgresSearchAdapter`; okuma modeli `search_documents` (LISTING, ARTICLE, CATEGORY, PLACE).
  Outbox olaylarıyla güncellenir; `pnpm search:reindex` tam yeniden kurar. Sıralama formülünde ticari sinyal yok.
- **Doğrulanan yapılandırma:** postgis/postgis:16-3.4 imajında `turkish` metin arama yapılandırması, `unaccent` ve
  `pg_trgm` mevcut (`SELECT cfgname FROM pg_ts_config` ile doğrulandı). Veritabanı UTF-8 ctype ile oluşturulmalı
  (`lower()` ve `[[:alnum:]]` Türkçe harfleri buna göre işler).
- **Normalizasyon:** belge ve sorgu **simetrik** olarak aksan katlanmış metin üzerinden işlenir:
  `turkish` kök bulucu + `simple` önek eşleşmesi (`kelime:*`), ağırlıklar A başlık / B kategori-yer / C kısa tanıtım /
  D gövde-özellik, GIN indeks. SQL'de `normalize_tr`/`fold_tr` (unaccent IMMUTABLE sarmalayıcı) uygulamadaki
  `normalizeTr` ile birebir; parite `search.int` testinde doğrulanır.
- **Geri dönüşler:** kelimeler VE ile birleşir; sonuçsuzsa VEYA; tam metin < 5 sonuçta `word_similarity` (eşik 0,4)
  trigram geri dönüşü; ayrıştırıcının bulduğu alt kategori sonuçsuzsa kök kategoriye genişletme; yer sayılan kelime
  sonuçsuzsa metin olarak deneme ("menemen" ilçe mi yemek mi).
- **Sorgu ayrıştırıcı (kural/sözlük):** iller (yazım toleranslı, Damerau ≤ 1/2), ülke genelinde adı benzersiz ve
  ≥ 5 harfli ilçeler (yaygın kelimelerle çakışmayı önlemek için yazım toleransı yok), takma adlar (`place_aliases`),
  yayındaki kategoriler (ad + tekil biçim), niyetler (`search_intents`: fiyat üst sınırı, özellik filtresi) ve
  eş anlamlılar (`search_synonyms`, zincirlenebilir). Ayrıştırılan filtreler arayüzde kaldırılabilir çip olarak döner.
- **Korpus:** `docs/requirements/ARA-sorgu-korpusu.json` (≥ 50 sorgu) kurgusal demo veride `search.int` ile
  CI'da koşar; kabul recall@5 ≥ 0,90 ve sıfır sonuç yalnızca beklenen sorgularda.
- **Arama olayları:** normalize sorgu, filtre özeti, sonuç sayısı; oturum karması rıza altyapısı (D10) gelene kadar
  tutulmaz.

## Değerlendirilen seçenekler
Meilisearch/Typesense (ek servis, Faz 1 ölçeği için gereksiz — REQ-ARA-016'da yeniden değerlendirilir);
yalnızca `turkish` yapılandırması (aksansız sorgularda kök bulucu farklı kök üretiyor — simetrik katlama seçildi).

## Sonuçlar
Olumlu: tek veritabanı, işlem tutarlılığı, port ile değiştirilebilir. Olumsuz: p95 hedefi (REQ-ARA-015) 50.000
listelemeyle henüz ölçülmedi (D13); sözlük ve eşikler panelden yönetim arayüzü bekliyor (6e).
Geri alma: Orta (adaptör değişimi).
