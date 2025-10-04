import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { GoogleBusinessProfileService } from '../../common/services/google-business-profile.service';

@Injectable()
@Processor('reviews.poll')
export class ReviewsPollProcessor extends WorkerHost {
  constructor(
    private prisma: PrismaService,
    private googleBusinessProfileService: GoogleBusinessProfileService,
    @InjectQueue('reviews.process') private reviewsProcessQueue: Queue,
  ) {
    super();
  }

  async process(job: Job<any>): Promise<any> {
    const { locationId, businessId, userId } = job.data;
    
    console.log(`Polling reviews for location ${locationId}`);

    try {
      // Get location details
      const location = await this.prisma.location.findUnique({
        where: { id: locationId },
      });

      if (!location || !location.oauthRefreshToken) {
        throw new Error('Location not found or not connected to Google Business Profile');
      }

      // Validate refresh token
      const isValid = await this.googleBusinessProfileService.validateRefreshToken(location.oauthRefreshToken);
      if (!isValid) {
        console.error(`Invalid refresh token for location ${locationId}`);
        // Mark location as disconnected
        await this.prisma.location.update({
          where: { id: locationId },
          data: { oauthRefreshToken: null },
        });
        throw new Error('Invalid refresh token - location disconnected');
      }

      // Fetch reviews from Google Business Profile API
      const googleReviews = await this.googleBusinessProfileService.getLocationReviews(
        location.oauthRefreshToken,
        location.googlePlaceId,
      );

      // Create jobs to process each review
      for (const googleReview of googleReviews) {
        const reviewData = {
          googleReviewId: googleReview.reviewId,
          authorName: googleReview.reviewer.displayName,
          authorEmail: '', // Google doesn't provide email in reviews
          rating: this.mapGoogleRating(googleReview.starRating),
          text: googleReview.comment || '',
          createdAt: new Date(googleReview.createTime),
          reviewReply: googleReview.reviewReply,
        };

        await this.reviewsProcessQueue.add('process-review', {
          reviewData,
          locationId,
          businessId,
          userId,
        });
      }

      // Update location last sync time
      await this.prisma.location.update({
        where: { id: locationId },
        data: { lastSyncAt: new Date() },
      });

      console.log(`Successfully polled ${googleReviews.length} reviews for location ${locationId}`);
      
      return { processed: googleReviews.length };
    } catch (error) {
      console.error(`Error polling reviews for location ${locationId}:`, error);
      throw error;
    }
  }

  private mapGoogleRating(googleRating: string): number {
    const ratingMap = {
      'ONE': 1,
      'TWO': 2,
      'THREE': 3,
      'FOUR': 4,
      'FIVE': 5,
    };
    return ratingMap[googleRating] || 5;
  }
}

