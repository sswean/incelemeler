# Açık sorular (OPEN-QUESTIONS)

Biçim: Ek C-5. B sınıfı: varsayılanla devam edilir. C sınıfı: o iş durur, diğer işler sürer.

## Q-001: Ürün varsayılanları onaylanıyor mu? (puan ölçekleri, hitap)
- Sınıf: B · Engellediği REQ'ler: — (varsayılanla ilerleniyor)
- Seçenekler: A) Kullanıcı 1–5 tam yıldız + editör 10 üzerinden; "sen" hitabı. B) Farklı ölçek/hitap.
- Önerim: A — §5.2 Ç-7 ve §4.3 gerekçeleri.
- Yanıt gelmezse: A uygulanır (A-002, A-004). · Yanıt: — · Tarih: —

## Q-002: Pilot dikeyler ve lansman şehirleri onaylanıyor mu?
- Sınıf: B · Engellediği REQ'ler: Faz 1 içerik/SEO önceliklendirmesi
- Seçenekler: A) Mekan + Konaklama + Teknoloji ürünü; İstanbul, İzmir, Antalya, Muğla, Nevşehir. B) Başka dikey/şehir kombinasyonu.
- Önerim: A — soğuk başlangıç riskini azaltır (§7.2).
- Yanıt gelmezse: A (A-003). · Yanıt: — · Tarih: —

## Q-003: İzin listesi dışı dolaylı bağımlılık lisansları kabul ediliyor mu?
- Sınıf: **C** · Engellediği REQ'ler: REQ-GUV-013 (tamamlanma onayı) · İlgili: L-025, `license-exceptions.json`
- Durum: Next.js (`sharp` → `@img/sharp-libvips` LGPL-3.0), Tailwind/Next (`lightningcss` MPL-2.0), Prisma araçları (`elkjs` EPL-2.0) ve geliştirme araçları (axe-core MPL-2.0 vb.) ZORUNLU yığının dolaylı bağımlılıkları.
- Seçenekler: A) İstisnaları onayla (doğrudan bağımlılık eklenmeden, dinamik bağlama/yalnızca derleme zamanı kullanımı). B) `sharp`'ı devre dışı bırak (Next görsel optimizasyonu harici CDN'e). C) Hukuk danışmanına sor.
- Önerim: A, hukuk danışmanı teyidiyle (C).
- Yanıt gelmezse: İstisnalar `pendingApproval` olarak kalır; yeni izin listesi dışı lisans CI'ı kırar. · Yanıt: — · Tarih: —

## Q-004: GitHub Actions bu depoda etkin mi; `main` dal koruması ayarlanacak mı? (X-031)
- Sınıf: B · Engellediği: §8.3 "CI'da art arda 3 yeşil" ölçütünün gerçek CI'da kanıtı
- Seçenekler: A) Actions'ı etkinleştir + dal koruması. B) Başka CI.
- Yanıt gelmezse: `pnpm ci:local` ile yerelde kanıtlanır; ölçüt `DOĞRULANAMADI (CI yok)` raporlanır.

## Q-005: Barındırma ve veri yerleşimi (Türkiye içi / AB) (X-002, L-010)
- Sınıf: **C** · Engellediği: staging/üretim ortamları, REQ-OPS-001 (kısmi), REQ-OPS-003
- Seçenekler: A) Türkiye'de barındırma (KVKK aktarım yükü düşük). B) AB bölgesi (KVKK m.9 aktarım dayanağı gerekir).
- Önerim: Hukuk danışmanı görüşüyle karar; Faz 1 boyunca yerel geliştirme yeterli.
- Yanıt gelmezse: Dağıtım yapılmaz.

## Q-006: İdari bölge (il/ilçe/mahalle) verisinin lisanslı kaynağı (ADR-0011)
- Sınıf: B · Engellediği: pilot dışı illerin ilçeleri, mahalle düzeyi filtreler
- Seçenekler: A) Kamu kurumunun açık lisanslı veri seti (lisansı doğrulanır). B) Lisanslı ticari adres veri sağlayıcısı (X-kaydı, maliyet C sınıfı).
- Yanıt gelmezse: 81 il + lansman illerinin ilçeleri (elle girilmiş olgular, MQA-003) ile devam; diğer illerde ilçe zorunluluğu yayın kuralında karşılanamaz.
