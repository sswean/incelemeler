import { describe, expect, it } from 'vitest';
import { withCase } from './suffix.js';

describe('[REQ-YRL-002] ek uyumu yardımcıları', () => {
  it.each([
    ['İzmir', "İzmir'de", "İzmir'e", "İzmir'in"],
    ['Kars', "Kars'ta", "Kars'a", "Kars'ın"],
    ['Antalya', "Antalya'da", "Antalya'ya", "Antalya'nın"],
    ['Muğla', "Muğla'da", "Muğla'ya", "Muğla'nın"],
    ['Bodrum', "Bodrum'da", "Bodrum'a", "Bodrum'un"],
    ['Ürgüp', "Ürgüp'te", "Ürgüp'e", "Ürgüp'ün"],
    ['Kadıköy', "Kadıköy'de", "Kadıköy'e", "Kadıköy'ün"],
    ['Kaş', "Kaş'ta", "Kaş'a", "Kaş'ın"],
    ['Datça', "Datça'da", "Datça'ya", "Datça'nın"],
    ['Nevşehir', "Nevşehir'de", "Nevşehir'e", "Nevşehir'in"],
    ['Hakkâri', "Hakkâri'de", "Hakkâri'ye", "Hakkâri'nin"],
    ['Göreme Ürgüp', "Göreme Ürgüp'te", "Göreme Ürgüp'e", "Göreme Ürgüp'ün"],
  ])('%s', (name, loc, dat, gen) => {
    expect(withCase(name, 'locative')).toBe(loc);
    expect(withCase(name, 'dative')).toBe(dat);
    expect(withCase(name, 'genitive')).toBe(gen);
  });

  it('sayıyla biten adlar son rakamın okunuşuna göre', () => {
    expect(withCase('Kanal 7', 'locative')).toBe("Kanal 7'de");
    expect(withCase('Salon 3', 'locative')).toBe("Salon 3'te");
    expect(withCase('Salon 6', 'genitive')).toBe("Salon 6'nın");
    expect(withCase('Salon 4', 'dative')).toBe("Salon 4'e");
  });

  it('okunuşu belirsiz adlarda null döner (ek gerektirmeyen kalıba düşülür)', () => {
    expect(withCase('TBMM', 'locative')).toBeNull();
    expect(withCase('Salon 10', 'locative')).toBeNull();
    expect(withCase('', 'locative')).toBeNull();
  });
});
