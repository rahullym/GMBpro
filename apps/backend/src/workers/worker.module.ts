import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ReviewsPollProcessor } from './processors/reviews-poll.processor';
import { ReviewsProcessProcessor } from './processors/reviews-process.processor';
import { RepliesGenerateProcessor } from './processors/replies-generate.processor';
import { PublishAttemptProcessor } from './processors/publish-attempt.processor';
import { GoogleBusinessProcessor } from './processors/google-business.processor';
import { PrismaService } from '../database/prisma.service';
import { ReviewsService } from '../reviews/reviews.service';
import { RepliesService } from '../replies/replies.service';
import { GoogleBusinessProfileService } from '../common/services/google-business-profile.service';
import { GoogleOAuthService } from '../common/services/google-oauth.service';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';
import redisConfig from '../config/redis.config';
import googleConfig from '../config/google.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [redisConfig, googleConfig],
    }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        connection: {
          host: configService.get<string>('redis.host'),
          port: configService.get<number>('redis.port'),
          password: configService.get<string>('redis.password'),
        },
      }),
      inject: [ConfigService],
    }),
    BullModule.registerQueue({
      name: 'reviews.poll',
    }),
    BullModule.registerQueue({
      name: 'reviews.process',
    }),
    BullModule.registerQueue({
      name: 'replies.generate',
    }),
    BullModule.registerQueue({
      name: 'publish.attempt',
    }),
    BullModule.registerQueue({
      name: 'google-business',
    }),
    AuditLogsModule,
  ],
  providers: [
    PrismaService,
    ReviewsService,
    RepliesService,
    GoogleBusinessProfileService,
    GoogleOAuthService,
    ReviewsPollProcessor,
    ReviewsProcessProcessor,
    RepliesGenerateProcessor,
    PublishAttemptProcessor,
    GoogleBusinessProcessor,
  ],
})
export class WorkerModule {}

