import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { ReviewsService } from '../../reviews/reviews.service';

@Injectable()
@Processor('reviews.process')
export class ReviewsProcessProcessor extends WorkerHost {
  constructor(
    private prisma: PrismaService,
    private reviewsService: ReviewsService,
  ) {
    super();
  }

  async process(job: Job<any>): Promise<any> {
    const { reviewData, locationId, businessId, userId } = job.data;
    
    console.log(`Processing review ${reviewData.googleReviewId}`);

    try {
      // Check if review already exists
      const existingReview = await this.prisma.review.findUnique({
        where: { googleReviewId: reviewData.googleReviewId },
      });

      if (existingReview) {
        console.log(`Review ${reviewData.googleReviewId} already exists, skipping`);
        return { status: 'skipped', reason: 'already_exists' };
      }

      // Perform sentiment analysis (mock implementation)
      const sentiment = this.analyzeSentiment(reviewData.text, reviewData.rating);

      // Create the review
      const review = await this.prisma.review.create({
        data: {
          locationId,
          googleReviewId: reviewData.googleReviewId,
          authorName: reviewData.authorName,
          authorEmail: reviewData.authorEmail,
          rating: reviewData.rating,
          text: reviewData.text,
          sentiment,
          createdAt: reviewData.createdAt,
        },
      });

      console.log(`Successfully processed review ${reviewData.googleReviewId}`);
      
      return { 
        status: 'processed', 
        reviewId: review.id,
        sentiment,
      };
    } catch (error) {
      console.error(`Error processing review ${reviewData.googleReviewId}:`, error);
      throw error;
    }
  }

  private analyzeSentiment(text: string, rating: number): string {
    // Simple sentiment analysis based on rating and keywords
    if (rating >= 4) {
      return 'positive';
    } else if (rating <= 2) {
      return 'negative';
    } else {
      // Check for positive/negative keywords in text
      const positiveKeywords = ['good', 'great', 'excellent', 'amazing', 'wonderful', 'love', 'perfect'];
      const negativeKeywords = ['bad', 'terrible', 'awful', 'horrible', 'hate', 'disappointed', 'worst'];
      
      const lowerText = text.toLowerCase();
      
      const positiveCount = positiveKeywords.filter(keyword => lowerText.includes(keyword)).length;
      const negativeCount = negativeKeywords.filter(keyword => lowerText.includes(keyword)).length;
      
      if (positiveCount > negativeCount) {
        return 'positive';
      } else if (negativeCount > positiveCount) {
        return 'negative';
      } else {
        return 'neutral';
      }
    }
  }
}

