import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { WeaknessCategory, Severity, ImprovementStatus } from '@prisma/client';
import { DetectedError } from '../dto/essay-feedback.dto';

@Injectable()
export class WeaknessProfileService {
  private readonly logger = new Logger(WeaknessProfileService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Get user's current weakness profile
   */
  async getWeaknessProfile(userId: string) {
    const weaknesses = await this.prisma.writingWeakness.findMany({
      where: { userId },
      orderBy: [{ severity: 'desc' }, { frequency: 'desc' }],
    });

    return weaknesses;
  }

  /**
   * Update weakness profile after essay feedback
   */
  async updateFromEssayFeedback(
    userId: string,
    detectedErrors: DetectedError[],
  ) {
    // Group errors by type
    const errorCounts = new Map<
      string,
      { category: WeaknessCategory; count: number }
    >();

    for (const error of detectedErrors) {
      const key = error.specificError;
      const existing = errorCounts.get(key);
      if (existing) {
        existing.count++;
      } else {
        errorCounts.set(key, { category: error.category, count: 1 });
      }
    }

    // Get existing weaknesses
    const existingWeaknesses = await this.prisma.writingWeakness.findMany({
      where: { userId },
    });
    const existingMap = new Map(
      existingWeaknesses.map((w) => [w.specificError, w]),
    );

    // Update or create weaknesses
    for (const [errorType, { category, count }] of errorCounts) {
      const existing = existingMap.get(errorType);

      if (existing) {
        // Error recurred - reset sessions without error, update frequency
        await this.prisma.writingWeakness.update({
          where: { id: existing.id },
          data: {
            frequency: existing.frequency + count,
            sessionsWithoutError: 0,
            lastOccurrence: new Date(),
            status:
              existing.sessionsWithoutError > 0 ? 'WORSENING' : existing.status,
            severity: this.calculateSeverity(existing.frequency + count),
          },
        });
      } else {
        // New weakness
        await this.prisma.writingWeakness.create({
          data: {
            userId,
            category,
            specificError: errorType,
            displayName: this.getDisplayName(errorType),
            frequency: count,
            severity: count >= 3 ? 'HIGH' : count >= 2 ? 'MEDIUM' : 'LOW',
            status: 'STAGNANT',
          },
        });
      }

      existingMap.delete(errorType);
    }

    // Increment sessionsWithoutError for weaknesses not found in this essay
    for (const [errorType, weakness] of existingMap) {
      const newSessionsWithout = weakness.sessionsWithoutError + 1;

      await this.prisma.writingWeakness.update({
        where: { id: weakness.id },
        data: {
          sessionsWithoutError: newSessionsWithout,
          status: newSessionsWithout >= 3 ? 'IMPROVING' : weakness.status,
          severity:
            newSessionsWithout >= 5
              ? this.demoteSeverity(weakness.severity)
              : weakness.severity,
        },
      });
    }

    this.logger.log(`Updated weakness profile for user ${userId}`);
  }

  /**
   * Get recommended drills based on weaknesses
   */
  async getRecommendedDrills(userId: string, limit = 5) {
    // 1. Prioritize drills due for review from Spaced Repetition (SM-2)
    const dueReviews = await this.prisma.drillReviewQueue.findMany({
      where: {
        userId,
        nextReviewAt: { lte: new Date() },
      },
      include: { drill: true },
      orderBy: { nextReviewAt: 'asc' },
      take: limit,
    });

    const reviewedDrills = dueReviews.map((r) => r.drill);

    if (reviewedDrills.length >= limit) {
      return reviewedDrills;
    }

    const remainingLimit = limit - reviewedDrills.length;
    const excludeIds = reviewedDrills.map((d) => d.id);

    // 2. Fetch drills based on weaknesses
    const weaknesses = await this.getWeaknessProfile(userId);
    const topWeaknesses = weaknesses.slice(0, 3);
    let newDrills: any[] = [];

    if (topWeaknesses.length > 0) {
      const targetErrors = topWeaknesses.map((w) => w.specificError);
      newDrills = await this.prisma.writingDrill.findMany({
        where: {
          isActive: true,
          id: { notIn: excludeIds },
          relatedWeaknesses: { hasSome: targetErrors },
        },
        take: remainingLimit,
      });
    }

    if (newDrills.length < remainingLimit) {
        const fallbackDrills = await this.prisma.writingDrill.findMany({
            where: {
                isActive: true,
                id: { notIn: [...excludeIds, ...newDrills.map(d => d.id)] }
            },
            take: remainingLimit - newDrills.length,
            orderBy: { difficulty: 'asc' }
        });
        newDrills = [...newDrills, ...fallbackDrills];
    }

    return [...reviewedDrills, ...newDrills];
  }

  private calculateSeverity(frequency: number): Severity {
    if (frequency >= 5) return 'HIGH';
    if (frequency >= 3) return 'MEDIUM';
    return 'LOW';
  }

  private demoteSeverity(current: Severity): Severity {
    if (current === 'HIGH') return 'MEDIUM';
    if (current === 'MEDIUM') return 'LOW';
    return 'LOW';
  }

  private getDisplayName(errorType: string): string {
    const names: Record<string, string> = {
      article_misuse: 'Article Misuse',
      comma_splice: 'Comma Splices',
      subject_verb_agreement: 'Subject-Verb Agreement',
      tense_error: 'Tense Errors',
      run_on_sentence: 'Run-on Sentences',
      fragment: 'Sentence Fragments',
      conditional_error: 'Conditional Errors',
      passive_voice_error: 'Passive Voice Errors',
      pronoun_reference: 'Pronoun Reference Issues',
      preposition_error: 'Preposition Errors',
      weak_collocation: 'Weak Collocations',
      word_choice_error: 'Word Choice Errors',
      informal_register: 'Informal Register',
      repetition: 'Repetitive Language',
      spelling_error: 'Spelling Errors',
      weak_vocabulary: 'Weak Vocabulary',
      inappropriate_paraphrasing: 'Inappropriate Paraphrasing',
      missing_discourse_marker: 'Missing Discourse Markers',
      unclear_reference: 'Unclear References',
      paragraph_break_needed: 'Paragraph Break Issues',
      illogical_flow: 'Illogical Flow',
      missing_topic_sentence: 'Missing Topic Sentences',
      off_topic: 'Off-Topic Content',
      position_unclear: 'Unclear Position',
      underdeveloped_idea: 'Underdeveloped Ideas',
      missing_conclusion: 'Missing Conclusion',
      no_examples: 'Lack of Examples',
      no_overview: 'Missing Overview',
      opinion_included: 'Opinion in Task 1',
      irrelevant_detail: 'Irrelevant Details',
      inaccurate_data: 'Inaccurate Data',
      no_comparisons: 'Missing Comparisons',
      mechanical_description: 'Mechanical Description',
    };
    return (
      names[errorType] ||
      errorType
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (l) => l.toUpperCase())
    );
  }
}
