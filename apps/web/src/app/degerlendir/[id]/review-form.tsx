'use client';

import { useRouter } from 'next/navigation';
import { useActionState, useEffect, useRef, useState } from 'react';
import type { ReviewFormContext } from '@incelemeler/contracts';
import { tr } from '@incelemeler/i18n';
import { errorMessage } from '../../../lib/errors';
import { saveDraftAction, submitReviewAction, type ReviewFormState } from '../actions';
import { EMPTY_DRAFT, type DraftData } from './draft';

const R = tr.reviews;
type FieldCode = keyof typeof R.fieldErrors;

const storageKey = (id: string) => `degerlendirme-taslak:${id}`;
function readLocal(id: string): DraftData | null {
  try {
    const raw = localStorage.getItem(storageKey(id));
    return raw ? { ...EMPTY_DRAFT, ...(JSON.parse(raw) as Partial<DraftData>) } : null;
  } catch {
    return null;
  }
}
function writeLocal(id: string, d: DraftData) {
  try {
    localStorage.setItem(storageKey(id), JSON.stringify(d));
  } catch {
    // Depolama kapalıysa taslak yalnızca bellekte kalır.
  }
}
function clearLocal(id: string) {
  try {
    localStorage.removeItem(storageKey(id));
  } catch {
    // yok say
  }
}

const inputClass = 'block w-full rounded-md border border-border-strong bg-bg-default px-3 py-2';

/**
 * Değerlendirme formu (Ek A6.4): genel puan zorunlu (metin karşılıklı), türe göre deneyim alanları, metin
 * 50–5.000 (canlı sayaç), önceden işaretli olmayan beyanlar. Taslak cihazda (misafir) ve hesapta (üye)
 * otomatik kaydedilir; "Gönder"de giriş istenir ve taslak geri yüklenir.
 */
