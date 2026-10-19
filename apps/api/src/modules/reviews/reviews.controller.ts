import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import {
  AppealCreateBody,
  AppealDecisionBody,
  RemovalDecisionBody,
  ModerationQueueQuery,
  ReportCreateBody,
  ReportDecisionBody,
  ReviewCreateBody,
  ReviewDecisionBody,
  ReviewDraftBody,
  ReviewListQuery,
  ReviewUpdateBody,
} from '@incelemeler/contracts';
import { parseId } from '../../common/ids.js';
import { requestMeta } from '../../common/request-meta.js';
import { parseBody } from '../../common/zod-body.js';
import { parseQuery } from '../../common/zod-query.js';
import { Auth, type AuthContext, Public, RequireAuth } from '../identity/auth.context.js';
import { AuthService } from '../identity/auth.service.js';
import { OpsService } from '../platform/ops.service.js';
import { ModerationService } from './moderation.service.js';
import { ReviewsService } from './reviews.service.js';

@Controller('v1')
export class ReviewsController {
  constructor(
    private readonly reviews: ReviewsService,
    private readonly moderation: ModerationService,
    private readonly auth: AuthService,
    private readonly ops: OpsService,
  ) {}

  @Get('listings/:id/reviews')
  @Public()
  async list(
    @Param('id') id: string,
    @Query() raw: unknown,
    @Res({ passthrough: true }) res: Response,
  ) {
    res.setHeader('Cache-Control', 'public, max-age=30');
    return this.reviews.listForListing(parseId(id), parseQuery(ReviewListQuery, raw));
  }

  @Get('listings/:id/review-form')
  @Public()
  formContext(@Param('id') id: string) {
    return this.reviews.formContext(parseId(id));
  }

  @Post('reviews')
  @HttpCode(201)
  @RequireAuth({ level: 'session' })
  async create(@Auth() ctx: AuthContext, @Body() body: unknown, @Req() req: Request) {
    // İşletim anahtarı ve yetki (yaptırım) denetimi gövde doğrulamasından önce (REQ-OPS-009, REQ-GUN-007).
    await this.ops.assertOpen('reviewsDisabled');
    await this.reviews.assertNotRestricted(ctx.userId);
    return this.reviews.create(ctx, parseBody(ReviewCreateBody, body), requestMeta(req));
  }

  @Patch('reviews/:id')
  @RequireAuth({ level: 'session' })
  async update(
    @Auth() ctx: AuthContext,
    @Param('id') id: string,
    @Body() body: unknown,
    @Req() req: Request,
  ) {
    await this.ops.assertOpen('reviewsDisabled');
    await this.reviews.assertNotRestricted(ctx.userId);
    return this.reviews.update(
      ctx,
      parseId(id),
      parseBody(ReviewUpdateBody, body),
      requestMeta(req),
    );
  }

  @Delete('reviews/:id')
  @RequireAuth({ level: 'session' })
  withdraw(@Auth() ctx: AuthContext, @Param('id') id: string) {
    return this.reviews.withdraw(ctx, parseId(id));
  }

  @Get('me/reviews')
  @RequireAuth({ level: 'session' })
  mine(@Auth() ctx: AuthContext) {
    return this.reviews.mine(ctx);
  }

  @Get('me/review-drafts/:listingId')
  @RequireAuth({ level: 'session' })
  draft(@Auth() ctx: AuthContext, @Param('listingId') listingId: string) {
    return this.reviews.getDraft(ctx, parseId(listingId));
  }

  @Put('me/review-drafts/:listingId')
  @RequireAuth({ level: 'session' })
  saveDraft(
    @Auth() ctx: AuthContext,
    @Param('listingId') listingId: string,
    @Body() body: unknown,
  ) {
    return this.reviews.saveDraft(ctx, parseId(listingId), parseBody(ReviewDraftBody, body).data);
  }

  /** Misafir de bildirebilir; oturum varsa bildirim üyeye bağlanır. */
  @Post('reports')
  @HttpCode(201)
  @Public()
  async report(@Body() body: unknown, @Req() req: Request) {
    const header = req.headers.authorization;
    const token = header?.startsWith('Bearer ') ? header.slice(7).trim() : null;
    const ctx = token ? await this.auth.resolveSession(token) : null;
    return this.moderation.report(ctx, parseBody(ReportCreateBody, body), requestMeta(req));
  }

  @Post('appeals')
  @HttpCode(201)
  @RequireAuth({ level: 'session' })
  appeal(@Auth() ctx: AuthContext, @Body() body: unknown) {
    return this.moderation.appeal(ctx, parseBody(AppealCreateBody, body));
  }

  @Get('admin/moderation/queue')
  @RequireAuth({ level: 'staff-mfa', permission: 'reviews.moderate' })
  queue(@Query() raw: unknown) {
    return this.moderation.queue(parseQuery(ModerationQueueQuery, raw).queue);
  }

  @Post('admin/moderation/reviews/:id/decision')
  @HttpCode(200)
  @RequireAuth({ level: 'staff-mfa', permission: 'reviews.moderate' })
  decideReview(
    @Auth() ctx: AuthContext,
    @Param('id') id: string,
    @Body() body: unknown,
    @Req() req: Request,
  ) {
    return this.moderation.decideReview(
      ctx,
      parseId(id),
      parseBody(ReviewDecisionBody, body),
      requestMeta(req),
    );
  }

  @Post('admin/moderation/reports/:id/decision')
  @HttpCode(200)
  @RequireAuth({ level: 'staff-mfa', permission: 'reviews.moderate' })
  decideReport(
    @Auth() ctx: AuthContext,
    @Param('id') id: string,
    @Body() body: unknown,
    @Req() req: Request,
  ) {
    return this.moderation.decideReport(
      ctx,
      parseId(id),
      parseBody(ReportDecisionBody, body),
      requestMeta(req),
    );
  }

  @Post('admin/moderation/appeals/:id/decision')
  @HttpCode(200)
  @RequireAuth({ level: 'staff-mfa', permission: 'reviews.moderate' })
  decideAppeal(
    @Auth() ctx: AuthContext,
    @Param('id') id: string,
    @Body() body: unknown,
    @Req() req: Request,
  ) {
    return this.moderation.decideAppeal(
      ctx,
      parseId(id),
      parseBody(AppealDecisionBody, body),
      requestMeta(req),
    );
  }

  @Post('admin/moderation/removals/:id/decision')
  @HttpCode(200)
  @RequireAuth({ level: 'staff-mfa', permission: 'reviews.moderate' })
  decideRemoval(
    @Auth() ctx: AuthContext,
    @Param('id') id: string,
    @Body() body: unknown,
    @Req() req: Request,
  ) {
    return this.moderation.decideRemoval(
      ctx,
      parseId(id),
      parseBody(RemovalDecisionBody, body),
      requestMeta(req),
    );
  }
}
