'use client';

import { useEffect } from 'react';
import type { AnalyticsEventName } from '@incelemeler/contracts';
import { sendEvent } from '../../lib/analytics-client';
import { useConsent } from '../consent/consent';

const ENGAGED_MS = 30_000;

/**
 * Sayfa olayları (REQ-ANL-002): görüntüleme ve ≥ 30 sn okuma (kuzey yıldızı girdisi). Yalnızca analitik onayıyla;
 * onay yoksa hiçbir istek atılmaz (REQ-KVK-012).
 */
export function PageEvents({
  name,
  props,
  demo = false,
  engaged,
}: {
  name: AnalyticsEventName;
  props: Record<string, unknown>;
  demo?: boolean;
  engaged?: 'listing' | 'content';
}) {
  const { consent } = useConsent();
  const allowed = consent?.analytics === true;
  const key = JSON.stringify(props);
  useEffect(() => {
    if (!allowed) return;
    sendEvent(name, JSON.parse(key) as Record<string, unknown>, demo);
    if (!engaged) return;
    const timer = setTimeout(() => {
      if (document.visibilityState === 'visible') {
        sendEvent('engaged_30s', { pageType: engaged }, demo);
      }
    }, ENGAGED_MS);
    return () => clearTimeout(timer);
  }, [allowed, name, key, demo, engaged]);
  return null;
}

/** Listeleme CTA tıklamaları (dış yönlendirme) — `data-cta` taşıyan bağlantılar. */
export function OutboundEvents({ listingId, demo }: { listingId: string; demo: boolean }) {
  const { consent } = useConsent();
  const allowed = consent?.analytics === true;
  useEffect(() => {
    if (!allowed) return;
    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement | null)?.closest<HTMLAnchorElement>('a[data-cta]');
      if (a) sendEvent('outbound_click', { listingId, ctaType: a.dataset['cta'] ?? '' }, demo);
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, [allowed, listingId, demo]);
  return null;
}
