import { Controller, Get, Res } from '@nestjs/common';
import type { Response } from 'express';
import type { HealthStatus } from '@incelemeler/contracts';
import { PrismaService } from '../../prisma/prisma.service.js';
import { Public } from '../identity/auth.context.js';

const VERSION = process.env.npm_package_version ?? '0.0.0';

@Controller('v1/health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @Public()
  async health(@Res({ passthrough: true }) res: Response): Promise<HealthStatus> {
    let database: HealthStatus['database'] = 'up';
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      database = 'down';
    }
    res.setHeader('Cache-Control', 'no-store');
    if (database === 'down') res.status(503);
    return {
      status: database === 'up' ? 'ok' : 'degraded',
      database,
      version: VERSION,
      time: new Date().toISOString(),
    };
  }
}
