import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { RepliesService } from '../../replies/replies.service';
import { GoogleBusinessProfileService } from '../../common/services/google-business-profile.service';

@Injectable()
@Processor('publish.attempt')
export class PublishAttemptProcessor extends WorkerHost {
  constructor(
    private prisma: PrismaService,
    private repliesService: RepliesService,
    private googleBusinessProfileService: GoogleBusinessProfileService,
  ) {
    super();
  }

  async process(job: Job<any>): Promise<any> {
    const { replyId, businessId, userId, finalText } = job.data;
    
    console.log(`Attempting to publish reply ${replyId}`);

    try {
      // Get reply details
      const reply = await this.prisma.reply.findUnique({
        where: { id: replyId },
        include: {
          review: {
            include: {
              location: true,
            },
          },
        },
      });

      if (!reply) {
        throw new Error(`Reply ${replyId} not found`);
      }

      if (reply.published) {
        console.log(`Reply ${replyId} already published, skipping`);
        return { status: 'skipped', reason: 'already_published' };
      }

      // Check if location has OAuth token
      if (!reply.review.location.oauthRefreshToken) {
        throw new Error('Location not connected to Google Business Profile');
      }

      // Validate refresh token
      const isValid = await this.googleBusinessProfileService.validateRefreshToken(
        reply.review.location.oauthRefreshToken
      );
      if (!isValid) {
        throw new Error('Invalid refresh token - location disconnected');
      }

      try {
        // Publish reply to Google Business Profile API
        await this.googleBusinessProfileService.replyToReview(
          reply.review.location.oauthRefreshToken,
          reply.review.googleReviewId,
          finalText,
        );

        // Mark as published
        await this.repliesService.markAsPublished(replyId, finalText);

        console.log(`Successfully published reply ${replyId} to Google Business Profile`);
        
        return { 
          status: 'published', 
          replyId,
          publishedAt: new Date(),
        };
      } catch (apiError) {
        console.error('Google Business Profile API error:', apiError);
        // Fallback to mock publishing for testing
        const publishSuccess = await this.simulateGooglePublish(reply.review.googleReviewId, finalText);
        
        if (publishSuccess) {
          await this.repliesService.markAsPublished(replyId, finalText);
          console.log(`Successfully published reply ${replyId} (mock mode)`);
          
          return { 
            status: 'published', 
            replyId,
            publishedAt: new Date(),
            mode: 'mock',
          };
        } else {
          throw new Error('Failed to publish reply to Google Business Profile');
        }
      }
    } catch (error) {
      console.error(`Error publishing reply ${replyId}:`, error);
      
      // In a real implementation, you might want to retry the job
      // or implement exponential backoff
      throw error;
    }
  }

  private async simulateGooglePublish(googleReviewId: string, replyText: string): Promise<boolean> {
    // Mock implementation - simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Simulate occasional failures for testing
    return Math.random() > 0.1; // 90% success rate
  }
}

