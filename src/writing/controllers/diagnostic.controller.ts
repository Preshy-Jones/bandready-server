import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Logger,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { PrismaService } from '../../common/prisma/prisma.service';
import { EssayAssessmentService } from '../services/essay-assessment.service';
import { WeaknessProfileService } from '../services/weakness-profile.service';
import { ProgressService } from '../services/progress.service';
import { SubmitDiagnosticDto } from '../dto/submit-essay.dto';

@Controller('writing/diagnostic')
@UseGuards(JwtAuthGuard)
export class DiagnosticController {
  private readonly logger = new Logger(DiagnosticController.name);

  constructor(
    private prisma: PrismaService,
    private assessmentService: EssayAssessmentService,
    private weaknessService: WeaknessProfileService,
    private progressService: ProgressService,
  ) {}

  /**
   * Start diagnostic test - returns a single Task 2 question
   */
  @Post('start')
  async startDiagnostic() {
    const task2Count = await this.prisma.writingQuestion.count({
      where: { taskType: 'TASK2', isActive: true },
    });

    const task2Offset = task2Count > 0 ? Math.floor(Math.random() * task2Count) : 0;

    const question = await this.prisma.writingQuestion.findFirst({
      where: { taskType: 'TASK2', isActive: true },
      skip: task2Offset,
    });

    return { question };
  }

  /**
   * Submit diagnostic test - single Task 2 essay
   */
  @Post('submit')
  async submitDiagnostic(
    @CurrentUser() user: any,
    @Body() dto: SubmitDiagnosticDto,
  ) {
    this.logger.log(`Submitting diagnostic for user ${user.id}`);

    const question = await this.prisma.writingQuestion.findUnique({
      where: { id: dto.questionId },
    });

    if (!question) {
      throw new Error('Diagnostic question not found');
    }

    // Create essay submission
    const submission = await this.prisma.essaySubmission.create({
      data: {
        userId: user.id,
        questionId: question.id,
        essayText: dto.essay,
        wordCount: dto.essay.split(/\s+/).length,
        timeSpentSeconds: dto.timeSpent,
        sessionType: 'DIAGNOSTIC',
      },
    });

    // Fetch user native language for personalized feedback
    const userExtended = await this.prisma.user.findUnique({
      where: { id: user.id },
      select: { nativeLanguage: true },
    });

    // Assess the essay
    const feedback = await this.assessmentService.assessEssay(
      submission.essayText,
      question.prompt,
      question.taskType,
      question.subType || 'general',
      submission.wordCount,
      submission.timeSpentSeconds,
      question.examType,
      userExtended?.nativeLanguage,
    );

    // Save feedback
    await this.assessmentService.saveFeedback(submission.id, feedback);

    // Update weakness profile with detected errors
    await this.weaknessService.updateFromEssayFeedback(
      user.id,
      feedback.detectedErrors,
    );

    // Update progress
    await this.progressService.updateProgressAfterEssay(user.id, submission.id);

    // Get weakness profile
    const weaknesses = await this.weaknessService.getWeaknessProfile(user.id);

    return {
      submissionId: submission.id,
      scores: feedback.scores,
      feedback: feedback.feedback,
      weaknesses,
      overallScore: feedback.scores.overall,
    };
  }

  /**
   * Get diagnostic results
   */
  @Get('results')
  async getDiagnosticResults(@CurrentUser() user: any) {
    // Get the latest diagnostic essay (Task 2 only)
    const diagnosticEssay = await this.prisma.essaySubmission.findFirst({
      where: {
        userId: user.id,
        sessionType: 'DIAGNOSTIC',
      },
      include: {
        question: true,
        feedback: true,
      },
      orderBy: { submittedAt: 'desc' },
    });

    // Get weakness profile
    const weaknesses = await this.weaknessService.getWeaknessProfile(user.id);

    return {
      essay: diagnosticEssay,
      weaknesses,
    };
  }
}
