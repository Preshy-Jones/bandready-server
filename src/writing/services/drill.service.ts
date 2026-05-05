import { Injectable, Logger, NotFoundException, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import { PrismaService } from '../../common/prisma/prisma.service';
import { DrillType, WeaknessCategory, Difficulty } from '@prisma/client';
import { generateDrillFeedbackPrompt } from '../prompts/drill-feedback.prompt';
import { DrillFeedbackResponse } from '../dto/drill-submission.dto';

const FREE_DAILY_DRILL_LIMIT = 5;

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

    // --- Drill access gating ---
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { nativeLanguage: true, drillsExpireAt: true, subscriptionTier: true, subscriptionExpiresAt: true },
    });

    // Check if user has unlimited drill access: active drill pack OR active premium subscription
    const now = new Date();
    const hasDrillPack = user?.drillsExpireAt && user.drillsExpireAt > now;
    const isPremium = user?.subscriptionTier === 'premium' && user?.subscriptionExpiresAt && user.subscriptionExpiresAt > now;
    const hasUnlimitedDrills = hasDrillPack || isPremium;

    if (!hasUnlimitedDrills) {
      // Enforce free daily drill limit
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      const todayAttempts = await this.prisma.drillAttempt.count({
        where: {
          userId,
          attemptedAt: { gte: startOfDay },
        },
      });

      if (todayAttempts >= FREE_DAILY_DRILL_LIMIT) {
        throw new ForbiddenException(
          `Daily drill limit reached (${FREE_DAILY_DRILL_LIMIT}/day). Upgrade your pack for unlimited drills.`,
        );
      }
    }

    // --- Tiered skill classification ---
    const exactMatchSkills = [
      'identifying_essay_type',
    ];

    const fuzzyThenAISkills = [
      'addressing_all_parts',
      'data_selection',
    ];

    const isExactTier = exactMatchSkills.includes(drill.specificSkill);
    const isFuzzyTier = fuzzyThenAISkills.includes(drill.specificSkill);
    // Everything else is AI-first (Tier 3)

    let isCorrect = false;
    let aiFeedbackResult: any = null;
    let scoringMethod: 'ai' | 'exact_match' | 'fallback' = 'exact_match';

    const performExactMatch = () => this.checkAnswer(userAnswer, drill.correctAnswer);

    if (isExactTier) {
      // Tier 1: Exact string matching only
      isCorrect = performExactMatch();
    } else if (isFuzzyTier) {
      // Tier 2: Try exact match first, fall back to AI
      isCorrect = performExactMatch();
      if (!isCorrect && this.anthropic) {
        try {
          aiFeedbackResult = await this.generateAIFeedback(drill, userAnswer, user?.nativeLanguage, 'validate');
          isCorrect = aiFeedbackResult.isCorrect;
          scoringMethod = 'ai';
        } catch (error) {
          this.logger.error('Error generating AI validation (Tier 2):', error);
          scoringMethod = 'fallback'; // Fallback to the exact match result
        }
      }
    } else {
      // Tier 3: AI-first validation
      if (this.anthropic) {
        try {
          aiFeedbackResult = await this.generateAIFeedback(drill, userAnswer, user?.nativeLanguage, 'validate');
          isCorrect = aiFeedbackResult.isCorrect;
          scoringMethod = 'ai';
        } catch (error) {
          this.logger.error('Error generating AI validation (Tier 3):', error);
          isCorrect = performExactMatch();
          scoringMethod = 'fallback';
        }
      } else {
        isCorrect = performExactMatch();
        scoringMethod = 'fallback';
      }
    }

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

    // Generate AI feedback if answer is incorrect and we haven't already generated it
    if (!isCorrect && !aiFeedbackResult && this.anthropic) {
      try {
        aiFeedbackResult = await this.generateAIFeedback(drill, userAnswer, user?.nativeLanguage, 'feedback_only');
      } catch (error) {
        this.logger.error('Error generating AI feedback:', error);
        // Fall back to basic feedback
      }
    }

    // Update progress for every attempt
    await this.updateDrillProgress(userId);

    // --- Spaced Repetition Logic (SM-2 simplified) ---
    await this.updateDrillReviewQueue(userId, drillId, isCorrect);

    if (aiFeedbackResult) {
      return {
        isCorrect,
        feedback: aiFeedbackResult.feedback,
        relatedConcept: aiFeedbackResult.relatedConcept,
        additionalExamples: aiFeedbackResult.additionalExamples,
        correctAnswer: isCorrect ? undefined : drill.correctAnswer,
        scoringMethod,
      };
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
      scoringMethod,
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
    nativeLanguage?: string | null,
    mode: 'validate' | 'feedback_only' = 'feedback_only'
  ): Promise<DrillFeedbackResponse> {
    const prompt = generateDrillFeedbackPrompt({
      drillType: drill.type,
      category: drill.category,
      instruction: drill.instruction,
      content: drill.content,
      correctAnswer: drill.correctAnswer,
      userAnswer,
      nativeLanguage,
      mode,
    });

    const response = await this.anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      temperature: 0.5,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response format');
    }

    let jsonText: string | null = null;
    
    // Try to extract from markdown code blocks first (with or without 'json' tag)
    const blockMatch = content.text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (blockMatch) {
      jsonText = blockMatch[1];
    } else {
      // Fallback: look for the first { and last }
      const firstBrace = content.text.indexOf('{');
      const lastBrace = content.text.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        jsonText = content.text.substring(firstBrace, lastBrace + 1);
      }
    }

    if (!jsonText) {
      this.logger.error(`AI response lacked JSON. Raw text: ${content.text}`);
      throw new Error('Failed to extract JSON from AI feedback response');
    }

    let feedbackData;
    try {
      feedbackData = JSON.parse(jsonText);
    } catch (e) {
      this.logger.error(`JSON Parse Error. Raw JSON text: ${jsonText}`);
      throw new Error('Failed to parse JSON from AI feedback response');
    }
    return {
      isCorrect: feedbackData.isCorrect ?? false,
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

  /**
   * Update DrillReviewQueue based on SM-2.
   * Only creates entries for incorrect answers. Updates existing entries
   * on subsequent attempts to either extend or reset the interval.
   */
  private async updateDrillReviewQueue(userId: string, drillId: string, isCorrect: boolean) {
    const queueItem = await this.prisma.drillReviewQueue.findUnique({
      where: { userId_drillId: { userId, drillId } },
    });

    // First-time correct answer — no need to schedule a review
    if (!queueItem && isCorrect) {
      return;
    }

    const quality = isCorrect ? 4 : 1;
    let nextEaseFactor = 2.5;
    let nextInterval = 1.0;
    let nextConsecutive = 0;

    if (queueItem) {
      // Existing queue item — recalculate SM-2 parameters
      nextEaseFactor = Math.max(1.3, queueItem.easeFactor + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));

      if (isCorrect) {
        nextConsecutive = queueItem.consecutiveCorrect + 1;
        if (nextConsecutive === 1) nextInterval = 1.0;
        else if (nextConsecutive === 2) nextInterval = 6.0;
        else nextInterval = queueItem.intervalDays * nextEaseFactor;
      } else {
        nextConsecutive = 0;
        nextInterval = 1.0;
      }

      const nextReview = new Date(Date.now() + Math.round(nextInterval * 24 * 60 * 60 * 1000));

      await this.prisma.drillReviewQueue.update({
        where: { userId_drillId: { userId, drillId } },
        data: {
          easeFactor: nextEaseFactor,
          intervalDays: nextInterval,
          consecutiveCorrect: nextConsecutive,
          nextReviewAt: nextReview,
        },
      });
    } else {
      // First-time incorrect — create a new review entry
      const nextReview = new Date(Date.now() + Math.round(nextInterval * 24 * 60 * 60 * 1000));

      await this.prisma.drillReviewQueue.create({
        data: {
          userId,
          drillId,
          easeFactor: nextEaseFactor,
          intervalDays: nextInterval,
          consecutiveCorrect: nextConsecutive,
          nextReviewAt: nextReview,
        },
      });
    }
  }
}
