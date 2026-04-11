import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import {
  Prisma,
  ReadingQuestion,
  ReadingQuestionType,
  ReadingSessionMode,
  ReadingTestType,
  ReadingDifficulty,
} from '@prisma/client';
import { PrismaService } from '../common/prisma/prisma.service';
import { StartReadingSessionDto } from './dto/start-reading-session.dto';
import { SubmitReadingAnswerDto } from './dto/submit-reading-answer.dto';
import { evaluateReadingAnswer } from './validators/answer-validator';

@Injectable()
export class ReadingService {
  constructor(private readonly prisma: PrismaService) {}

  getStatus() {
    return {
      module: 'reading',
      status: 'ready',
      message: 'Reading module is fully operational. Supports 11 question types, 4 practice modes, AI analysis, and adaptive difficulty.',
    };
  }

  async getPassageCatalog(filters: unknown) {
    const normalized = this.normalizeCatalogFilters(filters);

    try {
      const where: Prisma.ReadingPassageWhereInput = {
        isActive: true,
      };

      if (normalized.testType) {
        where.testType = normalized.testType as ReadingTestType;
      }

      if (normalized.difficulty) {
        where.difficultyLevel = normalized.difficulty as any;
      }

      if (normalized.topic) {
        where.topicCategory = {
          contains: normalized.topic,
          mode: 'insensitive',
        };
      }

      const [passages, total] = await Promise.all([
        this.prisma.readingPassage.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          take: normalized.limit,
          skip: normalized.offset,
          select: {
            id: true,
            title: true,
            wordCount: true,
            difficultyLevel: true,
            testType: true,
            topicCategory: true,
            sourceAttribution: true,
            createdAt: true,
            updatedAt: true,
          },
        }),
        this.prisma.readingPassage.count({ where }),
      ]);

