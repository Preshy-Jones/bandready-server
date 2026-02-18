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
   * Start diagnostic test - returns Task 1 and Task 2 questions
   */
  @Post('start')
  async startDiagnostic() {
    // Get random Task 1 and Task 2 questions
    const [task1Count, task2Count] = await Promise.all([
      this.prisma.writingQuestion.count({ where: { taskType: 'TASK1', isActive: true } }),
      this.prisma.writingQuestion.count({ where: { taskType: 'TASK2', isActive: true } }),
    ]);

    const task1Offset = task1Count > 0 ? Math.floor(Math.random() * task1Count) : 0;
    const task2Offset = task2Count > 0 ? Math.floor(Math.random() * task2Count) : 0;

    const [task1Question, task2Question] = await Promise.all([
      this.prisma.writingQuestion.findFirst({
        where: { taskType: 'TASK1', isActive: true },
        skip: task1Offset,
      }),
      this.prisma.writingQuestion.findFirst({
        where: { taskType: 'TASK2', isActive: true },
        skip: task2Offset,
      }),
    ]);

    return {
      task1Question,
      task2Question,
    };
  }

  /**
   * Submit diagnostic test - both Task 1 and Task 2 essays
   */
  @Post('submit')
  async submitDiagnostic(
    @CurrentUser() user: any,
    @Body() dto: SubmitDiagnosticDto,
  ) {
    this.logger.log(`Submitting diagnostic for user ${user.id}`);

    // Get questions using IDs from the DTO (sent by the start endpoint)
    const [task1Question, task2Question] = await Promise.all([
      this.prisma.writingQuestion.findUnique({
        where: { id: dto.task1QuestionId },
      }),
      this.prisma.writingQuestion.findUnique({
        where: { id: dto.task2QuestionId },
      }),
    ]);

    if (!task1Question || !task2Question) {
      throw new Error('Diagnostic questions not found');
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
          sessionType: 'DIAGNOSTIC',
        },
      }),
      this.prisma.essaySubmission.create({
        data: {
          userId: user.id,
          questionId: task2Question.id,
          essayText: dto.task2Essay,
          wordCount: dto.task2Essay.split(/\s+/).length,
          timeSpentSeconds: dto.task2TimeSpent,
          sessionType: 'DIAGNOSTIC',
        },
      }),
    ]);

    // Assess both essays
    const [task1Feedback, task2Feedback] = await Promise.all([
      this.assessmentService.assessEssay(
        task1Submission.essayText,
        task1Question.prompt,
        task1Question.taskType,
        task1Question.subType || 'general',
        task1Submission.wordCount,
        task1Submission.timeSpentSeconds,
      ),
      this.assessmentService.assessEssay(
        task2Submission.essayText,
        task2Question.prompt,
        task2Question.taskType,
        task2Question.subType || 'general',
        task2Submission.wordCount,
        task2Submission.timeSpentSeconds,
      ),
    ]);

    // Save feedback
    await Promise.all([
      this.assessmentService.saveFeedback(task1Submission.id, task1Feedback),
      this.assessmentService.saveFeedback(task2Submission.id, task2Feedback),
    ]);

    // Update weakness profile with detected errors from both essays
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
      overallScore:
        (task1Feedback.scores.overall + task2Feedback.scores.overall) / 2,
    };
  }

  /**
   * Get diagnostic results
   */
  @Get('results')
  async getDiagnosticResults(@CurrentUser() user: any) {
    // Get diagnostic essays
    const diagnosticEssays = await this.prisma.essaySubmission.findMany({
      where: {
        userId: user.id,
        sessionType: 'DIAGNOSTIC',
      },
      include: {
        question: true,
        feedback: true,
      },
      orderBy: { submittedAt: 'desc' },
      take: 2, // Latest Task 1 and Task 2
    });

    // Get weakness profile
    const weaknesses = await this.weaknessService.getWeaknessProfile(user.id);

    return {
      essays: diagnosticEssays,
      weaknesses,
    };
  }
}
