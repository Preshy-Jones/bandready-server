import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class ProgressService {
  private readonly logger = new Logger(ProgressService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Get overall writing progress for a user
   */
  async getProgress(userId: string) {
    const progress = await this.prisma.writingProgress.upsert({
      where: { userId },
      create: { userId },
      update: {},
    });

    return progress;
  }

  /**
   * Update progress after essay submission
   */
  async updateProgressAfterEssay(userId: string, essayId: string) {
    const essay = await this.prisma.essaySubmission.findUnique({
      where: { id: essayId },
      include: { question: true },
    });

    if (!essay || !essay.overallBandScore) {
      this.logger.warn(`Essay ${essayId} not found or not scored yet`);
      return;
    }

    // Get last 10 essays
    const recentEssays = await this.prisma.essaySubmission.findMany({
      where: {
        userId,
        overallBandScore: { not: null },
      },
      include: { question: true },
      orderBy: { submittedAt: 'desc' },
      take: 10,
    });

    // Calculate rolling averages
    const avgOverall = this.calculateAverage(
      recentEssays.map((e) => e.overallBandScore),
    );
    const avgTaskResponse = this.calculateAverage(
      recentEssays.map((e) => e.taskResponseScore),
    );
    const avgCoherence = this.calculateAverage(
      recentEssays.map((e) => e.coherenceCohesionScore),
    );
    const avgLexical = this.calculateAverage(
      recentEssays.map((e) => e.lexicalResourceScore),
    );
    const avgGrammar = this.calculateAverage(
      recentEssays.map((e) => e.grammarAccuracyScore),
    );

    // Calculate task-specific averages
    const task1Essays = recentEssays.filter(
      (e) => e.question.taskType === 'TASK1',
    );
    const task2Essays = recentEssays.filter(
      (e) => e.question.taskType === 'TASK2',
    );

    const avgTask1Score = this.calculateAverage(
      task1Essays.map((e) => e.overallBandScore),
    );
    const avgTask2Score = this.calculateAverage(
      task2Essays.map((e) => e.overallBandScore),
    );

    // Get total essays and practice time
    const totalEssays = await this.prisma.essaySubmission.count({
      where: { userId },
    });

    const allEssays = await this.prisma.essaySubmission.findMany({
      where: { userId },
      select: { timeSpentSeconds: true },
    });

    const totalPracticeMinutes =
      allEssays.reduce((sum, e) => sum + e.timeSpentSeconds, 0) / 60;

    // Check for milestones
    const milestones = await this.checkMilestones(
      userId,
      totalEssays,
      avgOverall,
    );

    // Check exam readiness (3 consecutive essays at Band 7+)
    const examReadyTask1 = this.checkExamReadiness(
      task1Essays.slice(0, 3),
      7.0,
    );
    const examReadyTask2 = this.checkExamReadiness(
      task2Essays.slice(0, 3),
      7.0,
    );

    // Update progress
    const progress = await this.prisma.writingProgress.upsert({
      where: { userId },
      create: {
        userId,
        avgOverallScore: avgOverall,
        avgTaskResponse,
        avgCoherence,
        avgLexical,
        avgGrammar,
        avgTask1Score,
        avgTask2Score,
        totalEssays,
        totalPracticeMinutes,
        milestones: milestones as any,
        examReadyTask1,
        examReadyTask2,
      },
      update: {
        avgOverallScore: avgOverall,
        avgTaskResponse,
        avgCoherence,
        avgLexical,
        avgGrammar,
        avgTask1Score,
        avgTask2Score,
        totalEssays,
        totalPracticeMinutes,
        milestones: milestones as any,
        examReadyTask1,
        examReadyTask2,
      },
    });

    this.logger.log(`Updated progress for user ${userId}`);
    return progress;
  }

  /**
   * Get score trends over time
   */
  async getScoreTrend(userId: string, days = 30) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const essays = await this.prisma.essaySubmission.findMany({
      where: {
        userId,
        submittedAt: { gte: since },
        overallBandScore: { not: null },
      },
      orderBy: { submittedAt: 'asc' },
      select: {
        submittedAt: true,
        overallBandScore: true,
        taskResponseScore: true,
        coherenceCohesionScore: true,
        lexicalResourceScore: true,
        grammarAccuracyScore: true,
        question: {
          select: { taskType: true },
        },
      },
    });

    return essays.map((e) => ({
      date: e.submittedAt,
      overall: e.overallBandScore,
      taskResponse: e.taskResponseScore,
      coherence: e.coherenceCohesionScore,
      lexical: e.lexicalResourceScore,
      grammar: e.grammarAccuracyScore,
      taskType: e.question.taskType,
    }));
  }

  /**
   * Get error frequency for visualization
   */
  async getErrorFrequency(userId: string) {
    const weaknesses = await this.prisma.writingWeakness.findMany({
      where: { userId },
      orderBy: { frequency: 'desc' },
      take: 10,
    });

    return weaknesses.map((w) => ({
      error: w.displayName,
      frequency: w.frequency,
      category: w.category,
      severity: w.severity,
    }));
  }

  /**
   * Calculate average from array of Decimal values
   */
  private calculateAverage(
    values: (Prisma.Decimal | null)[],
  ): Prisma.Decimal | null {
    const validValues = values.filter((v) => v !== null) as Prisma.Decimal[];
    if (validValues.length === 0) return null;

    const sum = validValues.reduce(
      (acc, val) => acc + Number(val),
      0,
    );
    return new Prisma.Decimal(sum / validValues.length);
  }

  /**
   * Check and update milestones
   */
  private async checkMilestones(
    userId: string,
    totalEssays: number,
    avgScore: Prisma.Decimal | null,
  ): Promise<string[]> {
    const existingProgress = await this.prisma.writingProgress.findUnique({
      where: { userId },
    });

    const currentMilestones: string[] = existingProgress
      ? (existingProgress.milestones as string[])
      : [];

    const possibleMilestones = [
      { name: 'first_essay', condition: totalEssays >= 1 },
      { name: '10_essays', condition: totalEssays >= 10 },
      { name: '25_essays', condition: totalEssays >= 25 },
      { name: '50_essays', condition: totalEssays >= 50 },
      { name: 'band_6_achieved', condition: avgScore && Number(avgScore) >= 6.0 },
      { name: 'band_7_achieved', condition: avgScore && Number(avgScore) >= 7.0 },
      { name: 'band_8_achieved', condition: avgScore && Number(avgScore) >= 8.0 },
    ];

    const newMilestones = possibleMilestones
      .filter((m) => m.condition && !currentMilestones.includes(m.name))
      .map((m) => m.name);

    return [...currentMilestones, ...newMilestones];
  }

  /**
   * Check exam readiness (3 consecutive essays at target band or higher)
   */
  private checkExamReadiness(essays: any[], targetBand: number): boolean {
    if (essays.length < 3) return false;

    return essays
      .slice(0, 3)
      .every((e) => e.overallBandScore && Number(e.overallBandScore) >= targetBand);
  }
}
