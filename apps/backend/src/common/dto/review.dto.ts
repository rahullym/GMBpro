import { IsString, IsOptional, IsNumber, IsEnum, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from './pagination.dto';

export enum ReviewStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  ESCALATED = 'escalated',
  ARCHIVED = 'archived',
}

export enum ReviewRating {
  ONE = 1,
  TWO = 2,
  THREE = 3,
  FOUR = 4,
  FIVE = 5,
}

export class GetReviewsDto extends PaginationDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  locationId?: string;

  @ApiPropertyOptional({ enum: ReviewStatus })
  @IsOptional()
  @IsEnum(ReviewStatus)
  status?: ReviewStatus;

  @ApiPropertyOptional({ enum: ReviewRating })
  @IsOptional()
  @IsEnum(ReviewRating)
  rating?: ReviewRating;
}

export class UpdateReviewDto {
  @ApiPropertyOptional({ enum: ReviewStatus })
  @IsOptional()
  @IsEnum(ReviewStatus)
  status?: ReviewStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sentiment?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;
}

export class ReviewResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  locationId: string;

  @ApiProperty()
  googleReviewId: string;

  @ApiProperty()
  authorName: string;

  @ApiPropertyOptional()
  authorEmail?: string;

  @ApiProperty()
  rating: number;

  @ApiPropertyOptional()
  text?: string;

  @ApiPropertyOptional()
  sentiment?: string;

  @ApiProperty()
  status: string;

  @ApiProperty()
  isPublished: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  ingestedAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

