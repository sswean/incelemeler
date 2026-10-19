import type { Metadata } from 'next';
import { tr } from '@incelemeler/i18n';
import { LegalDraft } from '../../components/legal';

export const metadata: Metadata = { title: tr.legal.termsTitle, robots: { index: false } };

export default function TermsPage() {
  return (
    <LegalDraft title={tr.legal.termsTitle}>
      <p>{tr.legal.termsIntro}</p>
      <p>{tr.legal.termsAge}</p>
      <p>{tr.legal.termsAccount}</p>
      <p>{tr.legal.termsContent}</p>
    </LegalDraft>
  );
}
