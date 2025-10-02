import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { LocalStrategy } from './strategies/local.strategy';
import { PrismaService } from '../database/prisma.service';
import { GoogleOAuthService } from '../common/services/google-oauth.service';
import { GoogleBusinessProfileService } from '../common/services/google-business-profile.service';
import jwtConfig from '../config/jwt.config';
import googleConfig from '../config/google.config';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule.forFeature(jwtConfig)],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('jwt.secret'),
        signOptions: { expiresIn: configService.get<string>('jwt.expiresIn') },
      }),
      inject: [ConfigService],
    }),
    ConfigModule.forFeature(googleConfig),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, GoogleStrategy, LocalStrategy, PrismaService, GoogleOAuthService, GoogleBusinessProfileService],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}

