import { Test, TestingModule } from '@nestjs/testing';
import { PracticeService } from './practice.service';
import { PrismaService } from '../common/prisma/prisma.service';
import { SpeechAnalysisService } from './services/speech-analysis.service';
import { S3Service } from './services/s3.service';
import { UsersService } from '../users/users.service';
import { getQueueToken } from '@nestjs/bullmq';
import { BadRequestException } from '@nestjs/common';

describe('PracticeService', () => {
  let practiceService: PracticeService;
  let prismaService: jest.Mocked<PrismaService>;
  let usersService: jest.Mocked<UsersService>;
  let audioQueue: any;

  beforeEach(async () => {
    const mockPrismaService = {
      $transaction: jest.fn().mockImplementation(async (cb) => {
        return cb(mockPrismaService);
      }),
      $queryRaw: jest.fn(),
      practiceSession: {
        findFirst: jest.fn(),
        create: jest.fn(),
        findUnique: jest.fn(),
      },
      user: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
    };

    const mockSpeechAnalysisService = {
      generateModelAnswer: jest.fn(),
    };

    const mockS3Service = {
      getSignedUrl: jest.fn(),
    };

    const mockUsersService = {
      canStartSession: jest.fn(),
    };

    const mockQueue = {
      add: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PracticeService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: SpeechAnalysisService, useValue: mockSpeechAnalysisService },
        { provide: S3Service, useValue: mockS3Service },
        { provide: UsersService, useValue: mockUsersService },
        { provide: getQueueToken('audio-processing'), useValue: mockQueue },
      ],
    }).compile();

    practiceService = module.get<PracticeService>(PracticeService);
    prismaService = module.get(PrismaService) as any;
    usersService = module.get(UsersService) as any;
    audioQueue = module.get(getQueueToken('audio-processing'));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createSession', () => {
    it('returns an existing recent open session (duplicate idempotency)', async () => {
      const mockSession = { id: 'session_1', userId: 'user_1', part: 1 };
      
      (prismaService.practiceSession.findFirst as jest.Mock).mockResolvedValue(mockSession);

      const res = await practiceService.createSession('user_1', 'question_1', 1);

      expect(res).toEqual(mockSession);
      expect(prismaService.user.update).not.toHaveBeenCalled();
      expect(prismaService.practiceSession.create).not.toHaveBeenCalled();
    });

    it('decrements balance for standard user and creates session', async () => {
      (prismaService.practiceSession.findFirst as jest.Mock).mockResolvedValue(null);
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user_1',
        creditBalance: 25,
        subscriptionTier: 'free'
      });
      const createdSession = { id: 'new_session_1' };
      (prismaService.practiceSession.create as jest.Mock).mockResolvedValue(createdSession);

      const res = await practiceService.createSession('user_1', 'question_1', 1);

      expect(res).toEqual(createdSession);
      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: 'user_1' },
        data: { creditBalance: { decrement: 5 } },
      });
      expect(prismaService.practiceSession.create).toHaveBeenCalledWith(expect.objectContaining({
        data: { userId: 'user_1', questionId: 'question_1', part: 1 }
      }));
    });

    it('does not decrement balance if user is premium with valid expiry', async () => {
      (prismaService.practiceSession.findFirst as jest.Mock).mockResolvedValue(null);
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 10);

      (prismaService.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user_1',
        creditBalance: 0,
        subscriptionTier: 'premium',
        subscriptionExpiresAt: futureDate
      });

      const createdSession = { id: 'new_session_2' };
      (prismaService.practiceSession.create as jest.Mock).mockResolvedValue(createdSession);

      await practiceService.createSession('user_1', 'question_1', 1);

      expect(prismaService.user.update).not.toHaveBeenCalled(); // No decrement because premium
      expect(prismaService.practiceSession.create).toHaveBeenCalled();
    });
  });

  describe('processSession', () => {
    it('throws BadRequestException if session is not found or user mismatch', async () => {
      (prismaService.practiceSession.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        practiceService.processSession('session_1', 'user_1', Buffer.from('audio'))
      ).rejects.toThrow(BadRequestException);
    });

    it('adds job to audio queue', async () => {
      (prismaService.practiceSession.findUnique as jest.Mock).mockResolvedValue({
        id: 'session_1',
        userId: 'user_1',
        part: 1,
        question: { questionText: 'Describe a time...' }
      });

      const audioBuffer = Buffer.from('fake_audio');
      
      const res = await practiceService.processSession('session_1', 'user_1', audioBuffer, 60, 120);

      expect(res.success).toBe(true);
      expect(audioQueue.add).toHaveBeenCalledWith(
        'process-audio',
        {
          sessionId: 'session_1',
          userId: 'user_1',
          audioBufferBase64: audioBuffer.toString('base64'),
          prepTimeUsedSeconds: 60,
          speakingTimeSeconds: 120
        },
        expect.objectContaining({ jobId: 'audio-session_1' })
      );
    });
  });
});
