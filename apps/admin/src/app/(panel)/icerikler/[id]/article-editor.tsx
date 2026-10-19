'use client';

import { useActionState, useState, type ReactNode } from 'react';
import type { AdminArticle, CommercialRelation, ExperienceType } from '@incelemeler/contracts';
import { tr } from '@incelemeler/i18n';
import { Alert, SubmitButton } from '../../../../components/ui';
import { errorMessage } from '../../../../lib/errors';
import {
  type ArticleFormState,
  saveArticleAction,
  searchListingsAction,
  uploadInlineMediaAction,
} from '../actions';
import { BLOCK_KINDS, type EditorBlock, emptyBlock, toBlock, toEditor } from './editor-blocks';

const C = tr.content;
const inputClass =
  'block w-full rounded-md border border-border-strong bg-bg-default px-3 py-2 text-base';
type FieldErrorCode = keyof typeof C.fieldErrors;

function Labeled({
  id,
  label,
  hint,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="block text-sm font-medium">
        {label}
      </label>
      {children}
      {hint ? <p className="text-sm text-text-secondary">{hint}</p> : null}
    </div>
  );
}

function ImageField({
  id,
  value,
  onChange,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  return (
    <div className="space-y-2">
      <Labeled id={id} label={C.mediaId}>
        <input
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={inputClass}
        />
      </Labeled>
      <label className="block text-sm">
        <span className="font-medium">{C.uploadImage}</span>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          disabled={busy}
          className={inputClass}
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            setBusy(true);
            setErr(null);
            const fd = new FormData();
            fd.set('file', file);
            const res = await uploadInlineMediaAction(fd);
            setBusy(false);
            if (res.id) onChange(res.id);
            else setErr(errorMessage(res.error));
          }}
        />
      </label>
      {err ? <p className="text-sm text-danger-text">{err}</p> : null}
      {/^[0-9a-f-]{36}$/i.test(value) ? (
        <p className="text-sm">
          <img src={`/medya-icerik/${value}`} alt="" className="max-h-40 rounded" />
          <a href={`/medya/${value}`} className="text-brand-default underline">
            {tr.media.editLicense}
          </a>
        </p>
      ) : null}
    </div>
  );
}

