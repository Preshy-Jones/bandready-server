import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  Res,
  UseGuards,
  Logger,
  BadRequestException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { PrismaService } from '../../common/prisma/prisma.service';
import { EssayAssessmentService, generateModelAnswer } from '../services/essay-assessment.service';
import { WeaknessProfileService } from '../services/weakness-profile.service';
import { ProgressService } from '../services/progress.service';
import { UsersService } from '../../users/users.service';
import { SubmitEssayDto, GetQuestionsDto } from '../dto/submit-essay.dto';
import { TaskType, Prisma } from '@prisma/client';

@Controller('writing')
@UseGuards(JwtAuthGuard)
export class EssayController {
  private readonly logger = new Logger(EssayController.name);

  constructor(
    private prisma: PrismaService,
    private assessmentService: EssayAssessmentService,
    private weaknessService: WeaknessProfileService,
    private progressService: ProgressService,
    private usersService: UsersService,
  ) {}

  /**
   * Get random question by task type
   */
  @Get('questions/:taskType')
  async getQuestion(
    @CurrentUser() user: any,
    @Param('taskType') taskType: string,
    @Query('subType') subType?: string,
    @Query('examType') queryExamType?: string,
  ) {
    const fullUser = await this.prisma.user.findUnique({
      where: { id: user.id },
      select: { examType: true },
    });

    const where: any = {
      taskType: taskType.toUpperCase() as TaskType,
      isActive: true,
      examType: queryExamType ? queryExamType.toUpperCase() : (fullUser?.examType || 'ACADEMIC'),
    };

    if (subType) {
      where.subType = subType;
    }

    // Get all matching questions and select one randomly
    const questions = await this.prisma.writingQuestion.findMany({
      where,
    });

    if (questions.length === 0) {
      throw new BadRequestException('No questions found for the specified criteria');
    }

    const randomIndex = Math.floor(Math.random() * questions.length);
    return questions[randomIndex];
  }

  /**
   * Get all questions by task type
   */
  @Get('questions/all/:taskType')
  async getAllQuestions(
    @CurrentUser() user: any,
    @Param('taskType') taskType: string,
    @Query('examType') queryExamType?: string,
  ) {
    const fullUser = await this.prisma.user.findUnique({
      where: { id: user.id },
      select: { examType: true },
    });

    const where: any = {
      taskType: taskType.toUpperCase() as TaskType,
      isActive: true,
      examType: queryExamType ? queryExamType.toUpperCase() : (fullUser?.examType || 'ACADEMIC'),
    };

    const questions = await this.prisma.writingQuestion.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return questions;
  }

  /**
   * Get specific question by ID
   */
  @Get('questions/by-id/:questionId')
  async getQuestionById(@Param('questionId') questionId: string) {
    const question = await this.prisma.writingQuestion.findUnique({
      where: { id: questionId },
    });

    if (!question) {
      throw new BadRequestException('Question not found');
    }

    return question;
  }

  /**
   * Submit essay for assessment
   */
  @Post('essay/submit')
  async submitEssay(
    @CurrentUser() user: any,
    @Body() dto: SubmitEssayDto,
  ) {
    this.logger.log(`Submitting essay for user ${user.id}`);

    // Check balance / Premium first
    const canStart = await this.usersService.canStartSession(user.id, 'writing');
    if (!canStart) {
      throw new HttpException(
        'Insufficient writing balance.',
        HttpStatus.PAYMENT_REQUIRED,
      );
    }

    // Get question
    const question = await this.prisma.writingQuestion.findUnique({
      where: { id: dto.questionId },
    });

    if (!question) {
      throw new BadRequestException('Question not found');
    }

    // Create essay submission
    const submission = await this.prisma.essaySubmission.create({
      data: {
        userId: user.id,
        questionId: dto.questionId,
        essayText: dto.essayText,
        wordCount: dto.essayText.split(/\s+/).length,
        timeSpentSeconds: dto.timeSpentSeconds,
        sessionType: dto.sessionType || 'PRACTICE',
      },
    });

    // Assess essay in background (async)
    this.assessEssayAsync(
      submission.id,
      question,
      dto.essayText,
      submission.wordCount,
      dto.timeSpentSeconds,
      user.id,
    );

    return { submissionId: submission.id };
  }

