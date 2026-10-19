import {
  CONSENT_COOKIE,
  CONSENT_COOKIE_DAYS,
  CONSENT_TEXT_VERSION,
  type ConsentState,
  encodeConsent,
} from '@incelemeler/contracts';

export type ConsentChoice = Pick<ConsentState, 'functional' | 'analytics' | 'marketing'>;

/** Onay olmadan da kalan çerezler (zorunlu kategori). Diğer her şey onay geri alınınca silinir. */
const NECESSARY = new Set([CONSENT_COOKIE, '__Host-sid']);

function newId(): string {
  return crypto.randomUUID();
}

/** Zorunlu olmayan, JavaScript'ten görülebilen çerezleri siler (REQ-KVK-012 geri alma). */
export function clearNonEssentialCookies(): void {
  for (const part of document.cookie.split(';')) {
    const name = part.split('=')[0]?.trim();
    if (!name || NECESSARY.has(name)) continue;
    const host = location.hostname;
    for (const domain of ['', `; domain=${host}`, `; domain=.${host}`]) {
      document.cookie = `${name}=; Max-Age=0; path=/${domain}`;
    }
  }
}

/** Kararı çereze yazar ve sunucuya kaydettirir (consent_records). */
export async function saveConsent(
  previous: ConsentState | null,
  choice: ConsentChoice,
): Promise<ConsentState> {
  const next: ConsentState = {
    anonymousId: previous?.anonymousId ?? newId(),
    ...choice,
    at: Math.floor(Date.now() / 1000),
  };
  const secure = location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${CONSENT_COOKIE}=${encodeConsent(next)}; Max-Age=${
    CONSENT_COOKIE_DAYS * 86_400
  }; path=/; SameSite=Lax${secure}`;
  const withdrawn =
    previous &&
    ((previous.functional && !choice.functional) ||
      (previous.analytics && !choice.analytics) ||
      (previous.marketing && !choice.marketing));
  if (withdrawn || (!choice.functional && !choice.analytics && !choice.marketing)) {
    clearNonEssentialCookies();
  }
  await fetch('/olay/onay', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      anonymousId: next.anonymousId,
      ...choice,
      textVersion: CONSENT_TEXT_VERSION,
    }),
    keepalive: true,
  }).catch(() => undefined);
  return next;
}
