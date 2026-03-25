import { Inject, Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { IReadingAnalysisProvider, READING_ANALYSIS_PROVIDER } from '../interfaces/reading-analysis-provider.interface';
import { buildReadingAnalysisPrompt } from '../prompts/reading-analysis.prompt';
import { ReadingAnalysisResponse } from '../dto/reading-analysis.dto';

@Injectable()
export class ReadingAnalysisService {
  constructor(
    @Inject(READING_ANALYSIS_PROVIDER)
    private readonly provider: IReadingAnalysisProvider,
    private readonly prisma: PrismaService,
  ) {}

  async analyzeSession(sessionId: string, userId: string): Promise<ReadingAnalysisResponse> {
    // Fetch session and verify ownership
    const session = await this.prisma.readingSession.findUnique({
      where: { id: sessionId },
      include: {
        answers: {
          include: {
            question: true,
          },
        },
      },
    });

    if (!session) {
      throw new NotFoundException('Reading session not found');
    }

    if (session.userId !== userId) {
      throw new ForbiddenException('You do not have access to this reading session.');
    }

    // Check if analysis already exists
    const existingResult = await this.prisma.readingResult.findFirst({
      where: { sessionId },
    });

    if (!existingResult) {
      throw new NotFoundException('Reading result not found for this session');
    }

    if (existingResult.aiAnalysis) {
      return existingResult.aiAnalysis as unknown as ReadingAnalysisResponse;
    }

    // Build incorrect answers array
    const incorrectAnswers = session.answers
      .filter((ans) => !ans.isCorrect)
      .map((ans) => ({
        questionNumber: ans.question.questionNumber,
        questionType: ans.question.questionType,
        questionText: (ans.question.questionData as any).prompt || '',
        userAnswer: ans.userAnswer ? String(ans.userAnswer) : '',
        correctAnswer: ans.question.correctAnswer ? String(ans.question.correctAnswer) : '',
        skillTested: ans.question.skillTested || 'General',
        explanation: ans.question.explanation || '',
      }));

    // Generate prompt
    const { system, user } = buildReadingAnalysisPrompt({
      testType: session.testType,
      rawScore: existingResult.rawScore,
      totalQuestions: existingResult.totalQuestions,
      bandScore: Number(existingResult.bandScore),
      timeSpentSeconds: session.timeSpentSeconds || 0,
      questionTypeBreakdown: (existingResult.questionTypeBreakdown as any) || {},
      incorrectAnswers,
    });

    // Call provider
    const analysis = await this.provider.analyze(system, user);

    // Save to DB
    await this.prisma.readingResult.update({
      where: { id: existingResult.id },
      data: {
        aiAnalysis: analysis as any,
      },
    });

    return analysis;
  }
}
