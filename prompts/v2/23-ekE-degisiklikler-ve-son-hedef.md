# EK E — v1 → v2 DEĞİŞİKLİK GÜNLÜĞÜ VE İZLENEBİLİRLİK

## E1 — Başlıca değişiklikler

1. **Yapı:** Tek parça metin, her oturumda geçerli **çekirdek** (§0–§14) ve Faz 0'da depoya aktarılan **ekler** (REQ kimlikli gereksinimler, E2E kataloğu, şablonlar, hukuk/bağımlılık listeleri) olarak ikiye ayrıldı.
2. **Altın kurallar** (AK-01…AK-15) tek yerde toplandı ve mekanik denetimlere bağlandı.
3. **Normatif dil** (ZORUNLU/YASAK/OLMALI/ÖNERİLİR/İSTEĞE BAĞLI), **öncelik sırası** ve **ölçülebilirlik kuralı** eklendi.
4. **Sözlük:** Listeleme / İçerik / Editör değerlendirmesi / Kullanıcı değerlendirmesi / Yorum / Sponsorlu içerik / Sponsorlu yerleşim / Kampanya / Fırsat / Teklif talebi / Dış yönlendirme / Entegrasyon sağlayıcısı ayrımları sabitlendi.
5. **15 v1 çelişkisi** bağlayıcı kurallarla çözüldü (§5.2).
6. **Faz × kapsam matrisi**, **Faz 0** (yürüyen iskelet), **pilot dikeyler**, **yayın eşikleri**, **Bitti Tanımları** ve **İnsan onaylı faz kapıları** eklendi.
7. **Çalışma protokolü:** ilk yanıt sözleşmesi, oturum başı/sonu, dikey dilim döngüsü (v1 §22 şelale sırasının yerine), git kuralları, kanonik komutlar, temiz klon testi.
8. **Kalıcı hafıza dosyaları** ve **durma koşulları** (A/B/C/D sınıfları) eklendi.
9. **Kanıt ve test bütünlüğü**, **demo veri politikası**, **MOCK izolasyonu**, **hukuki kapılar**, **bağımsız doğrulama** ve **rapor şablonları** eklendi.
10. **Veri modeli:** "kategori = veri, tür = kod"; hibrit model (ortak tablo + tür uzantıları + şemalı JSONB); kuruluş kapsamlı üyelik; değiştirilemez denetim kaydı; outbox; uyum varlıkları.
11. **Puanlama:** kullanıcı 1–5 tam yıldız, editör 10 üzerinden; gösterim eşikleri; Bayes sıralaması; birleştirme yasağı.
12. **Sponsorluk:** ticari ilişki alanı, sabit etiket sözlüğü, yüzey bazlı sayısal sınırlar, ayrı API dizisi, organik sıralama değişmezliği testi, görüntülenen gösterim tanımı.
13. **Dış yönlendirme:** açık yönlendirme koruması, tekilleştirme, bot ayıklama, dönüşüm verisi kuralı; fiyat tazeliği (`STALE`/`UNAVAILABLE`).
14. **Arama:** Türkçe normalizasyon, ek ayıklama, aksan katlama, trigram, yer adı sözlüğü, niyet/özellik eşleme tablosu (yapay zekâsız), ≥ 50 sorguluk korpus ve recall@5 ≥ %90 kabul ölçütü.
15. **Türkiye'ye özgü:** KVKK altyapısı, çerez onayı testleri, ticari ileti sınıflandırması, sektörel lisans kapıları (konaklama, turist rehberi, tur satışı), 24 maddelik hukuki inceleme listesi (doğrulama uyarısıyla), Türkçe slug/ek uyumu/biçim kuralları.
16. **Tasarım:** v1 paletinin kontrast ölçümü; vurgu renginin metin için kullanılamadığı ve kenarlık renginin form alanı için yetersiz olduğu tespit edildi; erişilebilir token tablosu, sponsorlu etiket rengi, karanlık tema eşlemesi, bileşen envanteri, görsel lisans alanları, logo brifi.
17. **Mobil:** misafir modu, derin bağlantı, push ön izni ve ticari push ayrımı, konum minimizasyonu, mağaza gereksinimleri, OTA politikası, mobil E2E.
18. **Kalite ve operasyon:** OWASP ASVS L2 hedefi, SSRF/dosya yükleme sertleştirmesi, Core Web Vitals ve Lighthouse bütçeleri, API p95 bütçeleri, RPO/RTO, geri yükleme tatbikatı, SLO'lar, runbook'lar, canlıya geçiş kontrol listesi.
19. **E2E kataloğu** 8 senaryodan 27 senaryoya genişletildi.
20. **Dış bağımlılık listesi** (30 madde) eklendi.

## E2 — v1 bölümlerinin v2'deki karşılıkları (hiçbir v1 maddesi düşürülmedi)

