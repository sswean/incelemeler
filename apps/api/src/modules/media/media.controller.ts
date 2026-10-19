import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Req,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request, Response } from 'express';
import { MEDIA_LIMITS, MediaUpdateBody } from '@incelemeler/contracts';
import { parseId } from '../../common/ids.js';
import { requestMeta } from '../../common/request-meta.js';
import { parseBody } from '../../common/zod-body.js';
import type { Permission } from '../access/permissions.js';
import { Auth, type AuthContext, RequireAuth } from '../identity/auth.context.js';
import { MediaService, type UploadedFile as File } from './media.service.js';

const MEDIA_EDITORS: Permission[] = [
  'listings.write',
  'listings.draft',
  'content.publish',
  'content.draft',
];

@Controller('v1/admin/media')
export class MediaController {
  constructor(private readonly media: MediaService) {}

  @Post()
  @HttpCode(201)
  @RequireAuth({ level: 'staff-mfa', permission: MEDIA_EDITORS })
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: MEDIA_LIMITS.maxBytes, files: 1, fields: 5 } }),
  )
  upload(
    @Auth() ctx: AuthContext,
    @UploadedFile() file: File | undefined,
    @Body() body: { altText?: unknown },
    @Req() req: Request,
  ) {
    const altText = typeof body?.altText === 'string' ? body.altText.slice(0, 300) : undefined;
    return this.media.upload(ctx, file, altText, requestMeta(req));
  }

  @Get(':id')
  @RequireAuth({ level: 'staff-mfa', permission: MEDIA_EDITORS })
  get(@Param('id') id: string) {
    return this.media.get(parseId(id));
  }

  @Patch(':id')
  @RequireAuth({ level: 'staff-mfa', permission: MEDIA_EDITORS })
  update(
    @Auth() ctx: AuthContext,
    @Param('id') id: string,
    @Body() body: unknown,
    @Req() req: Request,
  ) {
    return this.media.update(ctx, parseId(id), parseBody(MediaUpdateBody, body), requestMeta(req));
  }

  @Get(':id/content')
  @RequireAuth({ level: 'staff-mfa', permission: MEDIA_EDITORS })
  async content(@Param('id') id: string, @Res() res: Response) {
    const obj = await this.media.content(parseId(id));
    res
      .status(200)
      .setHeader('Content-Type', obj.contentType)
      .setHeader('Cache-Control', 'private, max-age=300')
      .setHeader('X-Content-Type-Options', 'nosniff')
      .send(obj.body);
  }
}
