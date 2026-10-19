# ADR-0011: İdari bölgeler ve konum verisi
- Durum: Kabul edildi · Tarih: 2026-10-19 · İlgili: REQ-VER-009, REQ-SEO-* (il/ilçe hub'ları), A-003

## Bağlam
Listelemelerin il/ilçe hiyerarşisine ve sorgulanabilir koordinata ihtiyacı var. İdari bölge verisi için lisanslı bir dış veri kümesi henüz seçilmedi; scraping yasak (AK-07).

## Karar
- `admin_areas` (PROVINCE → DISTRICT) referans verisi **migration** ile yüklenir (seed değil: üretimde de gerekir).
  İlk sürüm: 81 il (plaka kodlarıyla) + lansman illerinin (İstanbul, İzmir, Antalya, Muğla, Nevşehir) 109 ilçesi.
  Liste kamuya açık idari bölünme olgularından ajan tarafından elle girildi; resmî listeyle karşılaştırma MQA-003'tedir.
  Diğer illerin ilçeleri ve mahalle düzeyi, lisansı belgelenmiş bir kaynak seçildiğinde ayrı migration'la eklenir (Q-006).
- `listing_locations`: `latitude/longitude NUMERIC(9,6)` (6 ondalık) + tetikleyiciyle doldurulan `geo geography(Point,4326)` + GiST.
  Üretilen (generated) sütun yerine tetikleyici seçildi: Prisma üretilen sütun ifadesini varsayılan değer gibi görüp her migration'da fark üretiyordu; şemada `Unsupported` + `@@index(type: Gist)` ile birebir ifade edilir.
- Mahalle şimdilik serbest metin; hizmet bölgesi il düzeyinde (`listing_service_areas`).

## Sonuçlar
Olumlu: üretimde de hazır referans verisi; PostGIS yakınlık sorguları (ST_DWithin) indeksli. Olumsuz: 76 ilin ilçeleri eksik (pilot dışı iller için ilçe zorunlu yayın kuralı karşılanamaz). Geri alma: Düşük.
