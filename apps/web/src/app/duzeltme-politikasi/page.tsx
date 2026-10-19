import { tr } from '@incelemeler/i18n';
import { PolicyPage, draftMetadata } from '../../components/methodology/pages';

export const metadata = draftMetadata(tr.methodology.correctionsTitle);

export default function Page() {
  return <PolicyPage title={tr.methodology.correctionsTitle} items={tr.methodology.corrections} />;
}
