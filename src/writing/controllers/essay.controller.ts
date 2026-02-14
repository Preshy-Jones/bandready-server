import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { PrismaService } from '../../common/prisma/prisma.service';
import { EssayAssessmentService } from '../services/essay-assessment.service';
import { WeaknessProfileService } from '../services/weakness-profile.service';
import { ProgressService } from '../services/progress.service';
import { SubmitEssayDto, GetQuestionsDto } from '../dto/submit-essay.dto';
import { TaskType } from '@prisma/client';

@Controller('writing')
@UseGuards(JwtAuthGuard)
export class EssayController {
  private readonly logger = new Logger(EssayController.name);

  constructor(
    private prisma: PrismaService,
    private assessmentService: EssayAssessmentService,
    private weaknessService: WeaknessProfileService,
    private progressService: ProgressService,
  ) {}

  /**
   * Get random question by task type
   */
  @Get('questions/:taskType')
  async getQuestion(
    @Param('taskType') taskType: string,
    @Query('subType') subType?: string,
  ) {
    const where: any = {
      taskType: taskType.toUpperCase() as TaskType,
      isActive: true,
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
   * Submit essay for assessment
   */
  @Post('essay/submit')
  async submitEssay(
    @CurrentUser() user: any,
    @Body() dto: SubmitEssayDto,
  ) {
    this.logger.log(`Submitting essay for user ${user.id}`);

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
   * Get essay feedback (generates if not exists)
   */
  @Get('essay/:submissionId/feedback')
  async getFeedback(@Param('submissionId') submissionId: string) {
    const feedback = await this.assessmentService.getFeedback(submissionId);

    // Also get scores from submission
    const submission = await this.prisma.essaySubmission.findUnique({
      where: { id: submissionId },
    });

    if (submission) {
      feedback.scores = {
        taskResponse: submission.taskResponseScore
          ? Number(submission.taskResponseScore)
          : undefined,
        coherenceCohesion: Number(submission.coherenceCohesionScore || 0),
        lexicalResource: Number(submission.lexicalResourceScore || 0),
        grammaticalRangeAccuracy: Number(submission.grammarAccuracyScore || 0),
        overall: Number(submission.overallBandScore || 0),
      };
    }

    return feedback;
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
      userEssay: {
        text: submission.essayText,
        wordCount: submission.wordCount,
        bandScore: submission.overallBandScore,
      },
      modelEssay: submission.question.modelEssays[0] || null,
    };
  }

  /**
   * Get user's essay history
   */
  @Get('essays/:userId')
  async getEssayHistory(
    @Param('userId') userId: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Query('taskType') taskType?: string,
  ) {
    const where: any = { userId };

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
      );

      await this.assessmentService.saveFeedback(submissionId, feedback);

      // Update weakness profile
      await this.weaknessService.updateFromEssayFeedback(
        userId,
        feedback.detectedErrors,
      );

      // Update progress
      await this.progressService.updateProgressAfterEssay(userId, submissionId);

      this.logger.log(`Completed assessment for essay ${submissionId}`);
    } catch (error) {
      this.logger.error(`Error assessing essay ${submissionId}:`, error);
    }
  }
}
