import { describe, expect, it } from 'vitest';
import { JsonLogger, maskText, redact } from './json-logger.js';

describe('JSON log ve maskeleme', () => {
  it('[REQ-GUV-014] kişisel veri ve sır kalıpları maskelenir', () => {
    const masked = maskText(
      'ayse@example.com 0555 111 22 33 +905551112233 Bearer abc.def.ghi 10000000146 203.0.113.9 TR33 0006 1005 1978 6457 8413 26',
    );
    expect(masked).not.toMatch(/ayse@|555|abc\.def|10000000146|203\.0|TR33/);
    expect(masked).toContain('[E-POSTA]');
    expect(masked).toContain('Bearer [GİZLİ]');
    expect(
      redact({ password: 'p', nested: { refreshToken: 'x', note: 'ali@example.com' }, n: 3n }),
    ).toEqual({
      password: '[GİZLİ]',
      nested: { refreshToken: '[GİZLİ]', note: '[E-POSTA]' },
      n: '3',
    });
  });

  it('[REQ-GUV-014] satır başına tek JSON kaydı; satır sonu enjeksiyonu etkisiz; düzeyler süzülür', () => {
    const lines: string[] = [];
    const logger = new JsonLogger(['warn', 'error'], (l) => lines.push(l));
    logger.log('görünmez', 'Ctx');
    logger.warn('kullanıcı adı: x\n{"level":"error","msg":"sahte"}', 'Auth');
    logger.warn(JSON.stringify({ event: 'search.event_failed', message: 'veli@example.com' }), 'S');
    logger.error({ msg: 'unhandled_error', err: 'Error: authorization=Bearer zzz' }, 'Filter');
    expect(lines).toHaveLength(3);
    for (const l of lines) {
      expect(l.endsWith('\n')).toBe(true);
      expect(l.slice(0, -1)).not.toContain('\n');
    }
    const [a, b, c] = lines.map((l) => JSON.parse(l) as Record<string, unknown>);
    expect(a).toMatchObject({ level: 'warn', context: 'Auth' });
    expect(b).toMatchObject({ event: 'search.event_failed', message: '[E-POSTA]', context: 'S' });
    expect(c).toMatchObject({ level: 'error', msg: 'unhandled_error' });
    expect(String(c!['err'])).not.toContain('zzz');
  });
});
