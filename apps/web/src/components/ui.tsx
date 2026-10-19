import type { ReactNode } from 'react';

export function Field(props: {
  id: string;
  label: string;
  type?: string;
  name?: string;
  required?: boolean;
  autoComplete?: string;
  hint?: string;
  defaultValue?: string;
  minLength?: number;
  maxLength?: number;
}) {
  const hintId = props.hint ? `${props.id}-ipucu` : undefined;
  return (
    <div className="space-y-1">
      <label htmlFor={props.id} className="block text-sm font-medium">
        {props.label}
      </label>
      <input
        id={props.id}
        name={props.name ?? props.id}
        type={props.type ?? 'text'}
        required={props.required}
        autoComplete={props.autoComplete}
        defaultValue={props.defaultValue}
        minLength={props.minLength}
        maxLength={props.maxLength}
        aria-describedby={hintId}
        className="block w-full rounded-md border border-border-strong bg-bg-default px-3 py-2 text-base"
      />
      {props.hint ? (
        <p id={hintId} className="text-sm text-text-secondary">
          {props.hint}
        </p>
      ) : null}
    </div>
  );
}

export function Checkbox(props: { id: string; label: ReactNode; required?: boolean }) {
  return (
    <div className="flex items-start gap-2">
      <input
        id={props.id}
        name={props.id}
        type="checkbox"
        required={props.required}
        value="1"
        className="mt-1 h-5 w-5 rounded border-border-strong"
      />
      <label htmlFor={props.id} className="text-sm">
        {props.label}
      </label>
    </div>
  );
}

export function SubmitButton({ children }: { children: ReactNode }) {
  return (
    <button
      type="submit"
      className="inline-flex min-h-11 items-center rounded-md bg-brand-default px-5 py-2 font-medium text-on-brand hover:bg-brand-hover"
    >
      {children}
    </button>
  );
}

export function Alert({
  kind,
  children,
}: {
  kind: 'error' | 'success' | 'info';
  children: ReactNode;
}) {
  const color =
    kind === 'error'
      ? 'text-danger-text'
      : kind === 'success'
        ? 'text-success-text'
        : 'text-text-secondary';
  return (
    <div
      role={kind === 'error' ? 'alert' : 'status'}
      className={`rounded-md border border-border-default bg-bg-subtle px-4 py-3 text-sm ${color}`}
    >
      {children}
    </div>
  );
}

export function PageTitle({ children }: { children: ReactNode }) {
  return <h1 className="text-2xl font-semibold">{children}</h1>;
}
