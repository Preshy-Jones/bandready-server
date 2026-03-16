import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import {
  Prisma,
  ReadingQuestion,
  ReadingQuestionType,
  ReadingSessionMode,
  ReadingTestType,
} from '@prisma/client';
import { PrismaService } from '../common/prisma/prisma.service';
import { StartReadingSessionDto } from './dto/start-reading-session.dto';
import { SubmitReadingAnswerDto } from './dto/submit-reading-answer.dto';

@Injectable()
export class ReadingService {
  constructor(private readonly prisma: PrismaService) {}

  getStatus() {
    return {
      module: 'reading',
      status: 'scaffolded',
      message: 'Reading module scaffolding is in place. Session, content, and scoring APIs are not implemented yet.',
    };
  }

  async getPassageCatalog(filters: unknown) {
    const normalized = this.normalizeCatalogFilters(filters);

    try {
      const whereClauses = [Prisma.sql`"is_active" = true`];

      if (normalized.testType) {
        whereClauses.push(Prisma.sql`"test_type" = ${normalized.testType}::"ReadingTestType"`);
      }

      if (normalized.difficulty) {
        whereClauses.push(
          Prisma.sql`"difficulty_level" = ${normalized.difficulty}::"ReadingDifficulty"`,
        );
      }

      if (normalized.topic) {
        whereClauses.push(
          Prisma.sql`LOWER("topic_category") LIKE ${`%${normalized.topic.toLowerCase()}%`}`,
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
          "created_at" AS "createdAt",
          "updated_at" AS "updatedAt"
        FROM "reading_passages"
        WHERE ${whereSql}
        ORDER BY "created_at" DESC
        LIMIT ${normalized.limit}
        OFFSET ${normalized.offset}
      `);

      const totalRows = await this.prisma.$queryRaw<Array<{ count: bigint }>>(Prisma.sql`
        SELECT COUNT(*)::bigint AS "count"
        FROM "reading_passages"
        WHERE ${whereSql}
      `);

      return {
        status: 'ready',
        filters: normalized,
        passages,
        total: Number(totalRows[0]?.count || 0),
      };
    } catch (error) {
      return this.handleReadingStorageUnavailable('reading_passages', error, {
        filters: normalized,
        passages: [],
        total: 0,
      });
    }
  }

  async getPassage(id: string) {
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
          "created_at" AS "createdAt",
          "updated_at" AS "updatedAt"
        FROM "reading_passages"
        WHERE "id" = ${id} AND "is_active" = true
        LIMIT 1
      `);

      const passage = passages[0];

      if (!passage) {
        return {
          status: 'not_found',
          id,
          message: 'Reading passage not found.',
        };
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
          "explanation",
          "skill_tested" AS "skillTested",
          "created_at" AS "createdAt"
        FROM "reading_questions"
        WHERE "passage_id" = ${id}
        ORDER BY "question_number" ASC
      `);

      return {
        status: 'ready',
        passage,
        paragraphs,
        questionSets: questionSets.map((set) => ({
          ...set,
          questions: questions.filter((question) => question.questionSetId === set.id),
        })),
        ungroupedQuestions: questions.filter((question) => !question.questionSetId),
      };
    } catch (error) {
      return this.handleReadingStorageUnavailable('reading_passage', error, { id });
    }
  }

  async getSession(sessionId: string, userId: string) {
    let session;

    try {
      session = await this.prisma.readingSession.findUnique({
        where: { id: sessionId },
        include: {
          passages: {
            orderBy: { passageOrder: 'asc' },
            include: {
              passage: {
                include: {
                  paragraphs: { orderBy: { paragraphIndex: 'asc' } },
                  questionSets: {
                    orderBy: { questionRangeStart: 'asc' },
                    include: {
                      questions: {
                        orderBy: { questionNumber: 'asc' },
                      },
                    },
                  },
                },
              },
            },
          },
          answers: true,
          results: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      });
    } catch (error) {
      return this.handleReadingStorageUnavailable('reading_session', error, { sessionId });
    }

    if (!session) {
      throw new NotFoundException('Reading session not found.');
    }

    if (session.userId !== userId) {
      throw new ForbiddenException('You do not have access to this reading session.');
    }

    return {
      status: 'ready',
      session: {
        id: session.id,
        testType: session.testType,
        mode: session.mode,
        isTimed: session.isTimed,
        startedAt: session.startedAt,
        completedAt: session.completedAt,
        timeSpentSeconds: session.timeSpentSeconds,
        createdAt: session.createdAt,
      },
      passages: session.passages.map((item) => ({
        id: item.id,
        passageOrder: item.passageOrder,
        timeSpentSeconds: item.timeSpentSeconds,
        passage: this.serializePassage(item.passage),
      })),
      answers: session.answers.map((answer) => ({
        questionId: answer.questionId,
        answer: answer.userAnswer,
        isCorrect: answer.isCorrect,
        timeSpentSeconds: answer.timeSpentSeconds,
        answeredAt: answer.answeredAt,
      })),
      latestResult: session.results[0]
        ? {
            rawScore: session.results[0].rawScore,
            totalQuestions: session.results[0].totalQuestions,
            bandScore: Number(session.results[0].bandScore),
            questionTypeBreakdown: session.results[0].questionTypeBreakdown,
            skillBreakdown: session.results[0].skillBreakdown,
            timeManagement: session.results[0].timeManagement,
            createdAt: session.results[0].createdAt,
          }
        : null,
    };
  }

  async startSession(userId: string, payload: StartReadingSessionDto) {
    if (payload.mode !== ReadingSessionMode.SINGLE_PASSAGE) {
      throw new BadRequestException('Only SINGLE_PASSAGE reading sessions are implemented right now.');
    }

    const where: Prisma.ReadingPassageWhereInput = {
      isActive: true,
      testType: payload.testType as ReadingTestType,
    };

    if (payload.passageId) {
      where.id = payload.passageId;
    }

    let passage;

    try {
      passage = await this.prisma.readingPassage.findFirst({
        where,
        include: {
          paragraphs: { orderBy: { paragraphIndex: 'asc' } },
          questionSets: {
            orderBy: { questionRangeStart: 'asc' },
            include: {
              questions: { orderBy: { questionNumber: 'asc' } },
            },
          },
        },
        orderBy: payload.passageId ? undefined : { createdAt: 'desc' },
      });
    } catch (error) {
      return this.handleReadingStorageUnavailable('reading_session_start', error, { payload });
    }

    if (!passage) {
      throw new NotFoundException('No reading passage is available for that configuration.');
    }

    let session;

    try {
      session = await this.prisma.readingSession.create({
        data: {
          userId,
          testType: payload.testType as ReadingTestType,
          mode: payload.mode as ReadingSessionMode,
          isTimed: payload.isTimed,
          passages: {
            create: {
              passageId: passage.id,
              passageOrder: 1,
            },
          },
        },
      });
    } catch (error) {
      return this.handleReadingStorageUnavailable('reading_session_start', error, { payload });
    }

    return {
      status: 'ready',
      session: {
        id: session.id,
        testType: session.testType,
        mode: session.mode,
        isTimed: session.isTimed,
        startedAt: session.startedAt,
      },
      passage: this.serializePassage(passage),
    };
  }

  async submitAnswer(sessionId: string, userId: string, payload: SubmitReadingAnswerDto) {
    let session;

    try {
      session = await this.prisma.readingSession.findUnique({
        where: { id: sessionId },
        include: {
          passages: {
            include: {
              passage: {
                select: { id: true },
              },
            },
          },
        },
      });
    } catch (error) {
      return this.handleReadingStorageUnavailable('reading_answer', error, { sessionId });
    }

    if (!session) {
      throw new NotFoundException('Reading session not found.');
    }

    if (session.userId !== userId) {
      throw new ForbiddenException('You do not have access to this reading session.');
    }

    if (session.completedAt) {
      throw new BadRequestException('This reading session has already been completed.');
    }

    const allowedPassageIds = session.passages.map((item) => item.passage.id);

    let question;

    try {
      question = await this.prisma.readingQuestion.findFirst({
        where: {
          id: payload.questionId,
          passageId: { in: allowedPassageIds },
        },
      });
    } catch (error) {
      return this.handleReadingStorageUnavailable('reading_answer', error, { sessionId });
    }

    if (!question) {
      throw new NotFoundException('Reading question not found for this session.');
    }

    const evaluation = this.evaluateAnswer(question, payload.answer);

    let answer;

    try {
      answer = await this.prisma.readingAnswer.upsert({
        where: {
          sessionId_questionId: {
            sessionId,
            questionId: payload.questionId,
          },
        },
        update: {
          userAnswer: evaluation.persistedAnswer as Prisma.InputJsonValue,
          isCorrect: evaluation.isCorrect,
          timeSpentSeconds: payload.timeSpentSeconds,
          answeredAt: new Date(),
        },
        create: {
          sessionId,
          questionId: payload.questionId,
          userAnswer: evaluation.persistedAnswer as Prisma.InputJsonValue,
          isCorrect: evaluation.isCorrect,
          timeSpentSeconds: payload.timeSpentSeconds,
        },
      });
    } catch (error) {
      return this.handleReadingStorageUnavailable('reading_answer', error, { sessionId });
    }

    return {
      status: 'ready',
      answer: {
        id: answer.id,
        questionId: answer.questionId,
        answer: answer.userAnswer,
        isCorrect: answer.isCorrect,
        timeSpentSeconds: answer.timeSpentSeconds,
        answeredAt: answer.answeredAt,
      },
      evaluation: {
        isCorrect: evaluation.isCorrect,
        acceptedAnswers: evaluation.acceptedAnswers,
        explanation: question.explanation,
      },
    };
  }

  async completeSession(sessionId: string, userId: string) {
    let session;

    try {
      session = await this.prisma.readingSession.findUnique({
        where: { id: sessionId },
        include: {
          passages: {
            include: {
              passage: {
                include: {
                  questions: true,
                },
              },
            },
          },
          answers: true,
        },
      });
    } catch (error) {
      return this.handleReadingStorageUnavailable('reading_completion', error, { sessionId });
    }

    if (!session) {
      throw new NotFoundException('Reading session not found.');
    }

    if (session.userId !== userId) {
      throw new ForbiddenException('You do not have access to this reading session.');
    }

    const allQuestions = session.passages.flatMap((item) => item.passage.questions);
    if (allQuestions.length === 0) {
      throw new BadRequestException('This reading session has no questions to score.');
    }

    const rawScore = session.answers.filter((answer) => answer.isCorrect).length;
    const totalQuestions = allQuestions.length;
    const bandScore = this.convertRawScoreToBand(rawScore, totalQuestions);
    const questionTypeBreakdown = this.buildQuestionTypeBreakdown(allQuestions, session.answers);
    const skillBreakdown = this.buildSkillBreakdown(allQuestions, session.answers);
    const timeSpentSeconds =
      Math.max(
        0,
        Math.round((new Date().getTime() - session.startedAt.getTime()) / 1000),
      ) || session.timeSpentSeconds || 0;

    let result;

    try {
      result = await this.prisma.$transaction(async (tx) => {
        const savedSession = await tx.readingSession.update({
          where: { id: sessionId },
          data: {
            completedAt: session.completedAt ?? new Date(),
            timeSpentSeconds,
          },
        });

        const existingResult = await tx.readingResult.findFirst({
          where: { sessionId },
          select: { id: true },
        });

        const timeManagement = {
          isTimed: savedSession.isTimed,
          totalTimeSpentSeconds: timeSpentSeconds,
          averageSecondsPerQuestion: Math.round(timeSpentSeconds / totalQuestions),
        } as Prisma.InputJsonValue;

        const savedResult = existingResult
          ? await tx.readingResult.update({
              where: { id: existingResult.id },
              data: {
                rawScore,
                totalQuestions,
                bandScore,
                questionTypeBreakdown: questionTypeBreakdown as Prisma.InputJsonValue,
                skillBreakdown: skillBreakdown as Prisma.InputJsonValue,
                timeManagement,
              },
            })
          : await tx.readingResult.create({
              data: {
                sessionId,
                rawScore,
                totalQuestions,
                bandScore,
                questionTypeBreakdown: questionTypeBreakdown as Prisma.InputJsonValue,
                skillBreakdown: skillBreakdown as Prisma.InputJsonValue,
                timeManagement,
              },
            });

        for (const breakdown of Object.values(questionTypeBreakdown)) {
          const existingProgress = await tx.readingProgress.findUnique({
            where: {
              userId_questionType: {
                userId,
                questionType: breakdown.questionType as ReadingQuestionType,
              },
            },
          });

          const nextAttempts = (existingProgress?.attempts ?? 0) + breakdown.total;
          const nextCorrect = (existingProgress?.correct ?? 0) + breakdown.correct;

          await tx.readingProgress.upsert({
            where: {
              userId_questionType: {
                userId,
                questionType: breakdown.questionType as ReadingQuestionType,
              },
            },
            update: {
              attempts: { increment: breakdown.total },
              correct: { increment: breakdown.correct },
              accuracyRate: (nextCorrect / nextAttempts) * 100,
              lastPracticedAt: new Date(),
            },
            create: {
              userId,
              questionType: breakdown.questionType as ReadingQuestionType,
              attempts: breakdown.total,
              correct: breakdown.correct,
              accuracyRate: (breakdown.correct / breakdown.total) * 100,
              lastPracticedAt: new Date(),
            },
          });
        }

        return savedResult;
      });
    } catch (error) {
      return this.handleReadingStorageUnavailable('reading_completion', error, { sessionId });
    }

    return {
      status: 'ready',
      result: {
        sessionId,
        rawScore,
        totalQuestions,
        bandScore: Number(result.bandScore),
        questionTypeBreakdown: result.questionTypeBreakdown,
        skillBreakdown: result.skillBreakdown,
        timeManagement: result.timeManagement,
        createdAt: result.createdAt,
      },
    };
  }

  async getResults(sessionId: string, userId: string) {
    let session;

    try {
      session = await this.prisma.readingSession.findUnique({
        where: { id: sessionId },
        include: {
          results: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      });
    } catch (error) {
      return this.handleReadingStorageUnavailable('reading_results', error, { sessionId });
    }

    if (!session) {
      throw new NotFoundException('Reading session not found.');
    }

    if (session.userId !== userId) {
      throw new ForbiddenException('You do not have access to this reading session.');
    }

    if (!session.results[0]) {
      throw new BadRequestException('Reading session results are not available yet. Complete the session first.');
    }

    return {
      status: 'ready',
      result: {
        sessionId,
        rawScore: session.results[0].rawScore,
        totalQuestions: session.results[0].totalQuestions,
        bandScore: Number(session.results[0].bandScore),
        questionTypeBreakdown: session.results[0].questionTypeBreakdown,
        skillBreakdown: session.results[0].skillBreakdown,
        timeManagement: session.results[0].timeManagement,
        createdAt: session.results[0].createdAt,
      },
    };
  }

  async getProgress(userId: string) {
    let results;
    let progressRows;
    let recentSessions;

    try {
      [results, progressRows, recentSessions] = await Promise.all([
        this.prisma.readingResult.findMany({
          where: { session: { userId } },
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.readingProgress.findMany({
          where: { userId },
          orderBy: { updatedAt: 'desc' },
        }),
        this.prisma.readingSession.findMany({
          where: {
            userId,
            completedAt: { not: null },
          },
          orderBy: { completedAt: 'desc' },
          take: 5,
          include: {
            passages: {
              orderBy: { passageOrder: 'asc' },
              include: {
                passage: {
                  select: {
                    id: true,
                    title: true,
                    difficultyLevel: true,
                    topicCategory: true,
                  },
                },
              },
            },
            results: {
              orderBy: { createdAt: 'desc' },
              take: 1,
            },
          },
        }),
      ]);
    } catch (error) {
      return this.handleReadingStorageUnavailable('reading_progress', error, {
        overallStats: {
          completedSessions: 0,
          averageBandScore: null,
          bestBandScore: null,
        },
        questionTypeProgress: [],
        recentSessions: [],
        weakAreas: [],
        recommendations: [],
      });
    }

    const completedSessions = results.length;
    const avgBandScore =
      completedSessions === 0
        ? null
        : Number(
            (
              results.reduce((sum, item) => sum + Number(item.bandScore), 0) /
              completedSessions
            ).toFixed(2),
          );

    const weakAreas = progressRows
      .filter((row) => Number(row.accuracyRate ?? 0) < 70)
      .sort((a, b) => Number(a.accuracyRate ?? 0) - Number(b.accuracyRate ?? 0))
      .slice(0, 3)
      .map((row) => ({
        questionType: row.questionType,
        accuracyRate: Number(row.accuracyRate ?? 0),
      }));

    return {
      status: 'ready',
      overallStats: {
        completedSessions,
        averageBandScore: avgBandScore,
        bestBandScore: results[0]
          ? Math.max(...results.map((item) => Number(item.bandScore)))
          : null,
      },
      questionTypeProgress: progressRows.map((row) => ({
        questionType: row.questionType,
        attempts: row.attempts,
        correct: row.correct,
        accuracyRate: Number(row.accuracyRate ?? 0),
        lastPracticedAt: row.lastPracticedAt,
      })),
      recentSessions: recentSessions.map((session) => ({
        id: session.id,
        completedAt: session.completedAt,
        bandScore: session.results[0] ? Number(session.results[0].bandScore) : null,
        rawScore: session.results[0]?.rawScore ?? null,
        totalQuestions: session.results[0]?.totalQuestions ?? null,
        passage: session.passages[0]?.passage ?? null,
      })),
      weakAreas,
      recommendations: weakAreas.map((area) => `Spend another passage on ${this.humanizeQuestionType(area.questionType)}.`),
    };
  }

  async getQuestionTypeProgress(userId: string) {
    let progressRows;

    try {
      progressRows = await this.prisma.readingProgress.findMany({
        where: { userId },
        orderBy: { updatedAt: 'desc' },
      });
    } catch (error) {
      return this.handleReadingStorageUnavailable('reading_question_type_progress', error, {
        types: [],
      });
    }

    return {
      status: 'ready',
      types: progressRows.map((row) => ({
        questionType: row.questionType,
        attempts: row.attempts,
        correct: row.correct,
        accuracyRate: Number(row.accuracyRate ?? 0),
        lastPracticedAt: row.lastPracticedAt,
      })),
    };
  }

  private normalizeCatalogFilters(filters: unknown) {
    const input = (filters ?? {}) as Record<string, unknown>;

    const testType = this.normalizeEnumValue(input.testType, [
      'ACADEMIC',
      'GENERAL_TRAINING',
    ]);
    const difficulty = this.normalizeEnumValue(input.difficulty, ['EASY', 'MEDIUM', 'HARD']);
    const topic = typeof input.topic === 'string' ? input.topic.trim() : undefined;
    const limit = this.normalizePositiveInteger(input.limit, 20, 100);
    const offset = this.normalizePositiveInteger(input.offset, 0);

    return {
      testType,
      difficulty,
      topic: topic || undefined,
      limit,
      offset,
    };
  }

  private normalizeEnumValue(value: unknown, allowed: string[]) {
    if (typeof value !== 'string') {
      return undefined;
    }

    const normalized = value.trim().toUpperCase();
    return allowed.includes(normalized) ? normalized : undefined;
  }

  private normalizePositiveInteger(value: unknown, fallback: number, max?: number) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < 0) {
      return fallback;
    }

    const rounded = Math.floor(parsed);
    if (max !== undefined) {
      return Math.min(rounded, max);
    }

    return rounded;
  }

  private handleReadingStorageUnavailable(
    resource: string,
    error: unknown,
    extra: Record<string, unknown> = {},
  ) {
    const message = error instanceof Error ? error.message : 'Unknown storage error';

    return {
      status: 'not_ready',
      resource,
      ...extra,
      message:
        'Reading storage is not available yet. Ensure the reading migration has been applied before using this endpoint.',
      error: message,
    };
  }

  private serializePassage(
    passage: {
      id: string;
      title: string;
      content: string;
      wordCount: number;
      difficultyLevel: string;
      testType: string;
      topicCategory: string;
      sourceAttribution: string | null;
      createdAt?: Date;
      updatedAt?: Date;
      paragraphs: Array<{ id: string; paragraphIndex: number; label: string; content: string }>;
      questionSets: Array<{
        id: string;
        questionType: string;
        instructions: string;
        questionRangeStart: number;
        questionRangeEnd: number;
        setData: Prisma.JsonValue | null;
        createdAt?: Date;
        questions: ReadingQuestion[];
      }>;
    },
  ) {
    return {
      id: passage.id,
      title: passage.title,
      content: passage.content,
      wordCount: passage.wordCount,
      difficultyLevel: passage.difficultyLevel,
      testType: passage.testType,
      topicCategory: passage.topicCategory,
      sourceAttribution: passage.sourceAttribution,
      createdAt: passage.createdAt,
      updatedAt: passage.updatedAt,
      paragraphs: passage.paragraphs,
      questionSets: passage.questionSets.map((set) => ({
        id: set.id,
        questionType: set.questionType,
        instructions: set.instructions,
        questionRangeStart: set.questionRangeStart,
        questionRangeEnd: set.questionRangeEnd,
        setData: set.setData,
        createdAt: set.createdAt,
        questions: set.questions.map((question) => this.serializeQuestion(question)),
      })),
    };
  }

  private serializeQuestion(question: ReadingQuestion) {
    return {
      id: question.id,
      questionSetId: question.questionSetId,
      questionType: question.questionType,
      questionNumber: question.questionNumber,
      questionData: question.questionData,
      explanation: question.explanation,
      skillTested: question.skillTested,
      createdAt: question.createdAt,
    };
  }

  private evaluateAnswer(question: ReadingQuestion, answer: unknown) {
    const normalizedInput = this.normalizeAnswerValue(answer);
    const acceptedAnswers = this.extractAcceptedAnswers(question.correctAnswer);
    const normalizedAccepted = acceptedAnswers.map((item) => this.normalizeAnswerValue(item));
    const isCorrect = normalizedAccepted.includes(normalizedInput);

    return {
      isCorrect,
      persistedAnswer: this.wrapAnswer(answer),
      acceptedAnswers,
    };
  }

  private wrapAnswer(answer: unknown): Prisma.JsonValue {
    if (
      answer === null ||
      typeof answer === 'string' ||
      typeof answer === 'number' ||
      typeof answer === 'boolean'
    ) {
      return { value: answer };
    }

    if (Array.isArray(answer)) {
      return { value: answer as Prisma.JsonArray };
    }

    if (typeof answer === 'object') {
      return answer as Prisma.JsonObject;
    }

    return { value: String(answer) };
  }

  private extractAcceptedAnswers(correctAnswer: Prisma.JsonValue): string[] {
    if (typeof correctAnswer === 'string') {
      return [correctAnswer];
    }

    if (Array.isArray(correctAnswer)) {
      return correctAnswer.map((item) => String(item));
    }

    if (correctAnswer && typeof correctAnswer === 'object') {
      const objectValue = correctAnswer as Record<string, Prisma.JsonValue>;
      if (typeof objectValue.answer === 'string') {
        return [objectValue.answer];
      }

      if (Array.isArray(objectValue.answers)) {
        return objectValue.answers.map((item) => String(item));
      }
    }

    return [String(correctAnswer)];
  }

  private normalizeAnswerValue(value: unknown) {
    if (value === null || value === undefined) {
      return '';
    }

    if (typeof value === 'object' && !Array.isArray(value)) {
      const record = value as Record<string, unknown>;
      if ('value' in record) {
        return this.normalizeAnswerValue(record.value);
      }
    }

    if (Array.isArray(value)) {
      return value.map((item) => this.normalizeAnswerValue(item)).join('|');
    }

    return String(value)
      .trim()
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s/-]/g, '');
  }

  private convertRawScoreToBand(rawScore: number, totalQuestions: number) {
    const percentage = totalQuestions === 0 ? 0 : rawScore / totalQuestions;
    if (percentage >= 0.9) return new Prisma.Decimal(9.0);
    if (percentage >= 0.82) return new Prisma.Decimal(8.0);
    if (percentage >= 0.75) return new Prisma.Decimal(7.0);
    if (percentage >= 0.68) return new Prisma.Decimal(6.5);
    if (percentage >= 0.6) return new Prisma.Decimal(6.0);
    if (percentage >= 0.5) return new Prisma.Decimal(5.5);
    if (percentage >= 0.4) return new Prisma.Decimal(5.0);
    if (percentage >= 0.3) return new Prisma.Decimal(4.5);
    return new Prisma.Decimal(4.0);
  }

  private buildQuestionTypeBreakdown(questions: ReadingQuestion[], answers: Array<{ questionId: string; isCorrect: boolean }>) {
    const answerMap = new Map(answers.map((answer) => [answer.questionId, answer.isCorrect]));

    return questions.reduce<Record<string, { questionType: string; total: number; correct: number; accuracyRate: number }>>(
      (acc, question) => {
        const key = question.questionType;
        const current = acc[key] ?? {
          questionType: key,
          total: 0,
          correct: 0,
          accuracyRate: 0,
        };

        current.total += 1;
        if (answerMap.get(question.id)) {
          current.correct += 1;
        }

        current.accuracyRate = Number(((current.correct / current.total) * 100).toFixed(2));
        acc[key] = current;
        return acc;
      },
      {},
    );
  }

  private buildSkillBreakdown(questions: ReadingQuestion[], answers: Array<{ questionId: string; isCorrect: boolean }>) {
    const answerMap = new Map(answers.map((answer) => [answer.questionId, answer.isCorrect]));

    return questions.reduce<Record<string, { skill: string; total: number; correct: number; accuracyRate: number }>>(
      (acc, question) => {
        const key = question.skillTested || 'General comprehension';
        const current = acc[key] ?? {
          skill: key,
          total: 0,
          correct: 0,
          accuracyRate: 0,
        };

        current.total += 1;
        if (answerMap.get(question.id)) {
          current.correct += 1;
        }

        current.accuracyRate = Number(((current.correct / current.total) * 100).toFixed(2));
        acc[key] = current;
        return acc;
      },
      {},
    );
  }

  private humanizeQuestionType(questionType: string) {
    return questionType.toLowerCase().split('_').join(' ');
  }
}
