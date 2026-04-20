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
          subscriptionTier: 'none',
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

  async findByPasswordResetTokenHash(passwordResetTokenHash: string) {
    return this.prisma.user.findFirst({
      where: { passwordResetTokenHash },
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
        isEmailVerified: true, // Google has already verified the email
      },
    });
  }

  async linkGoogleAccount(userId: string, googleId: string, avatarUrl?: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        googleId,
        avatarUrl: avatarUrl || undefined,
        isEmailVerified: true, // linking Google confirms the email
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

  async incrementDailySession(userId: string, sessionType: 'speaking' | 'writing' = 'speaking') {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) return null;

    // Premium users (global subscription) don't consume sessions
    if (this.isPremiumActive(user)) {
      return user;
    }

    if (sessionType === 'speaking') {
      // If user has a session pack, deduct from balance
      if (user.speakingBalance > 0) {
        return this.prisma.user.update({
          where: { id: userId },
          data: { speakingBalance: { decrement: 1 } },
        });
      }
      // No balance and not premium — should not be reachable since canStartSession blocks access
      return user;
    }

    if (sessionType === 'writing') {
      // Writing has NO free daily sessions. Deduct from balance directly.
      if (user.writingBalance > 0) {
        return this.prisma.user.update({
          where: { id: userId },
          data: { writingBalance: { decrement: 1 } },
        });
      }
    }

    return user;
  }

  async hasPaidAccess(userId: string): Promise<boolean> {
    const user = await this.syncSubscriptionStatus(userId);
    if (!user) return false;
    // Returns true if they have any session balances or an active subscription
    return this.isPremiumActive(user) || user.speakingBalance > 0 || user.writingBalance > 0;
  }

  async hasPurchasedSessionPack(userId: string): Promise<boolean> {
    const successfulPackPurchase = await this.prisma.paymentTransaction.findFirst({
      where: {
        userId,
        status: 'SUCCESS',
        provider: 'paystack',
        plan: {
          in: ['starter', 'standard', 'pro', 'ultimate'],
        },
      },
      select: { id: true },
    });

    return !!successfulPackPurchase;
  }

  async canStartSession(userId: string, sessionType: 'speaking' | 'writing' = 'speaking'): Promise<boolean> {
    const normalizedUser = await this.syncSubscriptionStatus(userId);
    if (!normalizedUser) return false;

    const user = await this.prisma.user.findUnique({ where: { id: normalizedUser.id } });
    if (!user) return false;

    if (sessionType === 'speaking') {
      if (this.isPremiumActive(user)) return true;
      return user.speakingBalance > 0;
    }

    if (sessionType === 'writing') {
      return this.isPremiumActive(user) || user.writingBalance > 0;
    }

    return false;
  }
}
