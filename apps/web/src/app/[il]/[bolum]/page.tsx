import { HubRoute, hubMetadata, type HubProps } from '../../../components/hub/hub-page';

// ISR (ADR-0009): 60 sn; eşiğin altındaki hub 404.
export const revalidate = 60;
export const generateMetadata = hubMetadata;

export default function Page(props: HubProps) {
  return HubRoute(props);
}
