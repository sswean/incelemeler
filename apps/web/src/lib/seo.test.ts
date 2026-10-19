import { describe, expect, it } from 'vitest';
import { jsonLdScript } from './seo';

describe('JSON-LD serileştirici', () => {
  it('[REQ-GUV-004] kullanıcı metni betik etiketini kapatamaz; veri bozulmadan geri okunur', () => {
    const data = { name: '</script><script>alert(1)</script>', description: 'a < b & "c"' };
    const out = jsonLdScript(data);
    expect(out).not.toContain('<');
    expect(out.toLowerCase()).not.toContain('</script');
    expect(JSON.parse(out)).toEqual(data);
  });
});
