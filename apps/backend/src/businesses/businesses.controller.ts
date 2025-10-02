import { Controller, Get, Put, Body, UseGuards, Req } from '@nestjs/common';
import { Request } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { BusinessesService } from './businesses.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Businesses')
@Controller('businesses')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class BusinessesController {
  constructor(private businessesService: BusinessesService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current user business' })
  @ApiResponse({ status: 200, description: 'Business retrieved successfully' })
  async getMyBusiness(@Req() req: Request) {
    const user = req.user as any;
    return this.businessesService.findOne(user.businessId);
  }

  @Put('me')
  @ApiOperation({ summary: 'Update current user business' })
  @ApiResponse({ status: 200, description: 'Business updated successfully' })
  async updateMyBusiness(@Req() req: Request, @Body() updateData: any) {
    const user = req.user as any;
    return this.businessesService.update(user.businessId, user.id, updateData);
  }

  @Get('me/stats')
  @ApiOperation({ summary: 'Get business statistics' })
  @ApiResponse({ status: 200, description: 'Business stats retrieved successfully' })
  async getMyBusinessStats(@Req() req: Request) {
    const user = req.user as any;
    return this.businessesService.getStats(user.businessId);
  }
}

