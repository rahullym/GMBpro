import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { LocationsService } from './locations.service';
import { LocationsController } from './locations.controller';
import { LocationsGmbController } from './locations-gmb.controller';
import { PrismaService } from '../database/prisma.service';
import { GoogleBusinessProfileService } from '../common/services/google-business-profile.service';
import { AuthModule } from '../auth/auth.module';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';

@Module({
  imports: [
    AuthModule,
    AuditLogsModule,
    BullModule.registerQueue({
      name: 'reviews.poll',
    }),
  ],
  controllers: [LocationsController, LocationsGmbController],
  providers: [LocationsService, PrismaService, GoogleBusinessProfileService],
  exports: [LocationsService],
})
export class LocationsModule {}
