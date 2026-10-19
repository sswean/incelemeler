import { describe, expect, it } from 'vitest';
import {
  AdminTakedownCreateBody,
  takedownAlert,
  TakedownCreateBody,
  TakedownUpdateBody,
} from './takedown.js';

const base = {
  requesterName: 'Av. Deniz Ak',
  requesterEmail: 'Deniz@Hukuk.example',
  requesterCapacity: 'REPRESENTATIVE',
  legalBasis: 'Müvekkilin fotoğrafı izinsiz kullanılmıştır; kaldırılmasını talep ederiz.',
  targetUrl: 'https://incelemeler.example/mekan/ornek',
};

describe('hukuki talepler', () => {
  it('[REQ-GUN-005] herkese açık form yalnızca hak sahibi talepleri; resmî kararlar ayrı akışta referansla', () => {
    expect(
      TakedownCreateBody.parse({ ...base, kind: 'COPYRIGHT', goodFaithAck: true }).requesterEmail,
    ).toBe('deniz@hukuk.example');
    expect(
      TakedownCreateBody.safeParse({ ...base, kind: 'COURT_ORDER', goodFaithAck: true }).success,
    ).toBe(false);
    expect(TakedownCreateBody.safeParse({ ...base, kind: 'COPYRIGHT' }).success).toBe(false);
    expect(AdminTakedownCreateBody.safeParse({ ...base, kind: 'COURT_ORDER' }).success).toBe(false);
    expect(
      AdminTakedownCreateBody.safeParse({
        ...base,
        kind: 'COURT_ORDER',
        authorityReference: 'İstanbul 5. SCH, 2026/123 D.İş',
      }).success,
    ).toBe(true);
  });

  it('[REQ-GUN-005] ret gerekçeli; otomatik kaldırma yalnızca değerlendirme hedefinde; süre uyarıları', () => {
    expect(TakedownUpdateBody.safeParse({ version: 1, status: 'REJECTED' }).success).toBe(false);
    expect(
      TakedownUpdateBody.safeParse({
        version: 1,
        status: 'ACTIONED',
        removeTarget: true,
        targetType: 'listing',
        targetId: '0192f0a0-0000-7000-8000-000000000001',
      }).success,
    ).toBe(false);
    const receivedAt = new Date('2026-10-19T00:00:00Z');
    const dueAt = new Date('2026-10-20T00:00:00Z');
    expect(
      takedownAlert({ status: 'RECEIVED', receivedAt, dueAt }, new Date('2026-10-19T12:00:00Z')),
    ).toBe('NONE');
    expect(
      takedownAlert({ status: 'RECEIVED', receivedAt, dueAt }, new Date('2026-10-19T20:00:00Z')),
    ).toBe('DUE_SOON');
    expect(
      takedownAlert({ status: 'IN_REVIEW', receivedAt, dueAt }, new Date('2026-10-20T01:00:00Z')),
    ).toBe('OVERDUE');
    expect(
      takedownAlert({ status: 'ACTIONED', receivedAt, dueAt }, new Date('2026-10-21T00:00:00Z')),
    ).toBe('NONE');
  });
});
