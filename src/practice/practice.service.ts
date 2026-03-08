import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { SpeechAnalysisService } from './services/speech-analysis.service';
import { S3Service } from './services/s3.service';
import { UsersService } from '../users/users.service';
import { Prisma } from '@prisma/client';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class PracticeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly speechAnalysis: SpeechAnalysisService,
    private readonly s3Service: S3Service,
    private readonly usersService: UsersService,
    @InjectQueue('audio-processing') private readonly audioQueue: Queue,
  ) {}

  // ========================
  // Question Methods
  // ========================

  async getTopics(part: 1 | 2 | 3) {
    const questions = await this.prisma.speakingQuestion.findMany({
      where: { part, isActive: true },
      select: { topic: true },
      distinct: ['topic'],
    });

    return questions.map(q => q.topic);
  }

  async getRandomQuestion(part: 1 | 2 | 3, topic?: string, difficulty?: string) {
    const where: Prisma.SpeakingQuestionWhereInput = {
      part,
      isActive: true,
    };

    if (topic) where.topic = topic;
    if (difficulty) where.difficultyLevel = difficulty;

    const count = await this.prisma.speakingQuestion.count({ where });
    
    if (count === 0) {
      throw new BadRequestException('No questions found matching criteria');
    }

    const skip = Math.floor(Math.random() * count);
    
    const question = await this.prisma.speakingQuestion.findFirst({
      where,
      skip,
    });

    return question;
  }

  // ========================
  // Session Methods
  // ========================

  async canStartSession(userId: string) {
    return this.usersService.canStartSession(userId, 'speaking');
  }

  async createSession(userId: string, questionId: string, part: 1 | 2 | 3) {
    // All logic is inside a single transaction. A SELECT FOR UPDATE on the user row
    // serialises concurrent session-start requests for the same user, preventing the
    // race condition where two requests both pass the duplicate check before either
    // has committed a session record and decremented the balance.
    return this.prisma.$transaction(async (tx) => {
      // Acquire a row-level lock on the user so concurrent calls queue behind this one.
      await tx.$queryRaw`SELECT id FROM "users" WHERE id = ${userId} FOR UPDATE`;

      // Guard against duplicate start calls (e.g. retries/double-invocation) draining balance.
      const duplicateWindowStart = new Date(Date.now() - 60 * 1000);
      const recentOpenSession = await tx.practiceSession.findFirst({
        where: {
          userId,
          completedAt: null,
          mockTestId: null,
          part,
          createdAt: { gte: duplicateWindowStart },
        },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          userId: true,
          questionId: true,
          part: true,
          audioUrl: true,
          audioDurationSeconds: true,
          transcript: true,
          transcriptWithTimestamps: true,
          overallBandScore: true,
          fluencyCoherenceScore: true,
          lexicalResourceScore: true,
          grammarAccuracyScore: true,
          pronunciationScore: true,
          wordsPerMinute: true,
          totalWords: true,
          fillerWordCount: true,
          fillerWordsDetail: true,
          pauseCount: true,
          longPauseCount: true,
          pauseLocations: true,
          feedbackFluency: true,
          feedbackVocabulary: true,
          feedbackGrammar: true,
          feedbackPronunciation: true,
          feedbackOverall: true,
          vocabularySuggestions: true,
          grammarCorrections: true,
          mispronouncedWords: true,
          modelAnswer: true,
          prepTimeUsedSeconds: true,
          speakingTimeSeconds: true,
          completedAt: true,
          createdAt: true,
          mockTestId: true,
          questionNumber: true,
          question: true,
        },
      });

      if (recentOpenSession) {
        return recentOpenSession;
      }

      // Apply session consumption within the transaction so the decrement and the
      // session record are committed together atomically.
      const user = await tx.user.findUnique({ where: { id: userId } });
      if (user) {
        const isPremium =
          user.subscriptionTier === 'premium' &&
          (!user.subscriptionExpiresAt || user.subscriptionExpiresAt > new Date());

        if (!isPremium && user.speakingBalance > 0) {
          await tx.user.update({
            where: { id: userId },
            data: { speakingBalance: { decrement: 1 } },
          });
        }
      }

      return tx.practiceSession.create({
        data: {
          userId,
          questionId,
          part,
        },
        select: {
          id: true,
          userId: true,
          questionId: true,
          part: true,
          audioUrl: true,
          audioDurationSeconds: true,
          transcript: true,
          transcriptWithTimestamps: true,
          overallBandScore: true,
          fluencyCoherenceScore: true,
          lexicalResourceScore: true,
          grammarAccuracyScore: true,
          pronunciationScore: true,
          wordsPerMinute: true,
          totalWords: true,
          fillerWordCount: true,
          fillerWordsDetail: true,
          pauseCount: true,
          longPauseCount: true,
          pauseLocations: true,
          feedbackFluency: true,
          feedbackVocabulary: true,
          feedbackGrammar: true,
          feedbackPronunciation: true,
          feedbackOverall: true,
          vocabularySuggestions: true,
          grammarCorrections: true,
          mispronouncedWords: true,
          modelAnswer: true,
          prepTimeUsedSeconds: true,
          speakingTimeSeconds: true,
          completedAt: true,
          createdAt: true,
          mockTestId: true,
          questionNumber: true,
          question: true,
        },
      });
    });
  }

  async processSession(
    sessionId: string,
    userId: string,
    audioBuffer: Buffer,
    prepTimeUsed?: number,
    speakingTimeSeconds?: number,
  ) {
    // Get session with question
    const session = await this.prisma.practiceSession.findUnique({
      where: { id: sessionId },
      select: {
        id: true,
        userId: true,
        part: true,
        question: {
          select: {
            questionText: true,
            cueCardPoints: true,
          },
        },
      },
    });

    if (!session || session.userId !== userId) {
      throw new BadRequestException('Session not found');
    }

    // Convert Buffer to base64 for strictly serializable job data
    const audioBufferBase64 = audioBuffer.toString('base64');

    // Add job to the BullMQ audio-processing queue
    await this.audioQueue.add(
      'process-audio', 
      {
        sessionId,
        userId,
        audioBufferBase64,
        prepTimeUsedSeconds: prepTimeUsed,
        speakingTimeSeconds,
      },
      {
        jobId: `audio-${sessionId}`, // Prevent duplicate grading attempts
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
      }
    );

    // Return early before S3, Whisper, and Claude execute
    return {
      success: true,
      message: 'Audio submission accepted and is being processed in the background.',
      sessionId,
      status: 'processing', // Client can poll if necessary
    };
  }

  async getSessionWithDetails(sessionId: string) {
    const session = await this.prisma.practiceSession.findUnique({
      where: { id: sessionId },
      select: {
        id: true,
        userId: true,
        questionId: true,
        part: true,
        audioUrl: true,
        audioDurationSeconds: true,
        transcript: true,
        transcriptWithTimestamps: true,
        overallBandScore: true,
        fluencyCoherenceScore: true,
        lexicalResourceScore: true,
        grammarAccuracyScore: true,
        pronunciationScore: true,
        wordsPerMinute: true,
        totalWords: true,
        fillerWordCount: true,
        fillerWordsDetail: true,
        pauseCount: true,
        longPauseCount: true,
        pauseLocations: true,
        feedbackFluency: true,
        feedbackVocabulary: true,
        feedbackGrammar: true,
        feedbackPronunciation: true,
        feedbackOverall: true,
        vocabularySuggestions: true,
        grammarCorrections: true,
        mispronouncedWords: true,
        modelAnswer: true,
        enhancedModelAnswer: true,
        prepTimeUsedSeconds: true,
        speakingTimeSeconds: true,
        completedAt: true,
        createdAt: true,
        mockTestId: true,
        questionNumber: true,
        question: true,
        user: {
          select: {
            targetBandScore: true,
          },
        },
      },
    });

    if (session?.audioUrl) {
      try {
        const signedUrl = await this.s3Service.getSignedUrl(session.audioUrl);
        return { ...session, audioUrl: signedUrl };
      } catch (error) {
        console.error('Failed to generate signed URL for audio:', error.message);
        // Return session without audio URL if S3 is not configured
        return { ...session, audioUrl: null };
      }
    }

    return session;
  }

  async getUserSessions(userId: string, limit: number, offset: number, part?: 1 | 2 | 3) {
    const where: Prisma.PracticeSessionWhereInput = {
      userId,
      completedAt: { not: null },
    };

    if (part) where.part = part;

    const [sessions, total] = await Promise.all([
      this.prisma.practiceSession.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        select: {
          id: true,
          userId: true,
          questionId: true,
          part: true,
          audioUrl: true,
          audioDurationSeconds: true,
          transcript: true,
          transcriptWithTimestamps: true,
          overallBandScore: true,
          fluencyCoherenceScore: true,
          lexicalResourceScore: true,
          grammarAccuracyScore: true,
          pronunciationScore: true,
          wordsPerMinute: true,
          totalWords: true,
          fillerWordCount: true,
          fillerWordsDetail: true,
          pauseCount: true,
          longPauseCount: true,
          pauseLocations: true,
          feedbackFluency: true,
          feedbackVocabulary: true,
          feedbackGrammar: true,
          feedbackPronunciation: true,
          feedbackOverall: true,
          vocabularySuggestions: true,
          grammarCorrections: true,
          mispronouncedWords: true,
          modelAnswer: true,
          prepTimeUsedSeconds: true,
          speakingTimeSeconds: true,
          completedAt: true,
          createdAt: true,
          mockTestId: true,
          questionNumber: true,
          question: {
            select: {
              topic: true,
              questionText: true,
            },
          },
        },
      }),
      this.prisma.practiceSession.count({ where }),
    ]);

    return {
      sessions,
      total,
      hasMore: offset + limit < total,
    };
  }

  // ========================
  // Progress Methods
  // ========================

  async getUserProgress(userId: string) {
    // Use upsert to avoid race conditions when multiple requests initialize progress concurrently.
    return this.prisma.userProgress.upsert({
      where: { userId },
      update: {},
      create: { userId },
    });
  }

  async updateUserProgress(userId: string) {
    // Get last 10 completed sessions for rolling average
    const recentSessions = await this.prisma.practiceSession.findMany({
      where: {
        userId,
        completedAt: { not: null },
        overallBandScore: { not: null },
      },
      orderBy: { completedAt: 'desc' },
      take: 10,
    });

    if (recentSessions.length === 0) return;

    // Calculate averages
    const avgOverall = recentSessions.reduce((sum, s) => sum + Number(s.overallBandScore), 0) / recentSessions.length;
    const avgFluency = recentSessions.reduce((sum, s) => sum + Number(s.fluencyCoherenceScore), 0) / recentSessions.length;
    const avgLexical = recentSessions.reduce((sum, s) => sum + Number(s.lexicalResourceScore), 0) / recentSessions.length;
    const avgGrammar = recentSessions.reduce((sum, s) => sum + Number(s.grammarAccuracyScore), 0) / recentSessions.length;
    const avgPronunciation = recentSessions.reduce((sum, s) => sum + Number(s.pronunciationScore), 0) / recentSessions.length;

    // Get total practice time
    const totalMinutes = await this.prisma.practiceSession.aggregate({
      where: { userId, completedAt: { not: null } },
      _sum: { audioDurationSeconds: true },
      _count: true,
    });

    // Calculate streak
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const currentProgress = await this.prisma.userProgress.findUnique({
      where: { userId },
    });

    let streakDays = currentProgress?.currentStreakDays || 0;
    const lastPractice = currentProgress?.lastPracticeDate;

    if (lastPractice) {
      const lastDate = new Date(lastPractice);
      lastDate.setHours(0, 0, 0, 0);
      
      const diffDays = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) {
        // Same day, keep streak
      } else if (diffDays === 1) {
        // Consecutive day, increment
        streakDays++;
      } else {
        // Streak broken
        streakDays = 1;
      }
    } else {
      streakDays = 1;
    }

    await this.prisma.userProgress.upsert({
      where: { userId },
      create: {
        userId,
        avgOverallScore: avgOverall,
        avgFluencyScore: avgFluency,
        avgLexicalScore: avgLexical,
        avgGrammarScore: avgGrammar,
        avgPronunciationScore: avgPronunciation,
        totalSessions: totalMinutes._count,
        totalPracticeMinutes: Number(totalMinutes._sum.audioDurationSeconds || 0) / 60,
        currentStreakDays: streakDays,
        longestStreakDays: streakDays,
        lastPracticeDate: new Date(),
      },
      update: {
        avgOverallScore: avgOverall,
        avgFluencyScore: avgFluency,
        avgLexicalScore: avgLexical,
        avgGrammarScore: avgGrammar,
        avgPronunciationScore: avgPronunciation,
        totalSessions: totalMinutes._count,
        totalPracticeMinutes: Number(totalMinutes._sum.audioDurationSeconds || 0) / 60,
        currentStreakDays: streakDays,
        longestStreakDays: Math.max(streakDays, currentProgress?.longestStreakDays || 0),
        lastPracticeDate: new Date(),
      },
    });
  }

  async getStats(userId: string) {
    // Run all queries in parallel for performance.
    const [
      normalizedUser,
      recentScoredSessions,
      totalAgg,
      scoreTrend,
      topicDistribution,
      storedProgress,
    ] = await Promise.all([
      this.usersService.syncSubscriptionStatus(userId),

      // Last 10 completed+scored sessions used for computing live averages.
      // Reading directly from practiceSession avoids the UserProgress cache being
      // stale (e.g. the audio processor hasn't run yet, or updateUserProgress failed).
      this.prisma.practiceSession.findMany({
        where: {
          userId,
          completedAt: { not: null },
          overallBandScore: { not: null },
        },
        orderBy: { completedAt: 'desc' },
        take: 10,
        select: {
          overallBandScore: true,
          fluencyCoherenceScore: true,
          lexicalResourceScore: true,
          grammarAccuracyScore: true,
          pronunciationScore: true,
        },
      }),

      // Aggregate for total session count and total practice time.
      this.prisma.practiceSession.aggregate({
        where: { userId, completedAt: { not: null } },
        _sum: { audioDurationSeconds: true },
        _count: true,
      }),

      // Score trend for the chart — most recent 30 days in chronological order.
      // Previously used `take: 10` with `asc` which returned the oldest 10 sessions,
      // causing the chart to show stale history while the average reflected recent sessions.
      this.prisma.practiceSession.findMany({
        where: {
          userId,
          completedAt: {
            not: null,
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
          overallBandScore: { not: null },
        },
        orderBy: { completedAt: 'asc' },
        select: {
          overallBandScore: true,
          completedAt: true,
          part: true,
        },
      }),

      // Topic/part distribution.
      this.prisma.practiceSession.groupBy({
        by: ['part'],
        where: { userId, completedAt: { not: null } },
        _count: true,
      }),

      // Streak data only – computed by the audio processor which runs date-diff
      // logic we don't want to duplicate here.
      this.prisma.userProgress.findUnique({ where: { userId } }),
    ]);

    // Compute live averages from session records.
    const n = recentScoredSessions.length;
    const avg = (field: keyof typeof recentScoredSessions[0]) =>
      n > 0
        ? recentScoredSessions.reduce((sum, s) => sum + Number(s[field] ?? 0), 0) / n
        : 0;

    return {
      progress: {
        avgOverallScore: avg('overallBandScore'),
        avgFluencyScore: avg('fluencyCoherenceScore'),
        avgLexicalScore: avg('lexicalResourceScore'),
        avgGrammarScore: avg('grammarAccuracyScore'),
        avgPronunciationScore: avg('pronunciationScore'),
        totalSessions: totalAgg._count,
        totalPracticeMinutes: Number(totalAgg._sum.audioDurationSeconds ?? 0) / 60,
        // Streak lives in UserProgress (maintained by the audio processor).
        currentStreakDays: storedProgress?.currentStreakDays ?? 0,
        longestStreakDays: storedProgress?.longestStreakDays ?? 0,
        lastPracticeDate: storedProgress?.lastPracticeDate ?? null,
      },
      targetScore: normalizedUser?.targetBandScore,
      sessionBalance: normalizedUser?.speakingBalance || 0,
      scoreTrend,
      topicDistribution: topicDistribution.map(t => ({
        part: t.part,
        count: t._count,
      })),
    };
  }

  // ========================
  // Model Answer
  // ========================

  async generateModelAnswer(sessionId: string, userId: string) {
    const session = await this.prisma.practiceSession.findUnique({
      where: { id: sessionId },
      select: {
        userId: true,
        part: true,
        modelAnswer: true,
        question: {
          select: {
            questionText: true,
            cueCardPoints: true,
          },
        },
        user: { select: { targetBandScore: true } },
      },
    });

    if (!session || session.userId !== userId) {
      throw new BadRequestException('Session not found');
    }

    // Check if model answer already exists
    if (session.modelAnswer) {
      return { modelAnswer: session.modelAnswer };
    }

    const result = await this.speechAnalysis.generateModelAnswer({
      part: session.part as 1 | 2 | 3,
      question: session.question.questionText,
      targetBand: Number(session.user.targetBandScore),
      cueCardPoints: session.question.cueCardPoints as string[] | undefined,
    });

    // Save model answer
    await this.prisma.practiceSession.update({
      where: { id: sessionId },
      data: { modelAnswer: result.modelAnswer },
      select: { id: true },
    });

    return result;
  }

  async generateEnhancedModelAnswer(sessionId: string, userId: string) {
    const session = await this.prisma.practiceSession.findUnique({
      where: { id: sessionId },
      select: {
        userId: true,
        part: true,
        transcript: true,
        overallBandScore: true,
        enhancedModelAnswer: true,
        question: {
          select: {
            questionText: true,
            cueCardPoints: true,
          },
        },
      },
    });

    if (!session || session.userId !== userId) {
      throw new BadRequestException('Session not found');
    }

    if (!session.transcript || !session.overallBandScore) {
      throw new BadRequestException('Session must be completed to generate model answer');
    }

    // Return cached result if already generated
    if (session.enhancedModelAnswer) {
      return session.enhancedModelAnswer;
    }

    const result = await this.speechAnalysis.generateEnhancedModelAnswer({
      part: session.part as 1 | 2 | 3,
      question: session.question.questionText,
      userTranscript: session.transcript,
      userScore: Number(session.overallBandScore),
      cueCardPoints: session.question.cueCardPoints as string[] | undefined,
    });

    // Persist so subsequent requests are served from cache
    await this.prisma.practiceSession.update({
      where: { id: sessionId },
      data: { enhancedModelAnswer: result as any },
      select: { id: true },
    });

    return result;
  }
}
