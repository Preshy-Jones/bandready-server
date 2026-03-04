import { Controller, Get, Post, Body, Req, Res, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { AuthService, RegisterDto, LoginDto } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  async verifyOtp(@Body() body: { email: string; otp: string }) {
    return this.authService.verifyOtp(body.email, body.otp);
  }

  @Post('resend-otp')
  @HttpCode(HttpStatus.OK)
  async resendOtp(@Body() body: { email: string }) {
    return this.authService.resendOtp(body.email);
  }

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
    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
    
    console.log(`[Auth] Redirecting to frontend: ${frontendUrl}`);
    
    // Check if user needs onboarding (no target band score set beyond default)
    const needsOnboarding = !user.nativeLanguage;
    const redirectPath = needsOnboarding ? '/onboarding' : '/dashboard';

    // Append isNew flag so the frontend can fire a signup analytics event
    const isNewParam = user.isNew ? '&isNew=true' : '';

    // Redirect with token in query param (frontend will store in localStorage)
    res.redirect(`${frontendUrl}${redirectPath}?token=${tokens.accessToken}${isNewParam}`);
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
      examType: req.user.examType,
      subscriptionTier: req.user.subscriptionTier,
      subscriptionExpiresAt: req.user.subscriptionExpiresAt,
      country: req.user.country,
      speakingBalance: req.user.speakingBalance,
      writingBalance: req.user.writingBalance,
    };
  }

  @Get('logout')
  async logout(@Res() res: Response) {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL');
    // Frontend will clear the token from localStorage
    res.redirect(`${frontendUrl}/login?logout=true`);
  }
}
