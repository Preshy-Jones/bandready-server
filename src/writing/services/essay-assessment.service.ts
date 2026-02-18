import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import { PrismaService } from '../../common/prisma/prisma.service';
import {
  WRITING_SYSTEM_PROMPT,
  generateTask2AssessmentPrompt,
} from '../prompts/task2-assessment.prompt';
import {
  TASK1_SYSTEM_PROMPT,
  generateTask1AssessmentPrompt,
} from '../prompts/task1-assessment.prompt';
import { EssayFeedbackResponse } from '../dto/essay-feedback.dto';
import { TaskType } from '@prisma/client';

@Injectable()
export class EssayAssessmentService {
  private readonly logger = new Logger(EssayAssessmentService.name);
  private anthropic: Anthropic;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    const apiKey = this.configService.get<string>('ANTHROPIC_API_KEY');
    if (!apiKey) {
      this.logger.error('ANTHROPIC_API_KEY not found in environment variables');
      throw new Error('ANTHROPIC_API_KEY is required');
    }
    this.anthropic = new Anthropic({ apiKey });
  }

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
  ): Promise<EssayFeedbackResponse> {
    this.logger.log(`Assessing ${taskType} essay with ${wordCount} words`);

    const systemPrompt =
      taskType === 'TASK1' ? TASK1_SYSTEM_PROMPT : WRITING_SYSTEM_PROMPT;
    const userPrompt =
      taskType === 'TASK1'
        ? generateTask1AssessmentPrompt({
            question,
            questionType,
            essayText,
            wordCount,
            timeSpent,
          })
        : generateTask2AssessmentPrompt({
            question,
            questionType,
            essayText,
            wordCount,
            timeSpent,
          });

    try {
      const response = await this.anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4096,
        temperature: 0.3, // Lower temperature for more consistent grading
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: userPrompt,
          },
        ],
      });

      const content = response.content[0];
      if (content.type !== 'text') {
        throw new BadRequestException('Unexpected response format from Claude');
      }

      // Extract JSON from the response
      const jsonMatch = content.text.match(/```json\s*([\s\S]*?)\s*```/);
      if (!jsonMatch) {
        this.logger.error('Failed to extract JSON from Claude response');
        this.logger.debug('Response:', content.text);
        throw new BadRequestException('Failed to parse assessment response');
      }

      const assessmentData: EssayFeedbackResponse = JSON.parse(jsonMatch[1]);

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

    // Create feedback record
    await this.prisma.essayFeedback.create({
      data: {
        essayId,
        taskResponseFeedback: isTask1
          ? feedback.feedback.taskAchievement || ''
          : feedback.feedback.taskResponse || '',
        coherenceCohesionFeedback: feedback.feedback.coherenceCohesion,
        lexicalResourceFeedback: feedback.feedback.lexicalResource,
        grammarAccuracyFeedback: feedback.feedback.grammaticalRangeAccuracy,
        overallFeedback: feedback.feedback.overall,
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
      include: { question: true },
    });

    if (!submission) {
      throw new BadRequestException('Essay not found');
    }

    // Check if feedback already exists
    const existingFeedback = await this.prisma.essayFeedback.findUnique({
      where: { essayId },
    });

    if (existingFeedback) {
      // Return existing feedback with actual scores from the submission
      const isTask1 = submission.question.taskType === 'TASK1';

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
            ? {
                taskAchievement:
                  existingFeedback.taskResponseFeedback,
              }
            : {
                taskResponse: existingFeedback.taskResponseFeedback,
              }),
          coherenceCohesion: existingFeedback.coherenceCohesionFeedback,
          lexicalResource: existingFeedback.lexicalResourceFeedback,
          grammaticalRangeAccuracy: existingFeedback.grammarAccuracyFeedback,
          overall: existingFeedback.overallFeedback,
        },
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
    );

    // Save the feedback
    await this.saveFeedback(essayId, feedback);

    return feedback;
  }
}
