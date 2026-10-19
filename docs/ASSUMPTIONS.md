# Varsayımlar (ASSUMPTIONS)

Biçim: Ek C-4. "Yüksek" geri alma maliyetli varsayımlar OPEN-QUESTIONS'ta da yer alır.

## A-001: Geliştirme `claude/pensive-hopper-oftszn` dalında yapılır
- Tarih: 2026-10-19 · Faz 0 · Gerekçe: Oturumun yetkili dal talimatı; prompt §9.4'teki `feat/*` dal modeli, `main`'e birleştirme PR'larıyla başladığında uygulanacak.
- Etkilediği REQ'ler: — · Geri alma maliyeti: Düşük · Durum: AÇIK

## A-002: Kullanıcı puanı 1–5 tam yıldız, editör puanı 10 üzerinden 0,5 adımlı
- Tarih: 2026-10-19 · Faz 0 · Gerekçe: Ç-7 varsayılanı; `packages/utils/src/rating.ts`.
- Etkilediği REQ'ler: REQ-DEG-001, REQ-VER-005/006 · Geri alma maliyeti: Orta · Durum: AÇIK (Q-001)

## A-003: Pilot dikeyler Mekan (yeme-içme), Konaklama, Ürün (teknoloji) + destinasyon sayfaları; lansman şehirleri İstanbul, İzmir, Antalya, Muğla, Nevşehir
- Tarih: 2026-10-19 · Faz 0 · Gerekçe: §7.2 varsayılanı.
- Etkilediği REQ'ler: Faz 1 LST/ARA/SEO · Geri alma maliyeti: Orta · Durum: AÇIK (Q-002)

## A-004: Arayüz hitabı "sen"
- Tarih: 2026-10-19 · Faz 0 · Gerekçe: §4.3 varsayılanı; `packages/i18n`.
- Geri alma maliyeti: Düşük · Durum: AÇIK (Q-001)

## A-005: TypeScript 6.0.3 (en güncel 7.0.2 değil)
- Tarih: 2026-10-19 · Faz 0 · Gerekçe: typescript-eslint 8.71 TypeScript `<6.1` destekliyor; TS 7 ile lint zinciri çalışmaz (ADR-0001).
- Geri alma maliyeti: Düşük · Durum: AÇIK

## A-006: Arka plan işleri için Redis/BullMQ yok; gerekirse önce PostgreSQL kuyruğu
- Tarih: 2026-10-19 · Faz 0 · Gerekçe: §14.4 tetikleyicileri henüz ölçülmedi.
- Geri alma maliyeti: Düşük · Durum: AÇIK

## A-007: Başlangıç taksonomisi yayında (PUBLISHED) yüklenir
- Tarih: 2026-10-19 · Faz 0 · Gerekçe: Yürüyen iskeletin gerçek veri okuması için. Yayın eşikleri (§7.2) listeleme ve hub sayfalarına Faz 1'de uygulanacak; eşik altı kategoriler o zaman menü ve site haritasından gizlenecek (REQ-KAT-003).
- Etkilediği REQ'ler: REQ-KAT-003 · Geri alma maliyeti: Düşük · Durum: AÇIK

## A-008: Web ve panel geliştirme sürümünde `noindex`
- Tarih: 2026-10-19 · Faz 0 · Gerekçe: Canlıya geçiş C sınıfı; erken indekslenmeyi önler.
- Geri alma maliyeti: Düşük · Durum: AÇIK

## A-009: İstemci IP'si web/panelden `X-Forwarded-For` ile API'ye iletilir; üretimde başlığı güvenilen uç vekil ekler
- Tarih: 2026-10-19 · Faz 1 · Gerekçe: IP başına hız sınırları (REQ-HSP-008) web sunucusunun değil son kullanıcının IP'siyle çalışmalı. API yalnız loopback vekile güvenir (`TRUST_PROXY`) ve en sağdaki güvenilmeyen adresi kullanır; uç vekil (X-003) başlığa gözlediği IP'yi eklemezse istemci başlığı taklit edebilir. Gereksinim X-003 kaydına not düşüldü.
- Etkilediği REQ'ler: REQ-HSP-008, REQ-GUV-009 · Geri alma maliyeti: Düşük · Durum: AÇIK

