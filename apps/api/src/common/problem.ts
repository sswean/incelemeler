import { HttpException, HttpStatus } from '@nestjs/common';
import type { ErrorCode, Problem } from '@incelemeler/contracts';

const TYPE_BASE = 'https://incelemeler.com.tr/problems/';

export interface FieldError {
  pointer: string;
  code: string;
  message: string;
}

/** RFC 9457 problem+json olarak yanıtlanan uygulama hatası (REQ-MIM-010). */
export class ProblemException extends HttpException {
  constructor(
    status: HttpStatus,
    readonly code: ErrorCode,
    readonly title: string,
    readonly detail?: string,
    readonly fieldErrors?: FieldError[],
  ) {
    super(title, status);
  }

  toProblem(instance: string, traceId: string): Problem {
    return {
      type: TYPE_BASE + this.code.toLowerCase().replace(/_/g, '-'),
      title: this.title,
      status: this.getStatus(),
      ...(this.detail ? { detail: this.detail } : {}),
      instance,
      code: this.code,
      traceId,
      ...(this.fieldErrors?.length ? { errors: this.fieldErrors } : {}),
    };
  }
}

export function problemFor(status: number, instance: string, traceId: string): Problem {
  const map: Record<number, [ErrorCode, string]> = {
    400: ['VALIDATION_FAILED', 'İstek geçersiz'],
    401: ['UNAUTHENTICATED', 'Kimlik doğrulaması gerekli'],
    403: ['FORBIDDEN', 'Bu işlem için yetkin yok'],
    404: ['NOT_FOUND', 'Kaynak bulunamadı'],
    409: ['CONFLICT', 'Çakışma'],
    412: ['PRECONDITION_FAILED', 'Sürüm uyuşmazlığı'],
    413: ['PAYLOAD_TOO_LARGE', 'İstek gövdesi çok büyük'],
    415: ['UNSUPPORTED_MEDIA_TYPE', 'Desteklenmeyen içerik türü'],
    429: ['RATE_LIMITED', 'Çok fazla istek'],
    503: ['SERVICE_UNAVAILABLE', 'Hizmet geçici olarak kullanılamıyor'],
  };
  const [code, title] = map[status] ?? ['INTERNAL_ERROR', 'Beklenmeyen bir hata oluştu'];
  return {
    type: TYPE_BASE + code.toLowerCase().replace(/_/g, '-'),
    title,
    status: map[status] ? status : 500,
    instance,
    code,
    traceId,
  };
}
