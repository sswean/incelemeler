import { describe, expect, it } from 'vitest';
import { parseCsv } from './csv.js';

describe('[REQ-LST-007] CSV ayrıştırma', () => {
  it('virgül ayraçlı, tırnaklı alan, kaçışlı tırnak ve alan içi satır sonu', () => {
    const { header, rows } = parseCsv(
      'ad,adres,not\r\n"Deniz, Balık",Kadıköy,"""Taze"" balık\nher gün"\r\nKafe,Moda,\n',
    );
    expect(header).toEqual(['ad', 'adres', 'not']);
    expect(rows).toEqual([
      ['Deniz, Balık', 'Kadıköy', '"Taze" balık\nher gün'],
      ['Kafe', 'Moda', ''],
    ]);
  });

  it('BOM ve noktalı virgül ayracı (Türkçe Excel çıktısı); boş satırlar atlanır', () => {
    const { header, rows } = parseCsv('\uFEFFad;enlem;boylam\n\nLokanta;40,99;29,03\n');
    expect(header).toEqual(['ad', 'enlem', 'boylam']);
    expect(rows).toEqual([['Lokanta', '40,99', '29,03']]);
  });

  it('kapanmamış tırnak hata verir', () => {
    expect(() => parseCsv('ad\n"Eksik')).toThrow('Kapanmamış tırnak');
  });
});
