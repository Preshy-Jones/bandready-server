import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import { PrismaService } from '../../common/prisma/prisma.service';
import { DrillType, WeaknessCategory, Difficulty } from '@prisma/client';
import { generateDrillFeedbackPrompt } from '../prompts/drill-feedback.prompt';
import { DrillFeedbackResponse } from '../dto/drill-submission.dto';

@Injectable()
export class DrillService {
  private readonly logger = new Logger(DrillService.name);
  private anthropic: Anthropic;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    const apiKey = this.configService.get<string>('ANTHROPIC_API_KEY');
    if (apiKey) {
      this.anthropic = new Anthropic({ apiKey });
    }
  }

  /**
   * Get drills with filters
   */
  async getDrills(filters: {
    type?: DrillType;
    category?: WeaknessCategory;
    difficulty?: Difficulty;
    targetWeakness?: string;
    limit?: number;
    offset?: number;
  }) {
    const { type, category, difficulty, targetWeakness, limit = 20, offset = 0 } = filters;

    const where: any = { isActive: true };

    if (type) where.type = type;
    if (category) where.category = category;
    if (difficulty) where.difficulty = difficulty;
    if (targetWeakness) {
      where.relatedWeaknesses = { has: targetWeakness };
    }

    const [drills, total] = await Promise.all([
      this.prisma.writingDrill.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.writingDrill.count({ where }),
    ]);

    return { drills, total };
  }

  /**
   * Get a single drill by ID
   */
  async getDrillById(drillId: string) {
    const drill = await this.prisma.writingDrill.findUnique({
      where: { id: drillId },
    });

    if (!drill) {
      throw new NotFoundException('Drill not found');
    }

    return drill;
  }

  /**
   * Submit drill attempt and get feedback
   */
  async submitDrill(
    userId: string,
    drillId: string,
    userAnswer: string,
    timeSpentSeconds?: number,
  ): Promise<DrillFeedbackResponse> {
    const drill = await this.getDrillById(drillId);

    // Simple correctness check (can be enhanced with AI)
    const isCorrect = this.checkAnswer(userAnswer, drill.correctAnswer);

    // Save attempt
    await this.prisma.drillAttempt.create({
      data: {
        userId,
        drillId,
        userAnswer,
        isCorrect,
        timeSpentSeconds,
      },
    });

    // Update progress if correct
    if (isCorrect) {
      await this.updateDrillProgress(userId);
    }

    // Generate AI feedback if answer is incorrect and Claude is available
    if (!isCorrect && this.anthropic) {
      try {
        const aiFeedback = await this.generateAIFeedback(drill, userAnswer);
        return {
          isCorrect: false,
          ...aiFeedback,
          correctAnswer: drill.correctAnswer,
        };
      } catch (error) {
        this.logger.error('Error generating AI feedback:', error);
        // Fall back to basic feedback
      }
    }

    // Return basic feedback
    return {
      isCorrect,
      feedback: isCorrect
        ? `Correct! ${drill.explanation}`
        : `Not quite right. ${drill.explanation}`,
      relatedConcept: drill.specificSkill
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (l) => l.toUpperCase()),
      additionalExamples: [],
      correctAnswer: isCorrect ? undefined : drill.correctAnswer,
    };
  }

  /**
   * Get drill progress for a user
   */
  async getDrillProgress(userId: string) {
    const attempts = await this.prisma.drillAttempt.findMany({
      where: { userId },
      include: { drill: true },
    });

    const byCategory: Record<string, { total: number; correct: number }> = {};

    for (const attempt of attempts) {
      const category = attempt.drill.category;
      if (!byCategory[category]) {
        byCategory[category] = { total: 0, correct: 0 };
      }
      byCategory[category].total++;
      if (attempt.isCorrect) {
        byCategory[category].correct++;
      }
    }

    return {
      totalAttempts: attempts.length,
      correctAttempts: attempts.filter((a) => a.isCorrect).length,
      byCategory,
    };
  }

  /**
   * Simple answer checking (case-insensitive, trimmed)
   */
  private checkAnswer(userAnswer: string, correctAnswer: string): boolean {
    const normalize = (str: string) =>
      str.trim().toLowerCase().replace(/\s+/g, ' ');
    return normalize(userAnswer) === normalize(correctAnswer);
  }

  /**
   * Generate AI feedback using Claude
   */
  private async generateAIFeedback(
    drill: any,
    userAnswer: string,
  ): Promise<Omit<DrillFeedbackResponse, 'isCorrect'>> {
    const prompt = generateDrillFeedbackPrompt({
      drillType: drill.type,
      category: drill.category,
      instruction: drill.instruction,
      content: drill.content,
      correctAnswer: drill.correctAnswer,
      userAnswer,
    });

    const response = await this.anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      temperature: 0.5,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response format');
    }

    // Extract JSON from the response
    const jsonMatch = content.text.match(/```json\s*([\s\S]*?)\s*```/);
    if (!jsonMatch) {
      throw new Error('Failed to parse AI feedback response');
    }

    const feedbackData = JSON.parse(jsonMatch[1]);
    return {
      feedback: feedbackData.feedback,
      relatedConcept: feedbackData.relatedConcept,
      additionalExamples: feedbackData.additionalExamples || [],
    };
  }

  /**
   * Update drill progress count
   */
  private async updateDrillProgress(userId: string) {
    const progress = await this.prisma.writingProgress.findUnique({
      where: { userId },
    });

    if (progress) {
      await this.prisma.writingProgress.update({
        where: { userId },
        data: {
          totalDrillsCompleted: progress.totalDrillsCompleted + 1,
        },
      });
    } else {
      await this.prisma.writingProgress.create({
        data: {
          userId,
          totalDrillsCompleted: 1,
        },
      });
    }
  }
}
