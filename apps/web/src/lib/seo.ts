import { absoluteUrl } from '@incelemeler/routes';

/** Herkese açık site kökü (canonical, site haritası, JSON-LD). */
export function siteUrl(): string {
  return process.env.SITE_URL ?? 'http://localhost:3000';
}

export function canonical(path: string): string {
  return absoluteUrl(siteUrl(), path);
}

/**
 * Arama motoru indekslemesi yalnızca `SITE_INDEXING=on` iken açılır (A-008). Canlıya geçiş ve bu
 * anahtarın açılması C sınıfıdır; varsayılan kapalıdır.
 */
export function indexingEnabled(): boolean {
  return process.env.SITE_INDEXING === 'on';
}

export function robots(indexable: boolean) {
  return indexingEnabled() && indexable
    ? { index: true, follow: true }
    : { index: false, follow: true };
}

/** JSON-LD'yi <script> içinde güvenle gömmek için `<` kaçışlanır (XSS). */
export function jsonLdScript(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}
