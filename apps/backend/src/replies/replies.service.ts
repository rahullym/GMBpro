import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../database/prisma.service';
import { GenerateReplyDto, UpdateReplyDto, PublishReplyDto, BrandVoice } from '../common/dto/reply.dto';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { ReviewsService } from '../reviews/reviews.service';

@Injectable()
export class RepliesService {
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    @InjectQueue('replies.generate') private repliesGenerateQueue: Queue,
    @InjectQueue('publish.attempt') private publishAttemptQueue: Queue,
    private auditLogService: AuditLogsService,
    private reviewsService: ReviewsService,
  ) {}

  async findAllByReview(reviewId: string, businessId: string) {
    // Verify review belongs to business
    const review = await this.reviewsService.findOne(reviewId, businessId);

    return this.prisma.reply.findMany({
      where: { reviewId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, businessId: string) {
    const reply = await this.prisma.reply.findFirst({
      where: { 
        id,
        review: {
          location: { businessId },
        },
      },
      include: {
        review: {
          include: {
            location: {
              select: {
                id: true,
                name: true,
                address: true,
              },
            },
          },
        },
      },
    });

    if (!reply) {
      throw new NotFoundException('Reply not found');
    }

    return reply;
  }

  async generateReply(reviewId: string, businessId: string, userId: string, generateReplyDto: GenerateReplyDto) {
    const { voice = BrandVoice.POLITE } = generateReplyDto;

    // Verify review belongs to business
    const review = await this.reviewsService.findOne(reviewId, businessId);

    // Add job to generate reply
    await this.repliesGenerateQueue.add('generate-reply', {
      reviewId,
      voice,
      businessId,
      userId,
    });

    return { message: 'Reply generation initiated successfully' };
  }

  async update(id: string, businessId: string, userId: string, updateReplyDto: UpdateReplyDto) {
    const reply = await this.findOne(id, businessId);

    const updatedReply = await this.prisma.reply.update({
      where: { id },
      data: updateReplyDto,
    });

    // Log the action
    await this.auditLogService.create({
      businessId,
      actorUserId: userId,
      action: 'update',
      entityType: 'reply',
      entityId: id,
      details: updateReplyDto,
    });

    return updatedReply;
  }

  async publish(id: string, businessId: string, userId: string, publishReplyDto: PublishReplyDto) {
    const reply = await this.findOne(id, businessId);

    if (reply.published) {
      throw new BadRequestException('Reply has already been published');
    }

    // Update reply with final text
    const updatedReply = await this.prisma.reply.update({
      where: { id },
      data: {
        finalText: publishReplyDto.finalText,
      },
    });

    // Add job to publish reply to Google
    await this.publishAttemptQueue.add('publish-reply', {
      replyId: id,
      businessId,
      userId,
      finalText: publishReplyDto.finalText,
    });

    // Log the action
    await this.auditLogService.create({
      businessId,
      actorUserId: userId,
      action: 'publish',
      entityType: 'reply',
      entityId: id,
      details: { finalText: publishReplyDto.finalText },
    });

    return { message: 'Reply publication initiated successfully' };
  }

  async createDraftReply(reviewId: string, voice: BrandVoice, draftText: string, escalate: boolean = false) {
    return this.prisma.reply.create({
      data: {
        reviewId,
        voice,
        draftText,
        escalate,
      },
    });
  }

  async markAsPublished(id: string, publishedText: string) {
    return this.prisma.reply.update({
      where: { id },
      data: {
        published: true,
        finalText: publishedText,
        publishedAt: new Date(),
      },
    });
  }

  async getBrandVoicePrompt(voice: BrandVoice): Promise<string> {
    const voicePrompts = {
      [BrandVoice.POLITE]: `You are a polite and professional customer service representative. Your responses should be courteous, respectful, and helpful. Use formal language and always thank customers for their feedback.`,
      [BrandVoice.CASUAL]: `You are a friendly and approachable customer service representative. Your responses should be warm, conversational, and relatable. Use casual language while maintaining professionalism.`,
      [BrandVoice.PROFESSIONAL]: `You are a professional customer service representative representing a business. Your responses should be clear, concise, and business-appropriate. Maintain a professional tone while being helpful.`,
    };

    return voicePrompts[voice] || voicePrompts[BrandVoice.POLITE];
  }

  async generateOpenAIResponse(reviewText: string, rating: number, voice: BrandVoice): Promise<{ reply: string; escalate: boolean }> {
    const prompt = this.getBrandVoicePrompt(voice);
    
    const systemPrompt = `${prompt}

You are responding to a Google Business Profile review. Analyze the review and generate an appropriate response.

Instructions:
1. If the rating is 1-2 stars, acknowledge the concern and offer to resolve it offline
2. If the rating is 3-4 stars, thank them and invite them back
3. If the rating is 5 stars, thank them enthusiastically
4. Keep responses under 150 words
5. Always be respectful and professional
6. If the review contains serious complaints or inappropriate content, set escalate to true

Respond in JSON format with this structure:
{
  "reply": "Your generated response here",
  "escalate": false
}`;

    const userPrompt = `Review: "${reviewText}"
Rating: ${rating}/5 stars

Generate an appropriate response.`;

    // This is a placeholder - in a real implementation, you would call OpenAI API here
    // For now, return a mock response
    const mockResponse = {
      reply: `Thank you for your ${rating}-star review${rating >= 4 ? '! We appreciate your positive feedback' : '. We value your input and would love to discuss this further'}. ${rating >= 4 ? 'We look forward to serving you again soon!' : 'Please contact us directly so we can address your concerns.'}`,
      escalate: rating <= 2 && reviewText.toLowerCase().includes('terrible'),
    };

    return mockResponse;
  }
}

