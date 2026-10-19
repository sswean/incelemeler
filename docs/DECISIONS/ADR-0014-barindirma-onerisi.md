# ADR-0014: Barındırma önerisi (seçenek karşılaştırması)
- Durum: **Önerildi — İnsan kararı bekliyor (C sınıfı, Q-005)** · Tarih: 2026-10-19 · İlgili: REQ-OPS-003, REQ-OPS-005, REQ-OPS-006, REQ-GUV-010/011, L-010, X-002

## Bağlam
Uygulama: Node.js API + işçi (NestJS), iki Next.js uygulaması (web, panel), PostgreSQL 16 + PostGIS, S3 uyumlu nesne
depolama, işlemsel e-posta, CDN/WAF. Veri yerleşimi (Türkiye içi / AB) KVKK aktarım kuralları nedeniyle hukuki bir
karardır (L-010); **karar verilene kadar dağıtım yapılmaz.** Bu belge fiyat ya da sözleşme içermez; sağlayıcı
özellikleri satın alma öncesi sağlayıcıdan güncel olarak doğrulanmalıdır.

## Gereksinimler (karşılaştırma ölçütleri)
| Ölçüt | Kaynak |
|---|---|
| Yönetilen PostgreSQL 16 + PostGIS eklentisi, otomatik yedek + zaman noktasına geri dönüş, RPO ≤ 15 dk, RTO ≤ 4 sa | REQ-OPS-005 |
| Rol oluşturma yetkisi (uygulama/salt okunur/migration rolleri) | REQ-GUV-011 |
| Konteyner çalıştırma (API, işçi, web, panel), sıfır kesintili dağıtım (yuvarlanan/mavi-yeşil) | REQ-OPS-004 |
| S3 uyumlu depolama, sürümleme, herkese açık listeleme kapalı | REQ-GUV-008, REQ-OPS-005 |
| CDN + WAF, TLS 1.2+, HSTS | REQ-GUV-005/010, REQ-PRF-006 |
| Dinlenmede şifreleme, anahtar yönetimi | REQ-GUV-010 |
| Merkezi log, metrik, uyarı, uptime | REQ-OPS-006 |
| Veri yerleşimi ve alt işleyen envanteri | L-010, REQ-KVK (aktarım) |

## Seçenekler
| | A) Türkiye'de yerleşik bulut sağlayıcısı | B) Küresel bulut, AB bölgesi | C) Küresel bulut + Türkiye'de veritabanı (karma) |
|---|---|---|---|
| Veri yerleşimi | Türkiye içi; yurt dışı aktarım yükü en düşük | AB; KVKK yurt dışı aktarım dayanağı gerekir (hukukçu) | Kişisel veri Türkiye'de; statik/CDN küresel |
| Yönetilen PostgreSQL + PostGIS | Sağlayıcıya göre değişir — **doğrulanmalı** | Yaygın | Türkiye tarafı için doğrulanmalı |
| PITR / RPO 15 dk | Doğrulanmalı | Yaygın | Doğrulanmalı |
| Konteyner platformu | Doğrulanmalı | Yaygın (yönetilen) | Karma; ağ gecikmesi ölçülmeli |
| CDN/WAF | Ayrı sağlayıcı olabilir (CDN de aktarım envanterine girer) | Aynı sağlayıcı | Ayrı |
| İşletim karmaşıklığı | Orta | Düşük | Yüksek |

## Öneri (karar değil)
1. Hukuk görüşü alınana kadar **A** öncelikli değerlendirilsin (KVKK aktarım yükü en düşük); sağlayıcı seçimi yukarıdaki
   ölçüt tablosuyla, sağlayıcının güncel belgelerinden doğrulanarak yapılsın.
2. Hukuk görüşü AB aktarımını uygun bulursa **B** işletim açısından en basit seçenektir.
3. Hangi seçenek olursa olsun: CDN ve e-posta sağlayıcıları da alt işleyen envanterine (processor_inventory, REQ-VER-020)
   ve aydınlatma metnine eklenir; staging ayrı hesap/proje, `noindex` + temel kimlik doğrulama (MQA-002).

## Sonuçlar
- Karar verilene kadar: yerel Docker ortamı, `pnpm restore:drill` ile yerel geri yükleme tatbikatı (MQA-005 staging'de).
- IaC taslağı isteğe bağlıdır (REQ-OPS-003) ve sağlayıcı seçimine bağlı olduğundan yazılmadı.
