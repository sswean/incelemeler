import type { Metadata } from 'next';
import type { ExperienceType } from '@incelemeler/contracts';
import { tr } from '@incelemeler/i18n';
import { LegalDraft } from '../legal';

const M = tr.methodology;

/** Metodoloji metinleri TASLAK; hukuki incelemeye kadar arama motorlarına kapalı (A-015). */
export const draftMetadata = (title: string): Metadata => ({ title, robots: { index: false } });

function Bullets({ items }: { items: readonly string[] }) {
  return (
    <ul className="list-disc space-y-1 pl-6">
      {items.map((t) => (
        <li key={t}>{t}</li>
      ))}
    </ul>
  );
}

function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section aria-labelledby={id} className="space-y-2">
      <h2 id={id} className="text-xl font-semibold">
        {title}
      </h2>
      {children}
    </section>
  );
}

const EXPERIENCE_ORDER: ExperienceType[] = [
  'TESTED_IN_PERSON',
  'VISITED',
  'STAYED',
  'USED_LONG_TERM',
  'RESEARCH_ONLY',
];

export function MethodologyPage() {
  return (
    <LegalDraft title={M.title}>
      <Section id="olcekler" title={M.scalesTitle}>
        <p>{M.userScale}</p>
        <p>{M.editorScale}</p>
        <p>{M.neverMerged}</p>
      </Section>
      <Section id="esikler" title={M.thresholdsTitle}>
        <Bullets items={M.thresholds} />
      </Section>
      <Section id="bayes" title={M.bayesTitle}>
        <p>{M.bayesIntro}</p>
        <p className="rounded-md border border-border-default px-4 py-2 font-mono text-sm">
          {M.bayesFormula}
        </p>
        <Bullets items={M.bayesTerms} />
        <p>{M.bayesRules}</p>
      </Section>
      <Section id="deneyim" title={M.experienceTitle}>
        <p>{M.experienceIntro}</p>
        <Bullets items={EXPERIENCE_ORDER.map((e) => tr.content.experienceTypes[e])} />
        <p>{M.researchOnlyNote}</p>
      </Section>
      <Section id="test" title={M.testingTitle}>
        <p>{M.testing}</p>
      </Section>
    </LegalDraft>
  );
}

export function PolicyPage({ title, items }: { title: string; items: readonly string[] }) {
  return (
    <LegalDraft title={title}>
      <Bullets items={items} />
    </LegalDraft>
  );
}