## A-010: CSRF koruması ilk sürümde SameSite çerez + Next Server Actions Origin/Host denetimi
- Tarih: 2026-10-19 · Faz 1 · Gerekçe: Durum değiştiren tüm web/panel istekleri Server Action (yalnız POST, Next Origin ≠ Host ise reddeder); API çerez kabul etmez. Çift gönderim token'ı D13 sertleştirmede eklenecek.
- Etkilediği REQ'ler: REQ-HSP-004, REQ-GUV-006 · Geri alma maliyeti: Düşük · Durum: AÇIK

## A-011: YMYL ve lisanslı kategorilerde sponsorluk Faz 1'de kapalı tutulur; yayımlanmış kategorinin slug'ı değişmez
- Tarih: 2026-10-19 · Faz 1 · Gerekçe: REQ-KAT-004 "sponsorluk varsayılan kapalı" der; açma yolu hukuki kapı (C sınıfı) olduğundan API ve veritabanı (CHECK) bu kategorilerde sponsorluğu reddeder. Slug değişikliği SEO yönlendirme kaydı gerektirir (D4); o zamana dek kilitli.
- Etkilediği REQ'ler: REQ-KAT-003/004, REQ-SPN-* · Geri alma maliyeti: Düşük · Durum: AÇIK

## A-012: Görsel lisans tamlığı kuralı
- Tarih: 2026-10-19 · Faz 1 · Gerekçe: Ek A14.6 alanları; kaynak türü, hak sahibi ve lisans türü her görselde; işletme ve stok görsellerinde yazılı izin belgesi; süresi dolan lisans geçersiz. Model/mülk izni "gerekiyorsa" — otomatik çıkarılamadığından yalnızca kaydedilir. Yayımlanmış listelemeye sonradan eklenen lisanssız görsel herkese açık sayfada gösterilmez (D4 filtresi).
- Etkilediği REQ'ler: REQ-VER-014 · Geri alma maliyeti: Düşük · Durum: AÇIK

## A-013: Destinasyon listelemeleri `/destinasyon/{slug}`; harita yerine "Yol tarifi al" dış bağlantısı
- Tarih: 2026-10-19 · Faz 1 · Gerekçe: A15.1'de il/ilçe destinasyon yolları (`/{il}`, `/{il}/{ilce}`) hub dilimine (D6) aittir; il olmayan destinasyon listelemeleri (ör. tatil bölgesi) için ayrı önek. Harita sağlayıcısı (X-005) seçilmediğinden yol tarifi koordinatla dış harita bağlantısıdır (X-005 "erişim yokken davranış").
- Etkilediği REQ'ler: REQ-SEO-003, REQ-LST-003 · Geri alma maliyeti: Düşük · Durum: AÇIK

