import { tr } from '@incelemeler/i18n';
import { PolicyPage, draftMetadata } from '../../components/methodology/pages';

export const metadata = draftMetadata(tr.methodology.sponsoredTitle);

export default function Page() {
  return <PolicyPage title={tr.methodology.sponsoredTitle} items={tr.methodology.sponsored} />;
}
