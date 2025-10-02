import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../database/prisma.service';
import { GetReviewsDto, UpdateReviewDto } from '../common/dto/review.dto';
import { AuditLogsService } from '../audit-logs/audit-logs.service';

@Injectable()
export class ReviewsService {
  constructor(
    private prisma: PrismaService,
    @InjectQueue('reviews.process') private reviewsProcessQueue: Queue,
    private auditLogService: AuditLogsService,
  ) {}

  async findAll(businessId: string, query: GetReviewsDto) {
    const { page = 1, limit = 10, locationId, status, rating } = query;
    const skip = (page - 1) * limit;

    const where: any = {
      location: { businessId },
    };

    if (locationId) {
      where.locationId = locationId;
    }

    if (status) {
      where.status = status;
    }

    if (rating) {
      where.rating = rating;
    }

    const [reviews, total] = await Promise.all([
      this.prisma.review.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          location: {
            select: {
              id: true,
              name: true,
              address: true,
            },
          },
          replies: {
            select: {
              id: true,
              voice: true,
              draftText: true,
              finalText: true,
              escalate: true,
              published: true,
              publishedAt: true,
              createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
          },
        },
      }),
      this.prisma.review.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: reviews,
      meta: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  async findOne(id: string, businessId: string) {
    const review = await this.prisma.review.findFirst({
      where: { 
        id,
        location: { businessId },
      },
      include: {
        location: {
          select: {
            id: true,
            name: true,
            address: true,
          },
        },
        replies: {
          select: {
            id: true,
            voice: true,
            draftText: true,
            finalText: true,
            escalate: true,
            published: true,
            publishedAt: true,
            createdAt: true,
            updatedAt: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    return review;
  }

  async update(id: string, businessId: string, userId: string, updateReviewDto: UpdateReviewDto) {
    const review = await this.findOne(id, businessId);

    const updatedReview = await this.prisma.review.update({
      where: { id },
      data: updateReviewDto,
    });

    // Log the action
    await this.auditLogService.create({
      businessId,
      actorUserId: userId,
      action: 'update',
      entityType: 'review',
      entityId: id,
      details: updateReviewDto,
    });

    return updatedReview;
  }

  async bulkUpdateStatus(businessId: string, userId: string, reviewIds: string[], status: string) {
    const reviews = await this.prisma.review.findMany({
      where: {
        id: { in: reviewIds },
        location: { businessId },
      },
    });

    if (reviews.length === 0) {
      throw new BadRequestException('No reviews found for the given IDs');
    }

    const updatedReviews = await this.prisma.review.updateMany({
      where: {
        id: { in: reviewIds },
        location: { businessId },
      },
      data: { status },
    });

    // Log the action
    await this.auditLogService.create({
      businessId,
      actorUserId: userId,
      action: 'update',
      entityType: 'review',
      entityId: reviewIds.join(','),
      details: { status, count: reviewIds.length },
    });

    return { message: `${updatedReviews.count} reviews updated successfully` };
  }

  async createFromGoogleApi(reviewData: any, locationId: string) {
    // Check if review already exists
    const existingReview = await this.prisma.review.findUnique({
      where: { googleReviewId: reviewData.googleReviewId },
    });

    if (existingReview) {
      return existingReview;
    }

    // Add job to process the review (sentiment analysis, etc.)
    await this.reviewsProcessQueue.add('process-review', {
      reviewData,
      locationId,
    });

    // Create the review
    const review = await this.prisma.review.create({
      data: {
        locationId,
        googleReviewId: reviewData.googleReviewId,
        authorName: reviewData.authorName,
        authorEmail: reviewData.authorEmail,
        rating: reviewData.rating,
        text: reviewData.text,
        createdAt: reviewData.createdAt,
      },
    });

    return review;
  }

  async getStats(businessId: string, locationId?: string) {
    const where: any = {
      location: { businessId },
    };

    if (locationId) {
      where.locationId = locationId;
    }

    const [
      total,
      byRating,
      byStatus,
      pending,
    ] = await Promise.all([
      this.prisma.review.count({ where }),
      this.prisma.review.groupBy({
        by: ['rating'],
        where,
        _count: { rating: true },
      }),
      this.prisma.review.groupBy({
        by: ['status'],
        where,
        _count: { status: true },
      }),
      this.prisma.review.count({
        where: { ...where, status: 'pending' },
      }),
    ]);

    return {
      total,
      pending,
      byRating: byRating.reduce((acc, item) => {
        acc[item.rating] = item._count.rating;
        return acc;
      }, {}),
      byStatus: byStatus.reduce((acc, item) => {
        acc[item.status] = item._count.status;
        return acc;
      }, {}),
    };
  }
}

