/** İşlemsel e-posta metinleri (TASLAK; marka sesi "sen"). Ticari içerik eklenmez (A17.5). */
export const emailTemplates = {
  verifyEmail: (name: string, link: string) => ({
    subject: 'E-posta adresini doğrula',
    text: `Merhaba ${name},\n\nİncelemeler hesabını etkinleştirmek için bu bağlantıyı 24 saat içinde aç:\n${link}\n\nBu isteği sen yapmadıysan bu e-postayı yok sayabilirsin.`,
  }),
  alreadyRegistered: (link: string) => ({
    subject: 'Bu e-posta adresiyle zaten bir hesabın var',
    text: `Merhaba,\n\nBu e-posta adresiyle yeni bir kayıt denendi ama zaten bir hesabın var. Parolanı hatırlamıyorsan buradan sıfırlayabilirsin:\n${link}\n\nBu isteği sen yapmadıysan bir şey yapmana gerek yok.`,
  }),
  resetPassword: (link: string) => ({
    subject: 'Parola sıfırlama',
    text: `Merhaba,\n\nParolanı sıfırlamak için bu bağlantıyı 30 dakika içinde aç:\n${link}\n\nBu isteği sen yapmadıysan bu e-postayı yok sayabilirsin; parolan değişmez.`,
  }),
  passwordChanged: () => ({
    subject: 'Parolan değiştirildi',
    text: 'Merhaba,\n\nİncelemeler hesabının parolası değiştirildi ve tüm oturumlar kapatıldı. Bu değişikliği sen yapmadıysan hemen parolanı sıfırla.',
  }),
};

/** Değerlendirme ve moderasyon bildirimleri (A6.4: her geçişte işlemsel e-posta; TASLAK metinler). */
export const reviewEmails = {
  pending: (listing: string) => ({
    subject: 'Değerlendirmen incelemede',
    text: `Merhaba,\n\n"${listing}" için yazdığın değerlendirme incelemeye alındı. Sonucu sana e-postayla bildireceğiz; durumunu Hesabım › Değerlendirmelerim sayfasından da izleyebilirsin.`,
  }),
  published: (listing: string) => ({
    subject: 'Değerlendirmen yayında',
    text: `Merhaba,\n\n"${listing}" için yazdığın değerlendirme yayımlandı. Teşekkürler!`,
  }),
  rejected: (listing: string, reason: string, note: string | null) => ({
    subject: 'Değerlendirmen yayımlanmadı',
    text: `Merhaba,\n\n"${listing}" için yazdığın değerlendirme yayımlanmadı.\nGerekçe: ${reason}${note ? `\nAçıklama: ${note}` : ''}\n\nDeğerlendirmeni düzenleyip yeniden gönderebilir ya da 14 gün içinde bir kez itiraz edebilirsin (Hesabım › Değerlendirmelerim).`,
  }),
  removed: (listing: string, reason: string, note: string | null) => ({
    subject: 'Değerlendirmen kaldırıldı',
    text: `Merhaba,\n\n"${listing}" için yazdığın değerlendirme yayından kaldırıldı.\nGerekçe: ${reason}${note ? `\nAçıklama: ${note}` : ''}\n\n14 gün içinde bir kez itiraz edebilirsin (Hesabım › Değerlendirmelerim).`,
  }),
  reportDecided: (upheld: boolean) => ({
    subject: 'Bildirimin sonuçlandı',
    text: upheld
      ? 'Merhaba,\n\nBildirdiğin içerik incelendi ve topluluk kurallarına aykırı bulunarak kaldırıldı. Teşekkürler.'
      : 'Merhaba,\n\nBildirdiğin içerik incelendi; kurallara aykırı bulunmadı ve yayında kalıyor. Üye isen 14 gün içinde bir kez itiraz edebilirsin.',
  }),
  appealDecided: (overturned: boolean, note: string) => ({
    subject: 'İtirazın sonuçlandı',
    text: `Merhaba,\n\nİtirazın ilk kararı vermeyen bir moderatör tarafından incelendi. Sonuç: ${
      overturned ? 'itirazın kabul edildi, karar değiştirildi' : 'ilk karar korundu'
    }.\nAçıklama: ${note}`,
  }),
};
