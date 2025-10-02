import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
@Processor('reviews.poll')
export class ReviewsPollProcessor extends WorkerHost {
  constructor(
    private prisma: PrismaService,
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

      // In a real implementation, you would:
      // 1. Use the OAuth refresh token to get a new access token
      // 2. Call Google Business Profile API to fetch reviews
      // 3. Process the response and create jobs for review processing

      // Mock implementation - simulate fetching reviews
      const mockReviews = [
        {
          googleReviewId: `review_${Date.now()}_1`,
          authorName: 'John Doe',
          authorEmail: 'john@example.com',
          rating: 5,
          text: 'Great service! Highly recommend.',
          createdAt: new Date(),
        },
        {
          googleReviewId: `review_${Date.now()}_2`,
          authorName: 'Jane Smith',
          authorEmail: 'jane@example.com',
          rating: 3,
          text: 'Good food but service was slow.',
          createdAt: new Date(),
        },
      ];

      // Create jobs to process each review
      for (const reviewData of mockReviews) {
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

      console.log(`Successfully polled ${mockReviews.length} reviews for location ${locationId}`);
      
      return { processed: mockReviews.length };
    } catch (error) {
      console.error(`Error polling reviews for location ${locationId}:`, error);
      throw error;
    }
  }
}

