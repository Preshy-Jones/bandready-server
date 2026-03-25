import { Test, TestingModule } from '@nestjs/testing';
import { ReadingService } from './reading.service';
import { PrismaService } from '../common/prisma/prisma.service';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

describe('ReadingService', () => {
  let service: ReadingService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      $transaction: jest.fn().mockImplementation(async (cb) => cb(prisma)),
      $queryRaw: jest.fn(),
      readingPassage: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
      },
      readingSession: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        count: jest.fn(),
      },
      readingSessionPassage: {
        findMany: jest.fn(),
      },
      readingAnswer: {
        upsert: jest.fn(),
        findMany: jest.fn(),
      },
      readingResult: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      readingProgress: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        upsert: jest.fn(),
        count: jest.fn(),
      },
      readingQuestion: {
        findUnique: jest.fn(),
      },
      readingAchievement: {
        findMany: jest.fn(),
        createMany: jest.fn(),
      },
      user: {
        findUnique: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReadingService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<ReadingService>(ReadingService);
  });

  describe('getStatus', () => {
    it('returns ready status', () => {
      const result = service.getStatus();
      expect(result.status).toBe('ready');
      expect(result.module).toBe('reading');
    });
  });

  describe('convertRawScoreToBand (via completeSession)', () => {
    // We test band conversion by running completeSession with known scores
    // and checking the band score in the result.

    function buildMockSession(rawCorrect: number, totalQuestions: number, testType: string) {
      const questions = Array.from({ length: totalQuestions }, (_, i) => ({
        id: `q${i}`,
        questionType: 'TRUE_FALSE_NOT_GIVEN',
        skillTested: 'General',
        questionNumber: i + 1,
        questionData: { prompt: 'test' },
        correctAnswer: 'TRUE',
      }));

      const answers = questions.map((q, i) => ({
        id: `a${i}`,
        questionId: q.id,
        isCorrect: i < rawCorrect,
        timeSpentSeconds: 60,
        userAnswer: i < rawCorrect ? 'TRUE' : 'FALSE',
      }));

      return {
        id: 'session-1',
        userId: 'user-1',
        testType,
        mode: 'SINGLE_PASSAGE',
        isTimed: false,
        startedAt: new Date(Date.now() - 1800000),
        completedAt: null,
        timeSpentSeconds: null,
        passages: [{
          passageOrder: 1,
          passage: { id: 'p1', title: 'Test', questions },
          timeSpentSeconds: null,
        }],
        answers,
      };
    }

    it('Academic: 30/40 → Band 7.0', async () => {
      const session = buildMockSession(30, 40, 'ACADEMIC');
      prisma.readingSession.findUnique.mockResolvedValue(session);
      prisma.readingResult.findFirst.mockResolvedValue(null);
      prisma.readingSession.update.mockResolvedValue({ ...session, completedAt: new Date(), isTimed: false });
      prisma.readingResult.create.mockImplementation(({ data }) => Promise.resolve(data));
      prisma.readingProgress.findUnique.mockResolvedValue(null);
      prisma.readingProgress.upsert.mockResolvedValue({});
      prisma.readingAchievement.findMany.mockResolvedValue([]);
      prisma.readingAchievement.createMany.mockResolvedValue({});
      prisma.readingSession.count.mockResolvedValue(1);
      prisma.readingProgress.count.mockResolvedValue(1);

      const result = await service.completeSession('session-1', 'user-1') as any;
      expect(Number(result.result.bandScore)).toBe(7.0);
    });

    it('Academic: 35/40 → Band 8.0', async () => {
      const session = buildMockSession(35, 40, 'ACADEMIC');
      prisma.readingSession.findUnique.mockResolvedValue(session);
      prisma.readingResult.findFirst.mockResolvedValue(null);
      prisma.readingSession.update.mockResolvedValue({ ...session, completedAt: new Date(), isTimed: false });
      prisma.readingResult.create.mockImplementation(({ data }) => Promise.resolve(data));
      prisma.readingProgress.findUnique.mockResolvedValue(null);
      prisma.readingProgress.upsert.mockResolvedValue({});
      prisma.readingAchievement.findMany.mockResolvedValue([]);
      prisma.readingAchievement.createMany.mockResolvedValue({});
      prisma.readingSession.count.mockResolvedValue(1);
      prisma.readingProgress.count.mockResolvedValue(1);

      const result = await service.completeSession('session-1', 'user-1') as any;
      expect(Number(result.result.bandScore)).toBe(8.0);
    });

    it('GT: 30/40 → Band 6.0', async () => {
      const session = buildMockSession(30, 40, 'GENERAL_TRAINING');
      prisma.readingSession.findUnique.mockResolvedValue(session);
      prisma.readingResult.findFirst.mockResolvedValue(null);
      prisma.readingSession.update.mockResolvedValue({ ...session, completedAt: new Date(), isTimed: false });
      prisma.readingResult.create.mockImplementation(({ data }) => Promise.resolve(data));
      prisma.readingProgress.findUnique.mockResolvedValue(null);
      prisma.readingProgress.upsert.mockResolvedValue({});
      prisma.readingAchievement.findMany.mockResolvedValue([]);
      prisma.readingAchievement.createMany.mockResolvedValue({});
      prisma.readingSession.count.mockResolvedValue(1);
      prisma.readingProgress.count.mockResolvedValue(1);

      const result = await service.completeSession('session-1', 'user-1') as any;
      expect(Number(result.result.bandScore)).toBe(6.0);
    });

    it('Academic: scales 10/13 to /40 correctly', async () => {
      // 10/13 → scaled = round((10/13) * 40) = round(30.77) = 31 → Band 7.5 (≥30 = 7.0, ≥33 = 7.5... 31 → 7.0)
      const session = buildMockSession(10, 13, 'ACADEMIC');
      prisma.readingSession.findUnique.mockResolvedValue(session);
      prisma.readingResult.findFirst.mockResolvedValue(null);
      prisma.readingSession.update.mockResolvedValue({ ...session, completedAt: new Date(), isTimed: false });
      prisma.readingResult.create.mockImplementation(({ data }) => Promise.resolve(data));
      prisma.readingProgress.findUnique.mockResolvedValue(null);
      prisma.readingProgress.upsert.mockResolvedValue({});
      prisma.readingAchievement.findMany.mockResolvedValue([]);
      prisma.readingAchievement.createMany.mockResolvedValue({});
      prisma.readingSession.count.mockResolvedValue(1);
      prisma.readingProgress.count.mockResolvedValue(1);

      const result = await service.completeSession('session-1', 'user-1') as any;
      // 10/13 → scaled 31 → Academic band 7.0 (threshold is ≥30)
      expect(Number(result.result.bandScore)).toBe(7.0);
    });
  });

  describe('completeSession', () => {
    it('throws NotFoundException for missing session', async () => {
      prisma.readingSession.findUnique.mockResolvedValue(null);
      await expect(service.completeSession('bad-id', 'user-1')).rejects.toThrow(NotFoundException);
    });

    it('throws ForbiddenException for wrong user', async () => {
      prisma.readingSession.findUnique.mockResolvedValue({
        id: 'session-1',
        userId: 'user-2',
        completedAt: null,
      });
      await expect(service.completeSession('session-1', 'user-1')).rejects.toThrow(ForbiddenException);
    });

    it('returns already_completed for previously completed session', async () => {
      prisma.readingSession.findUnique.mockResolvedValue({
        id: 'session-1',
        userId: 'user-1',
        completedAt: new Date(),
      });
      prisma.readingResult.findFirst.mockResolvedValue({ id: 'result-1', bandScore: 7.0 });

      const result = await service.completeSession('session-1', 'user-1') as any;
      expect(result.status).toBe('already_completed');
    });
  });

  describe('getRecommendedPassage', () => {
    it('recommends EASY for low-accuracy users', async () => {
      prisma.user.findUnique.mockResolvedValue({ examType: 'ACADEMIC' });
      prisma.readingResult.findMany.mockResolvedValue([
        { rawScore: 5, totalQuestions: 13 },
        { rawScore: 4, totalQuestions: 13 },
      ]);
      prisma.readingSessionPassage.findMany.mockResolvedValue([]);
      prisma.readingPassage.findFirst.mockResolvedValue({
        id: 'p1',
        title: 'Easy Passage',
        difficultyLevel: 'EASY',
        paragraphs: [],
        questionSets: [],
      });

      const result = await service.getRecommendedPassage('user-1');
      expect(result.difficulty).toBe('EASY');
    });

    it('recommends HARD for high-accuracy users', async () => {
      prisma.user.findUnique.mockResolvedValue({ examType: 'ACADEMIC' });
      prisma.readingResult.findMany.mockResolvedValue([
        { rawScore: 12, totalQuestions: 13 },
        { rawScore: 11, totalQuestions: 13 },
      ]);
      prisma.readingSessionPassage.findMany.mockResolvedValue([]);
      prisma.readingPassage.findFirst.mockResolvedValue({
        id: 'p1',
        title: 'Hard Passage',
        difficultyLevel: 'HARD',
        paragraphs: [],
        questionSets: [],
      });

      const result = await service.getRecommendedPassage('user-1');
      expect(result.difficulty).toBe('HARD');
    });

    it('recommends MEDIUM for moderate-accuracy users', async () => {
      prisma.user.findUnique.mockResolvedValue({ examType: 'GENERAL' });
      prisma.readingResult.findMany.mockResolvedValue([
        { rawScore: 9, totalQuestions: 13 },
        { rawScore: 8, totalQuestions: 13 },
      ]);
      prisma.readingSessionPassage.findMany.mockResolvedValue([]);
      prisma.readingPassage.findFirst.mockResolvedValue({
        id: 'p1',
        title: 'Medium Passage',
        difficultyLevel: 'MEDIUM',
        paragraphs: [],
        questionSets: [],
      });

      const result = await service.getRecommendedPassage('user-1');
      expect(result.difficulty).toBe('MEDIUM');
    });

    it('defaults to EASY for new users with no results', async () => {
      prisma.user.findUnique.mockResolvedValue({ examType: 'ACADEMIC' });
      prisma.readingResult.findMany.mockResolvedValue([]);
      prisma.readingSessionPassage.findMany.mockResolvedValue([]);
      prisma.readingPassage.findFirst.mockResolvedValue(null);

      const result = await service.getRecommendedPassage('user-1');
      expect(result.difficulty).toBe('EASY');
    });
  });

  describe('getSession', () => {
    it('throws NotFoundException for missing session', async () => {
      prisma.readingSession.findUnique.mockResolvedValue(null);
      await expect(service.getSession('bad-id', 'user-1')).rejects.toThrow(NotFoundException);
    });

    it('throws ForbiddenException for wrong user', async () => {
      prisma.readingSession.findUnique.mockResolvedValue({
        id: 'session-1',
        userId: 'user-2',
      });
      await expect(service.getSession('session-1', 'user-1')).rejects.toThrow(ForbiddenException);
    });
  });
});
