# Mimari (REQ-MIM-003)

Son güncelleme: 2026-10-19 (Faz 0). Kararlar: `docs/DECISIONS/ADR-0001…0010`.

## Bileşen diyagramı

```mermaid
flowchart LR
  subgraph İstemciler
    W[apps/web<br/>Next.js 16 SSR/ISR]
    A[apps/admin<br/>Next.js 16, noindex]
    M[apps/mobile<br/>Expo — Faz 2]
  end
  subgraph Paylaşılan paketler
    C[contracts<br/>zod + uç nokta listesi]
    AC[api-client<br/>OpenAPI'den üretilir]
    T[tokens]
    I[i18n tr-TR]
    U[utils]
  end
  API[apps/api<br/>NestJS 12 modüler monolit]
  WK[apps/api worker<br/>outbox işleyici — Faz 1]
  DB[(PostgreSQL 16<br/>+ PostGIS, pg_trgm, unaccent)]
  S3[(S3 uyumlu depolama<br/>yerel: SeaweedFS)]
  MAIL[(SMTP<br/>yerel: Mailpit)]
  W -- HTTP/JSON --> API
  A -- HTTP/JSON --> API
  M -. Faz 2 .-> API
  W & A & M --- AC
  AC --- C
  API --- C
  API --> DB
  WK --> DB
  API --> S3
  API --> MAIL
```

**Kural:** Veritabanına yalnızca `apps/api` erişir (dependency-cruiser `db-only-in-api`). Organik sıralama modülleri (`search`, `catalog`, `reviews`) reklam/ticaret modüllerini içe aktaramaz (`organic-ranking-independent`).

## Veri modeli

### Faz 0'da kurulan tablolar

```mermaid
erDiagram
  CATEGORY ||--o{ CATEGORY : "üst (RESTRICT)"
  CATEGORY ||--o{ LISTING : "birincil kategori (RESTRICT)"
  ORGANIZATION ||--o{ LISTING : "sahibi/markası (RESTRICT)"
  AUDIT_LOG {
    uuid id
    text action
    text target_type
    timestamptz created_at
  }
```

- `categories`: ağaç, izinli türler (`allowed_kinds`), durum, YMYL/lisans/sponsorluk bayrakları, `data_origin`.
- `organizations`: tür (BUSINESS, BRAND, CHAIN, OPERATOR, ADVERTISER).
- `listings`: ortak alanlar (REQ-VER-001); CHECK: `price_level` 1–4, PUBLISHED ⇒ `published_at`.
- `audit_log`: UPDATE/DELETE/TRUNCATE tetikleyiciyle engelli (REQ-VER-017).
- Eklentiler: `postgis`, `pg_trgm`, `unaccent`.

### Hedef model (Faz 1–3; Ek A2 ve ADR-0004)

```mermaid
erDiagram
  ORGANIZATION ||--o{ LISTING : ""
  ORGANIZATION ||--o{ ORG_MEMBERSHIP : ""
  USER ||--o{ ORG_MEMBERSHIP : ""
  CATEGORY ||--o{ ATTRIBUTE_DEFINITION : "şema (sürümlü)"
  LISTING ||--o| LISTING_PLACE : "kind=PLACE"
  LISTING ||--o| LISTING_LODGING : "kind=LODGING"
  LISTING ||--o| LISTING_PRODUCT : "kind=PRODUCT"
  LISTING ||--o{ OPENING_HOURS : ""
  ARTICLE }o--o{ LISTING : "gömülü kartlar"
  LISTING ||--o| EDITORIAL_VERDICT : "güncel (sürümlü)"
  LISTING ||--o{ USER_REVIEW : ""
  USER ||--o{ USER_REVIEW : ""
  LISTING ||--|| RATING_STATS : "türetilmiş"
  LISTING ||--o{ OFFER : ""
  OFFER ||--o{ PRICE_SNAPSHOT : ""
  LISTING ||--o{ OUTBOUND_LINK : ""
  OUTBOUND_LINK ||--o{ OUTBOUND_CLICK : ""
  ORGANIZATION ||--o{ CAMPAIGN : "reklamveren"
  CAMPAIGN ||--o{ PLACEMENT : ""
  PLACEMENT_SLOT ||--o{ PLACEMENT : ""
  USER ||--o{ FAVORITE : ""
  MEDIA_ASSET ||--o{ MEDIA_USAGE : ""
```

## İzin matrisi (prompt v2 Ek A3'ten; her hücre Faz 1'de bir yetkilendirme testine bağlanır)

**Rol matrisi (özet; ayrıntı HSP.md'de):**

| Eylem | Süper yön. | Yönetici | Editör | Yazar | Moderatör | Satış/Sponsorluk | Üye | İşletme t. (F3) | Reklamveren t. (F3) |
|---|---|---|---|---|---|---|---|---|---|
| Rol atama, sistem ayarları, hukuki kapı açma talebi | ✔ | — | — | — | — | — | — | — | — |
| Kategori/özellik şeması yönetimi | ✔ | ✔ | — | — | — | — | — | — | — |
| Listeleme oluşturma/düzenleme | ✔ | ✔ | ✔ | taslak | — | — | düzeltme önerisi | kendi listelemesi: öneri (onaylı) | — |
| İçerik yayımlama | ✔ | ✔ | ✔ | taslak + incelemeye gönder | — | — | — | — | — |
| Editör değerlendirmesi/puanı | ✔ | ✔ | ✔ | taslak | — | **—** (yayından önce görmez) | — | — | — |
| Kullanıcı değerlendirmesi moderasyonu | ✔ | ✔ | — | — | ✔ | — | bildir | bildir + yanıt | — |
| Sponsorluk kampanyası/yerleşim | ✔ | ✔ (tutar alanı: yönetici) | sponsorlu içerik metni | — | — | ✔ (ticari alanlar, kreatif; onay yönetici) | — | — | kendi kampanyası: başvuru/rapor |
| Affiliate bağlantı yönetimi | ✔ | ✔ | bağlantı ekleme (izinli alanlar) | — | — | bağlantı ekleme (izinli alanlar) | — | — | — |
| Denetim kaydı görüntüleme | ✔ | ✔ (salt okunur) | — | — | kendi işlemleri | kendi işlemleri | — | — | — |
| Kişisel veri dışa aktarma (kullanıcı adına) | ✔ | — | — | — | — | — | kendi verisi | — | — |

## Render ve önbellek

ADR-0009 tablosu.
