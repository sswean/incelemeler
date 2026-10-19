# Hukuki inceleme listesi (LEGAL-REVIEW)

> §10 / Ek D1. Kayıt biçimi: Ek C-7. **Durumu "KARARA BAĞLANDI" yapan her zaman İnsan'dır.**
> Tüm satırların durumu: **AÇIK · DOĞRULANMADI** (2026-10-19). Ürün içindeki geçici önlem: ilgili `legalGate` KAPALI, metinler TASLAK, en kısıtlayıcı yorum.

## Başlangıç listesi (prompt v2 Ek D1)

> **Önemli:** Bu tablodaki mevzuat adları, değişiklik tarihleri ve kurum kararları v2 hazırlanırken büyük ölçüde **ikincil kaynaklardan** (hukuk bürosu yazıları, haber siteleri) derlenmiştir; resmî kaynaklara (Resmî Gazete, mevzuat.gov.tr, kvkk.gov.tr, ticaret.gov.tr, ktb.gov.tr) doğrudan erişilerek **doğrulanmamıştır**. Sen bunları §13.3 protokolüyle doğrulamaya çalışır, sonucu her satıra yazarsın; doğrulayamazsan satır `DOĞRULANMADI` kalır ve üründe **en kısıtlayıcı yorum** uygulanır. Hiçbir satırın durumunu sen "karara bağlandı" yapmazsın. Ayrıca 2026-10-18 sonrasında yeni değişiklikler olabilir.

