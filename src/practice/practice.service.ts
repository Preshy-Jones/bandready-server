import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { SpeechAnalysisService } from './services/speech-analysis.service';
import { S3Service } from './services/s3.service';
import { UsersService } from '../users/users.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class PracticeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly speechAnalysis: SpeechAnalysisService,
    private readonly s3Service: S3Service,
    private readonly usersService: UsersService,
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

  async canUserStartSession(userId: string): Promise<boolean> {
    return this.usersService.canStartSession(userId);
  }

  async createSession(userId: string, questionId: string, part: 1 | 2 | 3) {
    // Increment daily session count
    await this.usersService.incrementDailySession(userId);

    const session = await this.prisma.practiceSession.create({
      data: {
        userId,
        questionId,
        part,
      },
      include: {
        question: true,
      },
    });

    return session;
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
      include: { question: true },
    });

    if (!session || session.userId !== userId) {
      throw new BadRequestException('Session not found');
    }

    // Upload audio to S3
    const audioKey = await this.s3Service.uploadAudio(audioBuffer, userId, sessionId);
    const audioUrl = await this.s3Service.getSignedUrl(audioKey);

    // Transcribe audio
    const transcription = await this.speechAnalysis.transcribeAudio(audioBuffer);
    
    // Calculate metrics
    const audioMetrics = this.speechAnalysis.calculateAudioMetrics(transcription);

    // Get AI assessment
    const assessment = await this.speechAnalysis.assessSpeech({
      part: session.part as 1 | 2 | 3,
      question: session.question.questionText,
      transcript: transcription.text,
      audioMetrics,
      cueCardPoints: session.question.cueCardPoints as string[] | undefined,
    });

    // Update session with results
    const updatedSession = await this.prisma.practiceSession.update({
      where: { id: sessionId },
      data: {
        audioUrl: audioKey,
        audioDurationSeconds: audioMetrics.durationSeconds,
        transcript: transcription.text,
        transcriptWithTimestamps: transcription.words as Prisma.InputJsonValue,
        
        overallBandScore: assessment.scores.overall,
        fluencyCoherenceScore: assessment.scores.fluency,
        lexicalResourceScore: assessment.scores.lexical,
        grammarAccuracyScore: assessment.scores.grammar,
        pronunciationScore: assessment.scores.pronunciation,
        
        wordsPerMinute: audioMetrics.wordsPerMinute,
        totalWords: audioMetrics.totalWords,
        fillerWordCount: audioMetrics.fillerWords.reduce((sum, f) => sum + f.count, 0),
        fillerWordsDetail: audioMetrics.fillerWords as Prisma.InputJsonValue,
        pauseCount: audioMetrics.pauseCount,
        longPauseCount: audioMetrics.longPauseCount,
        
        feedbackFluency: assessment.feedback.fluency,
        feedbackVocabulary: assessment.feedback.vocabulary,
        feedbackGrammar: assessment.feedback.grammar,
        feedbackPronunciation: assessment.feedback.pronunciation,
        feedbackOverall: assessment.feedback.overall,
        
        vocabularySuggestions: assessment.suggestions.vocabulary as Prisma.InputJsonValue,
        grammarCorrections: assessment.suggestions.grammar as Prisma.InputJsonValue,
        
        prepTimeUsedSeconds: prepTimeUsed,
        speakingTimeSeconds: speakingTimeSeconds,
        completedAt: new Date(),
      },
      include: {
        question: true,
      },
    });

    // Update user progress
    await this.updateUserProgress(userId);

    return {
      ...updatedSession,
      audioUrl, // Return signed URL for playback
    };
  }

  async getSessionWithDetails(sessionId: string) {
    const session = await this.prisma.practiceSession.findUnique({
      where: { id: sessionId },
      include: {
        question: true,
        user: {
          select: {
            targetBandScore: true,
          },
        },
      },
    });

    if (session?.audioUrl) {
      const signedUrl = await this.s3Service.getSignedUrl(session.audioUrl);
      return { ...session, audioUrl: signedUrl };
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
        include: {
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
    let progress = await this.prisma.userProgress.findUnique({
      where: { userId },
    });

    if (!progress) {
      progress = await this.prisma.userProgress.create({
        data: { userId },
      });
    }

    return progress;
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
    const progress = await this.getUserProgress(userId);
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { targetBandScore: true, dailySessionsUsed: true, subscriptionTier: true },
    });

    // Get score trend (last 10 sessions)
    const recentScores = await this.prisma.practiceSession.findMany({
      where: { userId, completedAt: { not: null } },
      orderBy: { completedAt: 'asc' },
      take: 10,
      select: {
        overallBandScore: true,
        completedAt: true,
        part: true,
      },
    });

    // Get topic distribution
    const topicDistribution = await this.prisma.practiceSession.groupBy({
      by: ['part'],
      where: { userId, completedAt: { not: null } },
      _count: true,
    });

    return {
      progress,
      targetScore: user?.targetBandScore,
      dailySessionsUsed: user?.dailySessionsUsed || 0,
      dailySessionsLimit: user?.subscriptionTier === 'premium' ? null : 3,
      scoreTrend: recentScores,
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
      include: {
        question: true,
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
    });

    return result;
  }
}
