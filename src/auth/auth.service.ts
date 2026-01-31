import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';

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

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async validateGoogleUser(googleUser: GoogleUser) {
    // Find or create user
    let user = await this.usersService.findByGoogleId(googleUser.googleId);
    
    if (!user) {
      // Check if user exists with email
      user = await this.usersService.findByEmail(googleUser.email);
      
      if (user) {
        // Link Google account to existing user
        user = await this.usersService.linkGoogleAccount(user.id, googleUser.googleId, googleUser.avatarUrl);
      } else {
        // Create new user
        user = await this.usersService.createFromGoogle(googleUser);
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
    return this.usersService.findById(payload.sub);
  }
}
