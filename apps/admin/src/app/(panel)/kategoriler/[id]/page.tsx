import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { tr } from '@incelemeler/i18n';
import { Alert, PageTitle } from '../../../../components/ui';
import { api, requireStaff } from '../../../../lib/session';
import { CategoryForm } from '../category-form';

export const metadata: Metadata = { title: tr.taxonomy.editCategory };
export const dynamic = 'force-dynamic';

export default async function EditCategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ durum?: string }>;
}) {
  const { token, user } = await requireStaff();
  const { id } = await params;
  const { durum } = await searchParams;
  const { data: category } = await (
    await api(token)
  ).GET('/v1/admin/categories/{id}', { params: { path: { id } } });
  if (!category) notFound();
  const canManage = user.permissions.includes('taxonomy.manage');
  return (
    <div className="max-w-2xl space-y-6 rounded-lg border border-border-default bg-bg-default p-6">
      <PageTitle>{category.name}</PageTitle>
      <p className="text-sm text-text-secondary">
        {tr.taxonomy.status}: {tr.taxonomy.statuses[category.status]} · /{category.slug}
      </p>
      {durum === 'kaydedildi' ? <Alert kind="success">{tr.admin.saved}</Alert> : null}
      {canManage ? (
        <CategoryForm category={category} parents={[]} />
      ) : (
        <Alert kind="info">{tr.admin.noPermission}</Alert>
      )}
    </div>
  );
}
