import { tr } from '@incelemeler/i18n';

type ListingFieldError = keyof typeof tr.listings.fieldErrors;
type Blocker = keyof typeof tr.listings.blockers;

export function listingFieldError(code: string | undefined): string | null {
  if (!code) return null;
  return code in tr.listings.fieldErrors
    ? tr.listings.fieldErrors[code as ListingFieldError]
    : tr.listings.fieldErrors.invalid;
}

export function blockerMessage(code: string): string {
  return code in tr.listings.blockers ? tr.listings.blockers[code as Blocker] : code;
}

/** Arayüzde gösterilen geçişler (yetki ve kurallar API'de denetlenir). */
export const UI_TRANSITIONS = {
  DRAFT: ['IN_REVIEW', 'PUBLISHED', 'ARCHIVED'],
  IN_REVIEW: ['DRAFT', 'PUBLISHED', 'ARCHIVED'],
  PUBLISHED: ['DRAFT', 'CLOSED_TEMPORARILY', 'CLOSED_PERMANENTLY', 'ARCHIVED'],
  CLOSED_TEMPORARILY: ['PUBLISHED', 'CLOSED_PERMANENTLY', 'ARCHIVED'],
  CLOSED_PERMANENTLY: ['PUBLISHED', 'ARCHIVED'],
  ARCHIVED: ['DRAFT'],
} as const;
