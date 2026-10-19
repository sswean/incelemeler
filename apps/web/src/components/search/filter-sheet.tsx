'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { tr } from '@incelemeler/i18n';

const S = tr.search;

/**
 * Filtre paneli (REQ-ARA-012): mobilde alttan açılan sayfa (bottom sheet), masaüstünde yan sütun.
 * Etkin filtre sayısı rozetli; "Temizle" ve "Sonuçları göster (N)" — N, form değiştikçe canlı hesaplanır.
 * Form GET ile gönderilir: URL filtre durumunu yansıtır, geri tuşu çalışır.
 */
export function FilterSheet({
  children,
  activeCount,
  total,
  clearHref,
}: {
  children: ReactNode;
  activeCount: number;
  total: number;
  clearHref: string;
}) {
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState<number | null>(total);
  const trigger = useRef<HTMLButtonElement>(null);
  const sheet = useRef<HTMLDivElement>(null);
  const form = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!open) return;
    sheet.current?.querySelector<HTMLElement>('select, input, button, a')?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  function close() {
    setOpen(false);
    trigger.current?.focus();
  }

  async function recount() {
    if (!form.current) return;
    const params = new URLSearchParams();
    for (const [k, v] of new FormData(form.current))
      if (typeof v === 'string' && v) params.append(k, v);
    setCount(null);
    try {
      const res = await fetch(`/ara/sayi?${params.toString()}`);
      if (res.ok) setCount(((await res.json()) as { total: number }).total);
    } catch {
      // Sayı alınamazsa düğme sayısız gösterilir.
    }
  }

  return (
    <>
      <button
        ref={trigger}
        type="button"
        aria-expanded={open}
        aria-controls="filtre-paneli"
        onClick={() => setOpen(true)}
        className="min-h-11 rounded-md border border-border-strong px-4 md:hidden"
      >
        {activeCount ? S.filtersCount.replace('{n}', String(activeCount)) : S.filters}
      </button>
      {open ? (
        <div
          className="fixed inset-0 z-30 bg-text-primary/40 md:hidden"
          aria-hidden="true"
          onClick={close}
        />
      ) : null}
      <div
        id="filtre-paneli"
        ref={sheet}
        role={open ? 'dialog' : undefined}
        aria-modal={open ? true : undefined}
        aria-labelledby="filtre-baslik"
        className={`${
          open
            ? 'fixed inset-x-0 bottom-0 z-40 max-h-[85vh] overflow-y-auto rounded-t-xl'
            : 'hidden'
        } border border-border-default bg-bg-default p-4 md:static md:block md:max-h-none md:rounded-lg`}
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 id="filtre-baslik" className="text-lg font-semibold">
            {S.filters}
          </h2>
          {open ? (
            <button type="button" onClick={close} className="min-h-11 px-2 underline md:hidden">
              {S.close}
            </button>
          ) : null}
        </div>
        <form ref={form} action="/ara" method="get" onChange={recount} className="space-y-4">
          {children}
          <div className="sticky bottom-0 flex gap-2 bg-bg-default pt-2">
            <a
              href={clearHref}
              className="min-h-11 flex-1 content-center rounded-md border border-border-strong text-center"
            >
              {S.clear}
            </a>
            <button
              type="submit"
              className="min-h-11 flex-1 rounded-md bg-brand-default px-3 font-medium text-on-brand hover:bg-brand-hover"
            >
              {count === null ? S.showResultsPending : S.showResults.replace('{n}', String(count))}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
