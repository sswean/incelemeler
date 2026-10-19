import { describe, expect, it } from 'vitest';
import { isLicenseComplete } from './media.js';

describe('[REQ-VER-014] görsel lisans alanları (Ek A14.6)', () => {
  const editor = {
    sourceType: 'EDITOR' as const,
    rightsHolder: 'İncelemeler editör ekibi',
    licenseType: 'Kurum içi çekim',
    permissionRef: null,
    licenseExpiresAt: null,
  };
  it('editör çekimi: kaynak, hak sahibi ve lisans türü yeterli', () => {
    expect(isLicenseComplete(editor)).toBe(true);
    expect(isLicenseComplete({ ...editor, rightsHolder: null })).toBe(false);
  });
  it('işletme ve stok görseli yazılı izin belgesi ister', () => {
    expect(isLicenseComplete({ ...editor, sourceType: 'OWNER' })).toBe(false);
    expect(isLicenseComplete({ ...editor, sourceType: 'STOCK', permissionRef: 'Lisans #42' })).toBe(
      true,
    );
  });
  it('süresi dolmuş lisans geçersiz', () => {
    const now = new Date('2026-10-19T00:00:00Z');
    expect(
      isLicenseComplete({ ...editor, licenseExpiresAt: '2026-10-18T00:00:00.000Z' }, now),
    ).toBe(false);
  });
});