| v1 bölümü | v2 karşılığı |
|---|---|
| §1 Proje tanımı ve vizyon (rol, kullanım senaryoları, hedef, alan adı, marka, sloganlar, iki ürün, ortak hesap) | §1, §5.1, §6.1 |
| §2 Kesin teknik kısıtlar (WordPress yasağı, prototip yasağı, web/backend/mobil/DevOps yığını, modüler monolit, monorepo) | AK-13, §1.3, §5.2 Ç-1/Ç-9/Ç-10, §14, Ek A1, A20 |
| §3 Marka kimliği ve görsel tasarım (yaklaşım, palet, UI, logo, fotoğraf kuralı, "basit dashboard üretme") | Ek A14 (A14.1–A14.7), §5.2 Ç-3/Ç-4 |
| §4 Kategori mimarisi (A–J ve tüm alt kategoriler, konaklama/araç kiralama/mekan/rehber gereksinimleri, YMYL) | Ek A4 (A4.2 tablosu tüm v1 öğelerini içerir), A2.2, A4.4, A9.4 REQ-ENT-015, REQ-KAT-004 |
| §5 Web sayfa yapısı (18 ana sayfa modülü, sponsorlu denge, sayfa listesi) | Ek A15.4, A15.5, A8.3 |
| §6 Mobil uygulama (5 sekme, özellikler, misafir modu, mağaza kuralları) | Ek A12, §7.1 |
| §7 Gelişmiş arama ve filtreleme (örnek sorgular, ortak filtreler, harita/liste, bottom sheet, Türkçe dayanıklılık, PG FTS → Meili/Typesense, AI ileri faz) | Ek A7, §5.2 Ç-8 |
| §8 İnceleme ve değerlendirme sistemi (ortak çekirdek, detay bileşenleri, ölçek, editör/kullanıcı ayrımı, sponsor etkisizliği, sahte puan yasağı) | Ek A2, A4.4, A6, AK-02, AK-04 |
| §9 Sponsorlu içerik ve reklam sistemi (16 tür, aç/kapa ve tarih, etiketler, yönetim paneli alanları, gerçek ölçüm, işletme paneli, onay zorunluluğu, ilk sürümde yönetici) | Ek A8, A11, §7.1 |
| §10 Affiliate, rezervasyon, satın alma ve yönlendirme (ticari modeller, bağlamsal CTA, entegrasyon katmanı, API varsayma yasağı, scraping yasağı, fiyat/müsaitlik kuralları, affiliate takip) | Ek A9, AK-06, AK-07 |
| §11 Yönetim paneli (25 modül, içerik editörü, roller, denetim kaydı) | Ek A10, A5, A3, REQ-VER-017 |
| §12 Veritabanı ve temel varlıklar (35 varlık, kalıtım değerlendirmesi, türe özgü alanlar, indeks, silme/saklama, migration) | Ek A2 (varlıklar sözlüğe göre yeniden adlandırıldı: §4.1) |
| §13 SEO ve organik büyüme (teknik SEO, yapılandırılmış veri, içerik SEO örnekleri, programatik SEO) | Ek A13 |
| §14 İçerik kalitesi ve güven (10 politika, yapay zekâ kuralı) | REQ-ICR-006/007/009, A5.6, A6.6, AK-07 |
| §15 Gelir modeli (7 kaynak, sözleşme/mevzuat koşulu, panelden yönetim) | Ek A22 |
| §16 Güvenlik, KVKK ve operasyon (14 teknik gereksinim, hukuki inceleme listesi, konum) | Ek A16, A17, Ek D1, REQ-MOB-007 |
| §17 Hız, erişilebilirlik ve kullanılabilirlik (14 madde, gereksiz efekt yasağı) | Ek A18, A15.3 |
| §18 Analitik ve büyüme (12 olay, 8 pano, KVKK uyumu) | Ek A19, §6.3 |
| §19 MVP ve geliştirme fazları (Faz 1–4) | §7, §8 |
| §20 Test ve kalite kontrolü (13 test türü, 8 E2E, sahte rapor yasağı, demo veri) | Ek A21, Ek B (E2E-001…008 aynen + 19 yeni), AK-01, §12.4 |
| §21 Proje çıktıları (16 çıktı, boş buton yasağı, mock kuralı) | §8.6, §12.8, AK-06 |
| §22 Çalışma yöntemi (12 adım, ilk iş depo kontrolü, plan + uygulama, eksik erişimleri belirt, gereksiz soru sorma) | §9 (dikey dilim döngüsü), §11, §13.3, Ek D2 |
| SON HEDEF | Aşağıda |

---

# SON HEDEF

incelemeler.com.tr markası altında; seyahat, konaklama, restoranlar, otomobiller, araç kiralama, turist rehberliği, ürün incelemeleri ve çok çeşitli hizmetleri bir araya getiren; **açıkça etiketlenmiş** sponsorlu içeriklerden ve yönlendirmelerden gelir elde edebilen; iOS, Android ve web üzerinde çalışan; **güvenilir, hızlı, erişilebilir, modern, mevzuata saygılı ve gelecekte büyüyebilir** bir keşif platformu geliştirmek.

Sadece güzel görünen bir arayüz üretme. **Gerçek, test edilmiş ve kanıtlanabilir bir yazılım ürünü geliştir.**

**Şimdi §9.1'deki ilk yanıtınla başla.**
