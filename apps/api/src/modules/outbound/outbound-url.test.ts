import { describe, expect, it } from 'vitest';
import { checkTarget, classifyClick, expandTemplate } from './outbound-url.js';
import { isPrivateAddress } from './ssrf.js';

const allowed = ['ornek-otel.example', 'partner.example'];

describe('[REQ-AFF-002] açık yönlendirme yok: hedef denetimi', () => {
  it('izinli alan adı ve alt alan adı kabul edilir', () => {
    expect(checkTarget('https://ornek-otel.example/oda?x=1', allowed)).toMatchObject({ ok: true });
    expect(checkTarget('https://www.partner.example/a', allowed)).toMatchObject({
      ok: true,
      host: 'www.partner.example',
    });
  });

  it.each([
    ['//evil.example', 'invalid_url'],
    ['https:evil.example', 'domain_not_allowed'],
    ['https://evil.example/?u=https://ornek-otel.example', 'domain_not_allowed'],
    ['https://ornek-otel.example.evil.example/', 'domain_not_allowed'],
    ['https://evilornek-otel.example/', 'domain_not_allowed'],
    ['http://ornek-otel.example/', 'scheme'],
    ['javascript:alert(1)', 'scheme'],
    ['https://user:pass@ornek-otel.example/', 'credentials'],
    ['https://ornek-otel.example:8443/', 'port'],
    ['https://127.0.0.1/', 'ip_literal'],
    ['https://[::1]/', 'ip_literal'],
    ['https://örnek-otel.example/', 'domain_not_allowed'],
    ['https://оrnek-otel.example/', 'domain_not_allowed'],
  ])('%s → reddedilir (%s)', (url, reason) => {
    expect(checkTarget(url, allowed)).toEqual({ ok: false, reason });
  });

  it('Unicode izinli alan adı punycode ile karşılaştırılır', () => {
    expect(checkTarget('https://xn--rnek-4qa.example/', ['örnek.example'])).toMatchObject({
      ok: true,
    });
  });
});

describe('[REQ-AFF-006] alt kimlik şablonu', () => {
  it('yalnızca izinli yer tutucular; değerler URL kodlanır', () => {
    expect(
      expandTemplate('https://partner.example/r?sub={subId}&s={surface}', {
        subId: 'ldp/mekan 1',
        surface: 'listing_detail',
      }),
    ).toBe('https://partner.example/r?sub=ldp%2Fmekan%201&s=listing_detail');
    expect(() => expandTemplate('https://partner.example/?e={email}', {})).toThrow(/İzinsiz/);
  });
});

describe('[REQ-AFF-005] [REQ-AFF-007] tıklama sınıflama ve SSRF', () => {
  it('önceden getirme ve botlar ayrılır', () => {
    expect(
      classifyClick({ userAgent: 'Mozilla/5.0', secPurpose: 'prefetch', purpose: null }),
    ).toEqual({
      prefetch: true,
      bot: false,
    });
    expect(classifyClick({ userAgent: 'Googlebot/2.1', secPurpose: null, purpose: null }).bot).toBe(
      true,
    );
    expect(classifyClick({ userAgent: null, secPurpose: null, purpose: null }).bot).toBe(true);
  });

  it('özel ve yerel adresler engellenir', () => {
    for (const ip of [
      '10.0.0.1',
      '127.0.0.1',
      '169.254.169.254',
      '172.20.1.1',
      '192.168.1.1',
      '100.64.0.1',
      '::1',
      'fd00::1',
      'fe80::1',
      '::ffff:10.0.0.1',
      '0.0.0.0',
    ]) {
      expect(isPrivateAddress(ip), ip).toBe(true);
    }
    for (const ip of ['93.184.216.34', '2606:4700::1111'])
      expect(isPrivateAddress(ip), ip).toBe(false);
  });
});
