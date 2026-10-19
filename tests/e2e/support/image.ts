import jpeg from 'jpeg-js';

/**
 * Sentetik test deseni (degrade) + sahte GPS içeren EXIF segmenti. Gerçek bir yeri temsil etmez (AK-07);
 * yalnızca yükleme hattının meta veri silmesini doğrulamak için.
 */
export function testPatternJpeg(width = 320, height = 240): Buffer {
  const data = Buffer.alloc(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      data.set([(x * 255) / width, (y * 255) / height, 140, 255], (y * width + x) * 4);
    }
  }
  const jpg = Buffer.from(jpeg.encode({ data, width, height }, 85).data);
  const payload = Buffer.concat([
    Buffer.from('Exif\0\0', 'binary'),
    Buffer.from('GPS 41.0N 29.0E'),
  ]);
  const head = Buffer.from([0xff, 0xe1, 0, 0]);
  head.writeUInt16BE(payload.length + 2, 2);
  return Buffer.concat([jpg.subarray(0, 2), head, payload, jpg.subarray(2)]);
}
