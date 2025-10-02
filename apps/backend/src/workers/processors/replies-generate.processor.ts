import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { RepliesService } from '../../replies/replies.service';
import { BrandVoice } from '../../common/dto/reply.dto';

@Injectable()
@Processor('replies.generate')
export class RepliesGenerateProcessor extends WorkerHost {
  constructor(
    private prisma: PrismaService,
    private repliesService: RepliesService,
  ) {
    super();
  }

  async process(job: Job<any>): Promise<any> {
    const { reviewId, voice, businessId, userId } = job.data;
    
    console.log(`Generating reply for review ${reviewId} with voice ${voice}`);

    try {
      // Get review details
      const review = await this.prisma.review.findUnique({
        where: { id: reviewId },
        include: {
          location: {
            include: {
              business: true,
            },
          },
        },
      });

      if (!review) {
        throw new Error(`Review ${reviewId} not found`);
      }

      // Generate AI reply
      const aiResponse = await this.repliesService.generateOpenAIResponse(
        review.text || '',
        review.rating,
        voice as BrandVoice,
      );

      // Create reply record
      const reply = await this.repliesService.createDraftReply(
        reviewId,
        voice as BrandVoice,
        aiResponse.reply,
        aiResponse.escalate,
      );

      console.log(`Successfully generated reply for review ${reviewId}`);
      
      return { 
        status: 'generated', 
        replyId: reply.id,
        escalate: aiResponse.escalate,
      };
    } catch (error) {
      console.error(`Error generating reply for review ${reviewId}:`, error);
      throw error;
    }
  }
}

