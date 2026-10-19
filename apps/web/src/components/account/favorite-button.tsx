'use client';

import { useEffect, useState } from 'react';
import { tr } from '@incelemeler/i18n';

const T = tr.account;

/** Kaydet düğmesi: girişsiz kullanıcı tıklayınca girişe yönlenir, sonra sayfaya döner. */
export function FavoriteButton({ listingId, returnTo }: { listingId: string; returnTo: string }) {
  const [state, setState] = useState<{ signedIn: boolean; saved: boolean } | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    let alive = true;
    fetch(`/hesabim/kaydet?ilan=${listingId}`, { cache: 'no-store' })
      .then((r) => r.json() as Promise<{ signedIn: boolean; saved: boolean }>)
      .then((s) => alive && setState(s))
      .catch(() => alive && setState({ signedIn: false, saved: false }));
    return () => {
      alive = false;
    };
  }, [listingId]);

  const toggle = async () => {
    if (!state?.signedIn) {
      window.location.assign(`/giris?sonra=${encodeURIComponent(returnTo)}`);
      return;
    }
    setBusy(true);
    const r = await fetch('/hesabim/kaydet', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ilan: listingId, kaydet: !state.saved }),
    }).catch(() => null);
    if (r?.ok) setState((await r.json()) as { signedIn: boolean; saved: boolean });
    setBusy(false);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy || state === null}
      aria-pressed={state?.saved ?? false}
      className="inline-flex min-h-11 items-center rounded-md border border-border-strong px-5 py-2"
      data-testid="favorite-button"
    >
      {state?.saved ? T.savedState : T.save}
    </button>
  );
}
