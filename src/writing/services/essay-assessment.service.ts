import { Injectable, Logger, BadRequestException, Inject } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import {
  ESSAY_ASSESSMENT_PROVIDER,
  IEssayAssessmentProvider,
} from '../interfaces/essay-assessment-provider.interface';
import {
  WRITING_SYSTEM_PROMPT,
  generateTask2AssessmentPrompt,
} from '../prompts/task2-assessment.prompt';
import {
  TASK1_SYSTEM_PROMPT,
  generateTask1AssessmentPrompt,
} from '../prompts/task1-assessment.prompt';
import {
  TASK1_GENERAL_SYSTEM_PROMPT,
  generateTask1GeneralAssessmentPrompt,
} from '../prompts/task1-general-assessment.prompt';
import { EssayCriterionFeedback, EssayFeedbackResponse } from '../dto/essay-feedback.dto';
import { TaskType, ExamType } from '@prisma/client';

@Injectable()
export class EssayAssessmentService {
  private readonly logger = new Logger(EssayAssessmentService.name);

  constructor(
    private prisma: PrismaService,
    @Inject(ESSAY_ASSESSMENT_PROVIDER)
    private provider: IEssayAssessmentProvider,
  ) {}

  /**
   * Assess an essay using Claude API
   */
  async assessEssay(
    essayText: string,
    question: string,
    taskType: TaskType,
    questionType: string,
    wordCount: number,
    timeSpent: number,
    examType: ExamType = 'ACADEMIC',
    nativeLanguage?: string | null,
  ): Promise<EssayFeedbackResponse> {
    this.logger.log(`Assessing ${taskType} (${examType}) essay with ${wordCount} words`);

    let systemPrompt: string;
    let userPrompt: string;

    if (taskType === 'TASK2') {
      systemPrompt = WRITING_SYSTEM_PROMPT;
      userPrompt = generateTask2AssessmentPrompt({
        question,
        questionType,
        essayText,
        wordCount,
        timeSpent,
        nativeLanguage,
      });
    } else if (examType === 'GENERAL') {
      systemPrompt = TASK1_GENERAL_SYSTEM_PROMPT;
      userPrompt = generateTask1GeneralAssessmentPrompt({
        question,
        questionType,
        essayText,
        wordCount,
        timeSpent,
        nativeLanguage,
      });
    } else {
      systemPrompt = TASK1_SYSTEM_PROMPT;
      userPrompt = generateTask1AssessmentPrompt({
        question,
        questionType,
        essayText,
        wordCount,
        timeSpent,
        nativeLanguage,
      });
    }

    try {
      const assessmentData: EssayFeedbackResponse = await this.provider.assess(
        systemPrompt,
        userPrompt,
      );

      // Validate the response structure
      if (
        !assessmentData.scores ||
        !assessmentData.feedback ||
        !assessmentData.detectedErrors
      ) {
        this.logger.error('Invalid assessment data structure');
        throw new BadRequestException('Invalid assessment response structure');
      }

      return assessmentData;
    } catch (error) {
      this.logger.error('Error during essay assessment:', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(
        'Failed to assess essay. Please try again.',
      );
    }
  }

  /**
   * Save essay feedback to database
   */
  async saveFeedback(essayId: string, feedback: EssayFeedbackResponse) {
    // Determine if Task 1 or Task 2 based on presence of taskAchievement vs taskResponse
    const isTask1 = !!feedback.scores.taskAchievement;

    // Update essay submission with scores
    await this.prisma.essaySubmission.update({
      where: { id: essayId },
      data: {
        taskResponseScore: isTask1
          ? feedback.scores.taskAchievement
          : feedback.scores.taskResponse,
        coherenceCohesionScore: feedback.scores.coherenceCohesion,
        lexicalResourceScore: feedback.scores.lexicalResource,
        grammarAccuracyScore: feedback.scores.grammaticalRangeAccuracy,
        overallBandScore: feedback.scores.overall,
      },
    });

    // Create feedback record — criterion feedback stored as JSON strings for backward compat
    await this.prisma.essayFeedback.create({
      data: {
        essayId,
        taskResponseFeedback: JSON.stringify(
          isTask1
            ? feedback.feedback?.taskAchievement || {}
            : feedback.feedback?.taskResponse || {},
        ),
        coherenceCohesionFeedback: JSON.stringify(feedback.feedback?.coherenceCohesion || {}),
        lexicalResourceFeedback: JSON.stringify(feedback.feedback?.lexicalResource || {}),
        grammarAccuracyFeedback: JSON.stringify(feedback.feedback?.grammaticalRangeAccuracy || {}),
        overallFeedback: feedback.examinerNotes || '',
        annotations: feedback.annotations as any,
        examinerInsights: feedback.examinerInsights as any,
        priorityFixes: feedback.priorityFixes as any,
        detectedErrors: feedback.detectedErrors as any,
        vocabularySuggestions: (feedback.vocabularySuggestions || []) as any,
      },
    });

    this.logger.log(`Saved feedback for essay ${essayId}`);
  }

  /**
   * Get feedback for an essay (returns null if assessment is still pending)
   */
  async getFeedback(essayId: string): Promise<EssayFeedbackResponse | null> {
    // Get the submission with its question to determine task type
    const submission = await this.prisma.essaySubmission.findUnique({
      where: { id: essayId },
      include: { 
        question: true,
        user: { select: { nativeLanguage: true } }
      },
    });

    if (!submission) {
      throw new BadRequestException('Essay not found');
    }

    // Check if feedback already exists
    const existingFeedback = await this.prisma.essayFeedback.findUnique({
      where: { essayId },
    });

    if (existingFeedback) {
      const isTask1 = submission.question.taskType === 'TASK1';
      const taskCriterion = parseCriterionFeedback(existingFeedback.taskResponseFeedback);

      return {
        scores: {
          ...(isTask1
            ? { taskAchievement: Number(submission.taskResponseScore || 0) }
            : { taskResponse: Number(submission.taskResponseScore || 0) }),
          coherenceCohesion: Number(submission.coherenceCohesionScore || 0),
          lexicalResource: Number(submission.lexicalResourceScore || 0),
          grammaticalRangeAccuracy: Number(submission.grammarAccuracyScore || 0),
          overall: Number(submission.overallBandScore || 0),
        },
        feedback: {
          ...(isTask1
            ? { taskAchievement: taskCriterion }
            : { taskResponse: taskCriterion }),
          coherenceCohesion: parseCriterionFeedback(existingFeedback.coherenceCohesionFeedback),
          lexicalResource: parseCriterionFeedback(existingFeedback.lexicalResourceFeedback),
          grammaticalRangeAccuracy: parseCriterionFeedback(existingFeedback.grammarAccuracyFeedback),
        },
        examinerNotes: existingFeedback.overallFeedback || undefined,
        annotations: existingFeedback.annotations as any,
        examinerInsights: existingFeedback.examinerInsights as any,
        detectedErrors: existingFeedback.detectedErrors as any,
        priorityFixes: existingFeedback.priorityFixes as any,
        vocabularySuggestions: existingFeedback.vocabularySuggestions as any,
      };
    }

    // No feedback yet — check if assessment is likely in progress
    // If submission has no scores, assessment is still running (fired async on submit)
    if (!submission.overallBandScore) {
      return null; // Signal to controller that assessment is pending
    }

    // Scores exist but no feedback row — data inconsistency, regenerate
    const feedback = await this.assessEssay(
      submission.essayText,
      submission.question.prompt,
      submission.question.taskType,
      submission.question.subType || 'general',
      submission.wordCount,
      submission.timeSpentSeconds,
      submission.question.examType,
      submission.user?.nativeLanguage,
    );

    // Save the feedback
    await this.saveFeedback(essayId, feedback);

    return feedback;
  }
}

// Handles both old plain-text records and new JSON criterion objects
function parseCriterionFeedback(raw: string): EssayCriterionFeedback {
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && 'justification' in parsed) {
      return parsed as EssayCriterionFeedback;
    }
  } catch {
    // old format — wrap plain string in new shape
  }
  return { justification: raw || '', strengths: [], weaknesses: [] };
}