      return {
        status: 'ready',
        filters: normalized,
        passages: passages.map((p) => ({
          id: p.id,
          title: p.title,
          wordCount: p.wordCount,
          difficultyLevel: p.difficultyLevel,
          testType: p.testType,
          topicCategory: p.topicCategory,
          sourceAttribution: p.sourceAttribution,
          createdAt: p.createdAt,
          updatedAt: p.updatedAt,
        })),
        total,
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
          "vocabulary_terms" AS "vocabularyTerms",
          "created_at" AS "createdAt",
          "updated_at" AS "updatedAt"
        FROM "reading_passages"
        WHERE "id" = ${id} AND "is_active" = true
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
      passages: session.passages.map((item) => {
        const serialized = this.serializePassage(item.passage);
        const filters = (session as any).practiceFilters;

        if (filters && typeof filters === 'object') {
          if (filters.questionTypes) {
            serialized.questionSets = serialized.questionSets.filter((qs: any) =>
              filters.questionTypes.includes(qs.questionType),
            );
          } else if (filters.reviewQuestionIds) {
            const reviewSet = new Set(filters.reviewQuestionIds);
            serialized.questionSets.forEach((qs: any) => {
              qs.questions = qs.questions.filter((q: any) => reviewSet.has(q.id));
            });
            serialized.questionSets = serialized.questionSets.filter((qs: any) => qs.questions.length > 0);
          }
        }

        return {
          id: item.id,
          passageOrder: item.passageOrder,
          timeSpentSeconds: item.timeSpentSeconds,
          passage: serialized,
        };
      }),
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
    let sessionPassages: Array<{ passageId: string; passageOrder: number }> = [];
    let practiceFilters: any = null;

    if (payload.mode === ReadingSessionMode.FULL_TEST) {
      const availablePassages = await this.prisma.readingPassage.findMany({
        where: { isActive: true, testType: payload.testType as ReadingTestType },
        orderBy: { createdAt: 'desc' },
      });

      // Shuffle to avoid always picking the same passages
      const shuffled = [...availablePassages].sort(() => Math.random() - 0.5);
      const easy = shuffled.find(p => p.difficultyLevel === 'EASY');
      const med = shuffled.find(p => p.difficultyLevel === 'MEDIUM');
      const hard = shuffled.find(p => p.difficultyLevel === 'HARD');

      const selected = [easy, med, hard].filter(Boolean) as any[];
      if (selected.length < 3) {
        for (const p of availablePassages) {
          if (!selected.find(s => s.id === p.id) && selected.length < 3) {
            selected.push(p);
          }
        }
      }

      if (selected.length === 0) {
        throw new NotFoundException('No reading passages available for a full test.');
      }

      selected.forEach((p, idx) => {
        sessionPassages.push({ passageId: p.id, passageOrder: idx + 1 });
      });

      payload.isTimed = true; // Full tests are always timed (60 min handled frontend)

    } else if (payload.mode === ReadingSessionMode.QUESTION_TYPE_PRACTICE) {
      if (!payload.questionTypes || payload.questionTypes.length === 0) {
        throw new BadRequestException('questionTypes is required for QUESTION_TYPE_PRACTICE mode.');
      }

      const sets = await this.prisma.readingQuestionSet.findMany({
        where: {
          questionType: { in: payload.questionTypes as ReadingQuestionType[] },
          passage: { isActive: true, testType: payload.testType as ReadingTestType },
        },
        take: 10,
      });

      if (sets.length === 0) {
        throw new NotFoundException('No passages found covering these question types.');
      }

      // Pick the first passage that has a match
      sessionPassages.push({ passageId: sets[0].passageId, passageOrder: 1 });
      practiceFilters = { questionTypes: payload.questionTypes };

    } else if (payload.mode === ReadingSessionMode.REVIEW) {
      const incorrectAnswers = await this.prisma.readingAnswer.findMany({
        where: { session: { userId }, isCorrect: false },
        take: 40,
        orderBy: { answeredAt: 'desc' },
        include: { question: { select: { passageId: true } } },
      });

      if (incorrectAnswers.length === 0) {
        throw new NotFoundException('No incorrect questions found to review. Great job!');
      }

      const uniquePassageIds = [...new Set(incorrectAnswers.map(ans => ans.question.passageId))].slice(0, 3);
      uniquePassageIds.forEach((pid, idx) => {
        sessionPassages.push({ passageId: pid, passageOrder: idx + 1 });
      });

      practiceFilters = { reviewQuestionIds: incorrectAnswers.map(a => a.questionId) };

    } else if (payload.mode === ReadingSessionMode.SINGLE_PASSAGE) {
      const where: Prisma.ReadingPassageWhereInput = {
        isActive: true,
        testType: payload.testType as ReadingTestType,
      };

      if (payload.passageId) {
        where.id = payload.passageId;
      }

      const passage = await this.prisma.readingPassage.findFirst({
        where,
        orderBy: payload.passageId ? undefined : { createdAt: 'desc' },
      });

      if (!passage) {
        throw new NotFoundException('No reading passage is available for that configuration.');
      }
      
      sessionPassages.push({ passageId: passage.id, passageOrder: 1 });
    } else {
      throw new BadRequestException('Invalid session mode.');
    }

    let session;
    try {
      session = await this.prisma.readingSession.create({
        data: {
          userId,
          testType: payload.testType as ReadingTestType,
          mode: payload.mode as ReadingSessionMode,
          isTimed: payload.isTimed,
          practiceFilters: practiceFilters || Prisma.JsonNull,
          passages: {
            create: sessionPassages,
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
      // Since FULL_TEST etc can have multiple passages, we just return the session ID. 
      // The client redirects to /reading/practice/[id] which calls getSession() to get the full mapped passages.
      passage: null, 
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

    const evaluation = evaluateReadingAnswer(
      question.questionType,
      payload.answer,
      question.correctAnswer,
    );

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
        details: evaluation.details,
        explanation: question.explanation,
      },
    };
  }

  async completeSession(sessionId: string, userId: string, forceComplete?: boolean) {
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

    if (session.completedAt) {
      const existingResult = await this.prisma.readingResult.findFirst({
        where: { sessionId },
      });
      return {
        status: 'already_completed',
        result: existingResult,
      };
    }

    const allQuestions = session.passages.flatMap((item) => item.passage.questions);
    if (allQuestions.length === 0) {
      throw new BadRequestException('This reading session has no questions to score.');
    }

    const rawScore = session.answers.filter((answer) => answer.isCorrect).length;
    const totalQuestions = allQuestions.length;
    const bandScore = this.convertRawScoreToBand(rawScore, totalQuestions, session.testType);
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
          averageSecondsPerQuestion: Math.round(timeSpentSeconds / Math.max(1, totalQuestions)),
          passages: session.passages.map((p) => {
            const passageQuestionIds = p.passage.questions.map((q) => q.id);
            const answered = session.answers.filter((a) => passageQuestionIds.includes(a.questionId)).length;
            return {
              passageOrder: p.passageOrder,
              title: p.passage.title,
              timeSpentSeconds: p.timeSpentSeconds || 0,
              questionsAnswered: answered,
            };
          }),
        } as Prisma.InputJsonValue;

        const completionReason = forceComplete ? 'timer_expired' : 'user_submitted';

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
                completionReason,
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
                completionReason,
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

    const response = {
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

    // Fire-and-forget achievement check (don't block the response)
    this.checkAndAwardAchievements(userId, Number(bandScore), session, questionTypeBreakdown, timeSpentSeconds).catch(() => {});

    return response;
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

  async getRecommendedPassage(userId: string) {
    // Fetch user's exam type to filter passages accordingly
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { examType: true },
    });
    const testType: ReadingTestType =
      user?.examType === 'GENERAL' ? 'GENERAL_TRAINING' : 'ACADEMIC';

    const recentResults = await this.prisma.readingResult.findMany({
      where: { session: { userId } },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    let recommendedDifficulty: ReadingDifficulty = 'EASY';
    let reason = "Let's start with an easy passage to build your confidence.";

    if (recentResults.length > 0) {
      const avgAccuracy = recentResults.reduce((sum, res) => sum + (res.rawScore / Math.max(1, res.totalQuestions)), 0) / recentResults.length;
      
      if (avgAccuracy >= 0.8) {
        recommendedDifficulty = 'HARD';
        reason = "You've been doing great recently! Here is a challenging passage to push your limits.";
      } else if (avgAccuracy >= 0.6) {
        recommendedDifficulty = 'MEDIUM';
        reason = "Your recent scores are solid. Let's try a medium difficulty passage.";
      } else {
        recommendedDifficulty = 'EASY';
        reason = "Let's focus on the fundamentals with an easier passage.";
      }
    }

    const recentPassages = await this.prisma.readingSessionPassage.findMany({
      where: {
        session: {
          userId,
          createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        },
      },
      select: { passageId: true },
    });
    
    const excludedIds = recentPassages.map(rp => rp.passageId);

    let recommendedPassage = await this.prisma.readingPassage.findFirst({
      where: {
        difficultyLevel: recommendedDifficulty,
        testType,
        isActive: true,
        id: { notIn: excludedIds },
      },
      include: {
        paragraphs: true,
        questionSets: { include: { questions: true } }
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!recommendedPassage) {
      recommendedPassage = await this.prisma.readingPassage.findFirst({
        where: { testType, isActive: true },
        include: {
          paragraphs: true,
          questionSets: { include: { questions: true } }
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    return {
      status: 'ready',
      difficulty: recommendedDifficulty,
      reason,
      passage: recommendedPassage ? this.serializePassage(recommendedPassage as any) : null,
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
      vocabularyTerms?: Prisma.JsonValue | null;
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
      vocabularyTerms: passage.vocabularyTerms ?? null,
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
    const serialized = {
      id: question.id,
      questionSetId: question.questionSetId,
      questionType: question.questionType,
      questionNumber: question.questionNumber,
      questionData: question.questionData,
      explanation: question.explanation,
      skillTested: question.skillTested,
      createdAt: question.createdAt,
    };
    if ('correctAnswer' in serialized) {
      delete (serialized as any).correctAnswer;
    }
    return serialized;
  }

  private convertRawScoreToBand(rawScore: number, totalQuestions: number, testType: string = 'ACADEMIC') {
    // Scale to /40 if not already (single-passage sessions have fewer questions)
    const scaledScore = totalQuestions === 40
      ? rawScore
      : Math.round((rawScore / totalQuestions) * 40);

    // Official IELTS Academic conversion table
    const academicTable: [number, number][] = [
      [39, 9.0], [37, 8.5], [35, 8.0], [33, 7.5], [30, 7.0],
      [27, 6.5], [23, 6.0], [19, 5.5], [15, 5.0], [13, 4.5],
      [10, 4.0], [6, 3.5], [4, 3.0], [0, 0],
    ];

    // General Training has a different table
    const gtTable: [number, number][] = [
      [40, 9.0], [39, 8.5], [37, 8.0], [36, 7.5], [34, 7.0],
      [32, 6.5], [30, 6.0], [27, 5.5], [23, 5.0], [19, 4.5],
      [15, 4.0], [12, 3.5], [8, 3.0], [0, 0],
    ];

    const table = testType === 'GENERAL_TRAINING' ? gtTable : academicTable;
    for (const [threshold, band] of table) {
      if (scaledScore >= threshold) return new Prisma.Decimal(band);
    }
    return new Prisma.Decimal(0);
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

  // ─── Achievements ────────────────────────────────────────────────────

  private static readonly ACHIEVEMENT_DEFINITIONS = [
    {
      id: 'first_reading',
      name: 'First Steps',
      description: 'Complete your first reading practice',
      icon: '📖',
    },
    {
      id: 'full_test_complete',
      name: 'Test Ready',
      description: 'Complete a full 40-question test',
      icon: '📝',
    },
    {
      id: 'band_7',
      name: 'Band 7 Club',
      description: 'Score Band 7.0 or higher',
      icon: '🎯',
    },
    {
      id: 'band_8',
      name: 'Band 8 Elite',
      description: 'Score Band 8.0 or higher',
      icon: '🏆',
    },
    {
      id: 'perfect_tfng',
      name: 'Truth Seeker',
      description: 'Get 100% on True/False/Not Given in one session',
      icon: '✓',
    },
    {
      id: 'speed_reader',
      name: 'Speed Reader',
      description: 'Complete a full test with 10+ minutes to spare',
      icon: '⚡',
    },
    {
      id: 'streak_7',
      name: 'On Fire',
      description: 'Practice reading 7 days in a row',
      icon: '🔥',
    },
    {
      id: 'all_types',
      name: 'Versatile Reader',
      description: 'Practice all 11 question types',
      icon: '🌟',
    },
    {
      id: 'ten_sessions',
      name: 'Dedicated Reader',
      description: 'Complete 10 reading sessions',
      icon: '📚',
    },
  ];

  private async checkAndAwardAchievements(
    userId: string,
    bandScore: number,
    session: any,
    questionTypeBreakdown: any,
    timeSpentSeconds: number,
  ) {
    try {
      // Get existing achievements to avoid duplicate checks
      const existing = await this.prisma.readingAchievement.findMany({
        where: { userId },
        select: { achievementId: true },
      });
      const existingIds = new Set(existing.map((a: any) => a.achievementId));

      const newAchievements: string[] = [];

      // Count total completed sessions
      const totalSessions = await this.prisma.readingSession.count({
        where: { userId, completedAt: { not: null } },
      });

      // first_reading
      if (!existingIds.has('first_reading') && totalSessions >= 1) {
        newAchievements.push('first_reading');
      }

      // ten_sessions
      if (!existingIds.has('ten_sessions') && totalSessions >= 10) {
        newAchievements.push('ten_sessions');
      }

      // band_7
      if (!existingIds.has('band_7') && bandScore >= 7.0) {
        newAchievements.push('band_7');
      }

      // band_8
      if (!existingIds.has('band_8') && bandScore >= 8.0) {
        newAchievements.push('band_8');
      }

      // full_test_complete — 40 questions or session mode is FULL_TEST
      if (!existingIds.has('full_test_complete')) {
        const totalQs = session.answers?.length ?? 0;
        if (totalQs >= 38 || session.mode === 'FULL_TEST') {
          newAchievements.push('full_test_complete');
        }
      }

      // perfect_tfng — 100% on TFNG in this session
      if (!existingIds.has('perfect_tfng') && questionTypeBreakdown) {
        const tfngBreakdown = Object.values(questionTypeBreakdown).find(
          (b: any) => b.questionType === 'TRUE_FALSE_NOT_GIVEN',
        ) as any;
        if (tfngBreakdown && tfngBreakdown.total > 0 && tfngBreakdown.correct === tfngBreakdown.total) {
          newAchievements.push('perfect_tfng');
        }
      }

      // speed_reader — full test finished with 10+ min to spare (3600s total, so <3000s)
      if (!existingIds.has('speed_reader')) {
        const totalQs = session.answers?.length ?? 0;
        if (totalQs >= 38 && timeSpentSeconds < 3000) {
          newAchievements.push('speed_reader');
        }
      }

      // all_types — check that user has attempted all 11 question types
      if (!existingIds.has('all_types')) {
        const typesAttempted = await this.prisma.readingProgress.count({
          where: { userId, attempts: { gt: 0 } },
        });
        if (typesAttempted >= 11) {
          newAchievements.push('all_types');
        }
      }

      // streak_7 — check reading streak (unique days with completed sessions in a row)
      if (!existingIds.has('streak_7')) {
        const recentSessions = await this.prisma.readingSession.findMany({
          where: { userId, completedAt: { not: null } },
          select: { completedAt: true },
          orderBy: { completedAt: 'desc' },
          take: 30,
        });

        if (recentSessions.length >= 7) {
          const uniqueDays = [...new Set(
            recentSessions.map((s) => s.completedAt!.toISOString().split('T')[0]),
          )].sort().reverse();

          let streak = 1;
          for (let i = 1; i < uniqueDays.length; i++) {
            const prev = new Date(uniqueDays[i - 1] + 'T00:00:00');
            const curr = new Date(uniqueDays[i] + 'T00:00:00');
            const diffDays = Math.round((prev.getTime() - curr.getTime()) / (1000 * 60 * 60 * 24));
            if (diffDays === 1) {
              streak++;
            } else {
              break;
            }
          }

          if (streak >= 7) {
            newAchievements.push('streak_7');
          }
        }
      }

      // Award new achievements
      if (newAchievements.length > 0) {
        await this.prisma.readingAchievement.createMany({
          data: newAchievements.map((achievementId) => ({
            userId,
            achievementId,
          })),
          skipDuplicates: true,
        });
      }

      return newAchievements;
    } catch {
      // Silently fail — achievements are non-critical
      return [];
    }
  }

  async getUserAchievements(userId: string) {
    const unlocked = await this.prisma.readingAchievement.findMany({
      where: { userId },
      orderBy: { unlockedAt: 'desc' },
    });

    const unlockedMap = new Map(
      unlocked.map((a: any) => [a.achievementId, a.unlockedAt]),
    );

    return ReadingService.ACHIEVEMENT_DEFINITIONS.map((def) => ({
      ...def,
      unlocked: unlockedMap.has(def.id),
      unlockedAt: unlockedMap.get(def.id) || null,
    }));
  }
}
