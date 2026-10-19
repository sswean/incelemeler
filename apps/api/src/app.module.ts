import { Module, type DynamicModule } from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import type { Env } from './config/env.js';
import { ENV } from './config/env.provider.js';
import { ProblemFilter } from './common/problem.filter.js';
import { PrismaService } from './prisma/prisma.service.js';
import { HealthController } from './modules/platform/health.controller.js';
import { AuditService } from './modules/platform/audit.service.js';
import { RateLimitService } from './modules/platform/rate-limit.service.js';
import { CategoriesController } from './modules/taxonomy/categories.controller.js';
import { CategoriesService } from './modules/taxonomy/categories.service.js';
import { AdminCategoriesController } from './modules/taxonomy/admin-categories.controller.js';
import { AdminCategoriesService } from './modules/taxonomy/admin-categories.service.js';
import { CategorySchemaController } from './modules/taxonomy/category-schema.controller.js';
import { CategorySchemaService } from './modules/taxonomy/category-schema.service.js';
import { OutboxService } from './modules/outbox/outbox.service.js';
import { AdminListingsController } from './modules/catalog/admin-listings.controller.js';
import { AdminListingsService } from './modules/catalog/admin-listings.service.js';
import { ImportsController } from './modules/catalog/imports.controller.js';
import { ImportsService } from './modules/catalog/imports.service.js';
import { PublicListingsController } from './modules/catalog/public-listings.controller.js';
import { PublicListingsService } from './modules/catalog/public-listings.service.js';
import { AdminArticlesController } from './modules/editorial/admin-articles.controller.js';
import { AdminArticlesService } from './modules/editorial/admin-articles.service.js';
import { ModerationSettingsService } from './modules/reviews/moderation-settings.service.js';
import { ModerationService } from './modules/reviews/moderation.service.js';
import { RatingStatsService } from './modules/reviews/rating-stats.service.js';
import { ReviewsController } from './modules/reviews/reviews.controller.js';
import { ReviewsService } from './modules/reviews/reviews.service.js';
import { OutboundController } from './modules/outbound/outbound.controller.js';
import { OutboundService } from './modules/outbound/outbound.service.js';
import { AccountController } from './modules/account/account.controller.js';
import { AccountService } from './modules/account/account.service.js';
import { CampaignsService } from './modules/sponsorship/campaigns.service.js';
import { SponsoredServingService } from './modules/sponsorship/sponsored-serving.service.js';
import { SponsorshipController } from './modules/sponsorship/sponsorship.controller.js';
import { HubsController } from './modules/hubs/hubs.controller.js';
import { HubsService } from './modules/hubs/hubs.service.js';
import { ThresholdsService } from './modules/hubs/thresholds.service.js';
import { PostgresSearchAdapter } from './modules/search/postgres-search.adapter.js';
import { SearchIndexerService } from './modules/search/search-indexer.service.js';
import { SearchLexiconService } from './modules/search/search-lexicon.service.js';
import { SearchController } from './modules/search/search.controller.js';
import { SEARCH_PORT } from './modules/search/search.port.js';
import { SearchService } from './modules/search/search.service.js';
import { AuthorProfilesController } from './modules/editorial/author-profiles.controller.js';
import { AuthorProfilesService } from './modules/editorial/author-profiles.service.js';
import { PublicArticlesController } from './modules/editorial/public-articles.controller.js';
import { PublicArticlesService } from './modules/editorial/public-articles.service.js';
import { AdminAreasController } from './modules/geo/admin-areas.controller.js';
import { MediaController } from './modules/media/media.controller.js';
import { MediaService } from './modules/media/media.service.js';
import {
  MemoryStorageAdapter,
  S3StorageAdapter,
  STORAGE_PORT,
  type StoragePort,
} from './modules/media/storage.port.js';
import {
  AdminAccessController,
  AuthController,
  MeController,
} from './modules/identity/auth.controller.js';
import { AuthGuard } from './modules/identity/auth.guard.js';
import { AuthService } from './modules/identity/auth.service.js';
import {
  DisabledEmailAdapter,
  EMAIL_PORT,
  type EmailPort,
  MailpitEmailAdapter,
  MemoryEmailAdapter,
} from './modules/notifications/email.port.js';

export interface AppOverrides {
  emailPort?: EmailPort;
  storagePort?: StoragePort;
}

function emailAdapter(env: Env): EmailPort {
  switch (env.EMAIL_ADAPTER) {
    case 'mailpit':
      return new MailpitEmailAdapter(env.MAILPIT_URL, env.EMAIL_FROM);
    case 'memory':
      return new MemoryEmailAdapter();
    default:
      return new DisabledEmailAdapter();
  }
}

/** Tüm denetleyiciler (rota yetki denetimi testi bu listeyi kullanır). */
export const CONTROLLERS = [
  HealthController,
  CategoriesController,
  AuthController,
  MeController,
  AdminAccessController,
  AdminCategoriesController,
  CategorySchemaController,
  AdminAreasController,
  AdminListingsController,
  MediaController,
  ImportsController,
  PublicListingsController,
  AdminArticlesController,
  PublicArticlesController,
  AuthorProfilesController,
  SearchController,
  HubsController,
  ReviewsController,
  OutboundController,
  SponsorshipController,
  AccountController,
];

@Module({})
export class AppModule {
  static forRoot(env: Env, overrides: AppOverrides = {}): DynamicModule {
    return {
      module: AppModule,
      controllers: CONTROLLERS,
      providers: [
        { provide: ENV, useValue: env },
        { provide: EMAIL_PORT, useValue: overrides.emailPort ?? emailAdapter(env) },
        {
          provide: STORAGE_PORT,
          useValue:
            overrides.storagePort ??
            (env.STORAGE_ADAPTER === 'memory'
              ? new MemoryStorageAdapter()
              : new S3StorageAdapter(env)),
        },
        { provide: APP_FILTER, useClass: ProblemFilter },
        { provide: APP_GUARD, useClass: AuthGuard },
        PrismaService,
        AuditService,
        RateLimitService,
        AuthService,
        CategoriesService,
        AdminCategoriesService,
        CategorySchemaService,
        AdminListingsService,
        MediaService,
        ImportsService,
        PublicListingsService,
        AdminArticlesService,
        PublicArticlesService,
        AuthorProfilesService,
        OutboxService,
        { provide: SEARCH_PORT, useClass: PostgresSearchAdapter },
        SearchLexiconService,
        SearchService,
        SearchIndexerService,
        ThresholdsService,
        HubsService,
        ModerationSettingsService,
        ReviewsService,
        ModerationService,
        RatingStatsService,
        OutboundService,
        SponsoredServingService,
        CampaignsService,
        AccountService,
      ],
    };
  }
}
