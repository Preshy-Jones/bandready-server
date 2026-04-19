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
      unpaidUsers: totalUsers - premiumUsers,
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

  async exportUsers(params: {
    search?: string;
    tier?: string;
    verified?: string;
    country?: string;
  }): Promise<string> {
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

    const users = await this.prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        fullName: true,
        country: true,
        examType: true,
        subscriptionTier: true,
        subscriptionExpiresAt: true,
        isEmailVerified: true,
        speakingBalance: true,
        writingBalance: true,
        role: true,
        createdAt: true,
        _count: { select: { practiceSessions: true, essaySubmissions: true } },
      },
    });

    const esc = (val: string | number | boolean | null | undefined): string => {
      if (val === null || val === undefined) return '';
      const str = String(val);
      return str.includes(',') || str.includes('"') || str.includes('\n')
        ? `"${str.replace(/"/g, '""')}"`
        : str;
    };

    const headers = [
      'ID', 'Full Name', 'Email', 'Country', 'Exam Type',
      'Subscription', 'Subscription Expires', 'Email Verified',
      'Speaking Balance', 'Writing Balance', 'Role',
      'Speaking Sessions', 'Essay Submissions', 'Joined At',
    ].join(',');

    const rows = users.map((u) =>
      [
        esc(u.id),
        esc(u.fullName),
        esc(u.email),
        esc(u.country),
        esc(u.examType),
        esc(u.subscriptionTier),
        esc(u.subscriptionExpiresAt?.toISOString()),
        esc(u.isEmailVerified),
        esc(u.speakingBalance),
        esc(u.writingBalance),
        esc(u.role),
        esc(u._count.practiceSessions),
        esc(u._count.essaySubmissions),
        esc(u.createdAt.toISOString()),
      ].join(','),
    );

    return [headers, ...rows].join('\n');
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

  // ─── Reading Content ───────────────────────────────────────

  async getReadingPassages(params: {
    page?: number;
    limit?: number;
    testType?: string;
    difficulty?: string;
    topic?: string;
    active?: string;
  }) {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const skip = (page - 1) * limit;

    try {
      const whereClauses = [Prisma.sql`TRUE`];

      if (params.testType) {
        const normalized = params.testType.trim().toUpperCase();
        whereClauses.push(
          Prisma.sql`"test_type" = ${normalized}::"ReadingTestType"`,
        );
      }

      if (params.difficulty) {
        const normalized = params.difficulty.trim().toUpperCase();
        whereClauses.push(
          Prisma.sql`"difficulty_level" = ${normalized}::"ReadingDifficulty"`,
        );
      }

      if (params.active === 'true') {
        whereClauses.push(Prisma.sql`"is_active" = true`);
      }

      if (params.active === 'false') {
        whereClauses.push(Prisma.sql`"is_active" = false`);
      }

      if (params.topic) {
        whereClauses.push(
          Prisma.sql`LOWER("topic_category") LIKE ${`%${params.topic.trim().toLowerCase()}%`}`,
        );
      }

      const whereSql = Prisma.join(whereClauses, ' AND ');

      const passages = await this.prisma.$queryRaw<Array<Record<string, unknown>>>(Prisma.sql`
        SELECT
          "id",
          "title",
          "word_count" AS "wordCount",
          "difficulty_level" AS "difficultyLevel",
          "test_type" AS "testType",
          "topic_category" AS "topicCategory",
          "source_attribution" AS "sourceAttribution",
          "is_active" AS "isActive",
          "created_at" AS "createdAt",
          "updated_at" AS "updatedAt"
        FROM "reading_passages"
        WHERE ${whereSql}
        ORDER BY "created_at" DESC
        LIMIT ${limit}
        OFFSET ${skip}
      `);

      const totalRows = await this.prisma.$queryRaw<Array<{ count: bigint }>>(Prisma.sql`
        SELECT COUNT(*)::bigint AS "count"
        FROM "reading_passages"
        WHERE ${whereSql}
      `);

      const total = Number(totalRows[0]?.count || 0);

      return {
        passages,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      return this.handleReadingUnavailable('reading_passages', error, {
        passages: [],
        pagination: {
          page,
          limit,
          total: 0,
          totalPages: 0,
        },
      });
    }
  }

  async getReadingPassageDetail(id: string) {
    try {
      const passages = await this.prisma.$queryRaw<Array<Record<string, unknown>>>(Prisma.sql`
        SELECT
          "id",
          "title",
          "content",
          "word_count" AS "wordCount",
          "difficulty_level" AS "difficultyLevel",
          "test_type" AS "testType",
          "topic_category" AS "topicCategory",
          "source_attribution" AS "sourceAttribution",
          "is_active" AS "isActive",
          "created_at" AS "createdAt",
          "updated_at" AS "updatedAt"
        FROM "reading_passages"
        WHERE "id" = ${id}
        LIMIT 1
      `);

      const passage = passages[0];
      if (!passage) {
        throw new NotFoundException('Reading passage not found');
      }

      const paragraphs = await this.prisma.$queryRaw<Array<Record<string, unknown>>>(Prisma.sql`
        SELECT
          "id",
          "paragraph_index" AS "paragraphIndex",
          "label",
          "content"
        FROM "passage_paragraphs"
        WHERE "passage_id" = ${id}
        ORDER BY "paragraph_index" ASC
      `);

      const questionSets = await this.prisma.$queryRaw<Array<Record<string, unknown>>>(Prisma.sql`
        SELECT
          "id",
          "question_type" AS "questionType",
          "instructions",
          "question_range_start" AS "questionRangeStart",
          "question_range_end" AS "questionRangeEnd",
          "set_data" AS "setData",
          "created_at" AS "createdAt"
        FROM "reading_question_sets"
        WHERE "passage_id" = ${id}
        ORDER BY "question_range_start" ASC
      `);

      const questions = await this.prisma.$queryRaw<Array<Record<string, unknown>>>(Prisma.sql`
        SELECT
          "id",
          "question_set_id" AS "questionSetId",
          "question_type" AS "questionType",
          "question_number" AS "questionNumber",
          "question_data" AS "questionData",
          "correct_answer" AS "correctAnswer",
          "explanation",
          "skill_tested" AS "skillTested",
          "created_at" AS "createdAt"
        FROM "reading_questions"
        WHERE "passage_id" = ${id}
        ORDER BY "question_number" ASC
      `);

      return {
        passage,
        paragraphs,
        questionSets,
        questions,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      return this.handleReadingUnavailable('reading_passage_detail', error, { id });
    }
  }

  async createReadingPassage(data: Record<string, unknown>) {
    const {
      title,
      content,
      testType,
      difficultyLevel,
      topicCategory,
      sourceAttribution,
      paragraphs,
      questionSets,
    } = data as {
      title: string;
      content: string;
      testType: string;
      difficultyLevel: string;
      topicCategory: string;
      sourceAttribution?: string;
      paragraphs: Array<{ label: string; content: string }>;
      questionSets: Array<{
        questionType: string;
        instructions: string;
        setData?: any;
        questions: Array<{
          questionNumber: number;
          questionData: any;
          correctAnswer: any;
          explanation?: string;
          skillTested?: string;
        }>;
      }>;
    };

    const wordCount = content.split(/\s+/).filter(Boolean).length;

    const passage = await this.prisma.$transaction(async (tx) => {
      // 1. Create the passage
      const created = await tx.readingPassage.create({
        data: {
          title,
          content,
          wordCount,
          testType: testType as any,
          difficultyLevel: difficultyLevel as any,
          topicCategory,
          sourceAttribution: sourceAttribution || null,
          isActive: true,
        },
      });

      // 2. Create paragraphs
      if (paragraphs?.length) {
        await tx.passageParagraph.createMany({
          data: paragraphs.map((p, idx) => ({
            passageId: created.id,
            paragraphIndex: idx,
            label: p.label,
            content: p.content,
          })),
        });
      }

      // 3. Create question sets + questions
      if (questionSets?.length) {
        for (const qs of questionSets) {
          const rangeStart = qs.questions[0]?.questionNumber ?? 0;
          const rangeEnd = qs.questions[qs.questions.length - 1]?.questionNumber ?? 0;

          const questionSet = await tx.readingQuestionSet.create({
            data: {
              passageId: created.id,
              questionType: qs.questionType as any,
              instructions: qs.instructions,
              questionRangeStart: rangeStart,
              questionRangeEnd: rangeEnd,
              setData: qs.setData || undefined,
            },
          });

          if (qs.questions?.length) {
            await tx.readingQuestion.createMany({
              data: qs.questions.map((q) => ({
                passageId: created.id,
                questionSetId: questionSet.id,
                questionType: qs.questionType as any,
                questionNumber: q.questionNumber,
                questionData: q.questionData,
                correctAnswer: q.correctAnswer,
                explanation: q.explanation || null,
                skillTested: q.skillTested || null,
              })),
            });
          }
        }
      }

      return created;
    });

    // Return the fully-loaded passage
    return this.getReadingPassageDetail(passage.id);
  }

  async updateReadingPassage(id: string, data: Record<string, unknown>) {
    const {
      title,
      content,
      testType,
      difficultyLevel,
      topicCategory,
      sourceAttribution,
      isActive,
      paragraphs,
      questionSets,
    } = data as {
      title?: string;
      content?: string;
      testType?: string;
      difficultyLevel?: string;
      topicCategory?: string;
      sourceAttribution?: string;
      isActive?: boolean;
      paragraphs?: Array<{ label: string; content: string }>;
      questionSets?: Array<{
        questionType: string;
        instructions: string;
        setData?: any;
        questions: Array<{
          questionNumber: number;
          questionData: any;
          correctAnswer: any;
          explanation?: string;
          skillTested?: string;
        }>;
      }>;
    };

    // Make sure passage exists
    const existing = await this.prisma.readingPassage.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Reading passage not found');
    }

    await this.prisma.$transaction(async (tx) => {
      // Build update payload for metadata fields
      const updateData: any = {};
      if (title !== undefined) updateData.title = title;
      if (content !== undefined) {
        updateData.content = content;
        updateData.wordCount = content.split(/\s+/).filter(Boolean).length;
      }
      if (testType !== undefined) updateData.testType = testType;
      if (difficultyLevel !== undefined) updateData.difficultyLevel = difficultyLevel;
      if (topicCategory !== undefined) updateData.topicCategory = topicCategory;
      if (sourceAttribution !== undefined) updateData.sourceAttribution = sourceAttribution;
      if (isActive !== undefined) updateData.isActive = isActive;

      if (Object.keys(updateData).length > 0) {
        await tx.readingPassage.update({ where: { id }, data: updateData });
      }

      // Replace paragraphs if provided
      if (paragraphs) {
        await tx.passageParagraph.deleteMany({ where: { passageId: id } });
        await tx.passageParagraph.createMany({
          data: paragraphs.map((p, idx) => ({
            passageId: id,
            paragraphIndex: idx,
            label: p.label,
            content: p.content,
          })),
        });
      }

      // Replace question sets and questions if provided
      if (questionSets) {
        await tx.readingQuestion.deleteMany({ where: { passageId: id } });
        await tx.readingQuestionSet.deleteMany({ where: { passageId: id } });

        for (const qs of questionSets) {
          const rangeStart = qs.questions[0]?.questionNumber ?? 0;
          const rangeEnd = qs.questions[qs.questions.length - 1]?.questionNumber ?? 0;

          const questionSet = await tx.readingQuestionSet.create({
            data: {
              passageId: id,
              questionType: qs.questionType as any,
              instructions: qs.instructions,
              questionRangeStart: rangeStart,
              questionRangeEnd: rangeEnd,
              setData: qs.setData || undefined,
            },
          });

          if (qs.questions?.length) {
            await tx.readingQuestion.createMany({
              data: qs.questions.map((q) => ({
                passageId: id,
                questionSetId: questionSet.id,
                questionType: qs.questionType as any,
                questionNumber: q.questionNumber,
                questionData: q.questionData,
                correctAnswer: q.correctAnswer,
                explanation: q.explanation || null,
                skillTested: q.skillTested || null,
              })),
            });
          }
        }
      }
    });

    return this.getReadingPassageDetail(id);
  }

  async deleteReadingPassage(id: string) {
    const existing = await this.prisma.readingPassage.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Reading passage not found');
    }

    // Check for active sessions using this passage
    // @ts-ignore - readingSessionPassage may not be generated yet
    const activeSessions = await this.prisma.readingSessionPassage.count({
      where: {
        passageId: id,
        session: { completedAt: null },
      },
    });

    if (activeSessions > 0) {
      // Soft-delete: mark passage as inactive
      await this.prisma.readingPassage.update({
        where: { id },
        data: { isActive: false },
      });
      return {
        status: 'soft_deleted',
        message: `Passage deactivated (${activeSessions} active session(s) still reference it).`,
      };
    }

    // Hard-delete: cascade handles related records
    await this.prisma.readingPassage.delete({ where: { id } });
    return { status: 'deleted', message: 'Passage permanently deleted.' };
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

  // ─── App Settings ──────────────────────────────────────────

  async getAppSetting(key: string) {
    const setting = await this.prisma.appSetting.findUnique({ where: { key } });
    return { key, value: setting?.value ?? null };
  }

  async setAppSetting(key: string, value: string) {
    return this.prisma.appSetting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });
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

  private handleReadingUnavailable(
    resource: string,
    error: unknown,
    extra: Record<string, unknown> = {},
  ) {
    const message = error instanceof Error ? error.message : null;

    return {
      status: 'not_ready',
      resource,
      ...extra,
      ...(message ? { error: message } : {}),
      message:
        'Reading storage is not available yet. Ensure the reading migration has been applied before using this admin endpoint.',
    };
  }
}