  /**
   * Get essay feedback (returns 202 if assessment is still pending)
   */
  @Get('essay/:submissionId/feedback')
  async getFeedback(
    @Param('submissionId') submissionId: string,
    @Res() res: Response,
  ) {
    const feedback = await this.assessmentService.getFeedback(submissionId);

    if (!feedback) {
      // Assessment is still in progress
      return res.status(HttpStatus.ACCEPTED).json({ status: 'pending' });
    }

    return res.json(feedback);
  }

  /**
   * Get essay with model essay for comparison
   */
  @Get('essay/:submissionId/compare')
  async compareWithModelEssay(@Param('submissionId') submissionId: string) {
    const submission = await this.prisma.essaySubmission.findUnique({
      where: { id: submissionId },
      include: {
        question: {
          include: {
            modelEssays: {
              take: 1,
              orderBy: { bandScore: 'desc' },
            },
          },
        },
      },
    });

    if (!submission) {
      throw new BadRequestException('Submission not found');
    }

    return {
      question: {
        prompt: submission.question.prompt,
        taskType: submission.question.taskType,
      },
      userEssay: {
        text: submission.essayText,
        wordCount: submission.wordCount,
        bandScore: submission.overallBandScore,
      },
      modelEssay: submission.question.modelEssays[0] || null,
    };
  }

  /**
   * Generate a Band 8.5 model answer for this submission's question on demand
   */
  @Get('essay/:submissionId/model-answer')
  async getModelAnswer(@Param('submissionId') submissionId: string) {
    const submission = await this.prisma.essaySubmission.findUnique({
      where: { id: submissionId },
      include: {
        question: {
          select: { prompt: true, taskType: true, subType: true },
        },
      },
    });

    if (!submission) {
      throw new BadRequestException('Submission not found');
    }

    return generateModelAnswer(
      submission.question.prompt,
      submission.question.taskType,
      submission.question.subType,
    );
  }

  /**
   * Get user's essay history
   */
  @Get('essays')
  async getEssayHistory(
    @CurrentUser() user: any,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Query('taskType') taskType?: string,
  ) {
    const where: any = { userId: user.id };

    if (taskType) {
      where.question = {
        taskType: taskType.toUpperCase() as TaskType,
      };
    }

    const [essays, total] = await Promise.all([
      this.prisma.essaySubmission.findMany({
        where,
        include: {
          question: {
            select: {
              taskType: true,
              subType: true,
              prompt: true,
            },
          },
        },
        orderBy: { submittedAt: 'desc' },
        take: limit ? parseInt(limit, 10) : 20,
        skip: offset ? parseInt(offset, 10) : 0,
      }),
      this.prisma.essaySubmission.count({ where }),
    ]);

    return { essays, total };
  }

  /**
   * Assess essay asynchronously
   */
  private async assessEssayAsync(
    submissionId: string,
    question: any,
    essayText: string,
    wordCount: number,
    timeSpent: number,
    userId: string,
  ) {
    try {
      const feedback = await this.assessmentService.assessEssay(
        essayText,
        question.prompt,
        question.taskType,
        question.subType || 'general',
        wordCount,
        timeSpent,
        question.examType,
      );

      await this.assessmentService.saveFeedback(submissionId, feedback);

      // Update weakness profile
      await this.weaknessService.updateFromEssayFeedback(
        userId,
        feedback.detectedErrors,
      );

      // Update progress
      await this.progressService.updateProgressAfterEssay(userId, submissionId);

      // Deduct session balance
      await this.usersService.incrementDailySession(userId, 'writing');

      this.logger.log(`Completed assessment for essay ${submissionId}`);
    } catch (error) {
      this.logger.error(`Error assessing essay ${submissionId}:`, error);
    }
  }
}