| L | Alan | İlgili mevzuat/politika (doğrulanacak) | Risk | Ürün etkisi / geçici önlem | Kim onaylamalı |
|---|---|---|---|---|---|
| L-001 | Platform içi rezervasyon/ödeme, tur/paket satışı | 1618 sayılı Seyahat Acentaları Kanunu; 6493 sayılı Ödeme Hizmetleri Kanunu; 6563 ve mesafeli sözleşme/paket tur mevzuatı | Lisanssız faaliyet | Kapsam dışı; yalnızca dış yönlendirme; `legalGate.inPlatformBooking=KAPALI` | Turizm + ödeme hukukçusu |
| L-002 | Turist rehberi profilleri | 6326 sayılı Turist Rehberliği Meslek Kanunu ve yönetmeliği (güncel sürüm doğrulanacak) | Ruhsatsız rehberliğe aracılık | Ruhsat doğrulaması olmadan yayın yok; "yerel rehber" ayrı kategori olarak açılmaz | Turizm hukukçusu |
| L-003 | Konaklama ve kiralık tatil evi listelemeleri | 2634 sayılı Turizmi Teşvik Kanunu; konutların turizm amaçlı kiralanmasına ilişkin düzenlemeler (7464 sayılı Kanun olarak bildirilen); Kültür ve Turizm Bakanlığı'nın belge numarası gösterimi ve belgesiz ilan yasağına ilişkin olarak bildirilen 2025 sonu tebliği/2026 genelgesi | İlan başına yaptırım, kaldırma süreleri | Belge no alanı ZORUNLU; belgesiz konaklama yayımlanmaz (varsayılan); kaldırma talebine hızlı akış | Turizm hukukçusu |
| L-004 | Tüketici değerlendirmeleri | 6502 sayılı Tüketicinin Korunması Hakkında Kanun; Ticari Reklam ve Haksız Ticari Uygulamalar Yönetmeliği'nin tüketici değerlendirmelerine ilişkin hükümleri (2022'de eklendiği ve 2026'da değiştirildiği bildirilen); Reklam Kurulu tüketici değerlendirmeleri kılavuzu | Haksız ticari uygulama | Platformun bu hükümlerin kapsamında olup olmadığı; değerlendirmelerin yayın süresi; satın alma doğrulaması; reklamda kullanım yasağı; silme sonrası akıbet. Geçici: A6 kuralları + en kısıtlayıcı yorum | Tüketici hukukçusu |
| L-005 | Sponsorlu içerik ve affiliate etiketleri | 6502; Ticari Reklam ve Haksız Ticari Uygulamalar Yönetmeliği (örtülü reklam yasağı; "reklam" ibaresine ilişkin olarak bildirilen 2026 değişikliği); Reklam Kurulu sosyal medya etkileyicileri kılavuzu | Örtülü reklam | Sabit etiket sözlüğü `compliance_config`'te; hukuki onayla kesinleşir | Reklam hukukçusu |
| L-006 | Hedefli/kişiselleştirilmiş reklam ve yapay zekâ içerik açıklaması | Ticari reklam mevzuatındaki güncel değişiklikler (doğrulanacak); KVKK | Şeffaflık ihlali | "Neden bunu görüyorum?"; davranışsal hedefleme Faz 4; yapay zekâ görsel etiketi | Reklam hukukçusu + KVKK uzmanı |
| L-007 | İndirim/fırsat gösterimi, çekilişler | İndirim reklamlarına ilişkin hükümler; çekiliş/promosyon mevzuatı | Yanıltıcı indirim, izinsiz çekiliş | `Deal` alanları (referans fiyat dayanağı, koşullar, süre); çekiliş özelliği yok | Reklam hukukçusu |
| L-008 | Kısıtlı reklam kategorileri | Alkol (4250 sayılı Kanun ve değişiklikleri), tütün, sağlık/ilaç/takviye tanıtımı, şans oyunları, finansal ürünler mevzuatı | Yasak reklam | `sponsorshipAllowed=false` varsayılan; alkol servisi olan mekanın tanıtım dili kontrol listesi | Reklam/sağlık hukukçusu |
| L-009 | KVKK hukuki sebepler, aydınlatma ve açık rıza | 6698 sayılı KVKK (m.5, m.10), Aydınlatma Yükümlülüğü Tebliği; aydınlatma ile açık rızanın ayrılmasına ilişkin Kurul kararları (2026 tarihli olduğu bildirilen ilke kararı dahil) | Geçersiz rıza, idari para cezası | Ayrı metinler + `consent_records`; işleme envanteri | KVKK uzmanı |
| L-010 | Yurt dışına veri aktarımı | KVKK m.9 (2024'te 7499 sayılı Kanunla değiştirildiği bildirilen) ve Yurt Dışına Aktarım Yönetmeliği; standart sözleşme ve bildirim yükümlülükleri | Bildirimsiz/dayanaksız aktarım | `processor_inventory` kapısı; barındırma bölgesi C sınıfı | KVKK uzmanı |
| L-011 | Çerezler | KVKK Çerez Uygulamaları Rehberi (güncel sürüm) | Geçersiz rıza | CMP + E2E-016 | KVKK uzmanı |
| L-012 | Ticari elektronik ileti, İYS, push | 6563 sayılı Kanun; Ticari İletişim ve Ticari Elektronik İletiler Yönetmeliği; İleti Yönetim Sistemi; push bildirimlerinin kapsamı | İzinsiz ileti | İleti sınıflandırması; ticari push ayrı onay; `ConsentSyncPort` | E-ticaret hukukçusu |
| L-013 | Kullanıcı içeriği, kaldırma, log saklama | 5651 sayılı Kanun ve ikincil mevzuatı (yer/içerik sağlayıcı yükümlülükleri, trafik bilgisi saklama süreleri, kaldırma süreleri) | Sorumluluk, erişim engeli | `takedown_requests` (F1-D16c); yanıt süresi varsayılanları (24/72/168 sa) doğrulanmadı — `compliance_config.takedownResponseHours`; log saklama `compliance_config` | Bilişim hukukçusu |
| L-014 | Hakaret ve kişilik hakları | TCK ve TBK ilgili hükümleri | Dava, tazminat | Topluluk kuralları; moderasyon; hukuki talep akışı | Bilişim hukukçusu |
| L-015 | Telif ve marka | 5846 sayılı FSEK; 6769 sayılı SMK; marka adlarının karşılaştırmalı kullanımı; "İncelemeler" marka tescili ve logo benzerlik araştırması | İhlal | Lisans alanları; kullanıcı fotoğraf lisans beyanı; logo kuralı | FSEK/marka vekili |
| L-016 | Ödeme, fatura, sözleşmeler | 6493; Vergi Usul Kanunu (e-Fatura/e-Arşiv); reklamveren ve işletme sözleşmeleri | Lisans/vergi ihlali | Kapsam dışı; `PaymentPort`/`InvoicingPort` arayüz | Mali müşavir + hukukçu |
| L-017 | Künye ve hizmet sağlayıcı bilgileri, ETBİS | 6563 ve ikincil mevzuat; elektronik ticaret bilgi sistemi kaydının gerekip gerekmediği | İdari para cezası | `/kunye` sayfası | E-ticaret hukukçusu |
| L-018 | Erişilebilirlik | Türkiye'de web/mobil erişilebilirliğe ilişkin güncel düzenlemeler (2025 tarihli olduğu bildirilen Cumhurbaşkanlığı genelgesi dahil) ve WCAG 2.2 | Uyumsuzluk | WCAG 2.2 AA hedefi; erişilebilirlik beyanı | Erişilebilirlik uzmanı |
| L-019 | Yaş sınırı ve küçükler | TMK; KVKK | Geçersiz rıza | 18+ varsayılan | Hukukçu |
| L-020 | VERBİS kayıt yükümlülüğü | KVKK Kurul kararları (eşikler ve istisnalar) | Kayıt yükümlülüğü ihlali | Yıllık kontrol görevi | KVKK uzmanı |
| L-021 | Mağaza politikaları | Apple App Store Review Guidelines (hesap silme, giriş servisleri, UGC, dijital mal satışı, gizlilik); Google Play politikaları (hesap silme, Veri güvenliği, UGC) | Red/kaldırılma | Faz 2 çıkış kapısı; uygulama içinde sponsorluk satışı yok | Ürün sahibi |
| L-022 | Yapay zekâ ile üretilmiş içerik | Reklam ve tüketici mevzuatındaki güncel açıklama yükümlülükleri | Yanıltma | A5.6 kuralları | Reklam hukukçusu |
| L-023 | Teklif talebinin (lead) işletmeye iletimi | KVKK aktarım ve aydınlatma | Dayanaksız aktarım | Faz 3; ayrı aydınlatma + onay | KVKK uzmanı |
| L-024 | Doğrulama kanıtlarının (fiş/fatura) işlenmesi | KVKK | Aşırı veri işleme | Maskeleme uyarısı; doğrulama sonrası silme | KVKK uzmanı |


## Faz 0'da eklenenler

### L-025: Dolaylı bağımlılık lisansları (LGPL/MPL/EPL)
- İlgili: REQ-GUV-013, §13.2 · Kayıt: `license-exceptions.json`, Q-003
- Neden: Next.js/Tailwind/Prisma'nın dolaylı bağımlılıkları izin listesi dışı lisans taşıyor (ör. `@img/sharp-libvips` LGPL-3.0, `lightningcss` MPL-2.0). Dağıtım biçimine göre yükümlülük doğabilir.
- Geçici önlem: Doğrudan bağımlılık olarak eklenmedi; CI yeni ihlali yakalar.
- Karar verecek: İnsan / hukuk danışmanı · Durum: AÇIK
