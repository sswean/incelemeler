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
