import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards, Req, HttpStatus } from '@nestjs/common';
import { Request } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { LocationsService } from './locations.service';
import { GoogleBusinessProfileService } from '../common/services/google-business-profile.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Google Business Profile')
@Controller('locations')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class LocationsGmbController {
  constructor(
    private locationsService: LocationsService,
    private googleBusinessProfileService: GoogleBusinessProfileService,
  ) {}

  @Get(':id/gmb/accounts')
  @ApiOperation({ summary: 'Get Google Business Profile accounts for a location' })
  @ApiResponse({ status: 200, description: 'Business accounts retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Location not found' })
  async getBusinessAccounts(@Param('id') locationId: string, @Req() req: Request) {
    const user = req.user as any;
    const location = await this.locationsService.findOne(locationId, user.businessId);

    if (!location.oauthRefreshToken) {
      throw new Error('Location is not connected to Google Business Profile');
    }

    return this.googleBusinessProfileService.getBusinessAccounts(location.oauthRefreshToken);
  }

  @Get(':id/gmb/locations')
  @ApiOperation({ summary: 'Get Google Business Profile locations for an account' })
  @ApiResponse({ status: 200, description: 'Business locations retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Location not found' })
  async getAccountLocations(
    @Param('id') locationId: string,
    @Body('accountName') accountName: string,
    @Req() req: Request,
  ) {
    const user = req.user as any;
    const location = await this.locationsService.findOne(locationId, user.businessId);

    if (!location.oauthRefreshToken) {
      throw new Error('Location is not connected to Google Business Profile');
    }

    return this.googleBusinessProfileService.getAccountLocations(location.oauthRefreshToken, accountName);
  }

  @Get(':id/gmb/reviews')
  @ApiOperation({ summary: 'Get reviews for a Google Business Profile location' })
  @ApiResponse({ status: 200, description: 'Reviews retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Location not found' })
  async getLocationReviews(@Param('id') locationId: string, @Req() req: Request) {
    const user = req.user as any;
    const location = await this.locationsService.findOne(locationId, user.businessId);

    if (!location.oauthRefreshToken) {
      throw new Error('Location is not connected to Google Business Profile');
    }

    return this.googleBusinessProfileService.getLocationReviews(location.oauthRefreshToken, location.googlePlaceId);
  }

  @Post(':id/gmb/reviews/:reviewId/reply')
  @ApiOperation({ summary: 'Post a reply to a Google Business Profile review' })
  @ApiResponse({ status: 200, description: 'Reply posted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Location or review not found' })
  async replyToReview(
    @Param('id') locationId: string,
    @Param('reviewId') reviewId: string,
    @Body('replyText') replyText: string,
    @Req() req: Request,
  ) {
    const user = req.user as any;
    const location = await this.locationsService.findOne(locationId, user.businessId);

    if (!location.oauthRefreshToken) {
      throw new Error('Location is not connected to Google Business Profile');
    }

    await this.googleBusinessProfileService.replyToReview(
      location.oauthRefreshToken,
      `accounts/*/locations/*/reviews/${reviewId}`,
      replyText,
    );

    return { message: 'Reply posted successfully' };
  }

  @Get(':id/gmb/details')
  @ApiOperation({ summary: 'Get Google Business Profile location details' })
  @ApiResponse({ status: 200, description: 'Location details retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Location not found' })
  async getLocationDetails(@Param('id') locationId: string, @Req() req: Request) {
    const user = req.user as any;
    const location = await this.locationsService.findOne(locationId, user.businessId);

    if (!location.oauthRefreshToken) {
      throw new Error('Location is not connected to Google Business Profile');
    }

    return this.googleBusinessProfileService.getLocationDetails(location.oauthRefreshToken, location.googlePlaceId);
  }

  @Put(':id/gmb/update')
  @ApiOperation({ summary: 'Update Google Business Profile location information' })
  @ApiResponse({ status: 200, description: 'Location updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Location not found' })
  async updateLocation(
    @Param('id') locationId: string,
    @Body() updates: any,
    @Req() req: Request,
  ) {
    const user = req.user as any;
    const location = await this.locationsService.findOne(locationId, user.businessId);

    if (!location.oauthRefreshToken) {
      throw new Error('Location is not connected to Google Business Profile');
    }

    await this.googleBusinessProfileService.updateLocation(
      location.oauthRefreshToken,
      location.googlePlaceId,
      updates,
    );

    return { message: 'Location updated successfully' };
  }

  @Post(':id/gmb/sync')
  @ApiOperation({ summary: 'Sync Google Business Profile data for a location' })
  @ApiResponse({ status: 200, description: 'Sync initiated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Location not found' })
  async syncLocation(@Param('id') locationId: string, @Req() req: Request) {
    const user = req.user as any;
    return this.locationsService.sync(locationId, user.businessId, user.id);
  }

  @Post(':id/gmb/validate-token')
  @ApiOperation({ summary: 'Validate Google Business Profile refresh token' })
  @ApiResponse({ status: 200, description: 'Token validation result' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Location not found' })
  async validateToken(@Param('id') locationId: string, @Req() req: Request) {
    const user = req.user as any;
    const location = await this.locationsService.findOne(locationId, user.businessId);

    if (!location.oauthRefreshToken) {
      return { valid: false, message: 'No refresh token found' };
    }

    const isValid = await this.googleBusinessProfileService.validateRefreshToken(location.oauthRefreshToken);
    
    return { 
      valid: isValid,
      message: isValid ? 'Token is valid' : 'Token is invalid or expired'
    };
  }
}
