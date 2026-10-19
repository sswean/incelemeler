import type { Metadata } from 'next';
import { tr } from '@incelemeler/i18n';
import { Alert, PageTitle } from '../../../../components/ui';
import { api, requireStaff } from '../../../../lib/session';
import { CategoryForm } from '../category-form';

export const metadata: Metadata = { title: tr.taxonomy.newCategory };
export const dynamic = 'force-dynamic';

export default async function NewCategoryPage() {
  const { token, user } = await requireStaff();
  if (!user.permissions.includes('taxonomy.manage')) {
    return <Alert kind="error">{tr.errors.FORBIDDEN}</Alert>;
  }
  const { data } = await (await api(token)).GET('/v1/admin/categories');
  return (
    <div className="max-w-2xl space-y-6 rounded-lg border border-border-default bg-bg-default p-6">
      <PageTitle>{tr.taxonomy.newCategory}</PageTitle>
      <CategoryForm parents={(data?.data ?? []).filter((c) => c.depth < 3)} />
    </div>
  );
}
