import { Body, Controller, Delete, Get, HttpCode, Param, Post, Put, Req } from '@nestjs/common';
import type { Request } from 'express';
import { AccountDeletionBody, AccountDeletionPublicBody, TokenBody } from '@incelemeler/contracts';
import { parseId } from '../../common/ids.js';
import { requestMeta } from '../../common/request-meta.js';
import { parseBody } from '../../common/zod-body.js';
import { Auth, type AuthContext, Public, RequireAuth } from '../identity/auth.context.js';
import { AccountService } from './account.service.js';

@Controller('v1')
export class AccountController {
  constructor(private readonly account: AccountService) {}

  @Get('me/favorites')
  @RequireAuth({ level: 'session' })
  favorites(@Auth() ctx: AuthContext) {
    return this.account.favorites(ctx);
  }

  @Get('me/favorites/:listingId')
  @RequireAuth({ level: 'session' })
  favoriteState(@Auth() ctx: AuthContext, @Param('listingId') id: string) {
    return this.account.favoriteState(ctx, parseId(id));
  }

  @Put('me/favorites/:listingId')
  @RequireAuth({ level: 'session' })
  addFavorite(@Auth() ctx: AuthContext, @Param('listingId') id: string) {
    return this.account.addFavorite(ctx, parseId(id));
  }

  @Delete('me/favorites/:listingId')
  @RequireAuth({ level: 'session' })
  removeFavorite(@Auth() ctx: AuthContext, @Param('listingId') id: string) {
    return this.account.removeFavorite(ctx, parseId(id));
  }

  @Get('me/export')
  @RequireAuth({ level: 'session' })
  export(@Auth() ctx: AuthContext) {
    return this.account.export(ctx);
  }

  @Post('me/deletion')
  @HttpCode(200)
  @RequireAuth({ level: 'session' })
  requestDeletion(@Auth() ctx: AuthContext, @Body() body: unknown, @Req() req: Request) {
    return this.account.requestDeletion(
      ctx,
      parseBody(AccountDeletionBody, body),
      requestMeta(req),
    );
  }

  @Post('account-deletion/request')
  @Public()
  @HttpCode(202)
  requestByEmail(@Body() body: unknown, @Req() req: Request) {
    return this.account.requestDeletionByEmail(
      parseBody(AccountDeletionPublicBody, body).email,
      requestMeta(req),
    );
  }

  @Post('account-deletion/confirm')
  @Public()
  @HttpCode(200)
  confirm(@Body() body: unknown, @Req() req: Request) {
    return this.account.confirmDeletion(parseBody(TokenBody, body).token, requestMeta(req));
  }

  @Post('account-deletion/cancel')
  @Public()
  @HttpCode(202)
  cancel(@Body() body: unknown, @Req() req: Request) {
    return this.account.cancelDeletion(parseBody(TokenBody, body).token, requestMeta(req));
  }
}
