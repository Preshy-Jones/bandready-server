import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { PracticeService } from './practice.service';
import { SpeechAnalysisService } from './services/speech-analysis.service';
import { UsersService } from '../users/users.service';
import { Prisma } from '@prisma/client';

interface QuestionSequence {
  part1: string[]; // 4 question IDs
  part2: string;   // 1 question ID
  part3: string[]; // 3 question IDs
}

@Injectable()
export class MockTestService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly practiceService: PracticeService,
    private readonly speechAnalysis: SpeechAnalysisService,
    private readonly usersService: UsersService,
  ) {}

  /**
   * Start a new mock test with realistic question sequencing
   * Pre-selects all questions upfront with proper context
   */
  async startMockTest(userId: string, timingMode: 'strict' | 'flexible') {
    // Check if user can start (need 8 sessions: 4 Part 1 + 1 Part 2 + 3 Part 3)
    const canStart = await this.usersService.canStartSession(userId);
    if (!canStart) {
      throw new ForbiddenException('Daily session limit reached. Upgrade to premium for unlimited sessions.');
    }

    // STEP 1: Select all questions upfront with proper context
    console.log('[MockTest] Selecting questions with contextual flow...');

    // Get Part 1 questions (4 from same topic for contextual coherence)
    const part1Questions = await this.getContextualPart1Questions();
    console.log('[MockTest] Part 1 questions selected from topic:', part1Questions[0].topic);

    // Get Part 2 question (1 cue card)
    const part2Question = await this.getPart2Question();
    console.log('[MockTest] Part 2 question selected:', part2Question.topic);

    // Get Part 3 questions (3 related to Part 2 topic)
    const part3Questions = await this.getPart3QuestionsRelatedTo(part2Question.topic);
    console.log('[MockTest] Part 3 questions selected, related to Part 2');

    // Build question sequence
    const questionSequence: QuestionSequence = {
      part1: part1Questions.map(q => q.id),
      part2: part2Question.id,
      part3: part3Questions.map(q => q.id),
    };

    // STEP 2: Create mock test record with question sequence
    const mockTest = await this.prisma.mockTest.create({
      data: {
        userId,
        timingMode,
        currentPart: 1,
        currentQuestion: 1,
        status: 'in_progress',
        questionSequence: questionSequence as any,
        part2Topic: part2Question.topic,
      },
    });

    // STEP 3: Create first session (Part 1, Question 1)
    await this.usersService.incrementDailySession(userId);
    const firstSession = await this.prisma.practiceSession.create({
      data: {
        userId,
        questionId: part1Questions[0].id,
        part: 1,
        mockTestId: mockTest.id,
        questionNumber: 1,
      },
      include: {
        question: true,
      },
    });

    console.log('[MockTest] Mock test started with ID:', mockTest.id);

    return {
      mockTestId: mockTest.id,
      timingMode: mockTest.timingMode,
      currentPart: 1,
      currentQuestion: 1,
      session: firstSession,
    };
  }

  /**
   * Get current state of mock test
   */
  async getCurrentState(mockTestId: string, userId: string) {
    console.log('[MockTest] getCurrentState called for mockTestId:', mockTestId);

    const mockTest = await this.prisma.mockTest.findUnique({
      where: { id: mockTestId },
      include: {
        sessions: {
          orderBy: { questionNumber: 'asc' },
          include: { question: true },
        },
      },
    });

    if (!mockTest || mockTest.userId !== userId) {
      throw new BadRequestException('Mock test not found');
    }

    // Get current session (last one created)
    const currentSession = mockTest.sessions[mockTest.sessions.length - 1];
    console.log('[MockTest] Current session:', {
      id: currentSession?.id,
      part: currentSession?.part,
      questionNumber: currentSession?.questionNumber,
      totalSessions: mockTest.sessions.length
    });

    // Calculate progress
    const totalQuestions = 8; // 4 Part 1 + 1 Part 2 + 3 Part 3
    const completedSessions = mockTest.sessions.filter(s => s.completedAt).length;

    return {
      mockTest: {
        id: mockTest.id,
        timingMode: mockTest.timingMode,
        currentPart: mockTest.currentPart,
        currentQuestion: mockTest.currentQuestion,
        status: mockTest.status,
      },
      currentSession,
      totalQuestions,
      completedQuestions: completedSessions,
    };
  }

  /**
   * Submit current question and get next from pre-selected sequence
   */
  async submitQuestionAndGetNext(mockTestId: string, sessionId: string, userId: string) {
    console.log('[MockTest] submitQuestionAndGetNext called:', { mockTestId, sessionId, userId });

    const mockTest = await this.prisma.mockTest.findUnique({
      where: { id: mockTestId },
      include: {
        sessions: {
          orderBy: { questionNumber: 'asc' },
        },
      },
    });

    if (!mockTest || mockTest.userId !== userId) {
      console.error('[MockTest] Mock test not found or unauthorized');
      throw new BadRequestException('Mock test not found');
    }

    console.log('[MockTest] Found mock test with sessions:', mockTest.sessions.map(s => ({ id: s.id, part: s.part, questionNumber: s.questionNumber })));
    console.log('[MockTest] Looking for session ID:', sessionId);

    // If sessionId not provided (or undefined), use the current session from mock test
    let session;
    if (!sessionId) {
      console.log('[MockTest] No sessionId provided, using current session from mock test state');
      // Get the session matching current part and question
      session = mockTest.sessions.find(
        s => s.part === mockTest.currentPart && s.questionNumber === mockTest.currentQuestion
      );
      if (!session && mockTest.sessions.length > 0) {
        // Fallback: use last created session
        session = mockTest.sessions[mockTest.sessions.length - 1];
        console.log('[MockTest] Using last created session as fallback:', session?.id);
      }
    } else {
      session = mockTest.sessions.find(s => s.id === sessionId);
    }

    if (!session) {
      console.error('[MockTest] Session not found. Available sessions:', mockTest.sessions.map(s => s.id));
      throw new BadRequestException('Session not found in this mock test');
    }

    console.log('[MockTest] Using session:', { id: session.id, part: session.part, questionNumber: session.questionNumber });

    if (!mockTest.questionSequence) {
      throw new BadRequestException('Question sequence not found for this mock test');
    }

    // Determine next question/part
    const { nextPart, nextQuestionNumber, isComplete } = this.getNextQuestion(
      mockTest.currentPart,
      mockTest.currentQuestion,
    );

    if (isComplete) {
      return {
        isComplete: true,
        mockTestId,
      };
    }

    // Get next question ID from pre-selected sequence
    const sequence = mockTest.questionSequence as any as QuestionSequence;
    let nextQuestionId: string;

    if (nextPart === 1) {
      nextQuestionId = sequence.part1[nextQuestionNumber - 1];
    } else if (nextPart === 2) {
      nextQuestionId = sequence.part2;
    } else if (nextPart === 3) {
      nextQuestionId = sequence.part3[nextQuestionNumber - 1];
    } else {
      throw new BadRequestException('Invalid part number');
    }

    // Update mock test state
    await this.prisma.mockTest.update({
      where: { id: mockTestId },
      data: {
        currentPart: nextPart,
        currentQuestion: nextQuestionNumber,
      },
    });

    // Create next session with pre-selected question
    await this.usersService.incrementDailySession(userId);

    const nextSession = await this.prisma.practiceSession.create({
      data: {
        userId,
        questionId: nextQuestionId,
        part: nextPart,
        mockTestId: mockTest.id,
        questionNumber: nextQuestionNumber,
      },
      include: {
        question: true,
      },
    });

    console.log('[MockTest] Advanced to Part', nextPart, 'Question', nextQuestionNumber);

    return {
      isComplete: false,
      nextSession,
      mockTestState: {
        id: mockTest.id,
        timingMode: mockTest.timingMode,
        currentPart: nextPart,
        currentQuestion: nextQuestionNumber,
        status: mockTest.status,
      },
    };
  }

  /**
   * Finalize mock test - calculate overall score and generate analysis
   */
  async finalizeMockTest(mockTestId: string, userId: string) {
    const mockTest = await this.prisma.mockTest.findUnique({
      where: { id: mockTestId },
      include: {
        sessions: {
          where: { completedAt: { not: null } },
          orderBy: { part: 'asc' },
          include: { question: true },
        },
      },
    });

    if (!mockTest || mockTest.userId !== userId) {
      throw new BadRequestException('Mock test not found');
    }

    if (mockTest.sessions.length === 0) {
      throw new BadRequestException('No completed sessions found');
    }

    // Calculate overall score (average of all session scores)
    const totalScore = mockTest.sessions.reduce(
      (sum, session) => sum + Number(session.overallBandScore || 0),
      0,
    );
    const overallScore = totalScore / mockTest.sessions.length;

    // Generate cross-part analysis
    const crossPartAnalysis = await this.generateCrossPartAnalysis(mockTest.sessions);

    // Update mock test
    await this.prisma.mockTest.update({
      where: { id: mockTestId },
      data: {
        status: 'completed',
        overallScore,
        crossPartAnalysis: crossPartAnalysis as Prisma.InputJsonValue,
        completedAt: new Date(),
      },
    });

    return {
      mockTestId,
      overallScore,
      completedAt: new Date(),
    };
  }

  /**
   * Get comprehensive results for completed mock test
   */
  async getComprehensiveResults(mockTestId: string, userId: string) {
    const mockTest = await this.prisma.mockTest.findUnique({
      where: { id: mockTestId },
      include: {
        sessions: {
          where: { completedAt: { not: null } },
          orderBy: [{ part: 'asc' }, { questionNumber: 'asc' }],
          include: { question: true },
        },
      },
    });

    if (!mockTest || mockTest.userId !== userId) {
      throw new BadRequestException('Mock test not found');
    }

    // Group sessions by part
    const part1Sessions = mockTest.sessions.filter(s => s.part === 1);
    const part2Sessions = mockTest.sessions.filter(s => s.part === 2);
    const part3Sessions = mockTest.sessions.filter(s => s.part === 3);

    // Calculate part averages
    const calculateAverage = (sessions: any[]) => {
      if (sessions.length === 0) return 0;
      const total = sessions.reduce((sum, s) => sum + Number(s.overallBandScore || 0), 0);
      return total / sessions.length;
    };

    const part1AvgScore = calculateAverage(part1Sessions);
    const part2Score = part2Sessions[0]?.overallBandScore ? Number(part2Sessions[0].overallBandScore) : 0;
    const part3AvgScore = calculateAverage(part3Sessions);

    // Calculate total duration
    const totalDuration = mockTest.sessions.reduce(
      (sum, s) => sum + Number(s.audioDurationSeconds || 0),
      0,
    );

    return {
      mockTestId: mockTest.id,
      overallScore: mockTest.overallScore ? Number(mockTest.overallScore) : 0,
      totalDuration,
      totalQuestions: mockTest.sessions.length,

      part1Sessions,
      part1AvgScore,

      part2Session: part2Sessions[0] || null,
      part2Score,

      part3Sessions,
      part3AvgScore,

      crossPartAnalysis: mockTest.crossPartAnalysis,
      completedAt: mockTest.completedAt,
    };
  }

  /**
   * Generate cross-part analysis using Claude AI
   */
  private async generateCrossPartAnalysis(sessions: any[]) {
    const part1Sessions = sessions.filter(s => s.part === 1);
    const part2Session = sessions.find(s => s.part === 2);
    const part3Sessions = sessions.filter(s => s.part === 3);

    const prompt = `You are an expert IELTS examiner analyzing a complete speaking test.

PART 1 - Introduction & Interview (${part1Sessions.length} questions):
${part1Sessions.map((s, i) => `
Question ${i + 1}: ${s.question.questionText}
Answer: ${s.transcript}
Score: ${s.overallBandScore}
`).join('\n')}

PART 2 - Long Turn (Cue Card):
Topic: ${part2Session?.question.questionText}
Answer: ${part2Session?.transcript}
Score: ${part2Session?.overallBandScore}

PART 3 - Two-way Discussion (${part3Sessions.length} questions):
${part3Sessions.map((s, i) => `
Question ${i + 1}: ${s.question.questionText}
Answer: ${s.transcript}
Score: ${s.overallBandScore}
`).join('\n')}

Analyze the candidate's OVERALL performance across all three parts. Provide comprehensive analysis in JSON format:

{
  "consistencyScore": <0-100 based on score variance>,
  "strengths": [
    "<cross-part strength 1>",
    "<cross-part strength 2>",
    "<cross-part strength 3>"
  ],
  "weaknesses": [
    "<cross-part weakness 1>",
    "<cross-part weakness 2>",
    "<cross-part weakness 3>"
  ],
  "overallFeedback": "<comprehensive 3-4 sentence summary of overall performance>",
  "improvementPlan": [
    "<actionable step 1>",
    "<actionable step 2>",
    "<actionable step 3>",
    "<actionable step 4>",
    "<actionable step 5>"
  ]
}

Focus on:
1. Performance consistency across parts
2. Patterns in strengths (vocabulary, fluency, grammar, pronunciation)
3. Recurring weaknesses
4. Overall band score justification
5. Specific, actionable improvement steps

Return ONLY valid JSON.`;

    try {
      const response = await this.speechAnalysis['anthropic'].messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 3072,
        messages: [{ role: 'user', content: prompt }],
      });

      const content = response.content[0];
      if (content.type !== 'text') {
        throw new Error('Unexpected response type');
      }

      return this.speechAnalysis['parseJSONFromResponse'](content.text, 'generateCrossPartAnalysis');
    } catch (error) {
      console.error('[MockTestService] Failed to generate cross-part analysis:', error);
      // Return fallback analysis
      return {
        consistencyScore: 50,
        strengths: ['Completed full mock test'],
        weaknesses: ['Analysis generation failed'],
        overallFeedback: 'Analysis could not be generated. Please try again.',
        improvementPlan: ['Continue practicing all three parts'],
      };
    }
  }

  /**
   * Determine next question/part based on current state
   */
  private getNextQuestion(currentPart: number, currentQuestion: number): {
    nextPart: number;
    nextQuestionNumber: number;
    isComplete: boolean;
  } {
    // Part 1: 4 questions
    if (currentPart === 1) {
      if (currentQuestion < 4) {
        return { nextPart: 1, nextQuestionNumber: currentQuestion + 1, isComplete: false };
      } else {
        return { nextPart: 2, nextQuestionNumber: 1, isComplete: false };
      }
    }

    // Part 2: 1 question (cue card)
    if (currentPart === 2) {
      return { nextPart: 3, nextQuestionNumber: 1, isComplete: false };
    }

    // Part 3: 3 questions
    if (currentPart === 3) {
      if (currentQuestion < 3) {
        return { nextPart: 3, nextQuestionNumber: currentQuestion + 1, isComplete: false };
      } else {
        return { nextPart: 3, nextQuestionNumber: 3, isComplete: true };
      }
    }

    throw new BadRequestException('Invalid part/question state');
  }

  /**
   * Get 4 Part 1 questions from the SAME topic for contextual coherence
   * This ensures realistic flow like: "Where do you live?" → "What do you like about living there?"
   */
  private async getContextualPart1Questions() {
    // Get all Part 1 topics
    const allTopics = await this.prisma.speakingQuestion.groupBy({
      by: ['topic'],
      where: { part: 1, isActive: true },
      _count: true,
    });

    // Filter topics that have at least 4 questions
    const topicsWithEnoughQuestions = allTopics.filter(t => t._count >= 4);

    if (topicsWithEnoughQuestions.length === 0) {
      throw new BadRequestException('Not enough Part 1 questions available. Need at least one topic with 4+ questions.');
    }

    // Pick a random topic
    const selectedTopic = topicsWithEnoughQuestions[Math.floor(Math.random() * topicsWithEnoughQuestions.length)];

    // Get 4 questions from that topic
    const questions = await this.prisma.speakingQuestion.findMany({
      where: {
        part: 1,
        topic: selectedTopic.topic,
        isActive: true,
      },
      take: 4,
    });

    return questions;
  }

  /**
   * Get 1 Part 2 cue card question
   */
  private async getPart2Question() {
    const questions = await this.prisma.speakingQuestion.findMany({
      where: { part: 2, isActive: true },
    });

    if (questions.length === 0) {
      throw new BadRequestException('No Part 2 questions available');
    }

    // Return random cue card
    const randomIndex = Math.floor(Math.random() * questions.length);
    return questions[randomIndex];
  }

  /**
   * Get 3 Part 3 questions RELATED to the Part 2 topic
   * This ensures Part 3 discussion flows naturally from Part 2
   * Example: Part 2 about "a book" → Part 3 discusses reading habits, literature, education
   */
  private async getPart3QuestionsRelatedTo(part2Topic: string) {
    // First, try to find Part 3 questions with matching relatedPart2Topic
    let questions = await this.prisma.speakingQuestion.findMany({
      where: {
        part: 3,
        relatedPart2Topic: part2Topic,
        isActive: true,
      },
      take: 3,
    });

    // If no related questions found, fall back to same topic
    if (questions.length < 3) {
      console.log('[MockTest] No relatedPart2Topic match, falling back to same topic:', part2Topic);
      questions = await this.prisma.speakingQuestion.findMany({
        where: {
          part: 3,
          topic: part2Topic,
          isActive: true,
        },
        take: 3,
      });
    }

    // If still not enough, just get any Part 3 questions
    if (questions.length < 3) {
      console.log('[MockTest] Not enough topic-specific Part 3 questions, using random selection');
      const allPart3 = await this.prisma.speakingQuestion.findMany({
        where: { part: 3, isActive: true },
      });

      if (allPart3.length < 3) {
        throw new BadRequestException('Not enough Part 3 questions available');
      }

      // Shuffle and take 3
      const shuffled = allPart3.sort(() => 0.5 - Math.random());
      questions = shuffled.slice(0, 3);
    }

    return questions;
  }
}
