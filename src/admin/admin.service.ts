import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { Prisma, Role } from '@prisma/client';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Analytics ───────────────────────────────────────────────

  async getOverviewStats() {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      verifiedUsers,
      premiumUsers,
      newUsersThisMonth,
      activeUsersWeek,
      totalSpeakingSessions,
      totalEssaySubmissions,
      pendingAssessments,
      revenueNGN,
      revenueUSD,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { isEmailVerified: true } }),
      this.prisma.user.count({ where: { subscriptionTier: 'premium' } }),
      this.prisma.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      this.prisma.user.count({
        where: {
          OR: [
            { practiceSessions: { some: { createdAt: { gte: sevenDaysAgo } } } },
            { essaySubmissions: { some: { submittedAt: { gte: sevenDaysAgo } } } },
          ],
        },
      }),
      this.prisma.practiceSession.count(),
      this.prisma.essaySubmission.count(),
      this.prisma.essaySubmission.count({ where: { feedback: null } }),
      this.prisma.paymentTransaction.aggregate({
        _sum: { amountKobo: true },
        where: { currency: 'NGN', status: 'SUCCESS' },
      }),
      this.prisma.paymentTransaction.aggregate({
        _sum: { amountCents: true },
        where: { currency: { not: 'NGN' }, status: 'SUCCESS' },
      }),
    ]);

    return {
      totalUsers,
      verifiedUsers,
      unverifiedUsers: totalUsers - verifiedUsers,
      premiumUsers,
      freeUsers: totalUsers - premiumUsers,
      newUsersThisMonth,
      activeUsersWeek,
      totalSpeakingSessions,
      totalEssaySubmissions,
      pendingAssessments,
      revenueNGN: (revenueNGN._sum.amountKobo || 0) / 100, // Convert kobo to Naira
      revenueUSD: (revenueUSD._sum.amountCents || 0) / 100, // Convert cents to USD
    };
  }

  async getSignupTrend(days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const users = await this.prisma.user.findMany({
      where: { createdAt: { gte: startDate } },
      select: { createdAt: true },
      orderBy: { createdAt: 'asc' },
    });

    // Group by day
    const trend: Record<string, number> = {};
    users.forEach((u) => {
      const day = u.createdAt.toISOString().split('T')[0];
      trend[day] = (trend[day] || 0) + 1;
    });

    return Object.entries(trend).map(([date, count]) => ({ date, count }));
  }

  // ─── User Management ────────────────────────────────────────

  async getUsers(params: {
    page?: number;
    limit?: number;
    search?: string;
    tier?: string;
    verified?: string;
    country?: string;
  }) {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.UserWhereInput = {};

    if (params.search) {
      where.OR = [
        { email: { contains: params.search, mode: 'insensitive' } },
        { fullName: { contains: params.search, mode: 'insensitive' } },
      ];
    }
    if (params.tier) where.subscriptionTier = params.tier;
    if (params.verified === 'true') where.isEmailVerified = true;
    if (params.verified === 'false') where.isEmailVerified = false;
    if (params.country) where.country = params.country;

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          fullName: true,
          avatarUrl: true,
          country: true,
          examType: true,
          subscriptionTier: true,
          subscriptionExpiresAt: true,
          isEmailVerified: true,
          speakingBalance: true,
          writingBalance: true,
          role: true,
          createdAt: true,
          _count: {
            select: {
              practiceSessions: true,
              essaySubmissions: true,
            },
          },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getUserDetail(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        practiceSessions: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: {
            id: true,
            overallBandScore: true,
            fluencyCoherenceScore: true,
            lexicalResourceScore: true,
            grammarAccuracyScore: true,
            pronunciationScore: true,
            createdAt: true,
          },
        },
        essaySubmissions: {
          orderBy: { submittedAt: 'desc' },
          take: 10,
          include: { feedback: true },
        },
        progress: true,
        writingProgress: true,
        writingWeaknesses: true,
        paymentTransactions: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        _count: {
          select: {
            practiceSessions: true,
            essaySubmissions: true,
            mockTests: true,
            drillAttempts: true,
          },
        },
      },
    });

    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async updateUser(userId: string, data: Prisma.UserUpdateInput) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    return this.prisma.user.update({
      where: { id: userId },
      data,
    });
  }

  // ─── Content Management ─────────────────────────────────────

  async getSpeakingQuestions(params: {
    page?: number;
    limit?: number;
    part?: number;
    difficulty?: string;
    active?: string;
  }) {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.SpeakingQuestionWhereInput = {};
    if (params.part) where.part = params.part;
    if (params.difficulty) where.difficultyLevel = params.difficulty;
    if (params.active === 'true') where.isActive = true;
    if (params.active === 'false') where.isActive = false;

    const [questions, total] = await Promise.all([
      this.prisma.speakingQuestion.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.speakingQuestion.count({ where }),
    ]);

    return {
      questions,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async createSpeakingQuestion(data: Prisma.SpeakingQuestionCreateInput) {
    return this.prisma.speakingQuestion.create({ data });
  }

  async updateSpeakingQuestion(id: string, data: Prisma.SpeakingQuestionUpdateInput) {
    return this.prisma.speakingQuestion.update({ where: { id }, data });
  }

  async deleteSpeakingQuestion(id: string) {
    return this.prisma.speakingQuestion.delete({ where: { id } });
  }

  async getWritingQuestions(params: {
    page?: number;
    limit?: number;
    taskType?: string;
    active?: string;
  }) {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (params.taskType) where.taskType = params.taskType;
    if (params.active === 'true') where.isActive = true;
    if (params.active === 'false') where.isActive = false;

    const [questions, total] = await Promise.all([
      this.prisma.writingQuestion.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
      this.prisma.writingQuestion.count({ where }),
    ]);

    return {
      questions,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async createWritingQuestion(data: Prisma.WritingQuestionCreateInput) {
    return this.prisma.writingQuestion.create({ data });
  }

  async updateWritingQuestion(id: string, data: Prisma.WritingQuestionUpdateInput) {
    return this.prisma.writingQuestion.update({ where: { id }, data });
  }

  async deleteWritingQuestion(id: string) {
    return this.prisma.writingQuestion.delete({ where: { id } });
  }

  async getDrills(params: {
    page?: number;
    limit?: number;
    type?: string;
    category?: string;
    active?: string;
  }) {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (params.type) where.drillType = params.type;
    if (params.category) where.category = params.category;
    if (params.active === 'true') where.isActive = true;
    if (params.active === 'false') where.isActive = false;

    const [drills, total] = await Promise.all([
      this.prisma.writingDrill.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
      this.prisma.writingDrill.count({ where }),
    ]);

    return {
      drills,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async createDrill(data: Prisma.WritingDrillCreateInput) {
    return this.prisma.writingDrill.create({ data });
  }

  async updateDrill(id: string, data: Prisma.WritingDrillUpdateInput) {
    return this.prisma.writingDrill.update({ where: { id }, data });
  }

  async deleteDrill(id: string) {
    return this.prisma.writingDrill.delete({ where: { id } });
  }

  // ─── Payments ───────────────────────────────────────────────

  async getTransactions(params: {
    page?: number;
    limit?: number;
    provider?: string;
    status?: string;
  }) {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.PaymentTransactionWhereInput = {};
    if (params.provider) where.provider = params.provider;
    if (params.status) where.status = params.status as any;

    const [transactions, total] = await Promise.all([
      this.prisma.paymentTransaction.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, email: true, fullName: true } },
        },
      }),
      this.prisma.paymentTransaction.count({ where }),
    ]);

    return {
      transactions,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getRevenueStats() {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [totalNGN, totalUSD, recentNGN, recentUSD, failedCount] = await Promise.all([
      this.prisma.paymentTransaction.aggregate({
        _sum: { amountKobo: true },
        where: { currency: 'NGN', status: 'SUCCESS' },
      }),
      this.prisma.paymentTransaction.aggregate({
        _sum: { amountCents: true },
        where: { currency: { not: 'NGN' }, status: 'SUCCESS' },
      }),
      this.prisma.paymentTransaction.aggregate({
        _sum: { amountKobo: true },
        where: { currency: 'NGN', status: 'SUCCESS', createdAt: { gte: thirtyDaysAgo } },
      }),
      this.prisma.paymentTransaction.aggregate({
        _sum: { amountCents: true },
        where: { currency: { not: 'NGN' }, status: 'SUCCESS', createdAt: { gte: thirtyDaysAgo } },
      }),
      this.prisma.paymentTransaction.count({
        where: { status: 'FAILED', createdAt: { gte: thirtyDaysAgo } },
      }),
    ]);

    return {
      totalNGN: (totalNGN._sum.amountKobo || 0) / 100,
      totalUSD: (totalUSD._sum.amountCents || 0) / 100,
      recentNGN: (recentNGN._sum.amountKobo || 0) / 100,
      recentUSD: (recentUSD._sum.amountCents || 0) / 100,
      failedCount,
    };
  }
}
