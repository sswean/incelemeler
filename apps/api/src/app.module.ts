import { Module, type DynamicModule } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import type { Env } from './config/env.js';
import { ENV } from './config/env.provider.js';
import { ProblemFilter } from './common/problem.filter.js';
import { PrismaService } from './prisma/prisma.service.js';
import { HealthController } from './platform/health.controller.js';
import { CategoriesController } from './taxonomy/categories.controller.js';
import { CategoriesService } from './taxonomy/categories.service.js';

@Module({})
export class AppModule {
  static forRoot(env: Env): DynamicModule {
    return {
      module: AppModule,
      controllers: [HealthController, CategoriesController],
      providers: [
        { provide: ENV, useValue: env },
        { provide: APP_FILTER, useClass: ProblemFilter },
        PrismaService,
        CategoriesService,
      ],
    };
  }
}
