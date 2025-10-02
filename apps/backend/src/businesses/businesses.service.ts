import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class BusinessesService {
  constructor(private prisma: PrismaService) {}

  async findOne(businessId: string) {
    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
      include: {
        users: true,
        locations: true,
        _count: {
          select: {
            users: true,
            locations: true,
          },
        },
      },
    });

    if (!business) {
      throw new NotFoundException('Business not found');
    }

    return business;
  }

  async update(businessId: string, userId: string, updateData: any) {
    // Check if user has permission to update business
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || user.businessId !== businessId) {
      throw new ForbiddenException('You do not have permission to update this business');
    }

    if (user.role !== 'owner' && user.role !== 'admin') {
      throw new ForbiddenException('Only owners and admins can update business settings');
    }

    const business = await this.prisma.business.update({
      where: { id: businessId },
      data: updateData,
    });

    return business;
  }

  async getStats(businessId: string) {
    const [
      totalLocations,
      activeLocations,
      totalReviews,
      pendingReviews,
      publishedReplies,
    ] = await Promise.all([
      this.prisma.location.count({
        where: { businessId },
      }),
      this.prisma.location.count({
        where: { businessId, isActive: true },
      }),
      this.prisma.review.count({
        where: { location: { businessId } },
      }),
      this.prisma.review.count({
        where: { 
          location: { businessId },
          status: 'pending',
        },
      }),
      this.prisma.reply.count({
        where: { 
          published: true,
          review: { location: { businessId } },
        },
      }),
    ]);

    return {
      totalLocations,
      activeLocations,
      totalReviews,
      pendingReviews,
      publishedReplies,
    };
  }
}

