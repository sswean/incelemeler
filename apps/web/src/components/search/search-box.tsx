'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useId, useRef, useState } from 'react';
import type { SuggestResponse } from '@incelemeler/contracts';
import { tr } from '@incelemeler/i18n';

const S = tr.search;
const GROUPS: Array<[keyof SuggestResponse, string]> = [
  ['places', S.suggestPlaces],
  ['categories', S.suggestCategories],
  ['listings', S.suggestListings],
  ['articles', S.suggestArticles],
];

/**
 * Arama kutusu + otomatik tamamlama (REQ-ARA-010): ARIA 1.2 combobox, gruplu öneri listesi,
 * ok tuşları/Enter/Escape ile gezinme. Son aramalar Faz 1'de tutulmaz (rıza altyapısı D10).
 */
export function SearchBox({
  defaultValue = '',
  autoFocus = false,
}: {
  defaultValue?: string;
  autoFocus?: boolean;
}) {
  const router = useRouter();
  const id = useId();
  const listId = `${id}-oneriler`;
  const [value, setValue] = useState(defaultValue);
  const [data, setData] = useState<SuggestResponse | null>(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const abort = useRef<AbortController | null>(null);

  const items = data
    ? GROUPS.flatMap(([key]) => data[key].map((item) => ({ ...item, group: key })))
    : [];

  useEffect(() => {
    const q = value.trim();
    if (q.length < 2) {
      setData(null);
      setOpen(false);
      return;
    }
    const timer = setTimeout(async () => {
      abort.current?.abort();
      const ctrl = new AbortController();
      abort.current = ctrl;
      try {
        const res = await fetch(`/ara/oneri?q=${encodeURIComponent(q)}`, { signal: ctrl.signal });
        if (!res.ok) return;
        const json = (await res.json()) as SuggestResponse;
        setData(json);
        setActive(-1);
        setOpen(GROUPS.some(([k]) => json[k].length > 0));
      } catch {
        // İptal ya da ağ hatası: öneri göstermeden devam (arama formu yine çalışır).
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [value]);

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown' && items.length) {
      e.preventDefault();
      setOpen(true);
      setActive((a) => (a + 1) % items.length);
    } else if (e.key === 'ArrowUp' && items.length) {
      e.preventDefault();
      setOpen(true);
      setActive((a) => (a <= 0 ? items.length - 1 : a - 1));
    } else if (e.key === 'Escape' && open) {
      // Açık listeyi kapatır; tarayıcının arama kutusunu temizlemesini engeller.
      e.preventDefault();
      setOpen(false);
      setActive(-1);
    } else if (e.key === 'Enter' && open && active >= 0 && items[active]) {
      e.preventDefault();
      setOpen(false);
      router.push(items[active].path);
    }
  }

  let index = -1;
  return (
    <form action="/ara" method="get" role="search" className="relative" aria-label={S.title}>
      <label htmlFor={`${id}-q`} className="sr-only">
        {S.label}
      </label>
      <div className="flex gap-2">
        <input
          id={`${id}-q`}
          name="q"
          type="search"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={open && active >= 0 ? `${id}-o${active}` : undefined}
          autoComplete="off"
          autoFocus={autoFocus}
          enterKeyHint="search"
          maxLength={200}
          placeholder={S.placeholder}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={onKeyDown}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onFocus={() => setOpen(items.length > 0)}
          className="min-h-11 w-full rounded-md border border-border-strong bg-bg-default px-3 text-base"
        />
        <button
          type="submit"
          className="min-h-11 rounded-md bg-brand-default px-5 font-medium text-on-brand hover:bg-brand-hover"
        >
          {S.submit}
        </button>
      </div>
      <p className="sr-only" role="status" aria-live="polite">
        {open ? S.suggestStatus.replace('{n}', String(items.length)) : ''}
      </p>
      <div
        id={listId}
        role="listbox"
        aria-label={S.label}
        hidden={!open}
        className="absolute inset-x-0 top-full z-20 mt-1 max-h-96 overflow-auto rounded-md border border-border-default bg-bg-default shadow-lg"
      >
        {data
          ? GROUPS.map(([key, label]) =>
              data[key].length ? (
                <div key={key} role="group" aria-labelledby={`${id}-g-${key}`}>
                  <p
                    id={`${id}-g-${key}`}
                    className="px-3 pt-2 text-xs font-semibold text-text-secondary"
                  >
                    {label}
                  </p>
                  {data[key].map((item) => {
                    index++;
                    const i = index;
                    return (
                      <div
                        key={`${key}-${item.path}`}
                        id={`${id}-o${i}`}
                        role="option"
                        aria-selected={active === i}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          router.push(item.path);
                        }}
                        className={`min-h-11 cursor-pointer content-center px-3 py-1 ${
                          active === i ? 'bg-bg-subtle' : ''
                        }`}
                      >
                        <span className="font-medium">{item.title}</span>
                        {item.subtitle ? (
                          <span className="text-sm text-text-secondary"> · {item.subtitle}</span>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              ) : null,
            )
          : null}
      </div>
    </form>
  );
}
