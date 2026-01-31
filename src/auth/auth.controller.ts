import { Controller, Get, Req, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth() {
    // Initiates Google OAuth flow - handled by Passport
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleCallback(@Req() req: any, @Res() res: Response) {
    // User returned from Google OAuth
    const user = req.user;
    
    // Generate JWT tokens
    const tokens = await this.authService.generateTokens(user.id, user.email);
    
    // Redirect to frontend with token
    const frontendUrl = this.configService.get<string>('FRONTEND_URL');
    
    // Check if user needs onboarding (no target band score set beyond default)
    const needsOnboarding = !user.nativeLanguage;
    const redirectPath = needsOnboarding ? '/onboarding' : '/dashboard';
    
    // Redirect with token in query param (frontend will store in localStorage)
    res.redirect(`${frontendUrl}${redirectPath}?token=${tokens.accessToken}`);
  }

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  async getProfile(@Req() req: any) {
    return {
      id: req.user.id,
      email: req.user.email,
      fullName: req.user.fullName,
      avatarUrl: req.user.avatarUrl,
      targetBandScore: req.user.targetBandScore,
      targetExamDate: req.user.targetExamDate,
      nativeLanguage: req.user.nativeLanguage,
      subscriptionTier: req.user.subscriptionTier,
      dailySessionsUsed: req.user.dailySessionsUsed,
    };
  }

  @Get('logout')
  async logout(@Res() res: Response) {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL');
    // Frontend will clear the token from localStorage
    res.redirect(`${frontendUrl}/login?logout=true`);
  }
}
