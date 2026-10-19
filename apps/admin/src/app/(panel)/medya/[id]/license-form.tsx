import type { MediaAsset } from '@incelemeler/contracts';
import { tr } from '@incelemeler/i18n';
import { SubmitButton } from '../../../../components/ui';
import { saveMediaLicenseAction } from './actions';

const inputClass =
  'block w-full rounded-md border border-border-strong bg-bg-default px-3 py-2 text-base';

function Text(props: {
  id: string;
  label: string;
  value: string | number | null;
  hint?: string;
  type?: string;
}) {
  return (
    <div className="space-y-1">
      <label htmlFor={props.id} className="block text-sm font-medium">
        {props.label}
      </label>
      <input
        id={props.id}
        name={props.id}
        type={props.type ?? 'text'}
        defaultValue={props.value ?? ''}
        aria-describedby={props.hint ? `${props.id}-ipucu` : undefined}
        className={inputClass}
      />
      {props.hint ? (
        <p id={`${props.id}-ipucu`} className="text-sm text-text-secondary">
          {props.hint}
        </p>
      ) : null}
    </div>
  );
}

/** Ek A14.6 lisans alanları. */
export function MediaLicenseForm({ media, back }: { media: MediaAsset; back: string | null }) {
  return (
    <form action={saveMediaLicenseAction} className="space-y-4" aria-label={tr.media.editLicense}>
      <input type="hidden" name="id" value={media.id} />
      <input type="hidden" name="version" value={media.version} />
      <input type="hidden" name="back" value={back ?? ''} />
      <Text
        id="altText"
        label={tr.media.altText}
        value={media.altText}
        hint={tr.media.altTextHint}
      />
      <div className="space-y-1">
        <label htmlFor="sourceType" className="block text-sm font-medium">
          {tr.media.sourceType}
        </label>
        <select
          id="sourceType"
          name="sourceType"
          defaultValue={media.sourceType ?? ''}
          className={inputClass}
        >
          <option value="">—</option>
          {(['EDITOR', 'OWNER', 'USER', 'STOCK'] as const).map((s) => (
            <option key={s} value={s}>
              {tr.media.sourceTypes[s]}
            </option>
          ))}
        </select>
      </div>
      <Text id="rightsHolder" label={tr.media.rightsHolder} value={media.rightsHolder} />
      <Text id="licenseType" label={tr.media.licenseType} value={media.licenseType} />
      <Text
        id="permissionRef"
        label={tr.media.permissionRef}
        value={media.permissionRef}
        hint={tr.media.permissionHint}
      />
      <Text
        id="licenseExpiresAt"
        label={tr.media.licenseExpiresAt}
        type="date"
        value={media.licenseExpiresAt?.slice(0, 10) ?? null}
      />
      <label className="flex min-h-11 items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="modelPropertyRelease"
          value="1"
          defaultChecked={media.modelPropertyRelease === true}
          className="h-5 w-5"
        />
        {tr.media.modelPropertyRelease}
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <Text id="focalX" label={tr.media.focalX} value={media.focalX} />
        <Text id="focalY" label={tr.media.focalY} value={media.focalY} />
      </div>
      <SubmitButton>{tr.admin.save}</SubmitButton>
    </form>
  );
}
