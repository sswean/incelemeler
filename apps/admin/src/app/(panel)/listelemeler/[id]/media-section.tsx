import Link from 'next/link';
import type { AdminListing } from '@incelemeler/contracts';
import { tr } from '@incelemeler/i18n';
import { listingMediaCommandAction } from '../media-actions';
import { MediaUploadForm } from './media-upload-form';

/** Listeleme görselleri (REQ-VER-014): önizleme, lisans durumu, kapak seçimi, kaldırma. */
export function MediaSection({ listing }: { listing: AdminListing }) {
  return (
    <section aria-labelledby="gorseller" className="space-y-4">
      <h2 id="gorseller" className="text-lg font-semibold">
        {tr.media.title}
      </h2>
      <p className="text-sm text-text-secondary">{tr.media.intro}</p>
      {listing.media.length === 0 ? (
        <p className="text-sm">{tr.media.empty}</p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2" data-testid="listing-media">
          {listing.media.map((m) => (
            <li
              key={m.mediaId}
              className="space-y-2 rounded-md border border-border-default p-3 text-sm"
            >
              <img
                src={`/medya-icerik/${m.mediaId}`}
                alt={m.altText ?? ''}
                width={m.width}
                height={m.height}
                className="aspect-[4/3] w-full rounded object-cover"
              />
              <p>
                {m.role === 'PRIMARY' ? <strong>{tr.media.primary} · </strong> : null}
                <span className={m.licenseComplete ? 'text-success-text' : 'text-danger-text'}>
                  {m.licenseComplete ? tr.media.licenseOk : tr.media.licenseMissing}
                </span>
                {m.altText ? null : (
                  <span className="text-danger-text"> · {tr.media.altMissing}</span>
                )}
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href={`/medya/${m.mediaId}?listeleme=${listing.id}`}
                  className="min-h-11 content-center text-brand-default underline"
                >
                  {tr.media.editLicense}
                </Link>
                {(['primary', 'remove'] as const)
                  .filter((c) => c !== 'primary' || m.role !== 'PRIMARY')
                  .map((c) => (
                    <form key={c} action={listingMediaCommandAction}>
                      <input type="hidden" name="listingId" value={listing.id} />
                      <input type="hidden" name="mediaId" value={m.mediaId} />
                      <input type="hidden" name="command" value={c} />
                      <button type="submit" className="min-h-11 text-brand-default underline">
                        {c === 'primary' ? tr.media.makePrimary : tr.media.remove}
                      </button>
                    </form>
                  ))}
              </div>
            </li>
          ))}
        </ul>
      )}
      <MediaUploadForm listingId={listing.id} />
    </section>
  );
}
