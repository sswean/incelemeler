/**
 * tr-TR metin kataloğu (§4.3): arayüz metinleri yalnızca bu anahtarlarla kullanılır.
 * Hitap "sen" dilidir (B sınıfı karar, ADR ile değiştirilebilir).
 */
export const tr = {
  brand: {
    name: 'İncelemeler',
    slogan: 'Keşfet. Karşılaştır. Karar ver.',
  },
  common: {
    skipToContent: 'İçeriğe atla',
    retry: 'Yeniden dene',
    traceId: 'Destek kodu',
  },
  home: {
    exploreTitle: 'Ne keşfetmek istiyorsun?',
    exploreEmpty: 'Henüz yayımlanmış kategori yok.',
    loadError: 'Kategoriler şu an yüklenemedi.',
    phaseNotice:
      'Platform geliştirme aşamasında. Bu sayfada yalnızca yayımlanmış kategoriler gösterilir; henüz listeleme, puan ya da değerlendirme yoktur.',
  },
  admin: {
    title: 'Yönetim paneli',
    systemStatus: 'Sistem durumu',
    apiStatus: 'API',
    databaseStatus: 'Veritabanı',
    up: 'Çalışıyor',
    down: 'Erişilemiyor',
    unreachable: "API'ye ulaşılamadı.",
    phaseNotice:
      'Faz 0: Yönetim modülleri ve personel girişi (2FA zorunlu) Faz 1 dilimlerinde eklenecek.',
  },
} as const;

export type Messages = typeof tr;
