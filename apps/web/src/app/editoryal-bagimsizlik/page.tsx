import { tr } from '@incelemeler/i18n';
import { PolicyPage, draftMetadata } from '../../components/methodology/pages';

export const metadata = draftMetadata(tr.methodology.independenceTitle);

export default function Page() {
  return (
    <PolicyPage title={tr.methodology.independenceTitle} items={tr.methodology.independence} />
  );
}
