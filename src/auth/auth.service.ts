import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';

export interface GoogleUser {
  googleId: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
}

export interface JwtPayload {
  sub: string;
  email: string;
}

export interface RegisterDto {
  email: string;
  password: string;
  fullName: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
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
    
    // Create user
    const user = await this.usersService.createWithPassword({
      email,
      fullName,
      passwordHash,
    });
    
    // Generate tokens
    const tokens = await this.generateTokens(user.id, user.email);
    
    return {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
      },
      ...tokens,
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
    
    // Generate tokens
    const tokens = await this.generateTokens(user.id, user.email);
    
    return {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        avatarUrl: user.avatarUrl,
        targetBandScore: user.targetBandScore,
        nativeLanguage: user.nativeLanguage,
        subscriptionTier: user.subscriptionTier,
      },
      ...tokens,
    };
  }

  async validateGoogleUser(googleUser: GoogleUser) {
    console.log('[Auth] Validating Google user:', googleUser.email, googleUser.googleId);
    
    // Find or create user
    let user = await this.usersService.findByGoogleId(googleUser.googleId);
    console.log('[Auth] Found by googleId:', user?.id || 'NOT FOUND');
    
    if (!user) {
      // Check if user exists with email
      user = await this.usersService.findByEmail(googleUser.email);
      console.log('[Auth] Found by email:', user?.id || 'NOT FOUND');
      
      if (user) {
        // Link Google account to existing user
        user = await this.usersService.linkGoogleAccount(user.id, googleUser.googleId, googleUser.avatarUrl);
        console.log('[Auth] Linked Google account to user:', user.id);
      } else {
        // Create new user
        user = await this.usersService.createFromGoogle(googleUser);
        console.log('[Auth] Created new user:', user.id);
      }
    }
    
    return user;
  }

  async generateTokens(userId: string, email: string) {
    const payload: JwtPayload = { sub: userId, email };
    
    const accessToken = this.jwtService.sign(payload);
    
    return {
      accessToken,
      expiresIn: '7d',
    };
  }

  async validateJwtPayload(payload: JwtPayload) {
    console.log('[Auth] Validating JWT for user ID:', payload.sub);
    const user = await this.usersService.findById(payload.sub);
    console.log('[Auth] User lookup result:', user?.id || 'NOT FOUND');
    return user;
  }
}
