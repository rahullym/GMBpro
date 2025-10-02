import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../database/prisma.service';
import { RegisterDto, LoginDto, AuthResponseDto } from '../common/dto/auth.dto';
import { ConfigService } from '@nestjs/config';
import { GoogleOAuthService, GoogleUserInfo } from '../common/services/google-oauth.service';
import { GoogleBusinessProfileService, GoogleBusinessLocation } from '../common/services/google-business-profile.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private googleOAuthService: GoogleOAuthService,
    private googleBusinessProfileService: GoogleBusinessProfileService,
  ) {}

  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    const { email, password, firstName, lastName, businessName } = registerDto;

    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create business and user
    const business = await this.prisma.business.create({
      data: {
        name: businessName,
        planTier: 'free',
      },
    });

    const user = await this.prisma.user.create({
      data: {
        email,
        passwordHash,
        firstName,
        lastName,
        businessId: business.id,
        role: 'owner',
      },
    });

    // Generate tokens
    const tokens = await this.generateTokens(user.id, user.email);

    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        businessId: user.businessId,
      },
    };
  }

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const { email, password } = loginDto;

    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { business: true },
    });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    // Update last login
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Generate tokens
    const tokens = await this.generateTokens(user.id, user.email);

    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        businessId: user.businessId,
      },
    };
  }

  async validateUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { business: true },
    });

    if (!user || !user.isActive) {
      return null;
    }

    return user;
  }

  async googleAuth(googleUser: any): Promise<AuthResponseDto> {
    const { email, firstName, lastName, accessToken, refreshToken } = googleUser;

    let user = await this.prisma.user.findUnique({
      where: { email },
      include: { business: true },
    });

    if (!user) {
      // Create new user and business
      const business = await this.prisma.business.create({
        data: {
          name: `${firstName} ${lastName}'s Business`,
          planTier: 'free',
        },
      });

      user = await this.prisma.user.create({
        data: {
          email,
          firstName,
          lastName,
          businessId: business.id,
          role: 'owner',
          isActive: true,
          passwordHash: '', // Google OAuth users don't need a password
        },
        include: {
          business: true,
        },
      });
    }

    // Generate tokens
    const tokens = await this.generateTokens(user.id, user.email);

    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        businessId: user.businessId,
      },
    };
  }

  /**
   * Handle Google OAuth callback and create/update user with business profiles
   */
  async handleGoogleCallback(code: string): Promise<AuthResponseDto> {
    // Exchange code for tokens
    const tokens = await this.googleOAuthService.exchangeCodeForTokens(code);
    
    // Get user info from Google
    const googleUserInfo = await this.googleOAuthService.getUserInfo(tokens.accessToken);
    
    // Encrypt refresh token for storage
    const encryptedRefreshToken = this.googleOAuthService.encryptRefreshToken(tokens.refreshToken);
    
    // Get business profiles using the new service
    const businessProfiles = await this.googleBusinessProfileService.getAllBusinessProfiles(encryptedRefreshToken);
    
    // Find or create user
    let user = await this.prisma.user.findUnique({
      where: { email: googleUserInfo.email },
      include: { business: true },
    });

    if (!user) {
      // Create new business
      const business = await this.prisma.business.create({
        data: {
          name: businessProfiles.locations.length > 0 ? businessProfiles.locations[0].title : `${googleUserInfo.name}'s Business`,
          planTier: 'free',
        },
      });

      // Create user
      user = await this.prisma.user.create({
        data: {
          email: googleUserInfo.email,
          firstName: googleUserInfo.name.split(' ')[0],
          lastName: googleUserInfo.name.split(' ').slice(1).join(' '),
          businessId: business.id,
          role: 'owner',
          isActive: true,
          passwordHash: '', // Google OAuth users don't need a password
        },
        include: {
          business: true,
        },
      });
    }

    // Create or update locations for each business profile
    for (const location of businessProfiles.locations) {
      await this.prisma.location.upsert({
        where: { googlePlaceId: location.name },
        update: {
          name: location.title,
          address: location.storefrontAddress.addressLines.join(', '),
          phoneNumber: location.primaryPhone,
          website: location.websiteUri,
          oauthRefreshToken: encryptedRefreshToken,
          lastSyncAt: new Date(),
        },
        create: {
          businessId: user.businessId,
          googlePlaceId: location.name,
          name: location.title,
          address: location.storefrontAddress.addressLines.join(', '),
          phoneNumber: location.primaryPhone,
          website: location.websiteUri,
          oauthRefreshToken: encryptedRefreshToken,
          lastSyncAt: new Date(),
        },
      });
    }

    // Generate JWT tokens
    const jwtTokens = await this.generateTokens(user.id, user.email);

    return {
      ...jwtTokens,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        businessId: user.businessId,
      },
    };
  }

  /**
   * Get Google OAuth authorization URL
   */
  getGoogleAuthUrl(state?: string): string {
    return this.googleOAuthService.generateAuthUrl(state);
  }

  private async generateTokens(userId: string, email: string) {
    const payload = { sub: userId, email };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('jwt.secret'),
        expiresIn: this.configService.get<string>('jwt.expiresIn'),
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('jwt.refreshSecret'),
        expiresIn: this.configService.get<string>('jwt.refreshExpiresIn'),
      }),
    ]);

    return { accessToken, refreshToken };
  }

  async refreshToken(refreshToken: string): Promise<{ accessToken: string }> {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('jwt.refreshSecret'),
      });

      const user = await this.validateUser(payload.sub);
      if (!user) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const accessToken = await this.jwtService.signAsync(
        { sub: user.id, email: user.email },
        {
          secret: this.configService.get<string>('jwt.secret'),
          expiresIn: this.configService.get<string>('jwt.expiresIn'),
        },
      );

      return { accessToken };
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }
}

