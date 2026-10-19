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
  auth: {
    loginTitle: 'Giriş yap',
    registerTitle: 'Üye ol',
    email: 'E-posta',
    password: 'Parola',
    passwordHint: 'En az 10 karakter. Yaygın parolalar kabul edilmez.',
    displayName: 'Görünen ad',
    displayNameHint: 'Değerlendirmelerinde bu ad görünür. Gerçek adın olmak zorunda değil.',
    ageConfirm: '18 yaşından büyüğüm.',
    termsConfirm: 'Kullanım koşullarını okudum ve kabul ediyorum.',
    privacyNotice: 'Kişisel verilerinin nasıl işlendiğini KVKK aydınlatma metninde okuyabilirsin.',
    submitLogin: 'Giriş yap',
    submitRegister: 'Üye ol',
    noAccount: 'Hesabın yok mu?',
    haveAccount: 'Zaten üye misin?',
    forgot: 'Parolanı mı unuttun?',
    logout: 'Çıkış yap',
    registered:
      'Teşekkürler. E-posta adresine bir doğrulama bağlantısı gönderdik. Bağlantıyı 24 saat içinde açman gerekiyor.',
    verifyOk: 'E-posta adresin doğrulandı. Artık değerlendirme yazabilirsin.',
    verifyFail: 'Doğrulama bağlantısı geçersiz ya da süresi dolmuş.',
    resetTitle: 'Parola sıfırlama',
    resetRequest: 'Sıfırlama bağlantısı gönder',
    resetRequested:
      'Bu e-posta adresiyle bir hesap varsa sıfırlama bağlantısı gönderdik. Bağlantı 30 dakika geçerlidir.',
    newPassword: 'Yeni parola',
    resetConfirm: 'Parolayı değiştir',
    resetDone:
      'Parolan değiştirildi ve tüm oturumların kapatıldı. Yeni parolanla giriş yapabilirsin.',
    accountTitle: 'Hesabım',
    emailUnverified: 'E-posta adresin henüz doğrulanmadı.',
    sessionsTitle: 'Açık oturumlar',
    thisDevice: 'Bu cihaz',
    endSession: 'Oturumu kapat',
    lastSeen: 'Son etkinlik',
  },
  errors: {
    INVALID_CREDENTIALS: 'E-posta ya da parola hatalı.',
    WEAK_PASSWORD:
      'Parola yeterince güçlü değil: en az 10 karakter olmalı ve yaygın bir parola olmamalı.',
    VALIDATION_FAILED: 'Formdaki bilgileri kontrol et.',
    RATE_LIMITED: 'Çok fazla deneme yapıldı. Biraz bekleyip yeniden dene.',
    INVALID_TOKEN: 'Bağlantı geçersiz ya da süresi dolmuş.',
    ACCOUNT_SUSPENDED: 'Hesabın askıya alınmış.',
    MFA_INVALID: 'Kod hatalı. Yeniden dene.',
    MFA_REQUIRED: 'İki adımlı doğrulama gerekli.',
    FORBIDDEN: 'Bu işlem için yetkin yok.',
    UNAUTHENTICATED: 'Oturumun sona erdi. Yeniden giriş yap.',
    STEP_UP_REQUIRED: 'Bu işlem için iki adımlı doğrulama kodunu yeniden girmen gerekiyor.',
    UNKNOWN: 'Beklenmeyen bir hata oluştu. Yeniden dene.',
  },
  admin: {
    title: 'Yönetim paneli',
    systemStatus: 'Sistem durumu',
    apiStatus: 'API',
    databaseStatus: 'Veritabanı',
    up: 'Çalışıyor',
    down: 'Erişilemiyor',
    unreachable: "API'ye ulaşılamadı.",
    phaseNotice: 'Yönetim modülleri Faz 1 dilimlerinde ekleniyor.',
    loginTitle: 'Personel girişi',
    mfaSetupTitle: 'İki adımlı doğrulamayı kur',
    mfaSetupIntro:
      'Panel için iki adımlı doğrulama zorunludur. Kimlik doğrulayıcı uygulamana aşağıdaki anahtarı ekle ve üretilen 6 haneli kodu gir.',
    mfaSecret: 'Kurulum anahtarı',
    mfaCode: 'Doğrulama kodu',
    mfaConfirm: 'Doğrula ve etkinleştir',
    mfaVerifyTitle: 'İki adımlı doğrulama',
    mfaVerifyIntro: 'Kimlik doğrulayıcı uygulamandaki kodu ya da bir kurtarma kodunu gir.',
    mfaVerify: 'Doğrula',
    recoveryTitle: 'Kurtarma kodların',
    recoveryIntro:
      'Bu kodları güvenli bir yerde sakla. Her biri bir kez kullanılabilir ve yalnızca şimdi gösterilir.',
    continue: 'Panele devam et',
    signedInAs: 'Oturum',
    openInApp: 'Kimlik doğrulayıcı uygulamada aç',
    recoveryHint: 'Kodu kaybedersen telefonuna erişemediğinde bu kodlardan birini kullanabilirsin.',
    roles: 'Roller',
  },
  legal: {
    draftBadge: 'TASLAK',
    draftNotice:
      'Bu metin taslaktır ve henüz hukuki incelemeden geçmemiştir. Yayına alınmadan önce bir hukukçu tarafından gözden geçirilecektir.',
    termsTitle: 'Kullanım koşulları',
    privacyTitle: 'KVKK aydınlatma metni',
    termsIntro:
      'İncelemeler; mekânları, hizmetleri ve etkinlikleri keşfetmen, karşılaştırman ve deneyimlerini paylaşman için bir platformdur.',
    termsAge: 'Üye olmak için 18 yaşından büyük olman gerekir.',
    termsAccount:
      'Hesabının güvenliğinden sen sorumlusun. Parolanı kimseyle paylaşma; şüpheli bir durumda oturumlarını Hesabım sayfasından kapatabilirsin.',
    termsContent:
      'Paylaştığın içerikler topluluk kurallarına uygun olmalıdır. Kurallara aykırı içerikler moderasyon sürecinde kaldırılabilir.',
    privacyIntro:
      'Üyelik için şu verileri işliyoruz: e-posta adresin, görünen adın, parolanın tek yönlü özeti (parolanın kendisi saklanmaz), 18 yaş beyanın ve kabul ettiğin koşulların sürümü.',
    privacySessions:
      'Oturumlarını güvenle yönetebilmek için oturum başına tarayıcı bilgisini ve IP adresinin kısaltılmış önekini saklıyoruz.',
    privacyRights:
      'Verilerine ilişkin taleplerin ve haklarının ayrıntıları hukuki inceleme sonrasında bu metne eklenecektir.',
  },
} as const;

export type Messages = typeof tr;
