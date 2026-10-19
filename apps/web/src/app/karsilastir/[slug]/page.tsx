import { ArticleRoute, articleMetadata } from '../../../components/article/article-page';

export const revalidate = 60;
export const generateMetadata = articleMetadata;

export default function Page(props: { params: Promise<{ slug: string }> }) {
  return ArticleRoute(props, 'COMPARISON');
}
