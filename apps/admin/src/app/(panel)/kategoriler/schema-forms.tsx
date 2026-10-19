'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { tr } from '@incelemeler/i18n';
import { Alert, SubmitButton } from '../../../components/ui';
import { errorMessage } from '../../../lib/errors';
import type { CategoryFormState } from './actions';
import { fieldErrorMessage } from './field-errors';
import { addAttributeAction, addCriterionAction } from './schema-actions';

const TYPES = Object.keys(tr.taxonomy.types) as Array<keyof typeof tr.taxonomy.types>;
const inputClass =
  'block w-full rounded-md border border-border-strong bg-bg-default px-3 py-2 text-base';

function useResetOnSuccess(state: CategoryFormState) {
  const ref = useRef<HTMLFormElement>(null);
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (!state.error) ref.current?.reset();
  }, [state]);
  return ref;
}

function Errors({ state, field }: { state: CategoryFormState; field: string }) {
  const msg = fieldErrorMessage(state.fieldErrors?.[field]);
  return msg ? <p className="text-sm text-danger-text">{msg}</p> : null;
}

function TextInput(props: {
  id: string;
  label: string;
  hint?: string;
  required?: boolean;
  state: CategoryFormState;
  inputMode?: 'decimal';
}) {
  return (
    <div className="space-y-1">
      <label htmlFor={props.id} className="block text-sm font-medium">
        {props.label}
      </label>
      <input
        id={props.id}
        name={props.id.replace(/^(attr|crit)-/, '')}
        required={props.required}
        inputMode={props.inputMode}
        aria-describedby={props.hint ? `${props.id}-ipucu` : undefined}
        className={inputClass}
      />
      {props.hint ? (
        <p id={`${props.id}-ipucu`} className="text-sm text-text-secondary">
          {props.hint}
        </p>
      ) : null}
      <Errors state={props.state} field={props.id.replace(/^(attr|crit)-/, '')} />
    </div>
  );
}

export function AttributeForm({ categoryId }: { categoryId: string }) {
  const [state, action] = useActionState<CategoryFormState, FormData>(addAttributeAction, {});
  const ref = useResetOnSuccess(state);
  const [type, setType] = useState<(typeof TYPES)[number]>('BOOL');
  const choice = type === 'ENUM' || type === 'MULTI_ENUM';
  const numeric = type === 'INT' || type === 'DECIMAL';
  return (
    <form ref={ref} action={action} className="space-y-4" aria-label={tr.taxonomy.addAttribute}>
      <input type="hidden" name="categoryId" value={categoryId} />
      {state.error ? (
        <Alert kind="error">
          {state.fieldErrors && Object.keys(state.fieldErrors).length
            ? tr.errors.VALIDATION_FAILED
            : errorMessage(state.error)}
        </Alert>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <TextInput
          id="attr-key"
          label={tr.taxonomy.attrKey}
          hint={tr.taxonomy.attrKeyHint}
          required
          state={state}
        />
        <TextInput id="attr-label" label={tr.taxonomy.attrLabel} required state={state} />
      </div>
      <div className="space-y-1">
        <label htmlFor="attr-type" className="block text-sm font-medium">
          {tr.taxonomy.attrType}
        </label>
        <select
          id="attr-type"
          name="type"
          value={type}
          onChange={(e) => setType(e.target.value as (typeof TYPES)[number])}
          className={inputClass}
        >
          {TYPES.map((t) => (
            <option key={t} value={t}>
              {tr.taxonomy.types[t]}
            </option>
          ))}
        </select>
      </div>
      {choice ? (
        <div className="space-y-1">
          <label htmlFor="attr-options" className="block text-sm font-medium">
            {tr.taxonomy.attrOptions}
          </label>
          <textarea
            id="attr-options"
            name="options"
            rows={4}
            aria-describedby="attr-options-ipucu"
            className={inputClass}
          />
          <p id="attr-options-ipucu" className="text-sm text-text-secondary">
            {tr.taxonomy.attrOptionsHint}
          </p>
          <Errors state={state} field="options" />
        </div>
      ) : null}
      {numeric ? (
        <div className="grid gap-4 sm:grid-cols-3">
          <TextInput id="attr-unit" label={tr.taxonomy.attrUnit} state={state} />
          <TextInput id="attr-min" label={tr.taxonomy.attrMin} inputMode="decimal" state={state} />
          <TextInput id="attr-max" label={tr.taxonomy.attrMax} inputMode="decimal" state={state} />
        </div>
      ) : null}
      {type === 'TEXT' ? (
        <TextInput id="attr-maxLength" label={tr.taxonomy.attrMaxLength} state={state} />
      ) : null}
      <Errors state={state} field="validation" />
      <fieldset className="flex flex-wrap gap-x-6">
        <legend className="sr-only">{tr.taxonomy.flags}</legend>
        {(['filterable', 'showOnCard', 'required'] as const).map((f) => (
          <label key={f} className="flex min-h-11 items-center gap-2 text-sm">
            <input type="checkbox" name={f} value="1" className="h-5 w-5" />
            {tr.taxonomy[f]}
          </label>
        ))}
      </fieldset>
      <Errors state={state} field="filterable" />
      <Errors state={state} field="required" />
      <SubmitButton>{tr.taxonomy.addAttribute}</SubmitButton>
    </form>
  );
}

export function CriterionForm({ categoryId }: { categoryId: string }) {
  const [state, action] = useActionState<CategoryFormState, FormData>(addCriterionAction, {});
  const ref = useResetOnSuccess(state);
  return (
    <form ref={ref} action={action} className="space-y-4" aria-label={tr.taxonomy.addCriterion}>
      <input type="hidden" name="categoryId" value={categoryId} />
      {state.error && !state.fieldErrors?.name ? (
        <Alert kind="error">{errorMessage(state.error)}</Alert>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <TextInput id="crit-name" label={tr.taxonomy.criterionName} required state={state} />
        <TextInput id="crit-description" label={tr.taxonomy.criterionDescription} state={state} />
      </div>
      <SubmitButton>{tr.taxonomy.addCriterion}</SubmitButton>
    </form>
  );
}