export function ReviewForm({
  ctx,
  signedIn,
  initial,
  reviewId,
  version,
}: {
  ctx: ReviewFormContext;
  signedIn: boolean;
  initial: DraftData | null;
  reviewId?: string;
  version?: number;
}) {
  const router = useRouter();
  const listingId = ctx.listing.id;
  const [d, setD] = useState<DraftData>(initial ?? EMPTY_DRAFT);
  const [restored, setRestored] = useState(false);
  const [state, action, pending] = useActionState<ReviewFormState, FormData>(
    submitReviewAction,
    {},
  );
  const summaryRef = useRef<HTMLDivElement>(null);
  const loaded = useRef(false);

  // İlk yükleme: düzenleme değilse cihazdaki taslak (misafir → giriş sonrası dahil) önceliklidir.
  useEffect(() => {
    if (reviewId) {
      loaded.current = true;
      return;
    }
    const local = readLocal(listingId);
    if (local) {
      setD(local);
      setRestored(true);
    } else if (initial) {
      setRestored(true);
    }
    loaded.current = true;
  }, [listingId, reviewId, initial]);

  // Otomatik kayıt: cihazda hemen, hesapta seyrek.
  useEffect(() => {
    if (!loaded.current || reviewId) return;
    writeLocal(listingId, d);
    if (!signedIn) return;
    const t = setTimeout(() => {
      void saveDraftAction(listingId, d as unknown as Record<string, unknown>);
    }, 2000);
    return () => clearTimeout(t);
  }, [d, listingId, signedIn, reviewId]);

  useEffect(() => {
    if (state.needsLogin) {
      writeLocal(listingId, d);
      router.push(`/giris?sonra=${encodeURIComponent(`/degerlendir/${listingId}`)}`);
    } else if (state.error) {
      if (!reviewId) writeLocal(listingId, d);
      summaryRef.current?.focus();
    }
    // d bilerek bağımlılık dışı: yalnızca yeni sonuçta çalışır.
  }, [state]);

  const set = <K extends keyof DraftData>(k: K, v: DraftData[K]) => setD((x) => ({ ...x, [k]: v }));
  const fe = state.fieldErrors ?? {};
  const err = (key: string) =>
    fe[key] ? (
      <p className="text-sm text-danger-text">
        {R.fieldErrors[fe[key] as FieldCode] ?? R.fieldErrors.invalid}
      </p>
    ) : null;
  const payload = JSON.stringify({
    listingId,
    ...(reviewId ? { reviewId, version } : {}),
    rating: d.rating,
    title: d.title.trim() || null,
    body: d.body,
    criteriaRatings: Object.entries(d.criteria).map(([criterionId, rating]) => ({
      criterionId,
      rating,
    })),
    experienceMonth: ctx.usesDuration ? null : d.experienceMonth || null,
    usageDuration: ctx.usesDuration ? d.usageDuration || null : null,
    visitContext: d.visitContext || null,
    declarations: {
      ownExperience: d.ownExperience,
      noConflict: d.noConflict,
      incentivized: d.incentivized,
    },
  });
  const thisMonth = new Date().toISOString().slice(0, 7);

  return (
    <form
      action={(fd) => {
        clearLocal(listingId);
        return action(fd);
      }}
      className="space-y-6"
      aria-label={R.writeTitle.replace('{ad}', ctx.listing.name)}
    >
      <input type="hidden" name="payload" value={payload} />
      {restored ? (
        <p role="status" className="text-sm text-text-secondary">
          {R.draftRestored}
        </p>
      ) : null}
      <div ref={summaryRef} tabIndex={-1}>
        {state.error ? (
          <div
            role="alert"
            className="rounded-md border border-border-strong px-4 py-3 text-sm text-danger-text"
          >
            {fe.listingId ? R.fieldErrors[fe.listingId as FieldCode] : errorMessage(state.error)}
          </div>
        ) : null}
      </div>

      <fieldset className="space-y-2">
        <legend className="font-medium">{R.rating}</legend>
        <div className="flex flex-wrap gap-2">
          {([1, 2, 3, 4, 5] as const).map((n) => (
            <label
              key={n}
              className={`flex min-h-11 cursor-pointer items-center gap-2 rounded-md border px-3 ${
                d.rating === n ? 'border-brand-default bg-bg-subtle' : 'border-border-strong'
              }`}
            >
              <input
                type="radio"
                name="rating-choice"
                value={n}
                checked={d.rating === n}
                onChange={() => set('rating', n)}
                required
              />
              <span>
                {'★'.repeat(n)} {R.ratingLabels[n]}
              </span>
            </label>
          ))}
        </div>
        {err('rating')}
      </fieldset>

      {ctx.usesDuration ? (
        <label className="block space-y-1">
          <span className="font-medium">{R.usageDuration}</span>
          <select
            value={d.usageDuration}
            onChange={(e) => set('usageDuration', e.target.value)}
            required
            className={inputClass}
          >
            <option value="">—</option>
            {Object.entries(R.usageDurations).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
          {err('usageDuration')}
        </label>
      ) : (
        <label className="block space-y-1">
          <span className="font-medium">{R.experienceMonth}</span>
          <input
            type="month"
            value={d.experienceMonth}
            max={thisMonth}
            min="2000-01"
            onChange={(e) => set('experienceMonth', e.target.value)}
            required
            className={inputClass}
          />
          {err('experienceMonth')}
        </label>
      )}

      <label className="block space-y-1">
        <span className="font-medium">{R.visitContext}</span>
        <select
          value={d.visitContext}
          onChange={(e) => set('visitContext', e.target.value)}
          required={ctx.requiresVisitContext}
          className={inputClass}
        >
          <option value="">{ctx.requiresVisitContext ? '—' : R.optionalNone}</option>
          {Object.entries(R.visitContexts).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
        {err('visitContext')}
      </label>

      {ctx.criteria.length ? (
        <fieldset className="space-y-3">
          <legend className="font-medium">{R.criteria}</legend>
          {ctx.criteria.map((c) => (
            <label key={c.id} className="flex flex-wrap items-center justify-between gap-2">
              <span>{c.name}</span>
              <select
                value={d.criteria[c.id] ?? ''}
                onChange={(e) =>
                  setD((x) => {
                    const criteria = { ...x.criteria };
                    if (e.target.value) criteria[c.id] = Number(e.target.value);
                    else delete criteria[c.id];
                    return { ...x, criteria };
                  })
                }
                className="min-h-11 rounded-md border border-border-strong bg-bg-default px-2"
              >
                <option value="">{R.optionalNone}</option>
                {[5, 4, 3, 2, 1].map((n) => (
                  <option key={n} value={n}>
                    {n} · {R.ratingLabels[n as 1 | 2 | 3 | 4 | 5]}
                  </option>
                ))}
              </select>
            </label>
          ))}
        </fieldset>
      ) : null}

      <label className="block space-y-1">
        <span className="font-medium">{R.titleField}</span>
        <input
          value={d.title}
          maxLength={100}
          onChange={(e) => set('title', e.target.value)}
          className={inputClass}
        />
      </label>

      <label className="block space-y-1">
        <span className="font-medium">{R.body}</span>
        <textarea
          value={d.body}
          rows={8}
          minLength={50}
          maxLength={5000}
          required
          aria-describedby="govde-ipucu govde-sayac"
          onChange={(e) => set('body', e.target.value)}
          className={inputClass}
        />
        <span id="govde-ipucu" className="block text-sm text-text-secondary">
          {R.bodyHint}
        </span>
        <span id="govde-sayac" className="block text-sm" aria-live="polite">
          {R.bodyCounter.replace('{n}', d.body.length.toLocaleString('tr-TR'))}
        </span>
        {err('body')}
      </label>

      <fieldset className="space-y-2">
        <legend className="font-medium">{R.declarations}</legend>
        <label className="flex min-h-11 items-start gap-2">
          <input
            type="checkbox"
            className="mt-1 h-5 w-5"
            checked={d.ownExperience}
            onChange={(e) => set('ownExperience', e.target.checked)}
            required
          />
          {R.ownExperience}
        </label>
        <label className="flex min-h-11 items-start gap-2">
          <input
            type="checkbox"
            className="mt-1 h-5 w-5"
            checked={d.noConflict}
            onChange={(e) => set('noConflict', e.target.checked)}
            required
          />
          {R.noConflict}
        </label>
        <div role="radiogroup" aria-label={R.incentivized} className="space-y-1">
          <p>{R.incentivized}</p>
          <div className="flex gap-4">
            {([true, false] as const).map((v) => (
              <label key={String(v)} className="flex min-h-11 items-center gap-2">
                <input
                  type="radio"
                  name="incentivized-choice"
                  checked={d.incentivized === v}
                  onChange={() => set('incentivized', v)}
                  required
                />
                {v ? R.yes : R.no}
              </label>
            ))}
          </div>
        </div>
        {err('declarations')}
      </fieldset>

      <button
        type="submit"
        disabled={pending}
        className="inline-flex min-h-11 items-center rounded-md bg-brand-default px-5 py-2 font-medium text-on-brand hover:bg-brand-hover disabled:opacity-60"
      >
        {signedIn ? R.submit : R.loginToSubmit}
      </button>
    </form>
  );
}
