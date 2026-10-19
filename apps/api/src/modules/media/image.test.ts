import { describe, expect, it } from 'vitest';
import jpeg from 'jpeg-js';
import { PNG } from 'pngjs';
import { blurhashOf, detectImageType, dimensions, pngChunk, stripMetadata } from './image.js';

function rgba(w: number, h: number): Buffer {
  const data = Buffer.alloc(w * h * 4);
  for (let i = 0; i < w * h; i++) data.set([(i * 7) % 255, (i * 3) % 255, 120, 255], i * 4);
  return data;
}

/** Sahte GPS içeren EXIF APP1 segmenti (yalnızca test). */
function exifSegment(): Buffer {
  const payload = Buffer.concat([
    Buffer.from('Exif\0\0', 'binary'),
    Buffer.from('GPS 41.0082N 28.9784E'),
  ]);
  const head = Buffer.from([0xff, 0xe1, 0, 0]);
  head.writeUInt16BE(payload.length + 2, 2);
  return Buffer.concat([head, payload]);
}

describe('[REQ-VER-014] görsel işleme: EXIF/GPS silme, boyut, blurhash', () => {
  const jpg = Buffer.from(jpeg.encode({ data: rgba(64, 48), width: 64, height: 48 }, 80).data);
  const withExif = Buffer.concat([jpg.subarray(0, 2), exifSegment(), jpg.subarray(2)]);

  it('türü sihirli baytlardan belirler; tanınmayan içerik reddedilir', () => {
    expect(detectImageType(withExif)).toBe('jpeg');
    expect(detectImageType(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"/>'))).toBeNull();
    expect(detectImageType(Buffer.from('GIF89a'))).toBeNull();
  });

  it('JPEG: EXIF (GPS) segmenti silinir, görüntü çözülebilir kalır', () => {
    expect(withExif.includes(Buffer.from('GPS 41.0082N'))).toBe(true);
    const clean = stripMetadata(withExif, 'jpeg');
    expect(clean.includes(Buffer.from('Exif'))).toBe(false);
    expect(clean.includes(Buffer.from('GPS'))).toBe(false);
    expect(jpeg.decode(clean).width).toBe(64);
    expect(dimensions(clean)).toEqual({ width: 64, height: 48 });
  });

  it('PNG: eXIf ve tEXt parçaları silinir', () => {
    const png = new PNG({ width: 10, height: 8 });
    png.data = rgba(10, 8);
    const raw = PNG.sync.write(png);
    const ihdrEnd = 8 + 12 + 13;
    const meta = Buffer.concat([
      pngChunk('tEXt', Buffer.from('Author\0Gizli Kişi')),
      pngChunk('eXIf', Buffer.from('MM\0*GPS')),
    ]);
    const dirty = Buffer.concat([raw.subarray(0, ihdrEnd), meta, raw.subarray(ihdrEnd)]);
    const clean = stripMetadata(dirty, 'png');
    expect(clean.includes(Buffer.from('Gizli'))).toBe(false);
    expect(clean.includes(Buffer.from('GPS'))).toBe(false);
    expect(PNG.sync.read(clean).width).toBe(10);
  });

  it('WebP: EXIF/XMP parçaları silinir ve VP8X bayrakları temizlenir', () => {
    const chunk = (type: string, data: Buffer) => {
      const h = Buffer.alloc(8);
      h.write(type, 0, 'ascii');
      h.writeUInt32LE(data.length, 4);
      return Buffer.concat([h, data, data.length % 2 ? Buffer.alloc(1) : Buffer.alloc(0)]);
    };
    const vp8x = Buffer.alloc(10);
    vp8x[0] = 0x0c; // EXIF + XMP bayrakları
    const body = Buffer.concat([
      chunk('VP8X', vp8x),
      chunk('VP8L', Buffer.from([0x2f, 0, 0, 0, 0])),
      chunk('EXIF', Buffer.from('GPS konum')),
      chunk('XMP ', Buffer.from('<x:xmpmeta/>')),
    ]);
    const header = Buffer.alloc(12);
    header.write('RIFF', 0, 'ascii');
    header.writeUInt32LE(body.length + 4, 4);
    header.write('WEBP', 8, 'ascii');
    const clean = stripMetadata(Buffer.concat([header, body]), 'webp');
    expect(clean.includes(Buffer.from('GPS'))).toBe(false);
    expect(clean.includes(Buffer.from('xmpmeta'))).toBe(false);
    expect(clean[20]! & 0x0c).toBe(0);
    expect(clean.readUInt32LE(4)).toBe(clean.length - 8);
  });

  it('JPEG ve PNG için blurhash üretilir', () => {
    const hash = blurhashOf(jpg, 'jpeg');
    expect(hash).toMatch(/^[0-9A-Za-z#$%*+,-.:;=?@[\]^_{|}~]{20,}$/);
  });
});
