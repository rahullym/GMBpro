import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { RepliesService } from './replies.service';
import { RepliesController } from './replies.controller';
import { PrismaService } from '../database/prisma.service';
import { AuthModule } from '../auth/auth.module';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';
import { ReviewsModule } from '../reviews/reviews.module';

@Module({
  imports: [
    AuthModule,
    AuditLogsModule,
    ReviewsModule,
    BullModule.registerQueue({
      name: 'replies.generate',
    }),
    BullModule.registerQueue({
      name: 'publish.attempt',
    }),
  ],
  controllers: [RepliesController],
  providers: [RepliesService, PrismaService],
  exports: [RepliesService],
})
export class RepliesModule {}