## A-014: İçerik akışı ayrıntıları
- Tarih: 2026-10-19 · Faz 1 · Gerekçe: (1) A15.1'de olmayan türler için önek: Haber `/haber/{slug}`, Sponsorlu içerik `/sponsorlu/{slug}` (ticari ilişki URL'de de açık). (2) Sponsorlu içerikte "ticari açıklama kontrolü" adımı, İNCELEMEDE → ONAYLANDI geçişinin yönetici (`campaigns.amount` izni: yönetici/süper yönetici) tarafından yapılmasıyla karşılanır; kontrol eden kaydedilir. (3) "GÜNCELLENİYOR" ara durumu yerine yayındaki içerik editör tarafından doğrudan güncellenir; her güncellemede önceki hâl revizyon olarak saklanır ve değişiklik notu zorunludur (aşamalı taslak sürüm D13'te değerlendirilecek).
- Etkilediği REQ'ler: REQ-ICR-004/005, REQ-SEO-003 · Geri alma maliyeti: Orta · Durum: AÇIK

## A-015: Metodoloji ve politika sayfaları TASLAK iken noindex
- Tarih: 2026-10-19 · Faz 1 · Gerekçe: REQ-ICR-012 sayfaları TASLAK damgalıdır (AK-12) ve hukuki/editoryal incelemeden geçmemiştir; hukuki taslak sayfalarla aynı biçimde arama motorlarına kapalı tutulur. Kurallar Ek A6/A8'den aktarılmıştır; "Test yöntemleri" bölümü editoryal ekip metni gelene kadar yer tutucu açıklamadır (uydurma yöntem yazılmadı).
- Etkilediği REQ'ler: REQ-ICR-012, REQ-SEO-005 · Geri alma maliyeti: Düşük (TASLAK kaldırma C sınıfı; kaldırıldığında `robots` açılır) · Durum: AÇIK

## A-016: Önizleme belirteci sorgu parametresinde
- Tarih: 2026-10-19 · Faz 1 · Gerekçe: URL normalleştirme (REQ-SEO-003) yolu küçük harfe çevirir; büyük/küçük harf duyarlı imzalı belirteç yolda bozulurdu. Önizleme adresi `/onizleme?belirtec=…` (noindex, `Cache-Control: private, no-store`, API'de `X-Robots-Tag: noindex`).
- Etkilediği REQ'ler: REQ-ICR-005 · Geri alma maliyeti: Düşük · Durum: AÇIK

## A-017: Arama sözlüğü varsayılanları ve demo veri
- Tarih: 2026-10-19 · Faz 1 · Gerekçe: Ek A7.1 örneklerinin filtreye çevrilmesi için varsayılan niyetler (uygun fiyatlı → fiyat ≤ 2; denize yakın → `beachfront`; çocuklarla → `familyFriendly`; özel gün → `specialOccasion`; rehberli → `guided`; kablosuz → `wireless`), eş anlamlılar ve takma adlar (Kapadokya → Nevşehir, Sultanahmet → Fatih…) platform yapılandırması olarak seed edilir; ilgili filtrelenebilir özellikler kategori şemalarına eklenir. "Hafta sonu", "günlük" gibi ifadeler Faz 1'de filtreye çevrilmez (koleksiyon/kiralama süresi verisi yok) — dolgu ifadesi sayılır. Korpusun beklenen sonuçları `seedDemoListings` içindeki 64 kurgusal "(Demo)" kayıttır (gerçek işletme/yer adı taklidi yok; görsel, puan, fiyat, lisans no yok).
- Etkilediği REQ'ler: REQ-ARA-006, REQ-ARA-007 · Geri alma maliyeti: Düşük (panelden değiştirilebilir — 6e) · Durum: AÇIK

## A-018: Hub kuralları
- Tarih: 2026-10-19 · Faz 1 · Gerekçe: (1) Hub'ın kategori bölümü kategori slug'ıdır (`/istanbul/kahvalti-mekanlari`; A15.1 örneğindeki ayrı "keşif kategorisi" slug'ı için ayrı model açılmadı); kategori slug'ı il/ilçe slug'ı ya da ayrılmış sözcükle çakışamaz (kayıtta doğrulanır). (2) "Editoryal içerik" ve "rehber" eşik sayımı: hub'ın listelemelerinden en az birini gömülü kart olarak içeren yayımlanmış içerik (içeriklerde ayrı yer/konu alanı yok). (3) Eşik altındaki hub sayfası üretilmez (404); ilçe sayfası eşiği varsayılan 10 listeleme (tabloda ayrı satır yok). (4) Sayfalama varyantları `noindex,follow`; yalnızca demo listelemeli hub noindex ve JSON-LD'siz; site haritası demo kaydı saymaz. (5) Eşikler `platform_settings` içinde, panelden (`taxonomy.manage`) sürüm denetimli değişir.
- Etkilediği REQ'ler: REQ-KAT-003, REQ-SEO-003/004/006/011 · Geri alma maliyeti: Düşük · Durum: AÇIK
