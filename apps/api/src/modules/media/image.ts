import { crc32 } from 'node:zlib';
import { encode as encodeBlurhash } from 'blurhash';
import { imageSize } from 'image-size';
import jpeg from 'jpeg-js';
import { PNG } from 'pngjs';

export type ImageType = 'jpeg' | 'png' | 'webp';
export const MIME: Record<ImageType, string> = {
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
};

/** İçerik türü uzantıya/başlığa değil sihirli baytlara göre belirlenir (REQ-GUV-008). */
export function detectImageType(buf: Buffer): ImageType | null {
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'jpeg';
  if (
    buf.length >= 8 &&
    buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  ) {
    return 'png';
  }
  if (
    buf.length >= 12 &&
    buf.toString('ascii', 0, 4) === 'RIFF' &&
    buf.toString('ascii', 8, 12) === 'WEBP'
  ) {
    return 'webp';
  }
  return null;
}

// JPEG: APP1 (EXIF/XMP), APP13 (IPTC/Photoshop), COM silinir; APP0 (JFIF), APP2 (ICC), APP14 (Adobe) korunur.
const JPEG_DROP = new Set([0xe1, 0xed, 0xfe]);
const PNG_DROP = new Set(['eXIf', 'tEXt', 'zTXt', 'iTXt', 'tIME']);
const WEBP_DROP = new Set(['EXIF', 'XMP ']);

function stripJpeg(buf: Buffer): Buffer {
  const parts: Buffer[] = [buf.subarray(0, 2)];
  let i = 2;
  while (i + 4 <= buf.length) {
    if (buf[i] !== 0xff) throw new Error('JPEG yapısı bozuk');
    const marker = buf[i + 1]!;
    if (marker === 0xda) {
      parts.push(buf.subarray(i)); // SOS: görüntü verisi ve sonrası olduğu gibi
      return Buffer.concat(parts);
    }
    if (marker >= 0xd0 && marker <= 0xd9) {
      parts.push(buf.subarray(i, i + 2));
      i += 2;
      continue;
    }
    const len = buf.readUInt16BE(i + 2);
    const end = i + 2 + len;
    if (end > buf.length) throw new Error('JPEG segmenti taşıyor');
    if (!JPEG_DROP.has(marker)) parts.push(buf.subarray(i, end));
    i = end;
  }
  throw new Error('JPEG görüntü verisi yok');
}

function stripPng(buf: Buffer): Buffer {
  const parts: Buffer[] = [buf.subarray(0, 8)];
  let i = 8;
  while (i + 12 <= buf.length) {
    const len = buf.readUInt32BE(i);
    const type = buf.toString('ascii', i + 4, i + 8);
    const end = i + 12 + len;
    if (end > buf.length) throw new Error('PNG parçası taşıyor');
    if (!PNG_DROP.has(type)) parts.push(buf.subarray(i, end));
    i = end;
    if (type === 'IEND') return Buffer.concat(parts);
  }
  throw new Error('PNG IEND yok');
}

function stripWebp(buf: Buffer): Buffer {
  const chunks: Buffer[] = [];
  let i = 12;
  while (i + 8 <= buf.length) {
    const type = buf.toString('ascii', i, i + 4);
    const len = buf.readUInt32LE(i + 4);
    const end = i + 8 + len + (len % 2);
    if (end > buf.length + (len % 2)) throw new Error('WebP parçası taşıyor');
    if (!WEBP_DROP.has(type)) {
      const chunk = Buffer.from(buf.subarray(i, Math.min(end, buf.length)));
      // VP8X bayrakları: EXIF (0x08) ve XMP (0x04) bitleri temizlenir.
      if (type === 'VP8X' && chunk.length > 8) chunk[8] = chunk[8]! & ~0x0c;
      chunks.push(chunk);
    }
    i = end;
  }
  const body = Buffer.concat(chunks);
  const header = Buffer.alloc(12);
  header.write('RIFF', 0, 'ascii');
  header.writeUInt32LE(body.length + 4, 4);
  header.write('WEBP', 8, 'ascii');
  return Buffer.concat([header, body]);
}

/** EXIF/GPS, XMP, IPTC ve metin meta verilerini siler; görüntü baytlarına dokunmaz. */
export function stripMetadata(buf: Buffer, type: ImageType): Buffer {
  if (type === 'jpeg') return stripJpeg(buf);
  if (type === 'png') return stripPng(buf);
  return stripWebp(buf);
}

export function dimensions(buf: Buffer): { width: number; height: number } {
  const d = imageSize(buf);
  if (!d.width || !d.height) throw new Error('Boyut okunamadı');
  return { width: d.width, height: d.height };
}

/**
 * Bulanık yer tutucu (blurhash). JPEG/PNG saf JS ile çözülür; WebP için üretilmez (null).
 * Büyük görsellerde en yakın komşu örneklemesiyle ≤ 32 piksele indirilir.
 */
export function blurhashOf(buf: Buffer, type: ImageType): string | null {
  let w: number;
  let h: number;
  let data: Uint8Array;
  if (type === 'jpeg') {
    const img = jpeg.decode(buf, { useTArray: true, maxMemoryUsageInMB: 512 });
    ({ width: w, height: h, data } = img);
  } else if (type === 'png') {
    const img = PNG.sync.read(buf);
    ({ width: w, height: h } = img);
    data = img.data;
  } else {
    return null;
  }
  const scale = Math.min(1, 32 / Math.max(w, h));
  const sw = Math.max(1, Math.round(w * scale));
  const sh = Math.max(1, Math.round(h * scale));
  const small = new Uint8ClampedArray(sw * sh * 4);
  for (let y = 0; y < sh; y++) {
    for (let x = 0; x < sw; x++) {
      const src = (Math.floor(y / scale) * w + Math.floor(x / scale)) * 4;
      const dst = (y * sw + x) * 4;
      for (let c = 0; c < 4; c++) small[dst + c] = data[Math.min(src + c, data.length - 1)]!;
    }
  }
  return encodeBlurhash(small, sw, sh, 4, 3);
}

/** PNG parçası (testler ve meta veri üretimi için). */
export function pngChunk(type: string, data: Buffer): Buffer {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const typeBuf = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])) >>> 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}
