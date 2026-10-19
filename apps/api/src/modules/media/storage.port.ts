import {
  CreateBucketCommand,
  GetObjectCommand,
  HeadBucketCommand,
  NoSuchKey,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import type { Env } from '../../config/env.js';

export const STORAGE_PORT = Symbol('STORAGE_PORT');

export interface StoredObject {
  body: Buffer;
  contentType: string;
}

/** Nesne depolama (ADR-0007). Uygulama yalnızca bu portu kullanır; sağlayıcı X-002 kararına bağlı. */
export interface StoragePort {
  put(key: string, body: Buffer, contentType: string): Promise<void>;
  get(key: string): Promise<StoredObject | null>;
}

/** S3 uyumlu depolama (yerelde SeaweedFS, kimlik doğrulamasız geliştirme sunucusu). */
export class S3StorageAdapter implements StoragePort {
  private readonly s3: S3Client;
  private bucketReady: Promise<void> | null = null;

  constructor(private readonly env: Env) {
    this.s3 = new S3Client({
      endpoint: env.S3_ENDPOINT,
      region: env.S3_REGION,
      forcePathStyle: true,
      ...(env.S3_ACCESS_KEY_ID && env.S3_SECRET_ACCESS_KEY
        ? {
            credentials: {
              accessKeyId: env.S3_ACCESS_KEY_ID,
              secretAccessKey: env.S3_SECRET_ACCESS_KEY,
            },
          }
        : {}),
    });
  }

  /** Yerel/test ortamında kova yoksa oluşturulur; üretimde kova önceden hazırlanır (C sınıfı altyapı). */
  private ensureBucket(): Promise<void> {
    this.bucketReady ??= (async () => {
      try {
        await this.s3.send(new HeadBucketCommand({ Bucket: this.env.S3_BUCKET }));
      } catch (e) {
        if (this.env.APP_ENV === 'production') throw e;
        await this.s3.send(new CreateBucketCommand({ Bucket: this.env.S3_BUCKET }));
      }
    })();
    return this.bucketReady;
  }

  async put(key: string, body: Buffer, contentType: string): Promise<void> {
    await this.ensureBucket();
    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.env.S3_BUCKET,
        Key: key,
        Body: body,
        ContentType: contentType,
      }),
    );
  }

  async get(key: string): Promise<StoredObject | null> {
    await this.ensureBucket();
    try {
      const res = await this.s3.send(
        new GetObjectCommand({ Bucket: this.env.S3_BUCKET, Key: key }),
      );
      const bytes = await res.Body?.transformToByteArray();
      return bytes
        ? { body: Buffer.from(bytes), contentType: res.ContentType ?? 'application/octet-stream' }
        : null;
    } catch (e) {
      if (e instanceof NoSuchKey) return null;
      throw e;
    }
  }
}

/** Test adaptörü: nesneleri bellekte tutar (üretimde yasak — loadEnv). */
export class MemoryStorageAdapter implements StoragePort {
  readonly objects = new Map<string, StoredObject>();
  async put(key: string, body: Buffer, contentType: string): Promise<void> {
    this.objects.set(key, { body, contentType });
  }
  async get(key: string): Promise<StoredObject | null> {
    return this.objects.get(key) ?? null;
  }
}
