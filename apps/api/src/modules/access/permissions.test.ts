import { describe, expect, it } from 'vitest';
import { can, PERMISSIONS, ROLE_PERMISSIONS } from './permissions.js';

describe('[REQ-HSP-009] rol × izin matrisi', () => {
  it('yalnızca süper yönetici rol atayabilir', () => {
    for (const role of Object.keys(ROLE_PERMISSIONS) as Array<keyof typeof ROLE_PERMISSIONS>) {
      expect(can([role], 'users.roles.assign')).toBe(role === 'SUPER_ADMIN');
    }
  });
  it('yazar yayımlayamaz, yalnızca taslak yazar', () => {
    expect(can(['AUTHOR'], 'content.publish')).toBe(false);
    expect(can(['AUTHOR'], 'content.draft')).toBe(true);
  });
  it('moderatör kampanya yönetemez ve listeleme yazamaz', () => {
    expect(can(['MODERATOR'], 'campaigns.manage')).toBe(false);
    expect(can(['MODERATOR'], 'listings.write')).toBe(false);
    expect(can(['MODERATOR'], 'reviews.moderate')).toBe(true);
  });
  it('[REQ-GUN-012] satış rolü editör değerlendirmesi yazamaz', () => {
    expect(can(['SALES'], 'editorial.verdict.write')).toBe(false);
    expect(can(['SALES'], 'campaigns.manage')).toBe(true);
    expect(can(['SALES'], 'campaigns.amount')).toBe(false);
  });
  it('kategori şemasını yalnızca süper yönetici ve yönetici yönetir', () => {
    expect(can(['EDITOR'], 'taxonomy.manage')).toBe(false);
    expect(can(['ADMIN'], 'taxonomy.manage')).toBe(true);
  });
  it('rolsüz kullanıcı hiçbir personel iznine sahip değil', () => {
    for (const p of PERMISSIONS) expect(can([], p)).toBe(false);
  });
});
