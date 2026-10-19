import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import {
  CampaignCreateBody,
  CampaignTransitionBody,
  CampaignUpdateBody,
  CreativeCreateBody,
  CreativeReviewBody,
  OrganizationBody,
  PlacementCreateBody,
  PlacementSlotUpdateBody,
  SponsoredClickQuery,
  SponsoredEventBody,
} from '@incelemeler/contracts';
import { parseId } from '../../common/ids.js';
import { requestMeta } from '../../common/request-meta.js';
import { parseBody } from '../../common/zod-body.js';
import { parseQuery } from '../../common/zod-query.js';
import type { Permission } from '../access/permissions.js';
import { Auth, type AuthContext, Public, RequireAuth } from '../identity/auth.context.js';
import type { ClickHeaders } from '../outbound/outbound.service.js';
import { CampaignsService } from './campaigns.service.js';
import { SponsoredServingService } from './sponsored-serving.service.js';

const SALES: Permission = 'campaigns.manage';
/** Editoryal onay için editör de kampanyayı görür (tutar hariç). */
const VIEW: Permission[] = ['campaigns.manage', 'content.publish'];

function clickHeaders(req: Request): ClickHeaders {
  const h = (name: string) => {
    const v = req.headers[name];
    return typeof v === 'string' ? v.slice(0, 300) : null;
  };
  return {
    ip: req.ip ?? 'unknown',
    userAgent: h('user-agent'),
    secPurpose: h('sec-purpose'),
    purpose: h('purpose'),
  };
}

@Controller('v1')
export class SponsorshipController {
  constructor(
    private readonly serving: SponsoredServingService,
    private readonly campaigns: CampaignsService,
  ) {}

  @Get('listings/:id/sponsored')
  @Public()
  listingSponsored(@Param('id') id: string, @Res({ passthrough: true }) res: Response) {
    // Kampanya bitişinden sonra önbellekte kalmaz (REQ-SPN-005).
    res.setHeader('Cache-Control', 'no-store');
    return this.serving.forListing(parseId(id));
  }

  @Post('sponsored/events')
  @Public()
  @HttpCode(202)
  event(@Body() body: unknown, @Req() req: Request) {
    return this.serving.event(
      parseBody(SponsoredEventBody, body),
      clickHeaders(req),
      requestMeta(req),
    );
  }

  @Get('sponsored/:id/click')
  @Public()
  click(
    @Param('id') id: string,
    @Query() raw: unknown,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Robots-Tag', 'noindex');
    return this.serving.click(
      parseId(id),
      parseQuery(SponsoredClickQuery, raw).ctx,
      clickHeaders(req),
    );
  }

  @Get('admin/placement-slots')
  @RequireAuth({ level: 'staff-mfa', permission: SALES })
  slots() {
    return this.campaigns.slots();
  }

  @Patch('admin/placement-slots/:id')
  @RequireAuth({ level: 'staff-mfa', permission: SALES })
  updateSlot(
    @Auth() ctx: AuthContext,
    @Param('id') id: string,
    @Body() body: unknown,
    @Req() req: Request,
  ) {
    return this.campaigns.updateSlot(
      ctx,
      parseId(id),
      parseBody(PlacementSlotUpdateBody, body),
      requestMeta(req),
    );
  }

  @Get('admin/organizations')
  @RequireAuth({ level: 'staff-mfa', permission: SALES })
  organizations() {
    return this.campaigns.organizations();
  }

  @Post('admin/organizations')
  @HttpCode(201)
  @RequireAuth({ level: 'staff-mfa', permission: SALES })
  createOrganization(@Auth() ctx: AuthContext, @Body() body: unknown, @Req() req: Request) {
    return this.campaigns.createOrganization(
      ctx,
      parseBody(OrganizationBody, body),
      requestMeta(req),
    );
  }

  @Get('admin/campaigns')
  @RequireAuth({ level: 'staff-mfa', permission: VIEW })
  list() {
    return this.campaigns.list();
  }

  @Post('admin/campaigns')
  @HttpCode(201)
  @RequireAuth({ level: 'staff-mfa', permission: SALES })
  create(@Auth() ctx: AuthContext, @Body() body: unknown, @Req() req: Request) {
    return this.campaigns.create(ctx, parseBody(CampaignCreateBody, body), requestMeta(req));
  }

  @Get('admin/campaigns/:id')
  @RequireAuth({ level: 'staff-mfa', permission: VIEW })
  get(@Auth() ctx: AuthContext, @Param('id') id: string) {
    return this.campaigns.get(ctx, parseId(id));
  }

  @Patch('admin/campaigns/:id')
  @RequireAuth({ level: 'staff-mfa', permission: SALES })
  update(
    @Auth() ctx: AuthContext,
    @Param('id') id: string,
    @Body() body: unknown,
    @Req() req: Request,
  ) {
    return this.campaigns.update(
      ctx,
      parseId(id),
      parseBody(CampaignUpdateBody, body),
      requestMeta(req),
    );
  }

  @Post('admin/campaigns/:id/transition')
  @HttpCode(200)
  @RequireAuth({ level: 'staff-mfa', permission: VIEW })
  transition(
    @Auth() ctx: AuthContext,
    @Param('id') id: string,
    @Body() body: unknown,
    @Req() req: Request,
  ) {
    return this.campaigns.transition(
      ctx,
      parseId(id),
      parseBody(CampaignTransitionBody, body),
      requestMeta(req),
    );
  }

  @Post('admin/campaigns/:id/placements')
  @HttpCode(201)
  @RequireAuth({ level: 'staff-mfa', permission: SALES })
  addPlacement(
    @Auth() ctx: AuthContext,
    @Param('id') id: string,
    @Body() body: unknown,
    @Req() req: Request,
  ) {
    return this.campaigns.addPlacement(
      ctx,
      parseId(id),
      parseBody(PlacementCreateBody, body),
      requestMeta(req),
    );
  }

  @Delete('admin/campaign-placements/:id')
  @RequireAuth({ level: 'staff-mfa', permission: SALES })
  removePlacement(@Auth() ctx: AuthContext, @Param('id') id: string, @Req() req: Request) {
    return this.campaigns.removePlacement(ctx, parseId(id), requestMeta(req));
  }

  @Post('admin/campaigns/:id/creatives')
  @HttpCode(201)
  @RequireAuth({ level: 'staff-mfa', permission: SALES })
  addCreative(
    @Auth() ctx: AuthContext,
    @Param('id') id: string,
    @Body() body: unknown,
    @Req() req: Request,
  ) {
    return this.campaigns.addCreative(
      ctx,
      parseId(id),
      parseBody(CreativeCreateBody, body),
      requestMeta(req),
    );
  }

  @Post('admin/creatives/:id/review')
  @HttpCode(200)
  @RequireAuth({ level: 'staff-mfa', permission: 'content.publish' })
  reviewCreative(
    @Auth() ctx: AuthContext,
    @Param('id') id: string,
    @Body() body: unknown,
    @Req() req: Request,
  ) {
    return this.campaigns.reviewCreative(
      ctx,
      parseId(id),
      parseBody(CreativeReviewBody, body),
      requestMeta(req),
    );
  }

  @Get('admin/campaigns/:id/report')
  @RequireAuth({ level: 'staff-mfa', permission: SALES })
  report(@Param('id') id: string) {
    return this.campaigns.report(parseId(id));
  }
}
