'use client';

import { type ReactNode, useEffect, useRef } from 'react';

const VISIBLE_RATIO = 0.5;
const DWELL_MS = 1000;

/**
 * Görüntülenen gösterim (REQ-SPN-009): öğenin ≥ %50'si ≥ 1 sn görünür alanda kalınca bir kez bildirilir.
 * Kişisel veri gönderilmez; yalnızca sunucunun imzaladığı yerleşim belirteci ve otomasyon işareti.
 */
export function ImpressionTracker({ token, children }: { token: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let sent = false;
    const send = () => {
      if (sent) return;
      sent = true;
      const body = JSON.stringify({
        token,
        type: 'VIEWED',
        automated: navigator.webdriver === true,
      });
      const blob = new Blob([body], { type: 'application/json' });
      if (!navigator.sendBeacon?.('/olay/sponsorlu', blob)) {
        void fetch('/olay/sponsorlu', {
          method: 'POST',
          body,
          headers: { 'Content-Type': 'application/json' },
          keepalive: true,
        }).catch(() => undefined);
      }
      observer.disconnect();
    };
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry && entry.intersectionRatio >= VISIBLE_RATIO) {
          timer ??= setTimeout(send, DWELL_MS);
        } else if (timer) {
          clearTimeout(timer);
          timer = null;
        }
      },
      { threshold: [0, VISIBLE_RATIO, 1] },
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
      if (timer) clearTimeout(timer);
    };
  }, [token]);
  return (
    <div ref={ref} data-testid="impression-tracker">
      {children}
    </div>
  );
}
