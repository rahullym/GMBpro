import { 
  Controller, 
  Get, 
  Post, 
  Patch, 
  Param, 
  Body, 
  UseGuards, 
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Request } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { RepliesService } from './replies.service';
import { GenerateReplyDto, UpdateReplyDto, PublishReplyDto } from '../common/dto/reply.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Replies')
@Controller('replies')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class RepliesController {
  constructor(private repliesService: RepliesService) {}

  @Get('reviews/:reviewId')
  @ApiOperation({ summary: 'Get all replies for a review' })
  @ApiParam({ name: 'reviewId', description: 'Review ID' })
  @ApiResponse({ status: 200, description: 'Replies retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Review not found' })
  async findAllByReview(@Req() req: Request, @Param('reviewId') reviewId: string) {
    const user = req.user as any;
    return this.repliesService.findAllByReview(reviewId, user.businessId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a reply by ID' })
  @ApiParam({ name: 'id', description: 'Reply ID' })
  @ApiResponse({ status: 200, description: 'Reply retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Reply not found' })
  async findOne(@Req() req: Request, @Param('id') id: string) {
    const user = req.user as any;
    return this.repliesService.findOne(id, user.businessId);
  }

  @Post('reviews/:reviewId/generate')
  @ApiOperation({ summary: 'Generate AI reply for a review' })
  @ApiParam({ name: 'reviewId', description: 'Review ID' })
  @ApiResponse({ status: 200, description: 'Reply generation initiated successfully' })
  @ApiResponse({ status: 404, description: 'Review not found' })
  async generateReply(
    @Req() req: Request,
    @Param('reviewId') reviewId: string,
    @Body() generateReplyDto: GenerateReplyDto,
  ) {
    const user = req.user as any;
    return this.repliesService.generateReply(reviewId, user.businessId, user.id, generateReplyDto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a reply' })
  @ApiParam({ name: 'id', description: 'Reply ID' })
  @ApiResponse({ status: 200, description: 'Reply updated successfully' })
  @ApiResponse({ status: 404, description: 'Reply not found' })
  async update(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() updateReplyDto: UpdateReplyDto,
  ) {
    const user = req.user as any;
    return this.repliesService.update(id, user.businessId, user.id, updateReplyDto);
  }

  @Post(':id/publish')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Publish a reply to Google Business Profile' })
  @ApiParam({ name: 'id', description: 'Reply ID' })
  @ApiResponse({ status: 200, description: 'Reply publication initiated successfully' })
  @ApiResponse({ status: 400, description: 'Reply has already been published' })
  @ApiResponse({ status: 404, description: 'Reply not found' })
  async publish(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() publishReplyDto: PublishReplyDto,
  ) {
    const user = req.user as any;
    return this.repliesService.publish(id, user.businessId, user.id, publishReplyDto);
  }
}

