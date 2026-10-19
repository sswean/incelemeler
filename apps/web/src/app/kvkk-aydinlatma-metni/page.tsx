import type { Metadata } from 'next';
import { tr } from '@incelemeler/i18n';
import { LegalDraft } from '../../components/legal';

export const metadata: Metadata = { title: tr.legal.privacyTitle, robots: { index: false } };

export default function PrivacyPage() {
  return (
    <LegalDraft title={tr.legal.privacyTitle}>
      <p>{tr.legal.privacyIntro}</p>
      <p>{tr.legal.privacySessions}</p>
      <p>{tr.legal.privacyRights}</p>
    </LegalDraft>
  );
}
