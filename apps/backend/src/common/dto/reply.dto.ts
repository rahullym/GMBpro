import { IsString, IsOptional, IsEnum, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum BrandVoice {
  POLITE = 'polite',
  CASUAL = 'casual',
  PROFESSIONAL = 'professional',
}

export class GenerateReplyDto {
  @ApiPropertyOptional({ enum: BrandVoice })
  @IsOptional()
  @IsEnum(BrandVoice)
  voice?: BrandVoice;
}

export class UpdateReplyDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  draftText?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  finalText?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  escalate?: boolean;
}

export class ReplyResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  reviewId: string;

  @ApiProperty()
  voice: string;

  @ApiProperty()
  draftText: string;

  @ApiPropertyOptional()
  finalText?: string;

  @ApiProperty()
  escalate: boolean;

  @ApiProperty()
  published: boolean;

  @ApiPropertyOptional()
  publishedAt?: Date;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class PublishReplyDto {
  @ApiProperty()
  @IsString()
  finalText: string;
}

