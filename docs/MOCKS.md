# Mock adaptörler ve sahte veri kaynakları (MOCKS)

Biçim: Ek C-8. Üretim derlemesinde MOCK yasaktır (§12.8).

_Dış sağlayıcıyı taklit eden MOCK adaptör henüz yoktur._ Not: `EmailPort`'un `MemoryEmailAdapter`'ı yalnız testlerde, `MailpitEmailAdapter`'ı yalnız yerel geliştirmede kullanılır; üretimde (`APP_ENV=production`) `disabled` dışındaki değer açılışta hata verir. Gerçek gönderim X-004 sağlanınca yazılır. İlk MOCK'lar Faz 1 dilim 8'de (dış entegrasyon portları: konaklama fiyat/müsaitlik, araç kiralama, harita) eklenecek ve burada M-001'den itibaren kaydedilecek.
