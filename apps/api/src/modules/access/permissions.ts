import type { StaffRole } from '@incelemeler/contracts';

/**
 * Rol × izin matrisi (REQ-HSP-009, docs/architecture/README.md). Her izin bir yetkilendirme testine bağlıdır.
 * İşletme/reklamveren yetkileri global rol değil, kuruluş üyeliğiyle verilir (Faz 3).
 */
export const PERMISSIONS = [
  'users.roles.assign',
  'system.settings',
  'taxonomy.manage',
  'listings.write',
  'listings.draft',
  'content.publish',
  'content.draft',
  'editorial.verdict.write',
  'reviews.moderate',
  'campaigns.manage',
  'campaigns.amount',
  'sponsored.content.write',
  'affiliate.manage',
  'outbound.add',
  'audit.read',
  'audit.read.own',
] as const;
export type Permission = (typeof PERMISSIONS)[number];

export const ROLE_PERMISSIONS: Record<StaffRole, readonly Permission[]> = {
  SUPER_ADMIN: PERMISSIONS,
  ADMIN: [
    'taxonomy.manage',
    'listings.write',
    'content.publish',
    'editorial.verdict.write',
    'reviews.moderate',
    'campaigns.manage',
    'campaigns.amount',
    'sponsored.content.write',
    'affiliate.manage',
    'outbound.add',
    'audit.read',
  ],
  EDITOR: [
    'listings.write',
    'content.publish',
    'editorial.verdict.write',
    'sponsored.content.write',
    'outbound.add',
  ],
  AUTHOR: ['listings.draft', 'content.draft'],
  MODERATOR: ['reviews.moderate', 'audit.read.own'],
  // Satış/Sponsorluk sorumlusu: editör değerlendirmelerine yayından önce erişimi yok (REQ-GUN-012).
  SALES: ['campaigns.manage', 'outbound.add', 'audit.read.own'],
};

export function can(roles: readonly StaffRole[], permission: Permission): boolean {
  return roles.some((r) => ROLE_PERMISSIONS[r].includes(permission));
}

export function permissionsOf(roles: readonly StaffRole[]): Permission[] {
  return PERMISSIONS.filter((p) => can(roles, p));
}
