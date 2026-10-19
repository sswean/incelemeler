import { z } from 'zod';

/** Kararlı makine hata kodları (REQ-MIM-010). İstemci Türkçe mesajı bu koda göre seçer. */
export const ErrorCode = z.enum([
  'VALIDATION_FAILED',
  'NOT_FOUND',
  'UNAUTHENTICATED',
  'FORBIDDEN',
  'MFA_REQUIRED',
  'CONFLICT',
  'PRECONDITION_FAILED',
  'RATE_LIMITED',
  'INTERNAL_ERROR',
  'SERVICE_UNAVAILABLE',
  'INVALID_CREDENTIALS',
  'INVALID_TOKEN',
  'WEAK_PASSWORD',
  'ACCOUNT_SUSPENDED',
  'ACCOUNT_PENDING_DELETION',
  'ACCOUNT_RESTRICTED',
  'MFA_INVALID',
  'STEP_UP_REQUIRED',
  'EMAIL_NOT_VERIFIED',
  'PAYLOAD_TOO_LARGE',
  'UNSUPPORTED_MEDIA_TYPE',
]);
export type ErrorCode = z.infer<typeof ErrorCode>;

/** RFC 9457 problem+json gövdesi. `detail` iç bilgi (yığın izi, SQL) içermez. */
export const Problem = z
  .object({
    type: z.string(),
    title: z.string(),
    status: z.number().int(),
    detail: z.string().optional(),
    instance: z.string().optional(),
    code: ErrorCode,
    traceId: z.string(),
    errors: z
      .array(z.object({ pointer: z.string(), code: z.string(), message: z.string() }))
      .optional(),
  })
  .meta({ id: 'Problem' });
export type Problem = z.infer<typeof Problem>;
