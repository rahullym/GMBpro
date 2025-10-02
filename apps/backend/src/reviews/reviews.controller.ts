import { 
  Controller, 
  Get, 
  Patch, 
  Param, 
  Body, 
  UseGuards, 
  Req,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Request } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { ReviewsService } from './reviews.service';
import { GetReviewsDto, UpdateReviewDto } from '../common/dto/review.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Reviews')
@Controller('reviews')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ReviewsController {
  constructor(private reviewsService: ReviewsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all reviews for current business' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'locationId', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'rating', required: false })
  @ApiResponse({ status: 200, description: 'Reviews retrieved successfully' })
  async findAll(@Req() req: Request, @Query() query: GetReviewsDto) {
    const user = req.user as any;
    return this.reviewsService.findAll(user.businessId, query);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get review statistics' })
  @ApiQuery({ name: 'locationId', required: false })
  @ApiResponse({ status: 200, description: 'Review stats retrieved successfully' })
  async getStats(@Req() req: Request, @Query('locationId') locationId?: string) {
    const user = req.user as any;
    return this.reviewsService.getStats(user.businessId, locationId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a review by ID' })
  @ApiParam({ name: 'id', description: 'Review ID' })
  @ApiResponse({ status: 200, description: 'Review retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Review not found' })
  async findOne(@Req() req: Request, @Param('id') id: string) {
    const user = req.user as any;
    return this.reviewsService.findOne(id, user.businessId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a review' })
  @ApiParam({ name: 'id', description: 'Review ID' })
  @ApiResponse({ status: 200, description: 'Review updated successfully' })
  @ApiResponse({ status: 404, description: 'Review not found' })
  async update(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() updateReviewDto: UpdateReviewDto,
  ) {
    const user = req.user as any;
    return this.reviewsService.update(id, user.businessId, user.id, updateReviewDto);
  }

  @Patch('bulk/status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Bulk update review status' })
  @ApiResponse({ status: 200, description: 'Reviews updated successfully' })
  async bulkUpdateStatus(
    @Req() req: Request,
    @Body() body: { reviewIds: string[]; status: string },
  ) {
    const user = req.user as any;
    return this.reviewsService.bulkUpdateStatus(user.businessId, user.id, body.reviewIds, body.status);
  }
}

