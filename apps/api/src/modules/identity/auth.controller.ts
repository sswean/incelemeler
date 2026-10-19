import { Body, Controller, Delete, Get, HttpCode, Param, Post, Put, Req } from '@nestjs/common';
import type { Request } from 'express';
import {
  LoginBody,
  MfaCodeBody,
  PasswordResetConfirmBody,
  PasswordResetRequestBody,
  RegisterBody,
  RoleAssignBody,
  VerifyEmailBody,
} from '@incelemeler/contracts';
import { parseBody } from '../../common/zod-body.js';
import { requestMeta } from '../../common/request-meta.js';
import { parseId } from '../../common/ids.js';
import { Auth, type AuthContext, Public, RequireAuth } from './auth.context.js';
import { AuthService } from './auth.service.js';

@Controller('v1/auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('register')
  @Public()
  @HttpCode(202)
  async register(@Body() body: unknown, @Req() req: Request) {
    await this.auth.register(parseBody(RegisterBody, body), requestMeta(req));
    return { accepted: true as const };
  }

  @Post('verify-email')
  @Public()
  @HttpCode(200)
  async verifyEmail(@Body() body: unknown) {
    await this.auth.verifyEmail(parseBody(VerifyEmailBody, body).token);
    return { accepted: true as const };
  }

  @Post('login')
  @Public()
  @HttpCode(200)
  async login(@Body() body: unknown, @Req() req: Request) {
    const b = parseBody(LoginBody, body);
    return this.auth.login(b.email, b.password, requestMeta(req));
  }

  @Post('logout')
  @HttpCode(204)
  @RequireAuth({ level: 'session' })
  async logout(@Auth() ctx: AuthContext) {
    await this.auth.logout(ctx.sessionId);
  }

  @Post('password-reset/request')
  @Public()
  @HttpCode(202)
  async requestReset(@Body() body: unknown, @Req() req: Request) {
    await this.auth.requestPasswordReset(
      parseBody(PasswordResetRequestBody, body).email,
      requestMeta(req),
    );
    return { accepted: true as const };
  }

  @Post('password-reset/confirm')
  @Public()
  @HttpCode(200)
  async confirmReset(@Body() body: unknown, @Req() req: Request) {
    const b = parseBody(PasswordResetConfirmBody, body);
    await this.auth.confirmPasswordReset(b.token, b.newPassword, requestMeta(req));
    return { accepted: true as const };
  }

  @Post('mfa/setup')
  @HttpCode(200)
  @RequireAuth({ level: 'session' })
  mfaSetup(@Auth() ctx: AuthContext) {
    return this.auth.mfaSetup(ctx);
  }

  @Post('mfa/confirm')
  @HttpCode(200)
  @RequireAuth({ level: 'session' })
  mfaConfirm(@Auth() ctx: AuthContext, @Body() body: unknown, @Req() req: Request) {
    return this.auth.mfaConfirm(ctx, parseBody(MfaCodeBody, body).code, requestMeta(req));
  }

  @Post('mfa/verify')
  @HttpCode(200)
  @RequireAuth({ level: 'session' })
  mfaVerify(@Auth() ctx: AuthContext, @Body() body: unknown, @Req() req: Request) {
    return this.auth.mfaVerify(ctx, parseBody(MfaCodeBody, body).code, requestMeta(req));
  }
}

@Controller('v1/me')
export class MeController {
  constructor(private readonly auth: AuthService) {}

  @Get()
  @RequireAuth({ level: 'session' })
  me(@Auth() ctx: AuthContext) {
    return this.auth.currentUserFromContext(ctx);
  }

  @Get('sessions')
  @RequireAuth({ level: 'session' })
  sessions(@Auth() ctx: AuthContext) {
    return this.auth.listSessions(ctx);
  }

  @Delete('sessions/:id')
  @HttpCode(204)
  @RequireAuth({ level: 'session' })
  async revoke(@Auth() ctx: AuthContext, @Param('id') id: string) {
    await this.auth.revokeSession(ctx, parseId(id));
  }
}

@Controller('v1/admin')
export class AdminAccessController {
  constructor(private readonly auth: AuthService) {}

  @Get('me')
  @RequireAuth({ level: 'staff-mfa' })
  me(@Auth() ctx: AuthContext) {
    return this.auth.currentUserFromContext(ctx);
  }

  @Put('users/:id/roles')
  @RequireAuth({ level: 'staff-mfa', permission: 'users.roles.assign', stepUp: true })
  setRoles(
    @Auth() ctx: AuthContext,
    @Param('id') id: string,
    @Body() body: unknown,
    @Req() req: Request,
  ) {
    return this.auth.setRoles(
      ctx,
      parseId(id),
      parseBody(RoleAssignBody, body).roles,
      requestMeta(req),
    );
  }
}
