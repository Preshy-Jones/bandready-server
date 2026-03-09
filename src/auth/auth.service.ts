import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { MailService } from '../mail/mail.service';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes } from 'crypto';

export interface GoogleUser {
  googleId: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
}

export interface JwtPayload {
  sub: string;
  email: string;
  role?: string;
}

import { RegisterDto, LoginDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
  ) {}

  async register(registerDto: RegisterDto) {
    const { email, password, fullName } = registerDto;
    
    // Check if user already exists
    const existingUser = await this.usersService.findByEmail(email);
    if (existingUser) {
      throw new BadRequestException('Email already in use');
    }
    
    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    
    // Create user (unverified by default)
    const user = await this.usersService.createWithPassword({
      email,
      fullName,
      passwordHash,
    });
    
    // Generate a 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date();
    expiry.setMinutes(expiry.getMinutes() + 15); // 15 minute expiry
    
    // Update user with OTP
    await this.usersService.update(user.id, {
      emailVerificationOtp: otp,
      emailVerificationOtpExpiry: expiry,
      isEmailVerified: false,
    } as Prisma.UserUpdateInput);
    
    // Send email and fail the registration flow if delivery was rejected.
    const sent = await this.mailService.sendVerificationOtp(email, fullName, otp);
    if (!sent) {
      throw new BadRequestException('Failed to send verification email. Please try again later.');
    }
    
    return {
      message: 'Registration successful. Please verify your email.',
      requiresOtp: true,
      email: user.email,
    };
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;
    
    // Find user by email
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }
    
    // Check if user has a password (might be Google-only user)
    if (!user.passwordHash) {
      throw new UnauthorizedException('Please sign in with Google');
    }
    
    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }
    
    // Check if email is verified
    if (!user.isEmailVerified) {
      // Generate a new OTP automatically on login attempt
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiry = new Date();
      expiry.setMinutes(expiry.getMinutes() + 15);
      
      await this.usersService.update(user.id, {
        emailVerificationOtp: otp,
        emailVerificationOtpExpiry: expiry,
      } as Prisma.UserUpdateInput);
      
      await this.mailService.sendVerificationOtp(user.email, user.fullName || 'User', otp);
      
      // We throw a specific structure so the frontend knows to redirect to the OTP screen
      throw new UnauthorizedException({
        message: 'Email not verified. A new code has been sent.',
        requiresOtp: true,
        email: user.email,
      });
    }
    
    // Generate tokens
    const tokens = await this.generateTokens(user.id, user.email, user.role);
    
    return {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        avatarUrl: user.avatarUrl,
        targetBandScore: user.targetBandScore,
        nativeLanguage: user.nativeLanguage,
        subscriptionTier: user.subscriptionTier,
        subscriptionExpiresAt: user.subscriptionExpiresAt,
        role: user.role,
      },
      ...tokens,
    };
  }

  async validateGoogleUser(googleUser: GoogleUser) {
    // Find or create user
    let user = await this.usersService.findByGoogleId(googleUser.googleId);
    let isNew = false;

    if (!user) {
      // Check if user exists with email
      user = await this.usersService.findByEmail(googleUser.email);

      if (user) {
        // Link Google account to existing user
        user = await this.usersService.linkGoogleAccount(user.id, googleUser.googleId, googleUser.avatarUrl);
      } else {
        // Create new user
        user = await this.usersService.createFromGoogle(googleUser);
        isNew = true;
      }
    }

    return { ...user, isNew };
  }
  
  async verifyOtp(email: string, otp: string) {
    const user = await this.usersService.findByEmail(email);
    
    if (!user) {
      throw new BadRequestException('User not found');
    }
    
    // Check if OTP matches and is not expired
    if (!user.emailVerificationOtp || user.emailVerificationOtp !== otp) {
      throw new BadRequestException('Invalid verification code');
    }
    
    if (user.emailVerificationOtpExpiry && new Date() > user.emailVerificationOtpExpiry) {
      throw new BadRequestException('Verification code has expired. Please request a new one.');
    }
    
    // Mark as verified and clear OTP fields
    await this.usersService.update(user.id, {
      isEmailVerified: true,
      emailVerificationOtp: null,
      emailVerificationOtpExpiry: null,
    } as Prisma.UserUpdateInput);
    
    // Return tokens to log the user in immediately
    const tokens = await this.generateTokens(user.id, user.email);
    
    return {
      message: 'Email verified successfully',
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
      },
      ...tokens,
    };
  }
  
  async resendOtp(email: string) {
    const user = await this.usersService.findByEmail(email);
    
    if (!user) {
      throw new BadRequestException('If an account matches this email, a code has been sent.');
    }
    
    if (user.isEmailVerified) {
      throw new BadRequestException('Email is already verified');
    }
    
    // Generate a new 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date();
    expiry.setMinutes(expiry.getMinutes() + 15);
    
    await this.usersService.update(user.id, {
      emailVerificationOtp: otp,
      emailVerificationOtpExpiry: expiry,
    } as Prisma.UserUpdateInput);
    
    const sent = await this.mailService.sendVerificationOtp(user.email, user.fullName || 'User', otp);
    
    if (!sent) {
      throw new BadRequestException('Failed to send verification email. Please try again later.');
    }
    
    return {
      message: 'Verification code sent to your email',
    };
  }

  async forgotPassword(email: string) {
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      return {
        message: 'If an account matches this email, a password reset link has been sent.',
      };
    }

    const resetToken = randomBytes(32).toString('hex');
    const resetTokenHash = this.hashToken(resetToken);
    const expiry = new Date();
    expiry.setHours(expiry.getHours() + 1);

    await this.usersService.update(user.id, {
      passwordResetTokenHash: resetTokenHash,
      passwordResetTokenExpiry: expiry,
    } as Prisma.UserUpdateInput);

    const sent = await this.mailService.sendPasswordResetEmail(
      user.email,
      user.fullName,
      resetToken,
    );

    if (!sent) {
      throw new BadRequestException('Failed to send password reset email. Please try again later.');
    }

    return {
      message: 'If an account matches this email, a password reset link has been sent.',
    };
  }

  async resetPassword(token: string, password: string) {
    const user = await this.usersService.findByPasswordResetTokenHash(this.hashToken(token));

    if (!user || !user.passwordResetTokenExpiry || user.passwordResetTokenExpiry < new Date()) {
      throw new BadRequestException('Reset link is invalid or has expired.');
    }

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    await this.usersService.update(user.id, {
      passwordHash,
      passwordResetTokenHash: null,
      passwordResetTokenExpiry: null,
    } as Prisma.UserUpdateInput);

    return {
      message: 'Password reset successful. You can now sign in with your new password.',
    };
  }

  async generateTokens(userId: string, email: string, role?: string) {
    const payload: JwtPayload = { sub: userId, email, role };
    
    const accessToken = this.jwtService.sign(payload);
    
    return {
      accessToken,
      expiresIn: '7d',
    };
  }

  async validateJwtPayload(payload: JwtPayload) {
    const user = await this.usersService.findById(payload.sub);
    return user;
  }

  private hashToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }
}
