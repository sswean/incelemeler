import { tr } from '@incelemeler/i18n';
import { MethodologyPage, draftMetadata } from '../../components/methodology/pages';

export const metadata = draftMetadata(tr.methodology.title);

export default function Page() {
  return <MethodologyPage />;
}
