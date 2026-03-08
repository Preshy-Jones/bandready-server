import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Logger,
  BadRequestException,
  Query,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { PrismaService } from '../../common/prisma/prisma.service';
import { EssayAssessmentService } from '../services/essay-assessment.service';
import { WeaknessProfileService } from '../services/weakness-profile.service';
import { ProgressService } from '../services/progress.service';
import { UsersService } from '../../users/users.service';
import { SubmitWritingMockDto } from '../dto/submit-essay.dto';

@Controller('writing/mock')
@UseGuards(JwtAuthGuard)
export class MockWritingController {
  private readonly logger = new Logger(MockWritingController.name);

  constructor(
    private prisma: PrismaService,
    private assessmentService: EssayAssessmentService,
    private weaknessService: WeaknessProfileService,
    private progressService: ProgressService,
    private usersService: UsersService,
  ) {}

  /**
   * Start a full writing mock test — returns Task 1 + Task 2 questions.
   * Checks that the user has enough writing balance (costs 2 credits).
   */
  @Post('start')
  async startMockTest(
    @CurrentUser() user: any,
    @Query('examType') examType?: string,
  ) {
    // Check writing balance (costs 2 credits)
    const canStart = await this.usersService.canStartSession(user.id, 'writing');
    if (!canStart) {
      throw new BadRequestException(
        'Insufficient writing balance. A mock test requires 2 writing credits.',
      );
    }

    // Verify user has at least 2 credits
    const userRecord = await this.prisma.user.findUnique({
      where: { id: user.id },
      select: {
        writingBalance: true,
        subscriptionTier: true,
        subscriptionExpiresAt: true,
        examType: true,
      },
    });

    const isPremium =
      userRecord?.subscriptionTier === 'premium' &&
      (!userRecord.subscriptionExpiresAt || userRecord.subscriptionExpiresAt > new Date());

    if (!isPremium && (userRecord?.writingBalance ?? 0) < 2) {
      throw new BadRequestException(
        'You need at least 2 writing credits for a mock test.',
      );
    }

    // Resolve exam type: query param takes precedence, fall back to user profile
    const resolvedExamType = examType
      ? examType.toUpperCase()
      : (userRecord?.examType || 'ACADEMIC');

    // Fetch random Task 1 (filtered by exam type) and Task 2 questions
    const [task1Count, task2Count] = await Promise.all([
      this.prisma.writingQuestion.count({ where: { taskType: 'TASK1', isActive: true, examType: resolvedExamType as any } }),
      this.prisma.writingQuestion.count({ where: { taskType: 'TASK2', isActive: true } }),
    ]);

    if (task1Count === 0 || task2Count === 0) {
      throw new BadRequestException('Not enough writing questions available.');
    }

    const task1Offset = Math.floor(Math.random() * task1Count);
    const task2Offset = Math.floor(Math.random() * task2Count);

    const [task1Question, task2Question] = await Promise.all([
      this.prisma.writingQuestion.findFirst({
        where: { taskType: 'TASK1', isActive: true, examType: resolvedExamType as any },
        skip: task1Offset,
      }),
      this.prisma.writingQuestion.findFirst({
        where: { taskType: 'TASK2', isActive: true },
        skip: task2Offset,
      }),
    ]);

    // Deduct 2 writing credits (inside a transaction for safety)
    if (!isPremium) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { writingBalance: { decrement: 2 } },
      });
    }

    return {
      task1Question,
      task2Question,
    };
  }

  /**
   * Submit a full writing mock test — both Task 1 and Task 2 essays.
   */
  @Post('submit')
  async submitMockTest(
    @CurrentUser() user: any,
    @Body() dto: SubmitWritingMockDto,
  ) {
    this.logger.log(`Submitting writing mock test for user ${user.id} (mode: ${dto.mode})`);

    // Validate questions exist
    const [task1Question, task2Question] = await Promise.all([
      this.prisma.writingQuestion.findUnique({ where: { id: dto.task1QuestionId } }),
      this.prisma.writingQuestion.findUnique({ where: { id: dto.task2QuestionId } }),
    ]);

    if (!task1Question || !task2Question) {
      throw new BadRequestException('Mock test questions not found');
    }

    // Create essay submissions
    const [task1Submission, task2Submission] = await Promise.all([
      this.prisma.essaySubmission.create({
        data: {
          userId: user.id,
          questionId: task1Question.id,
          essayText: dto.task1Essay,
          wordCount: dto.task1Essay.split(/\s+/).length,
          timeSpentSeconds: dto.task1TimeSpent,
          sessionType: 'EXAM_SIMULATION',
        },
      }),
      this.prisma.essaySubmission.create({
        data: {
          userId: user.id,
          questionId: task2Question.id,
          essayText: dto.task2Essay,
          wordCount: dto.task2Essay.split(/\s+/).length,
          timeSpentSeconds: dto.task2TimeSpent,
          sessionType: 'EXAM_SIMULATION',
        },
      }),
    ]);

    // Fetch user native language
    const userExtended = await this.prisma.user.findUnique({
      where: { id: user.id },
      select: { nativeLanguage: true },
    });

    // Assess both essays in parallel
    const [task1Feedback, task2Feedback] = await Promise.all([
      this.assessmentService.assessEssay(
        task1Submission.essayText,
        task1Question.prompt,
        task1Question.taskType,
        task1Question.subType || 'general',
        task1Submission.wordCount,
        task1Submission.timeSpentSeconds,
        task1Question.examType,
        userExtended?.nativeLanguage,
      ),
      this.assessmentService.assessEssay(
        task2Submission.essayText,
        task2Question.prompt,
        task2Question.taskType,
        task2Question.subType || 'general',
        task2Submission.wordCount,
        task2Submission.timeSpentSeconds,
        task2Question.examType,
        userExtended?.nativeLanguage,
      ),
    ]);

    // Save feedback
    await Promise.all([
      this.assessmentService.saveFeedback(task1Submission.id, task1Feedback),
      this.assessmentService.saveFeedback(task2Submission.id, task2Feedback),
    ]);

    // Update weakness profile
    const allErrors = [
      ...task1Feedback.detectedErrors,
      ...task2Feedback.detectedErrors,
    ];
    await this.weaknessService.updateFromEssayFeedback(user.id, allErrors);

    // Update progress
    await Promise.all([
      this.progressService.updateProgressAfterEssay(user.id, task1Submission.id),
      this.progressService.updateProgressAfterEssay(user.id, task2Submission.id),
    ]);

    // Get weakness profile
    const weaknesses = await this.weaknessService.getWeaknessProfile(user.id);

    // Calculate combined score (Task 1 is 1/3, Task 2 is 2/3 of the writing score)
    const overallScore =
      (task1Feedback.scores.overall * 1 + task2Feedback.scores.overall * 2) / 3;

    return {
      task1: {
        submissionId: task1Submission.id,
        scores: task1Feedback.scores,
        feedback: task1Feedback.feedback,
      },
      task2: {
        submissionId: task2Submission.id,
        scores: task2Feedback.scores,
        feedback: task2Feedback.feedback,
      },
      weaknesses,
      overallScore: Math.round(overallScore * 2) / 2, // Round to nearest 0.5
    };
  }

  /**
   * Get mock test history
   */
  @Get('history')
  async getMockHistory(@CurrentUser() user: any) {
    const submissions = await this.prisma.essaySubmission.findMany({
      where: {
        userId: user.id,
        sessionType: 'EXAM_SIMULATION',
      },
      include: {
        question: true,
        feedback: true,
      },
      orderBy: { submittedAt: 'desc' },
    });

    return { tests: submissions };
  }
}
