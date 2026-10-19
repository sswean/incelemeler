import { z } from 'zod';
import { CONSENT_ID_PATTERN } from './consent-cookie.js';

export * from './consent-cookie.js';

export const ConsentPurpose = z.enum(['FUNCTIONAL', 'ANALYTICS', 'MARKETING']);
export type ConsentPurpose = z.infer<typeof ConsentPurpose>;

export const ConsentBody = z.object({
  anonymousId: z.string().regex(CONSENT_ID_PATTERN),
  functional: z.boolean(),
  analytics: z.boolean(),
  marketing: z.boolean(),
  textVersion: z.string().min(1).max(40),
  channel: z.enum(['WEB', 'IOS', 'ANDROID']).default('WEB'),
});
export type ConsentBody = z.infer<typeof ConsentBody>;
