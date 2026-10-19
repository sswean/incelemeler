import type { AnalyticsEventName } from '@incelemeler/contracts';

const SESSION_KEY = 'incelemeler-oturum';

/** Sekme başına rastgele oturum kimliği (sessionStorage; kişisel veri değil). */
export function analyticsSession(): string {
  try {
    const existing = sessionStorage.getItem(SESSION_KEY);
    if (existing) return existing;
    const id = crypto.randomUUID();
    sessionStorage.setItem(SESSION_KEY, id);
    return id;
  } catch {
    return crypto.randomUUID();
  }
}

/** Olayı birinci taraf vekile gönderir. Çağıran, analitik onayını denetlemiş olmalıdır. */
export function sendEvent(
  name: AnalyticsEventName,
  props: Record<string, unknown>,
  demo = false,
): void {
  const body = JSON.stringify({
    name,
    sessionId: analyticsSession(),
    path: location.pathname,
    props,
    demo,
    automated: navigator.webdriver === true,
  });
  const blob = new Blob([body], { type: 'application/json' });
  if (!navigator.sendBeacon?.('/olay/analitik', blob)) {
    void fetch('/olay/analitik', {
      method: 'POST',
      body,
      headers: { 'Content-Type': 'application/json' },
      keepalive: true,
    }).catch(() => undefined);
  }
}

/** Giriş kaynağı sınıflaması: tam yönlendiren adresi değil yalnızca türü (kişisel veri yok). */
export function landingSource(
  referrer: string,
  ownHost: string,
): 'search' | 'social' | 'direct' | 'internal' | 'other' {
  if (!referrer) return 'direct';
  let host: string;
  try {
    host = new URL(referrer).hostname;
  } catch {
    return 'other';
  }
  if (host === ownHost) return 'internal';
  if (/(^|\.)(google|bing|yandex|duckduckgo|yahoo|ecosia)\./.test(host)) return 'search';
  if (
    /(^|\.)(facebook|instagram|x|twitter|t|linkedin|youtube|tiktok|pinterest|reddit)\./.test(host)
  ) {
    return 'social';
  }
  return 'other';
}