function ListingPicker({
  block,
  onChange,
}: {
  block: Extract<EditorBlock, { k: 'listingCard' }>;
  onChange: (b: EditorBlock) => void;
}) {
  const [q, setQ] = useState('');
  const [results, setResults] = useState<
    Array<{ id: string; name: string; kind: string; status: string }>
  >([]);
  return (
    <div className="space-y-2">
      <p className="text-sm">{block.listingId ? `${block.label || block.listingId}` : '—'}</p>
      <div className="flex gap-2">
        <input
          aria-label={C.listingSearch}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className={inputClass}
        />
        <button
          type="button"
          className="min-h-11 rounded-md border border-border-strong px-3"
          onClick={async () => setResults(await searchListingsAction(q))}
        >
          {C.listingSearch}
        </button>
      </div>
      <ul className="space-y-1">
        {results.map((r) => (
          <li key={r.id}>
            <button
              type="button"
              className="min-h-11 text-brand-default underline"
              onClick={() => onChange({ ...block, listingId: r.id, label: r.name })}
            >
              {C.choose}: {r.name} (
              {tr.taxonomy.kindLabels[r.kind as keyof typeof tr.taxonomy.kindLabels]})
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function BlockFields({ b, i, set }: { b: EditorBlock; i: number; set: (b: EditorBlock) => void }) {
  const id = (f: string) => `blok-${i}-${f}`;
  switch (b.k) {
    case 'heading':
      return (
        <div className="grid gap-3 sm:grid-cols-[8rem_1fr]">
          <Labeled id={id('level')} label={C.level}>
            <select
              id={id('level')}
              value={b.level}
              onChange={(e) => set({ ...b, level: Number(e.target.value) as 2 | 3 })}
              className={inputClass}
            >
              <option value={2}>H2</option>
              <option value={3}>H3</option>
            </select>
          </Labeled>
          <Labeled id={id('text')} label={C.blockTypes.heading}>
            <input
              id={id('text')}
              value={b.text}
              onChange={(e) => set({ ...b, text: e.target.value })}
              className={inputClass}
            />
          </Labeled>
        </div>
      );
    case 'paragraph':
    case 'infoBox':
    case 'quote':
      return (
        <div className="space-y-3">
          {b.k === 'infoBox' ? (
            <Labeled id={id('tone')} label={C.tone}>
              <select
                id={id('tone')}
                value={b.tone}
                onChange={(e) => set({ ...b, tone: e.target.value as 'tip' | 'warning' })}
                className={inputClass}
              >
                <option value="tip">{C.tip}</option>
                <option value="warning">{C.warning}</option>
              </select>
            </Labeled>
          ) : null}
          <Labeled id={id('markup')} label={C.blockTypes[b.k]} hint={C.markupHint}>
            <textarea
              id={id('markup')}
              rows={4}
              value={b.markup}
              onChange={(e) => set({ ...b, markup: e.target.value })}
              className={inputClass}
            />
          </Labeled>
          {b.k === 'quote' ? (
            <Labeled id={id('attr')} label={C.attribution}>
              <input
                id={id('attr')}
                value={b.attribution}
                onChange={(e) => set({ ...b, attribution: e.target.value })}
                className={inputClass}
              />
            </Labeled>
          ) : null}
        </div>
      );
    case 'list':
      return (
        <div className="space-y-3">
          <label className="flex min-h-11 items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={b.ordered}
              onChange={(e) => set({ ...b, ordered: e.target.checked })}
              className="h-5 w-5"
            />
            {C.ordered}
          </label>
          <Labeled
            id={id('lines')}
            label={C.blockTypes.list}
            hint={`${C.listItemsHint} ${C.markupHint}`}
          >
            <textarea
              id={id('lines')}
              rows={5}
              value={b.lines}
              onChange={(e) => set({ ...b, lines: e.target.value })}
              className={inputClass}
            />
          </Labeled>
        </div>
      );
    case 'image':
      return (
        <div className="space-y-3">
          <ImageField
            id={id('media')}
            value={b.mediaId}
            onChange={(v) => set({ ...b, mediaId: v })}
          />
          <Labeled id={id('caption')} label={C.caption}>
            <input
              id={id('caption')}
              value={b.caption}
              onChange={(e) => set({ ...b, caption: e.target.value })}
              className={inputClass}
            />
          </Labeled>
        </div>
      );
    case 'gallery':
      return (
        <Labeled id={id('ids')} label={C.blockTypes.gallery} hint={C.listItemsHint}>
          <textarea
            id={id('ids')}
            rows={4}
            value={b.ids}
            onChange={(e) => set({ ...b, ids: e.target.value })}
            className={inputClass}
          />
        </Labeled>
      );
    case 'table':
      return (
        <div className="space-y-3">
          <Labeled id={id('table')} label={C.blockTypes.table} hint={C.tableHint}>
            <textarea
              id={id('table')}
              rows={5}
              value={b.text}
              onChange={(e) => set({ ...b, text: e.target.value })}
              className={inputClass}
            />
          </Labeled>
          <Labeled id={id('caption')} label={C.caption}>
            <input
              id={id('caption')}
              value={b.caption}
              onChange={(e) => set({ ...b, caption: e.target.value })}
              className={inputClass}
            />
          </Labeled>
        </div>
      );
    case 'listingCard':
      return <ListingPicker block={b} onChange={set} />;
    case 'prosCons':
      return (
        <div className="grid gap-3 sm:grid-cols-2">
          <Labeled id={id('pros')} label={C.pros}>
            <textarea
              id={id('pros')}
              rows={4}
              value={b.pros}
              onChange={(e) => set({ ...b, pros: e.target.value })}
              className={inputClass}
            />
          </Labeled>
          <Labeled id={id('cons')} label={C.cons}>
            <textarea
              id={id('cons')}
              rows={4}
              value={b.cons}
              onChange={(e) => set({ ...b, cons: e.target.value })}
              className={inputClass}
            />
          </Labeled>
        </div>
      );
    case 'faq':
      return (
        <Labeled id={id('faq')} label={C.blockTypes.faq} hint={C.faqHint}>
          <textarea
            id={id('faq')}
            rows={6}
            value={b.text}
            onChange={(e) => set({ ...b, text: e.target.value })}
            className={inputClass}
          />
        </Labeled>
      );
  }
}

/** İçerik düzenleyici (REQ-ICR-001/002/006/007/008): meta alanları + blok listesi; kayıt API'de doğrulanır. */
export function ArticleEditor({ article }: { article: AdminArticle }) {
  const [state, action] = useActionState<ArticleFormState, FormData>(saveArticleAction, {});
  const [title, setTitle] = useState(article.title);
  const [slug, setSlug] = useState(article.slug);
  const [summary, setSummary] = useState(article.summary ?? '');
  const [interest, setInterest] = useState<CommercialRelation | ''>(
    article.interestDeclared ? article.commercialRelation : '',
  );
  const [experience, setExperience] = useState<ExperienceType | ''>(article.experienceType ?? '');
  const [experienceNote, setExperienceNote] = useState(article.experienceNote ?? '');
  const [selection, setSelection] = useState(article.selectionMethod ?? '');
  const [sources, setSources] = useState(
    article.sources.map((s) => (s.url ? `${s.title} | ${s.url}` : s.title)).join('\n'),
  );
  const [blocks, setBlocks] = useState<EditorBlock[]>(article.body.map(toEditor));
  const [kind, setKind] = useState<EditorBlock['k']>('paragraph');
  const [changeNote, setChangeNote] = useState('');
  const [significant, setSignificant] = useState(false);
  const published = article.status === 'PUBLISHED';
  const sponsored = article.type === 'SPONSORED';

  const payload = JSON.stringify({
    version: article.version,
    title,
    ...(article.publishedAt ? {} : { slug }),
    summary: summary.trim() || null,
    body: blocks.map(toBlock),
    sources: sources
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
      .map((l) => {
        const [t, u] = l.split('|').map((x) => x.trim());
        return u ? { title: t, url: u } : { title: t };
      }),
    ...(interest
      ? { interestDeclared: true, commercialRelation: interest }
      : { interestDeclared: false }),
    experienceType: experience || null,
    experienceNote: experienceNote.trim() || null,
    selectionMethod: selection.trim() || null,
    ...(published ? { changeNote: changeNote.trim(), significantChange: significant } : {}),
  });
  const move = (i: number, d: -1 | 1) =>
    setBlocks((bs) => {
      const next = [...bs];
      const j = i + d;
      if (j < 0 || j >= next.length) return bs;
      [next[i], next[j]] = [next[j]!, next[i]!];
      return next;
    });
  const fe = state.fieldErrors ?? {};
  const fieldMsg = (code?: string) =>
    code
      ? code in C.fieldErrors
        ? C.fieldErrors[code as FieldErrorCode]
        : C.fieldErrors.invalid
      : null;

  return (
    <form action={action} className="space-y-8" aria-label={C.title}>
      <input type="hidden" name="id" value={article.id} />
      <input type="hidden" name="payload" value={payload} />
      {state.error ? (
        <Alert kind="error">
          {Object.keys(fe).length
            ? `${tr.errors.VALIDATION_FAILED} ${Object.entries(fe)
                .map(([k, v]) => fieldMsg(v) ?? k)
                .join(' ')}`
            : errorMessage(state.error)}
        </Alert>
      ) : null}

      <section className="space-y-4">
        <Labeled id="title" label={C.titleField}>
          <input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={inputClass}
          />
        </Labeled>
        <Labeled id="slug" label={C.slug}>
          <input
            id="slug"
            value={slug}
            readOnly={!!article.publishedAt}
            onChange={(e) => setSlug(e.target.value)}
            className={inputClass}
          />
        </Labeled>
        <Labeled id="summary" label={C.summary}>
          <textarea
            id="summary"
            rows={2}
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            className={inputClass}
          />
        </Labeled>
      </section>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">{C.interestQuestion}</legend>
        {(sponsored ? (['SPONSORED'] as const) : (['NONE', 'GIFTED', 'AFFILIATE'] as const)).map(
          (v) => (
            <label key={v} className="flex min-h-11 items-center gap-2 text-sm">
              <input
                type="radio"
                name="interest"
                value={v}
                checked={interest === v}
                onChange={() => setInterest(v)}
              />
              {v === 'NONE'
                ? C.interestNone
                : v === 'GIFTED'
                  ? C.interestGifted
                  : v === 'AFFILIATE'
                    ? C.interestAffiliate
                    : C.interestSponsored}
            </label>
          ),
        )}
      </fieldset>

      {!sponsored ? (
        <section className="grid gap-4 sm:grid-cols-2">
          <Labeled id="experience" label={C.experience}>
            <select
              id="experience"
              value={experience}
              onChange={(e) => setExperience(e.target.value as ExperienceType | '')}
              className={inputClass}
            >
              <option value="">—</option>
              {(Object.keys(C.experienceTypes) as ExperienceType[]).map((x) => (
                <option key={x} value={x}>
                  {C.experienceTypes[x]}
                </option>
              ))}
            </select>
          </Labeled>
          <Labeled id="experienceNote" label={C.experienceNote}>
            <input
              id="experienceNote"
              value={experienceNote}
              onChange={(e) => setExperienceNote(e.target.value)}
              className={inputClass}
            />
          </Labeled>
        </section>
      ) : null}
      {article.type === 'LIST' ? (
        <Labeled id="selection" label={C.selectionMethod} hint={C.selectionHint}>
          <textarea
            id="selection"
            rows={3}
            value={selection}
            onChange={(e) => setSelection(e.target.value)}
            className={inputClass}
          />
        </Labeled>
      ) : null}

      <section className="space-y-4" aria-labelledby="bloklar">
        <h2 id="bloklar" className="text-lg font-semibold">
          {C.blocks}
        </h2>
        <ol className="space-y-4" data-testid="block-list">
          {blocks.map((b, i) => (
            <li key={i} className="space-y-3 rounded-md border border-border-default p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <strong className="text-sm">
                  {i + 1}. {C.blockTypes[b.k]}
                </strong>
                <div className="flex gap-2 text-sm">
                  <button
                    type="button"
                    className="min-h-11 px-2 underline"
                    onClick={() => move(i, -1)}
                    aria-label={`${C.moveUp}: ${i + 1}`}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    className="min-h-11 px-2 underline"
                    onClick={() => move(i, 1)}
                    aria-label={`${C.moveDown}: ${i + 1}`}
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    className="min-h-11 px-2 text-danger-text underline"
                    onClick={() => setBlocks((bs) => bs.filter((_, j) => j !== i))}
                  >
                    {C.removeBlock}
                  </button>
                </div>
              </div>
              <BlockFields
                b={b}
                i={i}
                set={(nb) => setBlocks((bs) => bs.map((x, j) => (j === i ? nb : x)))}
              />
            </li>
          ))}
        </ol>
        <div className="flex flex-wrap items-end gap-2">
          <Labeled id="newBlock" label={C.addBlock}>
            <select
              id="newBlock"
              value={kind}
              onChange={(e) => setKind(e.target.value as EditorBlock['k'])}
              className={inputClass}
            >
              {BLOCK_KINDS.map((k) => (
                <option key={k} value={k}>
                  {C.blockTypes[k]}
                </option>
              ))}
            </select>
          </Labeled>
          <button
            type="button"
            className="min-h-11 rounded-md border border-border-strong px-4"
            onClick={() => setBlocks((bs) => [...bs, emptyBlock(kind)])}
          >
            {C.addBlock}
          </button>
        </div>
      </section>

      <Labeled id="sources" label={C.sources} hint={C.sourcesHint}>
        <textarea
          id="sources"
          rows={3}
          value={sources}
          onChange={(e) => setSources(e.target.value)}
          className={inputClass}
        />
      </Labeled>

      {published ? (
        <section className="space-y-3">
          <Labeled id="changeNote" label={C.changeNote}>
            <input
              id="changeNote"
              value={changeNote}
              onChange={(e) => setChangeNote(e.target.value)}
              className={inputClass}
            />
          </Labeled>
          <label className="flex min-h-11 items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={significant}
              onChange={(e) => setSignificant(e.target.checked)}
              className="h-5 w-5"
            />
            {C.significantChange}
          </label>
        </section>
      ) : null}

      <SubmitButton>{tr.admin.save}</SubmitButton>
    </form>
  );
}
