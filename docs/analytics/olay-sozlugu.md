# Olay sözlüğü (REQ-ANL-002)

Kural: olaylar yalnızca **gerçek** kayıtlardan; kişisel veri yok; bot, otomasyon (`navigator.webdriver`), önceden
getirme, personel oturumu ve demo içerik işaretlenir ve raporlara girmez (REQ-ANL-005). Kullanıcı düzeyi olay verisi
`compliance_config.retention.analyticsEventsDays` (varsayılan 425 gün ≈ 14 ay) sonunda günlük toplama
(`analytics_daily`) dönüştürülüp silinir (REQ-ANL-006).

## A. Rızaya bağlı istemci olayları (`analytics_events`)
Yalnızca "Analitik" onayı varken gönderilir; vekil (`/olay/analitik`) onayı tercih çerezinden ayrıca denetler ve
anonim kimliği istemciden değil çerezden alır. Oturum kimliği sekme başına rastgele (sessionStorage).

| Olay | Tetiklenme anı | Özellikler | Kişisel veri | Rıza | Saklama |
|---|---|---|---|---|---|
| `landing` | Sekmede ilk sayfa (onay varsa) | `source`: search · social · direct · internal · other (yönlendiren adres saklanmaz) | Yok | Analitik | 14 ay → günlük toplam |
| `listing_viewed` | Listeleme sayfası açıldı | `listingId`, `kind` | Yok | Analitik | 〃 |
| `content_viewed` | İçerik sayfası açıldı (önizleme hariç) | `articleId` | Yok | Analitik | 〃 |
| `category_viewed` | Keşif/hub sayfası açıldı | `hubPath` | Yok | Analitik | 〃 |
| `engaged_30s` | Listeleme/içerik sayfasında 30 sn görünür kalındı | `pageType` | Yok | Analitik | 〃 |
| `favorite_added` | Kaydet düğmesi kaydetti | `listingId` | Yok | Analitik | 〃 |
| `outbound_click` | Listeleme CTA'sı tıklandı | `listingId`, `ctaType` | Yok | Analitik | 〃 |

Ortak alanlar: `path` (yalnızca yol; sorgu dizesi reddedilir), `sessionId`, `demo`, `automated`. IP ve kullanıcı ajanı
olaya yazılmaz (bot sınıflaması için yalnızca istek anında kullanılır).

## B. Rızadan bağımsız, çerezsiz sunucu kayıtları (REQ-ANL-003, REQ-KVK-013)

| v1 §18 olayı | Kaynak | Not |
|---|---|---|
| `search_performed`, `zero_result_search` | `search_events` (normalize sorgu, filtre özeti, sonuç sayısı) | Oturum karması yok; panoda yalnızca ≥ 3 kez aranan sorgular (k-anonimlik) |
| `sponsored_impression`, `sponsored_click` | `sponsored_events` (sunulan/görüntülenen/tıklama) | Görüntülenen tanımı: ≥ %50, ≥ 1 sn (X-032 doğrulaması açık) |
| `affiliate_click`, `outbound_click` (sunucu), `provider_redirected` | `outbound_clicks` | Günlük tuzlu oturum karması 90 gün sonra silinir |
| `review_submitted`, `review_published` | `reviews` tablosu (durum ve zaman damgaları) | Ayrı olay tutulmaz |
| `favorite_added` (sayım) | `favorites` tablosu | Ayrı olay tutulmaz |
| `consent_changed` | `consent_records` | IP yerine anahtarlı karma |
| `business_application_created`, `ad_application_created` | — | Faz 3 (başvuru akışları yok); panoda "Veri yok" |
| `newsletter_subscribed` | — | Bülten yok (sağlayıcı ve ticari ileti izni yok) |

## C. Panolar (REQ-ANL-004)
`/v1/admin/analytics/overview?days=7|30|90` — her yanıtta `generatedAt` (tazelik). Kuzey yıldızı (§6.3): `engaged_30s`,
`favorite_added` ya da `outbound_click` içeren farklı oturum sayısı. Organik trafik: `landing.source = search`.
