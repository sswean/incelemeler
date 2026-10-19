import { createHash } from 'node:crypto';
import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import {
  isLicenseComplete,
  MEDIA_LIMITS,
  type MediaAsset,
  type MediaUpdateBody,
} from '@incelemeler/contracts';
import { ProblemException } from '../../common/problem.js';
import type { RequestMeta } from '../../common/request-meta.js';
import type { MediaAsset as MediaRow, Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { AuthContext } from '../identity/auth.context.js';
import { OutboxService } from '../outbox/outbox.service.js';
import { AuditService } from '../platform/audit.service.js';
import { blurhashOf, detectImageType, dimensions, MIME, stripMetadata } from './image.js';
import { STORAGE_PORT, type StoragePort } from './storage.port.js';

export interface UploadedFile {
  buffer: Buffer;
  size: number;
}

const EXT = { jpeg: 'jpg', png: 'png', webp: 'webp' } as const;

function reject(
  status: HttpStatus,
  code: 'UNSUPPORTED_MEDIA_TYPE' | 'VALIDATION_FAILED',
  title: string,
) {
  return new ProblemException(status, code, title);
}

/**
 * Görsel işleme hattı (REQ-VER-014, Ek A14.6, ADR-0007): tür sihirli baytlarla doğrulanır, boyut ve piksel
 * sınırı (sıkıştırma bombası) denetlenir, EXIF/GPS/XMP/IPTC silinir, blurhash üretilir, özgün depoya yazılır.
 * Boyut/biçim varyantları teslimde (Next görüntü iyileştirici) üretilir. Kötü amaçlı içerik taraması X-010.
 */
@Injectable()
export class MediaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly outbox: OutboxService,
    @Inject(STORAGE_PORT) private readonly storage: StoragePort,
  ) {}

  async upload(
    ctx: AuthContext,
    file: UploadedFile | undefined,
    altText: string | undefined,
    meta: RequestMeta,
  ): Promise<MediaAsset> {
    if (!file?.buffer?.length) {
      throw reject(HttpStatus.UNPROCESSABLE_ENTITY, 'VALIDATION_FAILED', 'Dosya gerekli');
    }
    if (file.size > MEDIA_LIMITS.maxBytes) {
      throw new ProblemException(
        HttpStatus.PAYLOAD_TOO_LARGE,
        'PAYLOAD_TOO_LARGE',
        'Dosya çok büyük',
      );
    }
    const type = detectImageType(file.buffer);
    if (!type) {
      throw reject(
        HttpStatus.UNSUPPORTED_MEDIA_TYPE,
        'UNSUPPORTED_MEDIA_TYPE',
        'Yalnızca JPEG, PNG ve WebP',
      );
    }
    let size: { width: number; height: number };
    let clean: Buffer;
    try {
      size = dimensions(file.buffer);
      if (
        size.width > MEDIA_LIMITS.maxDimension ||
        size.height > MEDIA_LIMITS.maxDimension ||
        size.width * size.height > MEDIA_LIMITS.maxPixels
      ) {
        throw new Error('Boyut sınırı aşıldı');
      }
      clean = stripMetadata(file.buffer, type);
    } catch {
      throw reject(
        HttpStatus.UNPROCESSABLE_ENTITY,
        'VALIDATION_FAILED',
        'Görsel okunamadı ya da çok büyük',
      );
    }
    let hash: string | null = null;
    try {
      hash = blurhashOf(clean, type);
    } catch {
      hash = null; // Yer tutucu üretilemezse görsel yine kullanılabilir (bulanık önizlemesiz).
    }
    const sha256 = createHash('sha256').update(clean).digest('hex');
    const id = crypto.randomUUID();
    const storageKey = `media/${id}/original.${EXT[type]}`;
    await this.storage.put(storageKey, clean, MIME[type]);

    const row = await this.prisma.$transaction(async (tx) => {
      const created = await tx.mediaAsset.create({
        data: {
          id,
          storageKey,
          mime: MIME[type],
          bytes: clean.length,
          width: size.width,
          height: size.height,
          blurhash: hash,
          altText: altText?.trim() || null,
          exifStripped: true,
          sha256,
          uploadedById: ctx.userId,
          dataOrigin: 'EDITORIAL',
        },
      });
      await this.record(tx, ctx, 'media.upload', id, meta, {
        mime: MIME[type],
        bytes: clean.length,
      });
      await this.outbox.enqueue(tx, {
        type: 'media.uploaded',
        aggregateType: 'media',
        aggregateId: id,
      });
      return created;
    });
    return toMediaDto(row);
  }

  async get(id: string): Promise<MediaAsset> {
    return toMediaDto(await this.load(id));
  }

  async update(
    ctx: AuthContext,
    id: string,
    body: MediaUpdateBody,
    meta: RequestMeta,
  ): Promise<MediaAsset> {
    const current = await this.load(id);
    if (current.version !== body.version) {
      throw new ProblemException(
        HttpStatus.PRECONDITION_FAILED,
        'PRECONDITION_FAILED',
        'Görsel başka biri tarafından değiştirildi',
      );
    }
    const { version, licenseExpiresAt, ...rest } = body;
    const data = Object.fromEntries(Object.entries(rest).filter(([, v]) => v !== undefined));
    const row = await this.prisma.$transaction(async (tx) => {
      const res = await tx.mediaAsset.updateMany({
        where: { id, version },
        data: {
          ...data,
          ...(licenseExpiresAt !== undefined
            ? { licenseExpiresAt: licenseExpiresAt ? new Date(licenseExpiresAt) : null }
            : {}),
          version: { increment: 1 },
        },
      });
      if (res.count === 0) {
        throw new ProblemException(
          HttpStatus.PRECONDITION_FAILED,
          'PRECONDITION_FAILED',
          'Sürüm uyuşmazlığı',
        );
      }
      await this.record(tx, ctx, 'media.update', id, meta, {
        changed: Object.keys(body).filter((k) => k !== 'version'),
      });
      await this.outbox.enqueue(tx, {
        type: 'media.updated',
        aggregateType: 'media',
        aggregateId: id,
      });
      return tx.mediaAsset.findUniqueOrThrow({ where: { id } });
    });
    return toMediaDto(row);
  }

  async content(id: string): Promise<{ body: Buffer; contentType: string }> {
    const row = await this.load(id);
    const obj = await this.storage.get(row.storageKey);
    if (!obj) throw new ProblemException(HttpStatus.NOT_FOUND, 'NOT_FOUND', 'Görsel dosyası yok');
    return obj;
  }

  private async load(id: string): Promise<MediaRow> {
    const row = await this.prisma.mediaAsset.findUnique({ where: { id } });
    if (!row) throw new ProblemException(HttpStatus.NOT_FOUND, 'NOT_FOUND', 'Görsel bulunamadı');
    return row;
  }

  private record(
    tx: Prisma.TransactionClient,
    ctx: AuthContext,
    action: string,
    targetId: string,
    meta: RequestMeta,
    summary: Prisma.InputJsonObject,
  ) {
    return this.audit.record(
      {
        actorId: ctx.userId,
        actorRole: ctx.roles.join(','),
        action,
        targetType: 'media',
        targetId,
        summary,
        ipPrefix: meta.ipPrefix,
        traceId: meta.traceId,
      },
      tx,
    );
  }
}

export function toMediaDto(m: MediaRow): MediaAsset {
  const dto = {
    id: m.id,
    mime: m.mime,
    bytes: m.bytes,
    width: m.width,
    height: m.height,
    focalX: Number(m.focalX),
    focalY: Number(m.focalY),
    blurhash: m.blurhash,
    altText: m.altText,
    status: m.status,
    exifStripped: m.exifStripped,
    sourceType: m.sourceType,
    rightsHolder: m.rightsHolder,
    licenseType: m.licenseType,
    permissionRef: m.permissionRef,
    licenseExpiresAt: m.licenseExpiresAt?.toISOString() ?? null,
    modelPropertyRelease: m.modelPropertyRelease,
    dataOrigin: m.dataOrigin,
    createdAt: m.createdAt.toISOString(),
    version: m.version,
  };
  return { ...dto, licenseComplete: isLicenseComplete(dto) };
}
