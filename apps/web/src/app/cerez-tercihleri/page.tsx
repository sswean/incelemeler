import type { Metadata } from 'next';
import { tr } from '@incelemeler/i18n';
import { ConsentPreferences } from '../../components/consent/consent';
import { PageTitle } from '../../components/ui';

export const metadata: Metadata = { title: tr.consent.title, robots: { index: false } };

/** Çerez tercih merkezi (REQ-KVK-010…012). */
export default function CookiePreferencesPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageTitle>{tr.consent.title}</PageTitle>
      <p>{tr.consent.intro}</p>
      <ConsentPreferences />
    </div>
  );
}
