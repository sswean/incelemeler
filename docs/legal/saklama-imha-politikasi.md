# Kişisel Veri Saklama ve İmha Politikası — TASLAK

> **TASLAK (AK-12).** Bu belge hukuki incelemeden geçmemiştir. Mevzuat atıfları, azami süreler ve periyodik imha
> aralığının üst sınırı bir hukukçu tarafından doğrulanıp eklenecektir (L kaydı). Aşağıdaki süreler ürün
> varsayılanıdır ve `compliance_config` (`platform_settings.compliance`) üzerinden değiştirilir.

## Kapsam
Platformun işlediği kişisel veri kategorileri, saklama süreleri ve imha yöntemleri. Uygulama: `RetentionService`
(worker; günde bir), her çalışma `destruction_logs` tablosuna kategori, yöntem, adet ve kesim tarihiyle yazılır.

## Kategoriler ve varsayılan süreler

| Kategori | Saklama (varsayılan) | Yöntem | Not |
|---|---|---|---|
| Süresi dolmuş e-posta bağlantı belirteçleri | bitişten 7 gün sonra | Silme | |
| Süresi dolmuş oturumlar | bitişten 30 gün sonra | Silme | IP öneki ve tarayıcı bilgisi oturumla birlikte silinir |
| Hız sınırı sayaçları | 1 gün | Silme | |
| Değerlendirme taslakları | son güncellemeden 180 gün | Silme | |
| Arama olayları (kişisel veri içermez) | 365 gün | Silme | |
| Doğrulanmamış hesapsız başvurular (işletme, reklam) | oluşturmadan 7 gün | Silme | A-028 |
| Reddedilen hesapsız başvurular | karardan 365 gün | Silme | Onaylananlar iş ilişkisi süresince — **doğrulanacak** |
| Tıklama/sponsorlu olay oturum karması | 90 gün | Anonimleştirme (karma silinir) | Toplam sayılar kalır |
| Rıza kayıtlarındaki IP karması | 365 gün | Anonimleştirme | Rızanın kendisi ispat için kalır |
| Hesap silme talebi | geri alma penceresi 30 gün | Silme + hesap kaydının anonimleştirilmesi | A-022 |
| Denetim kayıtları | **doğrulanacak** | — | Güvenlik ve hukuki yükümlülük; erişim kısıtlı |
| KVKK başvuruları | **doğrulanacak** | — | |
| Hukuki talepler (bildirim-kaldırma) | **doğrulanacak** | — | Yanıt süreleri de doğrulanacak (L-013, A-031) |

## Yedekler
Yedeklerdeki kişisel verilerin imhası: yedek saklama süresi sonunda yedeğin tamamen silinmesiyle (X-002 barındırma
kararından sonra kesinleşir).

## Sorumluluk
Politika sahibi ve onaylayan: **belirlenecek** (İnsan).
