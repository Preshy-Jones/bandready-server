import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { GoogleUser } from '../auth/auth.service';
import { Prisma, User } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  private isPremiumActive(user: Pick<User, 'subscriptionTier' | 'subscriptionExpiresAt'>): boolean {
    if (user.subscriptionTier !== 'premium') {
      return false;
    }

    if (!user.subscriptionExpiresAt) {
      return true;
    }

    return user.subscriptionExpiresAt > new Date();
  }

  async syncSubscriptionStatus(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) return null;

    if (
      user.subscriptionTier === 'premium' &&
      user.subscriptionExpiresAt &&
      user.subscriptionExpiresAt <= new Date()
    ) {
      return this.prisma.user.update({
        where: { id: userId },
        data: {
          subscriptionTier: 'free',
          subscriptionExpiresAt: null,
        },
      });
    }

    return user;
  }

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
    examType?: import('@prisma/client').ExamType;
  }) {
    return this.prisma.user.update({
      where: { id: userId },
      data,
    });
  }

  async update(id: string, data: Prisma.UserUpdateInput) {
    return this.prisma.user.update({
      where: { id },
      data,
    });
  }

  async updateGoals(userId: string, data: {
    targetBandScore?: number;
    targetExamDate?: Date;
  }) {
    console.log('[UsersService] updateGoals called with:', { userId, data });
    
    const updateData: Prisma.UserUpdateInput = {};
    
    if (data.targetBandScore !== undefined) {
      updateData.targetBandScore = data.targetBandScore;
    }
    if (data.targetExamDate !== undefined) {
      updateData.targetExamDate = data.targetExamDate;
    }
    
    console.log('[UsersService] Prisma updateData:', updateData);
    
    const result = await this.prisma.user.update({
      where: { id: userId },
      data: updateData,
    });
    
    console.log('[UsersService] Update result - targetBandScore:', result.targetBandScore);
    
    return result;
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
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) return null;

    // Premium users don't consume sessions
    if (this.isPremiumActive(user)) {
      return user;
    }

    // If user has a session pack, deduct from balance
    if (user.sessionBalance > 0) {
      return this.prisma.user.update({
        where: { id: userId },
        data: {
          sessionBalance: { decrement: 1 },
        },
      });
    }

    // Otherwise, consume a daily free session
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        dailySessionsUsed: { increment: 1 },
      },
    });
  }

  async canStartSession(userId: string): Promise<boolean> {
    const normalizedUser = await this.syncSubscriptionStatus(userId);
    if (!normalizedUser) return false;

    const user = await this.resetDailySessionCount(normalizedUser.id);
    
    if (!user) return false;
    
    // Premium users have unlimited sessions
    if (this.isPremiumActive(user)) return true;

    // Users with a session balance can start a session
    if (user.sessionBalance > 0) return true;
    
    // Free users get 3 sessions per day
    return user.dailySessionsUsed < 3;
  }
}
