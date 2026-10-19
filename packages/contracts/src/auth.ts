import { z } from 'zod';

export const StaffRole = z.enum(['SUPER_ADMIN', 'ADMIN', 'EDITOR', 'AUTHOR', 'MODERATOR', 'SALES']);
export type StaffRole = z.infer<typeof StaffRole>;

const Email = z
  .string()
  .trim()
  .max(254)
  .email()
  .transform((v) => v.toLowerCase());
const Password = z.string().min(1).max(256);

export const RegisterBody = z
  .object({
    email: Email,
    password: Password,
    displayName: z.string().trim().min(2).max(60),
    /** 18 yaş ve üzeri beyanı (REQ-HSP-014) */
    ageConfirmed: z.literal(true),
    /** Kabul edilen kullanım koşulları sürümü */
    termsVersion: z.string().min(1).max(40),
  })
  .meta({ id: 'RegisterBody' });
export type RegisterBody = z.infer<typeof RegisterBody>;

export const Accepted = z.object({ accepted: z.literal(true) }).meta({ id: 'Accepted' });

export const VerifyEmailBody = z
  .object({ token: z.string().min(10).max(200) })
  .meta({ id: 'VerifyEmailBody' });

export const LoginBody = z.object({ email: Email, password: Password }).meta({ id: 'LoginBody' });

export const MfaState = z.enum(['NONE', 'SETUP_REQUIRED', 'VERIFY_REQUIRED', 'VERIFIED']);
export type MfaState = z.infer<typeof MfaState>;

export const CurrentUser = z
  .object({
    id: z.string(),
    email: z.string(),
    displayName: z.string(),
    emailVerified: z.boolean(),
    roles: z.array(StaffRole),
    /** Rollerden türetilen izinler (arayüz yalnızca gösterim için kullanır; yetki API'de denetlenir). */
    permissions: z.array(z.string()),
    mfa: MfaState,
  })
  .meta({ id: 'CurrentUser' });
export type CurrentUser = z.infer<typeof CurrentUser>;

export const LoginResult = z
  .object({
    sessionToken: z.string(),
    expiresAt: z.iso.datetime(),
    user: CurrentUser,
  })
  .meta({ id: 'LoginResult' });
export type LoginResult = z.infer<typeof LoginResult>;

export const PasswordResetRequestBody = z
  .object({ email: Email })
  .meta({ id: 'PasswordResetRequestBody' });
export const PasswordResetConfirmBody = z
  .object({ token: z.string().min(10).max(200), newPassword: Password })
  .meta({ id: 'PasswordResetConfirmBody' });

export const SessionInfo = z
  .object({
    id: z.string(),
    current: z.boolean(),
    createdAt: z.iso.datetime(),
    lastSeenAt: z.iso.datetime(),
    userAgent: z.string().nullable(),
    ipPrefix: z.string().nullable(),
  })
  .meta({ id: 'SessionInfo' });
export const SessionList = z.object({ data: z.array(SessionInfo) }).meta({ id: 'SessionList' });

export const MfaSetupResult = z
  .object({ secret: z.string(), otpauthUrl: z.string() })
  .meta({ id: 'MfaSetupResult' });
export const MfaCodeBody = z
  .object({ code: z.string().regex(/^(\d{6}|[a-z0-9]{5}-[a-z0-9]{5})$/) })
  .meta({ id: 'MfaCodeBody' });
export const MfaConfirmResult = z
  .object({ recoveryCodes: z.array(z.string()) })
  .meta({ id: 'MfaConfirmResult' });

export const RoleAssignBody = z
  .object({ roles: z.array(StaffRole).max(6) })
  .meta({ id: 'RoleAssignBody' });

export const IdParam = z.object({ id: z.uuid() });
