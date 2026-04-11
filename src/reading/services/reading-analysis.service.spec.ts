import { Test, TestingModule } from '@nestjs/testing';
import { ReadingAnalysisService } from './reading-analysis.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { READING_ANALYSIS_PROVIDER } from '../interfaces/reading-analysis-provider.interface';
import { ForbiddenException, NotFoundException } from '@nestjs/common';

describe('ReadingAnalysisService', () => {
  let service: ReadingAnalysisService;
  let prisma: any;
  let provider: any;

  beforeEach(async () => {
    prisma = {
      readingSession: {
        findUnique: jest.fn(),
      },
      readingResult: {
        findFirst: jest.fn(),
        update: jest.fn(),
      },
    };

    provider = {
      analyze: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReadingAnalysisService,
        { provide: PrismaService, useValue: prisma },
        { provide: READING_ANALYSIS_PROVIDER, useValue: provider },
      ],
    }).compile();

    service = module.get<ReadingAnalysisService>(ReadingAnalysisService);
  });

  it('throws NotFoundException when session not found', async () => {
    prisma.readingSession.findUnique.mockResolvedValue(null);
    await expect(service.analyzeSession('bad-id', 'user-1')).rejects.toThrow(NotFoundException);
  });

  it('throws ForbiddenException for wrong user', async () => {
    prisma.readingSession.findUnique.mockResolvedValue({
      id: 'session-1',
      userId: 'user-2',
      answers: [],
    });
    await expect(service.analyzeSession('session-1', 'user-1')).rejects.toThrow(ForbiddenException);
  });

  it('throws NotFoundException when result not found', async () => {
    prisma.readingSession.findUnique.mockResolvedValue({
      id: 'session-1',
      userId: 'user-1',
      answers: [],
    });
    prisma.readingResult.findFirst.mockResolvedValue(null);
    await expect(service.analyzeSession('session-1', 'user-1')).rejects.toThrow(NotFoundException);
  });

  it('returns cached analysis if already exists', async () => {
    const cachedAnalysis = {
      summary: 'Good performance',
      strengths: ['Scanning'],
      weaknesses: ['Time management'],
    };

    prisma.readingSession.findUnique.mockResolvedValue({
      id: 'session-1',
      userId: 'user-1',
      answers: [],
    });
    prisma.readingResult.findFirst.mockResolvedValue({
      id: 'result-1',
      sessionId: 'session-1',
      aiAnalysis: cachedAnalysis,
    });

    const result = await service.analyzeSession('session-1', 'user-1');
    expect(result).toEqual(cachedAnalysis);
    expect(provider.analyze).not.toHaveBeenCalled();
  });

  it('calls provider and stores analysis when not cached', async () => {
    const mockAnalysis = {
      summary: 'Needs improvement',
      strengths: ['Detail recognition'],
      weaknesses: ['Skimming'],
      questionTypeAnalysis: [],
      skillScores: { skimming: 50, scanning: 60, inference: 55, detailRecognition: 70, vocabularyInContext: 45 },
      timeManagementFeedback: 'Good pace',
      recommendedPractice: ['Practice TFNG'],
    };

    prisma.readingSession.findUnique.mockResolvedValue({
      id: 'session-1',
      userId: 'user-1',
      testType: 'ACADEMIC',
      timeSpentSeconds: 1800,
      answers: [
        {
          isCorrect: false,
          question: {
            questionNumber: 1,
            questionType: 'TRUE_FALSE_NOT_GIVEN',
            questionData: { prompt: 'The sky is blue.' },
            correctAnswer: 'TRUE',
            skillTested: 'Detail Recognition',
            explanation: 'Stated in paragraph A.',
          },
          userAnswer: 'FALSE',
        },
      ],
    });
    prisma.readingResult.findFirst.mockResolvedValue({
      id: 'result-1',
      sessionId: 'session-1',
      rawScore: 8,
      totalQuestions: 13,
      bandScore: 5.5,
      aiAnalysis: null,
      questionTypeBreakdown: {},
    });
    prisma.readingResult.update.mockResolvedValue({});
    provider.analyze.mockResolvedValue(mockAnalysis);

    const result = await service.analyzeSession('session-1', 'user-1');

    expect(result).toEqual(mockAnalysis);
    expect(provider.analyze).toHaveBeenCalledTimes(1);
    expect(prisma.readingResult.update).toHaveBeenCalledWith({
      where: { id: 'result-1' },
      data: { aiAnalysis: mockAnalysis },
    });
  });
});
