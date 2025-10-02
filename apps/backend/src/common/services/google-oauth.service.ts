import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { google } from 'googleapis';
import { EncryptionUtil } from '../utils/encryption.util';

export interface GoogleTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
}

export interface GoogleUserInfo {
  id: string;
  email: string;
  name: string;
  picture?: string;
  verifiedEmail: boolean;
}

export interface GoogleBusinessProfile {
  name: string;
  primaryCategory: string;
  address: string;
  phoneNumber?: string;
  website?: string;
  businessStatus: string;
}

@Injectable()
export class GoogleOAuthService {
  private oauth2Client: any;
  private encryptionKey: string;

  constructor(private configService: ConfigService) {
    this.oauth2Client = new google.auth.OAuth2(
      this.configService.get<string>('google.clientId'),
      this.configService.get<string>('google.clientSecret'),
      this.configService.get<string>('google.redirectUri')
    );

    // Get encryption key from environment or generate one
    this.encryptionKey = this.configService.get<string>('ENCRYPTION_KEY') || 
      EncryptionUtil.generateKey();
  }

  /**
   * Generate Google OAuth authorization URL
   */
  generateAuthUrl(state?: string): string {
    const scopes = [
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/business.manage',
      'https://www.googleapis.com/auth/plus.business.manage',
      'https://www.googleapis.com/auth/business.manage',
    ];

    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent', // Force consent to get refresh token
      state: state || 'default',
    });
  }

  /**
   * Exchange authorization code for tokens
   */
  async exchangeCodeForTokens(code: string): Promise<GoogleTokens> {
    try {
      const { tokens } = await this.oauth2Client.getToken(code);
      
      if (!tokens.refresh_token) {
        throw new BadRequestException('No refresh token received. Please re-authorize with consent.');
      }

      return {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt: new Date(tokens.expiry_date),
      };
    } catch (error) {
      throw new InternalServerErrorException('Failed to exchange code for tokens');
    }
  }

  /**
   * Get user information from Google
   */
  async getUserInfo(accessToken: string): Promise<GoogleUserInfo> {
    try {
      this.oauth2Client.setCredentials({ access_token: accessToken });
      
      const oauth2 = google.oauth2({ version: 'v2', auth: this.oauth2Client });
      const { data } = await oauth2.userinfo.get();

      return {
        id: data.id,
        email: data.email,
        name: data.name,
        picture: data.picture,
        verifiedEmail: data.verified_email,
      };
    } catch (error) {
      throw new InternalServerErrorException('Failed to get user information');
    }
  }

  /**
   * Get user's Google Business Profiles
   */
  async getBusinessProfiles(accessToken: string): Promise<GoogleBusinessProfile[]> {
    try {
      // For now, return mock data since the API structure has changed
      console.log('Google Business Profile API integration - using mock data for now');
      
      return [
        {
          name: 'Mock Business Profile',
          primaryCategory: 'Restaurant',
          address: '123 Main St, New York, NY 10001',
          phoneNumber: '+1234567890',
          website: 'https://example.com',
          businessStatus: 'ACTIVE',
        }
      ];
    } catch (error) {
      console.error('Error fetching business profiles:', error);
      throw new InternalServerErrorException('Failed to get business profiles');
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(encryptedRefreshToken: string): Promise<{ accessToken: string; expiresAt: Date }> {
    try {
      const refreshToken = EncryptionUtil.decrypt(encryptedRefreshToken, this.encryptionKey);
      
      this.oauth2Client.setCredentials({ refresh_token: refreshToken });
      const { credentials } = await this.oauth2Client.refreshAccessToken();

      return {
        accessToken: credentials.access_token,
        expiresAt: new Date(credentials.expiry_date),
      };
    } catch (error) {
      throw new InternalServerErrorException('Failed to refresh access token');
    }
  }

  /**
   * Encrypt refresh token for storage
   */
  encryptRefreshToken(refreshToken: string): string {
    return EncryptionUtil.encrypt(refreshToken, this.encryptionKey);
  }

  /**
   * Decrypt refresh token from storage
   */
  decryptRefreshToken(encryptedRefreshToken: string): string {
    return EncryptionUtil.decrypt(encryptedRefreshToken, this.encryptionKey);
  }

  /**
   * Revoke tokens (logout)
   */
  async revokeTokens(encryptedRefreshToken: string): Promise<void> {
    try {
      const refreshToken = EncryptionUtil.decrypt(encryptedRefreshToken, this.encryptionKey);
      await this.oauth2Client.revokeToken(refreshToken);
    } catch (error) {
      console.error('Error revoking tokens:', error);
      // Don't throw error as token might already be revoked
    }
  }
}
