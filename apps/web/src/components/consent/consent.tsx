'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { createContext, type ReactNode, useContext, useEffect, useState } from 'react';
import type { ConsentState } from '@incelemeler/contracts';
import { consent } from '@incelemeler/i18n';
import { STATIC_PATHS } from '@incelemeler/routes';
import { landingSource, sendEvent } from '../../lib/analytics-client';
import { type ConsentChoice, saveConsent } from '../../lib/consent-client';

// Yalnızca kullanılan ad alanı istemci paketine girer (REQ-PRF-004).
const tr = { consent };

const T = tr.consent;
type Ctx = {
  consent: ConsentState | null;
  save: (choice: ConsentChoice) => Promise<void>;
};
const ConsentContext = createContext<Ctx | null>(null);

export function useConsent(): Ctx {
  const c = useContext(ConsentContext);
  if (!c) throw new Error('ConsentProvider eksik');
  return c;
}

/**
 * Onay kapısı (REQ-KVK-012): analitik/pazarlama betikleri yalnızca ilgili kategori onaylıysa render edilir
 * ("yükle ama gönderme" yok). Faz 1'de analitik sağlayıcı yok; D12 bu kapının arkasına eklenir.
 */
export function ConsentGate({
  category,
  children,
}: {
  category: 'functional' | 'analytics' | 'marketing';
  children: ReactNode;
}) {
  const { consent } = useConsent();
  return consent?.[category] ? <>{children}</> : null;
}

const BUTTON =
  'inline-flex min-h-11 min-w-44 items-center justify-center rounded-md border border-border-strong bg-bg-default px-4 py-2 text-base font-medium';

/**
 * İlk ziyaret bandı (REQ-KVK-011): üç eşit düğme, aynı katmanda; içeriği engellemez (çerez duvarı yok).
 */
function Banner({ onDone }: { onDone: () => void }) {
  const { save } = useConsent();
  const choose = async (all: boolean) => {
    await save({ functional: all, analytics: all, marketing: all });
    onDone();
  };
  return (
    <section
      aria-label={T.bannerLabel}
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border-strong bg-bg-default shadow-lg"
      data-testid="consent-banner"
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-4 md:flex-row md:items-center md:justify-between">
        <p className="text-sm">{T.bannerText}</p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <button type="button" className={BUTTON} onClick={() => choose(true)}>
            {T.acceptAll}
          </button>
          <button type="button" className={BUTTON} onClick={() => choose(false)}>
            {T.rejectAll}
          </button>
          <Link href="/cerez-tercihleri" className={BUTTON} onClick={onDone}>
            {T.manage}
          </Link>
        </div>
      </div>
    </section>
  );
}

export function ConsentProvider({
  initial,
  children,
}: {
  initial: ConsentState | null;
  children: ReactNode;
}) {
  const [consent, setConsent] = useState<ConsentState | null>(initial);
  const [bannerOpen, setBannerOpen] = useState(initial === null);
  // Tercih merkezinde bant gösterilmez (aynı kararı iki yerde sormayalım; düğmeleri örtmesin).
  const onPreferences = usePathname() === '/cerez-tercihleri';
  const save = async (choice: ConsentChoice) => {
    setConsent(await saveConsent(consent, choice));
  };
  // Giriş olayı: sekme başına bir kez, yalnızca analitik onayıyla (REQ-ANL-002).
  useEffect(() => {
    if (!consent?.analytics) return;
    try {
      if (sessionStorage.getItem('incelemeler-giris')) return;
      sessionStorage.setItem('incelemeler-giris', '1');
    } catch {
      return;
    }
    sendEvent('landing', { source: landingSource(document.referrer, location.hostname) });
  }, [consent?.analytics]);
  return (
    <ConsentContext.Provider value={{ consent, save }}>
      {children}
      {bannerOpen && !onPreferences ? <Banner onDone={() => setBannerOpen(false)} /> : null}
    </ConsentContext.Provider>
  );
}

/** Tercih merkezi (footer'dan tek tıkla): kategoriler önceden işaretli değil; geri alma tek eylem. */
export function ConsentPreferences() {
  const { consent, save } = useConsent();
  const [saved, setSaved] = useState(false);
  const rows: Array<{
    key: 'functional' | 'analytics' | 'marketing';
    label: string;
    desc: string;
  }> = [
    { key: 'functional', label: T.functional, desc: T.functionalDesc },
    { key: 'analytics', label: T.analytics, desc: T.analyticsDesc },
    { key: 'marketing', label: T.marketing, desc: T.marketingDesc },
  ];
  return (
    <form
      aria-label={T.title}
      className="space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        await save({
          functional: f.get('functional') === '1',
          analytics: f.get('analytics') === '1',
          marketing: f.get('marketing') === '1',
        });
        setSaved(true);
      }}
    >
      <div className="flex items-start gap-3 rounded-md border border-border-default p-3">
        <input id="necessary" type="checkbox" checked disabled readOnly className="mt-1 h-5 w-5" />
        <label htmlFor="necessary">
          <span className="font-medium">{T.necessary}</span>
          <span className="block text-sm text-text-secondary">{T.necessaryDesc}</span>
        </label>
      </div>
      {rows.map((r) => (
        <div
          key={r.key}
          className="flex items-start gap-3 rounded-md border border-border-default p-3"
        >
          <input
            id={r.key}
            name={r.key}
            type="checkbox"
            value="1"
            defaultChecked={consent?.[r.key] ?? false}
            className="mt-1 h-5 w-5"
          />
          <label htmlFor={r.key}>
            <span className="font-medium">{r.label}</span>
            <span className="block text-sm text-text-secondary">{r.desc}</span>
          </label>
        </div>
      ))}
      <button
        type="submit"
        className="min-h-11 rounded-md bg-brand-default px-5 font-medium text-on-brand"
      >
        {T.save}
      </button>
      {saved ? (
        <p role="status" className="text-sm">
          {T.saved}
        </p>
      ) : null}
      <p className="text-sm">
        <Link href={STATIC_PATHS.privacy} className="underline">
          {T.policyNote}
        </Link>
      </p>
    </form>
  );
}
