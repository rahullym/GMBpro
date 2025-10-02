import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { GoogleBusinessProfileService } from '../../common/services/google-business-profile.service';

interface SyncLocationJobData {
  locationId: string;
  businessId: string;
  userId: string;
}

interface ReplyToReviewJobData {
  locationId: string;
  reviewId: string;
  replyText: string;
  businessId: string;
  userId: string;
}

@Injectable()
@Processor('google-business')
export class GoogleBusinessProcessor extends WorkerHost {
  private readonly logger = new Logger(GoogleBusinessProcessor.name);

  constructor(
    private prisma: PrismaService,
    private googleBusinessProfileService: GoogleBusinessProfileService,
  ) {
    super();
  }

  async process(job: Job): Promise<any> {
    const { name, data } = job;

    switch (name) {
      case 'sync-location':
        return this.syncLocation(data as SyncLocationJobData);
      case 'reply-to-review':
        return this.replyToReview(data as ReplyToReviewJobData);
      default:
        this.logger.warn(`Unknown job type: ${name}`);
        throw new Error(`Unknown job type: ${name}`);
    }
  }

  private async syncLocation(data: SyncLocationJobData): Promise<void> {
    const { locationId, businessId, userId } = data;

    try {
      this.logger.log(`Starting sync for location ${locationId}`);

      // Get location with encrypted refresh token
      const location = await this.prisma.location.findFirst({
        where: { id: locationId, businessId },
      });

      if (!location || !location.oauthRefreshToken) {
        throw new Error('Location not found or not connected to Google Business Profile');
      }

      // Validate refresh token
      const isValid = await this.googleBusinessProfileService.validateRefreshToken(location.oauthRefreshToken);
      if (!isValid) {
        this.logger.error(`Invalid refresh token for location ${locationId}`);
        // Mark location as disconnected
        await this.prisma.location.update({
          where: { id: locationId },
          data: { oauthRefreshToken: null },
        });
        throw new Error('Invalid refresh token - location disconnected');
      }

      // Get reviews from Google Business Profile
      const googleReviews = await this.googleBusinessProfileService.getLocationReviews(
        location.oauthRefreshToken,
        location.googlePlaceId,
      );

      // Process each review
      for (const googleReview of googleReviews) {
        const existingReview = await this.prisma.review.findUnique({
          where: { googleReviewId: googleReview.reviewId },
        });

        if (!existingReview) {
          // Create new review
          const rating = this.mapGoogleRating(googleReview.starRating);
          const sentiment = await this.analyzeSentiment(googleReview.comment || '');

          await this.prisma.review.create({
            data: {
              locationId: location.id,
              googleReviewId: googleReview.reviewId,
              authorName: googleReview.reviewer.displayName,
              rating,
              text: googleReview.comment,
              sentiment,
              status: 'pending',
              createdAt: new Date(googleReview.createTime),
              ingestedAt: new Date(),
            },
          });

          this.logger.log(`Created new review ${googleReview.reviewId} for location ${locationId}`);
        } else {
          // Update existing review if needed
          const rating = this.mapGoogleRating(googleReview.starRating);
          const sentiment = await this.analyzeSentiment(googleReview.comment || '');

          await this.prisma.review.update({
            where: { id: existingReview.id },
            data: {
              rating,
              text: googleReview.comment,
              sentiment,
              updatedAt: new Date(),
            },
          });

          this.logger.log(`Updated review ${googleReview.reviewId} for location ${locationId}`);
        }
      }

      // Update last sync time
      await this.prisma.location.update({
        where: { id: locationId },
        data: { lastSyncAt: new Date() },
      });

      this.logger.log(`Successfully synced location ${locationId}`);
    } catch (error) {
      this.logger.error(`Error syncing location ${locationId}:`, error);
      throw error;
    }
  }

  private async replyToReview(data: ReplyToReviewJobData): Promise<void> {
    const { locationId, reviewId, replyText, businessId, userId } = data;

    try {
      this.logger.log(`Posting reply to review ${reviewId}`);

      // Get location with encrypted refresh token
      const location = await this.prisma.location.findFirst({
        where: { id: locationId, businessId },
      });

      if (!location || !location.oauthRefreshToken) {
        throw new Error('Location not found or not connected to Google Business Profile');
      }

      // Get review
      const review = await this.prisma.review.findFirst({
        where: { id: reviewId, locationId },
      });

      if (!review) {
        throw new Error('Review not found');
      }

      // Post reply to Google Business Profile
      await this.googleBusinessProfileService.replyToReview(
        location.oauthRefreshToken,
        review.googleReviewId,
        replyText,
      );

      // Update review in database
      await this.prisma.review.update({
        where: { id: reviewId },
        data: {
          status: 'approved',
          updatedAt: new Date(),
        },
      });

      // Create reply record
      await this.prisma.reply.create({
        data: {
          reviewId: review.id,
          voice: 'professional', // Default voice
          draftText: replyText,
          finalText: replyText,
          published: true,
          publishedAt: new Date(),
        },
      });

      this.logger.log(`Successfully posted reply to review ${reviewId}`);
    } catch (error) {
      this.logger.error(`Error posting reply to review ${reviewId}:`, error);
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

  private async analyzeSentiment(text: string): Promise<string> {
    // Simple sentiment analysis - in a real implementation, you'd use OpenAI or another service
    if (!text) return 'neutral';
    
    const positiveWords = ['great', 'excellent', 'amazing', 'wonderful', 'fantastic', 'love', 'perfect', 'awesome'];
    const negativeWords = ['terrible', 'awful', 'horrible', 'bad', 'hate', 'worst', 'disappointed', 'poor'];
    
    const lowerText = text.toLowerCase();
    const positiveCount = positiveWords.filter(word => lowerText.includes(word)).length;
    const negativeCount = negativeWords.filter(word => lowerText.includes(word)).length;
    
    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }
}
