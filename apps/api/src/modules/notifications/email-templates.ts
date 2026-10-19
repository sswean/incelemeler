import { lowerTr } from '@incelemeler/utils';

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

/** Hesap silme bildirimleri (REQ-KVK-020/021; TASLAK metinler — saklama süreleri hukuki incelemeyle kesinleşir). */
export const accountEmails = {
  confirmDeletion: (link: string) => ({
    subject: 'Hesap silme talebini onayla',
    text: `Merhaba,\n\nİncelemeler hesabının silinmesi için bir talep aldık. Onaylamak için bu bağlantıyı 1 saat içinde aç:\n${link}\n\nBu isteği sen yapmadıysan bu e-postayı yok sayabilirsin; hesabın değişmez.`,
  }),
  deletionScheduled: (date: string, cancelLink: string) => ({
    subject: 'Hesabın silinmek üzere',
    text: `Merhaba,\n\nHesabın "silme bekliyor" durumunda ve giriş kapatıldı. ${date} tarihinde hesabın, profilin, kaydedilenlerin, değerlendirmelerin ve taslakların silinecek. Güvenlik ve hukuki yükümlülük için tutulan denetim kayıtları erişimi kısıtlı olarak saklanır ve süre sonunda imha edilir.\n\nFikrini değiştirirsen bu tarihe kadar bu bağlantıyla silmeyi iptal edebilirsin:\n${cancelLink}`,
  }),
  deletionCancelled: () => ({
    subject: 'Hesap silme iptal edildi',
    text: 'Merhaba,\n\nHesap silme talebin iptal edildi; hesabın yeniden etkin. Giriş yapabilirsin.',
  }),
  deleted: () => ({
    subject: 'Hesabın silindi',
    text: 'Merhaba,\n\nİncelemeler hesabın ve ilişkili verilerin silindi. Bu e-posta bu adrese gönderdiğimiz son iletidir.',
  }),
};

/** KVKK başvuru bildirimleri (TASLAK metinler). */
export const privacyEmails = {
  verifyRequest: (link: string) => ({
    subject: 'KVKK başvurunu doğrula',
    text: `Merhaba,\n\nKişisel verilerinle ilgili bir başvuru aldık. Başvurunun sana ait olduğunu doğrulamak için bu bağlantıyı 72 saat içinde aç:\n${link}\n\nBu başvuruyu sen yapmadıysan bu e-postayı yok sayabilirsin.`,
  }),
  received: (days: number) => ({
    subject: 'KVKK başvurunu aldık',
    text: `Merhaba,\n\nBaşvurunu aldık ve kaydettik. En geç ${days} gün içinde sana yanıt vereceğiz.`,
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

/** Hesapsız başvuru bildirimleri (REQ-ISL-001/002; TASLAK metinler). */
export const applicationEmails = {
  verify: (kind: string, link: string) => ({
    subject: `${kind} başvurunu doğrula`,
    text: `Merhaba,\n\n${kind} başvurunu aldık. İncelemeye alabilmemiz için e-posta adresini bu bağlantıyla 72 saat içinde doğrula:\n${link}\n\nBu başvuruyu sen yapmadıysan bu e-postayı yok sayabilirsin; doğrulanmayan başvurular silinir.`,
  }),
  received: (kind: string) => ({
    subject: `${kind} başvurun incelemede`,
    text: `Merhaba,\n\nE-posta adresin doğrulandı; ${lowerTr(kind)} başvurun ekibimizin inceleme kuyruğunda. Sonucu bu adrese bildireceğiz.`,
  }),
  approved: (kind: string, name: string) => ({
    subject: `${kind} başvurun onaylandı`,
    text: `Merhaba,\n\n"${name}" için yaptığın başvuru onaylandı. Ekibimiz bilgileri doğruladıktan sonra seninle iletişime geçecek; yayına alma editoryal doğrulamadan sonra olur ve ücretli değildir.`,
  }),
  rejected: (kind: string, name: string, reason: string, note: string | null) => ({
    subject: `${kind} başvurun hakkında`,
    text: `Merhaba,\n\n"${name}" için yaptığın başvuruyu şu gerekçeyle kabul edemedik: ${reason}${note ? `\nAçıklama: ${note}` : ''}\n\nEksikleri tamamlayıp yeniden başvurabilirsin.`,
  }),
};
