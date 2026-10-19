import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { tr } from '@incelemeler/i18n';
import { ArticleView } from '../../components/article/article-page';
import { serverApi } from '../../lib/api';

// İmzalı önizleme (REQ-ICR-005): her istekte sunucuda; arama motorlarına kapalı.
export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: tr.article.previewTitle,
  robots: { index: false, follow: false, nocache: true },
};

export default async function PreviewPage({
  searchParams,
}: {
  searchParams: Promise<{ belirtec?: string }>;
}) {
  const { belirtec } = await searchParams;
  if (!belirtec) notFound();
  const { data } = await serverApi().GET('/v1/preview/article', {
    params: { query: { token: belirtec } },
  });
  if (!data) notFound();
  return <ArticleView a={data} preview />;
}
