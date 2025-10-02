import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { google } from 'googleapis';
import { GoogleOAuthService } from './google-oauth.service';

export interface GoogleReview {
  reviewId: string;
  reviewer: {
    displayName: string;
    profilePhotoUrl?: string;
    isAnonymous: boolean;
  };
  starRating: 'ONE' | 'TWO' | 'THREE' | 'FOUR' | 'FIVE';
  comment?: string;
  createTime: string;
  updateTime: string;
  reviewReply?: {
    comment: string;
    updateTime: string;
  };
}

export interface GoogleBusinessLocation {
  name: string;
  title: string;
  primaryCategory: string;
  storefrontAddress: {
    addressLines: string[];
    locality: string;
    administrativeArea: string;
    postalCode: string;
    regionCode: string;
  };
  primaryPhone?: string;
  websiteUri?: string;
  businessStatus: string;
  state: string;
}

export interface GoogleBusinessAccount {
  name: string;
  accountName: string;
  type: string;
  role: string;
  state: string;
}

@Injectable()
export class GoogleBusinessProfileService {
  constructor(
    private configService: ConfigService,
    private googleOAuthService: GoogleOAuthService,
  ) {}

  /**
   * Get user's Google Business Profile accounts
   */
  async getBusinessAccounts(encryptedRefreshToken: string): Promise<GoogleBusinessAccount[]> {
    try {
      // Refresh access token
      const { accessToken } = await this.googleOAuthService.refreshAccessToken(encryptedRefreshToken);
      
      const oauth2Client = new google.auth.OAuth2(
        this.configService.get<string>('google.clientId'),
        this.configService.get<string>('google.clientSecret'),
        this.configService.get<string>('google.redirectUri')
      );
      
      oauth2Client.setCredentials({ access_token: accessToken });

      // For now, return a mock response since the API structure has changed
      // In production, you would need to use the correct Google Business Profile API endpoints
      console.log('Google Business Profile API integration - using mock data for now');
      
      return [
        {
          name: 'accounts/mock-account-1',
          accountName: 'Mock Business Account',
          type: 'PERSONAL',
          role: 'OWNER',
          state: 'ACTIVE',
        }
      ];
    } catch (error) {
      console.error('Error fetching business accounts:', error);
      throw new InternalServerErrorException('Failed to get business accounts from Google Business Profile');
    }
  }

  /**
   * Get locations for a specific business account
   */
  async getAccountLocations(encryptedRefreshToken: string, accountName: string): Promise<GoogleBusinessLocation[]> {
    try {
      // For now, return mock data since the API structure has changed
      console.log('Google Business Profile API integration - using mock data for now');
      
      return [
        {
          name: 'accounts/mock-account-1/locations/mock-location-1',
          title: 'Mock Business Location',
          primaryCategory: 'Restaurant',
          storefrontAddress: {
            addressLines: ['123 Main St'],
            locality: 'New York',
            administrativeArea: 'NY',
            postalCode: '10001',
            regionCode: 'US',
          },
          primaryPhone: '+1234567890',
          websiteUri: 'https://example.com',
          businessStatus: 'OPEN',
          state: 'ACTIVE',
        }
      ];
    } catch (error) {
      console.error('Error fetching account locations:', error);
      throw new InternalServerErrorException('Failed to get locations from Google Business Profile');
    }
  }

  /**
   * Get reviews for a specific location
   */
  async getLocationReviews(encryptedRefreshToken: string, locationName: string): Promise<GoogleReview[]> {
    try {
      // For now, return mock data since the API structure has changed
      console.log('Google Business Profile API integration - using mock data for now');
      
      return [
        {
          reviewId: 'mock-review-1',
          reviewer: {
            displayName: 'John Doe',
            profilePhotoUrl: 'https://example.com/photo.jpg',
            isAnonymous: false,
          },
          starRating: 'FIVE',
          comment: 'Great service and food!',
          createTime: new Date().toISOString(),
          updateTime: new Date().toISOString(),
        },
        {
          reviewId: 'mock-review-2',
          reviewer: {
            displayName: 'Jane Smith',
            profilePhotoUrl: undefined,
            isAnonymous: false,
          },
          starRating: 'FOUR',
          comment: 'Good experience overall.',
          createTime: new Date().toISOString(),
          updateTime: new Date().toISOString(),
        }
      ];
    } catch (error) {
      console.error('Error fetching location reviews:', error);
      throw new InternalServerErrorException('Failed to fetch reviews from Google Business Profile');
    }
  }

  /**
   * Post a reply to a review
   */
  async replyToReview(
    encryptedRefreshToken: string,
    reviewName: string,
    replyText: string,
  ): Promise<void> {
    try {
      // For now, just log the reply since the API structure has changed
      console.log('Google Business Profile API integration - mock reply posted:', {
        reviewName,
        replyText,
      });
    } catch (error) {
      console.error('Error posting review reply:', error);
      throw new InternalServerErrorException('Failed to post reply to review');
    }
  }

  /**
   * Get location details
   */
  async getLocationDetails(encryptedRefreshToken: string, locationName: string): Promise<GoogleBusinessLocation | null> {
    try {
      // For now, return mock data since the API structure has changed
      console.log('Google Business Profile API integration - using mock data for now');
      
      return {
        name: locationName,
        title: 'Mock Business Location',
        primaryCategory: 'Restaurant',
        storefrontAddress: {
          addressLines: ['123 Main St'],
          locality: 'New York',
          administrativeArea: 'NY',
          postalCode: '10001',
          regionCode: 'US',
        },
        primaryPhone: '+1234567890',
        websiteUri: 'https://example.com',
        businessStatus: 'OPEN',
        state: 'ACTIVE',
      };
    } catch (error) {
      console.error('Error fetching location details:', error);
      throw new InternalServerErrorException('Failed to fetch location details from Google Business Profile');
    }
  }

  /**
   * Update location information
   */
  async updateLocation(
    encryptedRefreshToken: string,
    locationName: string,
    updates: Partial<GoogleBusinessLocation>,
  ): Promise<void> {
    try {
      // For now, just log the update since the API structure has changed
      console.log('Google Business Profile API integration - mock location update:', {
        locationName,
        updates,
      });
    } catch (error) {
      console.error('Error updating location:', error);
      throw new InternalServerErrorException('Failed to update location in Google Business Profile');
    }
  }

  /**
   * Check if refresh token is still valid
   */
  async validateRefreshToken(encryptedRefreshToken: string): Promise<boolean> {
    try {
      await this.googleOAuthService.refreshAccessToken(encryptedRefreshToken);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get all business profiles for a user (accounts + locations)
   */
  async getAllBusinessProfiles(encryptedRefreshToken: string): Promise<{
    accounts: GoogleBusinessAccount[];
    locations: GoogleBusinessLocation[];
  }> {
    try {
      const accounts = await this.getBusinessAccounts(encryptedRefreshToken);
      const allLocations: GoogleBusinessLocation[] = [];

      for (const account of accounts) {
        try {
          const locations = await this.getAccountLocations(encryptedRefreshToken, account.name);
          allLocations.push(...locations);
        } catch (error) {
          console.error(`Error fetching locations for account ${account.name}:`, error);
        }
      }

      return {
        accounts,
        locations: allLocations,
      };
    } catch (error) {
      console.error('Error fetching all business profiles:', error);
      throw new InternalServerErrorException('Failed to fetch business profiles');
    }
  }
}
