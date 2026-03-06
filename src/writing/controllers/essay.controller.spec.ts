import { Test, TestingModule } from '@nestjs/testing';
import { EssayController } from './essay.controller';
import { PrismaService } from '../../common/prisma/prisma.service';
import { EssayAssessmentService } from '../services/essay-assessment.service';
import { WeaknessProfileService } from '../services/weakness-profile.service';
import { ProgressService } from '../services/progress.service';
import { UsersService } from '../../users/users.service';
import { HttpException, BadRequestException, HttpStatus } from '@nestjs/common';

describe('EssayController', () => {
  let controller: EssayController;
  let usersService: jest.Mocked<UsersService>;
  let prismaService: jest.Mocked<PrismaService>;
  let assessmentService: jest.Mocked<EssayAssessmentService>;

  beforeEach(async () => {
    const mockUsersService = {
      canStartSession: jest.fn(),
      incrementDailySession: jest.fn(),
    };

    const mockPrismaService = {
      writingQuestion: {
        findUnique: jest.fn(),
      },
      essaySubmission: {
        create: jest.fn(),
      },
      user: {
        findUnique: jest.fn(),
      }
    };

    const mockAssessmentService = {
      assessEssay: jest.fn(),
      saveFeedback: jest.fn(),
    };

    const mockWeaknessService = {
      updateFromEssayFeedback: jest.fn(),
    };

    const mockProgressService = {
      updateProgressAfterEssay: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [EssayController],
      providers: [
        { provide: UsersService, useValue: mockUsersService },
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: EssayAssessmentService, useValue: mockAssessmentService },
        { provide: WeaknessProfileService, useValue: mockWeaknessService },
        { provide: ProgressService, useValue: mockProgressService },
      ],
    }).compile();

    controller = module.get<EssayController>(EssayController);
    usersService = module.get(UsersService) as any;
    prismaService = module.get(PrismaService) as any;
    assessmentService = module.get(EssayAssessmentService) as any;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('submitEssay', () => {
    const mockUser = { id: 'user_1' };
    const mockDto = { questionId: 'q_1', essayText: 'This is my essay.', timeSpentSeconds: 300 };

    it('throws Payment Required if user cannot start a writing session', async () => {
      usersService.canStartSession.mockResolvedValue(false);

      await expect(controller.submitEssay(mockUser, mockDto)).rejects.toThrow(
        new HttpException('Insufficient writing balance.', HttpStatus.PAYMENT_REQUIRED),
      );
    });

    it('throws BadRequestException if question is not found', async () => {
      usersService.canStartSession.mockResolvedValue(true);
      (prismaService.writingQuestion.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(controller.submitEssay(mockUser, mockDto)).rejects.toThrow(BadRequestException);
    });

    it('creates essay submission and kicks off async assessment', async () => {
      usersService.canStartSession.mockResolvedValue(true);
      (prismaService.writingQuestion.findUnique as jest.Mock).mockResolvedValue({ id: 'q_1', prompt: 'test prompt', taskType: 'TASK1', examType: 'ACADEMIC' });
      (prismaService.essaySubmission.create as jest.Mock).mockResolvedValue({ id: 'sub_1', wordCount: 4 });
      
      const result = await controller.submitEssay(mockUser, mockDto);
      
      expect(result).toEqual({ submissionId: 'sub_1' });
      expect(prismaService.essaySubmission.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          userId: 'user_1',
          questionId: 'q_1',
          essayText: 'This is my essay.'
        })
      }));

      // Wait a tick to allow the async `assessEssayAsync` to start
      await new Promise((resolve) => setImmediate(resolve));
      
      expect(assessmentService.assessEssay).toHaveBeenCalled();
    });
  });
});
