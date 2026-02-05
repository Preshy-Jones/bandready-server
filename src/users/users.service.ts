import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { GoogleUser } from '../auth/auth.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async findByGoogleId(googleId: string) {
    return this.prisma.user.findUnique({
      where: { googleId },
    });
  }

  async createWithPassword(data: {
    email: string;
    fullName: string;
    passwordHash: string;
  }) {
    return this.prisma.user.create({
      data: {
        email: data.email,
        fullName: data.fullName,
        passwordHash: data.passwordHash,
      },
    });
  }

  async createFromGoogle(googleUser: GoogleUser) {
    return this.prisma.user.create({
      data: {
        email: googleUser.email,
        fullName: googleUser.fullName,
        googleId: googleUser.googleId,
        avatarUrl: googleUser.avatarUrl,
      },
    });
  }

  async linkGoogleAccount(userId: string, googleId: string, avatarUrl?: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        googleId,
        avatarUrl: avatarUrl || undefined,
      },
    });
  }

  async updateProfile(userId: string, data: {
    fullName?: string;
    nativeLanguage?: string;
    country?: string;
  }) {
    return this.prisma.user.update({
      where: { id: userId },
      data,
    });
  }

  async updateGoals(userId: string, data: {
    targetBandScore?: number;
    targetExamDate?: Date;
  }) {
    const updateData: Prisma.UserUpdateInput = {};
    
    if (data.targetBandScore !== undefined) {
      updateData.targetBandScore = data.targetBandScore;
    }
    if (data.targetExamDate !== undefined) {
      updateData.targetExamDate = data.targetExamDate;
    }
    
    return this.prisma.user.update({
      where: { id: userId },
      data: updateData,
    });
  }

  async resetDailySessionCount(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    
    if (!user) return null;
    
    const now = new Date();
    const resetAt = new Date(user.dailySessionsResetAt);
    
    // Reset if it's a new day
    if (now.toDateString() !== resetAt.toDateString()) {
      return this.prisma.user.update({
        where: { id: userId },
        data: {
          dailySessionsUsed: 0,
          dailySessionsResetAt: now,
        },
      });
    }
    
    return user;
  }

  async incrementDailySession(userId: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        dailySessionsUsed: { increment: 1 },
      },
    });
  }

  async canStartSession(userId: string): Promise<boolean> {
    // DEV_MODE bypasses all restrictions
    if (process.env.DEV_MODE === 'true') return true;
    
    const user = await this.resetDailySessionCount(userId);
    
    if (!user) return false;
    
    // Premium users have unlimited sessions
    if (user.subscriptionTier === 'premium') return true;
    
    // Free users get 3 sessions per day
    return user.dailySessionsUsed < 3;
  }
}
