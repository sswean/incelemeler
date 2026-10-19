import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import {
  AttributeCreateBody,
  AttributeUpdateBody,
  CriterionCreateBody,
  CriterionUpdateBody,
} from '@incelemeler/contracts';
import { parseId } from '../../common/ids.js';
import { requestMeta } from '../../common/request-meta.js';
import { parseBody } from '../../common/zod-body.js';
import { Auth, type AuthContext, RequireAuth } from '../identity/auth.context.js';
import { CategorySchemaService } from './category-schema.service.js';

/** Özellik şeması ve değerlendirme kriterleri (REQ-VER-003, REQ-KAT-001, Ek A6.3). */
@Controller('v1/admin/categories/:id')
export class CategorySchemaController {
  constructor(private readonly schema: CategorySchemaService) {}

  @Get('schema')
  @RequireAuth({ level: 'staff-mfa' })
  get(@Param('id') id: string) {
    return this.schema.getSchema(parseId(id));
  }

  @Post('attributes')
  @HttpCode(201)
  @RequireAuth({ level: 'staff-mfa', permission: 'taxonomy.manage' })
  createAttribute(
    @Auth() ctx: AuthContext,
    @Param('id') id: string,
    @Body() body: unknown,
    @Req() req: Request,
  ) {
    return this.schema.createAttribute(
      ctx,
      parseId(id),
      parseBody(AttributeCreateBody, body),
      requestMeta(req),
    );
  }

  @Patch('attributes/:attributeId')
  @RequireAuth({ level: 'staff-mfa', permission: 'taxonomy.manage' })
  updateAttribute(
    @Auth() ctx: AuthContext,
    @Param('id') id: string,
    @Param('attributeId') attributeId: string,
    @Body() body: unknown,
    @Req() req: Request,
  ) {
    return this.schema.updateAttribute(
      ctx,
      parseId(id),
      parseId(attributeId),
      parseBody(AttributeUpdateBody, body),
      requestMeta(req),
    );
  }

  @Delete('attributes/:attributeId')
  @HttpCode(204)
  @RequireAuth({ level: 'staff-mfa', permission: 'taxonomy.manage' })
  async archiveAttribute(
    @Auth() ctx: AuthContext,
    @Param('id') id: string,
    @Param('attributeId') attributeId: string,
    @Req() req: Request,
  ) {
    await this.schema.archiveAttribute(ctx, parseId(id), parseId(attributeId), requestMeta(req));
  }

  @Post('criteria')
  @HttpCode(201)
  @RequireAuth({ level: 'staff-mfa', permission: 'taxonomy.manage' })
  createCriterion(
    @Auth() ctx: AuthContext,
    @Param('id') id: string,
    @Body() body: unknown,
    @Req() req: Request,
  ) {
    return this.schema.createCriterion(
      ctx,
      parseId(id),
      parseBody(CriterionCreateBody, body),
      requestMeta(req),
    );
  }

  @Patch('criteria/:criterionId')
  @RequireAuth({ level: 'staff-mfa', permission: 'taxonomy.manage' })
  updateCriterion(
    @Auth() ctx: AuthContext,
    @Param('id') id: string,
    @Param('criterionId') criterionId: string,
    @Body() body: unknown,
    @Req() req: Request,
  ) {
    return this.schema.updateCriterion(
      ctx,
      parseId(id),
      parseId(criterionId),
      parseBody(CriterionUpdateBody, body),
      requestMeta(req),
    );
  }

  @Delete('criteria/:criterionId')
  @HttpCode(204)
  @RequireAuth({ level: 'staff-mfa', permission: 'taxonomy.manage' })
  async archiveCriterion(
    @Auth() ctx: AuthContext,
    @Param('id') id: string,
    @Param('criterionId') criterionId: string,
    @Req() req: Request,
  ) {
    await this.schema.archiveCriterion(ctx, parseId(id), parseId(criterionId), requestMeta(req));
  }
}
