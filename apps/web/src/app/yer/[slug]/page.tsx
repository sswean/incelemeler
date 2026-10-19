import { ListingPage, listingMetadata } from '../../../components/listing/listing-page';

// ISR (ADR-0009): 60 sn; olay tabanlı geçersiz kılma outbox tüketicisiyle eklenecek.
export const revalidate = 60;
export const generateMetadata = listingMetadata;

export default function Page(props: { params: Promise<{ slug: string }> }) {
  return ListingPage(props, ['POI']);
}
