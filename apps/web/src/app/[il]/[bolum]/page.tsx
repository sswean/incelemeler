import { HubRoute, hubMetadata, type HubProps } from '../../../components/hub/hub-page';

// Dinamik: sponsorlu yerleşim kampanya bitince hemen kalkmalı (REQ-SPN-005, A-021); eşiğin altındaki hub 404.
export const dynamic = 'force-dynamic';
export const generateMetadata = hubMetadata;

export default function Page(props: HubProps) {
  return HubRoute(props);
}
