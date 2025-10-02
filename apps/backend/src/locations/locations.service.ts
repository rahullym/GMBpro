import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../database/prisma.service';
import { CreateLocationDto, UpdateLocationDto } from '../common/dto/location.dto';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { GoogleBusinessProfileService } from '../common/services/google-business-profile.service';

@Injectable()
export class LocationsService {
  constructor(
    private prisma: PrismaService,
    @InjectQueue('reviews.poll') private reviewsPollQueue: Queue,
    private auditLogService: AuditLogsService,
    private googleBusinessProfileService: GoogleBusinessProfileService,
  ) {}

  async findAll(businessId: string) {
    return this.prisma.location.findMany({
      where: { businessId },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            reviews: true,
          },
        },
      },
    });
  }

  async findOne(id: string, businessId: string) {
    const location = await this.prisma.location.findFirst({
      where: { id, businessId },
      include: {
        reviews: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        _count: {
          select: {
            reviews: true,
          },
        },
      },
    });

    if (!location) {
      throw new NotFoundException('Location not found');
    }

    return location;
  }

  async create(businessId: string, userId: string, createLocationDto: CreateLocationDto) {
    const { googlePlaceId, name, address, latitude, longitude, phoneNumber, website } = createLocationDto;

    // Check if location already exists
    const existingLocation = await this.prisma.location.findUnique({
      where: { googlePlaceId },
    });

    if (existingLocation) {
      throw new BadRequestException('Location with this Google Place ID already exists');
    }

    const location = await this.prisma.location.create({
      data: {
        businessId,
        googlePlaceId,
        name,
        address,
        latitude,
        longitude,
        phoneNumber,
        website,
      },
    });

    // Log the action
    await this.auditLogService.create({
      businessId,
      actorUserId: userId,
      action: 'create',
      entityType: 'location',
      entityId: location.id,
      details: { name, address },
    });

    return location;
  }

  async update(id: string, businessId: string, userId: string, updateLocationDto: UpdateLocationDto) {
    const location = await this.findOne(id, businessId);

    const updatedLocation = await this.prisma.location.update({
      where: { id },
      data: updateLocationDto,
    });

    // Log the action
    await this.auditLogService.create({
      businessId,
      actorUserId: userId,
      action: 'update',
      entityType: 'location',
      entityId: id,
      details: updateLocationDto,
    });

    return updatedLocation;
  }

  async remove(id: string, businessId: string, userId: string) {
    const location = await this.findOne(id, businessId);

    await this.prisma.location.delete({
      where: { id },
    });

    // Log the action
    await this.auditLogService.create({
      businessId,
      actorUserId: userId,
      action: 'delete',
      entityType: 'location',
      entityId: id,
      details: { name: location.name },
    });

    return { message: 'Location deleted successfully' };
  }

  async sync(id: string, businessId: string, userId: string) {
    const location = await this.findOne(id, businessId);

    if (!location.oauthRefreshToken) {
      throw new BadRequestException('Location is not connected to Google Business Profile');
    }

    // Add job to poll reviews for this location
    await this.reviewsPollQueue.add('poll-reviews', {
      locationId: id,
      businessId,
      userId,
    });

    // Update last sync time
    await this.prisma.location.update({
      where: { id },
      data: { lastSyncAt: new Date() },
    });

    // Log the action
    await this.auditLogService.create({
      businessId,
      actorUserId: userId,
      action: 'sync',
      entityType: 'location',
      entityId: id,
      details: { name: location.name },
    });

    return { message: 'Location sync initiated successfully' };
  }

  async connectGoogleBusinessProfile(id: string, businessId: string, userId: string, oauthRefreshToken: string) {
    const location = await this.findOne(id, businessId);

    // Store the encrypted refresh token
    const updatedLocation = await this.prisma.location.update({
      where: { id },
      data: { oauthRefreshToken },
    });

    // Log the action
    await this.auditLogService.create({
      businessId,
      actorUserId: userId,
      action: 'update',
      entityType: 'location',
      entityId: id,
      details: { connected: true },
    });

    return updatedLocation;
  }

  async disconnectGoogleBusinessProfile(id: string, businessId: string, userId: string) {
    const location = await this.findOne(id, businessId);

    const updatedLocation = await this.prisma.location.update({
      where: { id },
      data: { oauthRefreshToken: null },
    });

    // Log the action
    await this.auditLogService.create({
      businessId,
      actorUserId: userId,
      action: 'update',
      entityType: 'location',
      entityId: id,
      details: { connected: false },
    });

    return updatedLocation;
  }
}

