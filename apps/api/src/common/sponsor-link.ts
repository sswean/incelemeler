/**
 * Moderasyonun sponsor bağlantısını sorduğu dar arayüz (REQ-GUN-004). `reviews` modülü sponsorluk modülünü
 * içe aktarmaz (REQ-MIM-005); uygulama modülü bu belirteci sponsorluk servisine bağlar.
 */
export abstract class SponsorLinkLookup {
  abstract isSponsorLinked(listingId: string): Promise<boolean>;
}
