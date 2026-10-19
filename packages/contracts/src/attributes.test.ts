import { describe, expect, it } from 'vitest';
import { attributeValuesSchema } from './attributes.js';

const defs = [
  { key: 'hasPrivateBathroom', type: 'BOOL', options: [], required: true, validation: {} },
  {
    key: 'tentType',
    type: 'ENUM',
    options: [
      { value: 'safari', label: 'Safari çadırı' },
      { value: 'bubble', label: 'Balon çadır' },
    ],
    required: false,
    validation: {},
  },
  { key: 'maxGuests', type: 'INT', options: [], required: false, validation: { min: 1, max: 12 } },
  {
    key: 'amenities',
    type: 'MULTI_ENUM',
    options: [
      { value: 'wifi', label: 'Wi-Fi' },
      { value: 'parking', label: 'Otopark' },
    ],
    required: false,
    validation: {},
  },
  { key: 'openedOn', type: 'DATE', options: [], required: false, validation: {} },
] as const;

describe('[REQ-VER-003] özellik değerlerinin şemaya karşı doğrulanması', () => {
  const schema = attributeValuesSchema(defs.map((d) => ({ ...d, options: [...d.options] })));

  it('geçerli değerler kabul edilir', () => {
    expect(
      schema.safeParse({
        hasPrivateBathroom: true,
        tentType: 'safari',
        maxGuests: 4,
        amenities: ['wifi'],
        openedOn: '2024-05-01',
      }).success,
    ).toBe(true);
    expect(schema.safeParse({ hasPrivateBathroom: false }).success).toBe(true);
  });

  it('bilinmeyen anahtar, yanlış tip, izinsiz seçenek ve aralık dışı değer reddedilir', () => {
    for (const bad of [
      { hasPrivateBathroom: true, unknownKey: 1 },
      { hasPrivateBathroom: 'evet' },
      { hasPrivateBathroom: true, tentType: 'igloo' },
      { hasPrivateBathroom: true, maxGuests: 0 },
      { hasPrivateBathroom: true, maxGuests: 2.5 },
      { hasPrivateBathroom: true, amenities: ['wifi', 'wifi'] },
      { hasPrivateBathroom: true, openedOn: '01.05.2024' },
    ]) {
      expect(schema.safeParse(bad).success, JSON.stringify(bad)).toBe(false);
    }
  });

  it('zorunlu özellik eksikse reddedilir', () => {
    expect(schema.safeParse({ tentType: 'bubble' }).success).toBe(false);
  });
});
