import { PrismaClient, Role, ExamType, TaskType } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

// Utility for generating dates
const pastDate = (daysAgo: number) => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date;
};

// Utility for random floats
const randomScore = (min: number, max: number) => {
  // Returns score in 0.5 increments
  const raw = min + Math.random() * (max - min);
  return Math.round(raw * 2) / 2;
}

const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

// Pick random items
const sample = <T>(arr: T[], count: number = 1): T[] => {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

// Fake transcripts and details
const fillerWords = ["um", "uh", "you know", "like", "actually"];
const fillerDetail = fillerWords.map(w => ({ word: w, count: randomInt(0, 5) }));

const pauseLocations = [
  { start: 2.1, end: 3.5, duration: 1.4 },
  { start: 10.5, end: 12.0, duration: 1.5 },
];

async function main() {
  console.log('🚀 Starting Demo Seeder...');

  const demoEmail = 'babalolas773@gmail.com';

  // 1. Clean up existing demo user
  const existingUser = await prisma.user.findUnique({ where: { email: demoEmail } });
  if (existingUser) {
    console.log('🧹 Cleaning up existing demo user data...');
    // Because of Cascade delete on relations, deleting the user should delete their sessions, etc.
    await prisma.user.delete({ where: { id: existingUser.id } });
  }

  // 2. Fetch existing questions to use
  const speakingQuestions = await prisma.speakingQuestion.findMany();
  const writingQuestions = await prisma.writingQuestion.findMany({
    include: { modelEssays: true }
  });

  if (speakingQuestions.length === 0 || writingQuestions.length === 0) {
    console.error('❌ Error: Base questions not found. Please run the standard seed first: `npm run db:seed`');
    process.exit(1);
  }

  // 3. Create Demo User
  console.log('👤 Creating Demo User...');
  const passwordHash = await bcrypt.hash('Demo@123', 10);
  const user = await prisma.user.create({
    data: {
      email: demoEmail,
      passwordHash,
      fullName: 'Jane Doe (Demo)',
      targetBandScore: 8.0,
      targetExamDate: pastDate(-14), // 2 weeks from now
      nativeLanguage: 'Spanish',
      country: 'Spain',
      examType: ExamType.ACADEMIC,
      subscriptionTier: 'premium',
      subscriptionExpiresAt: pastDate(-180), // 6 months from now
      isEmailVerified: true,
      speakingBalance: 9999,
      writingBalance: 9999,
      role: Role.USER,
      createdAt: pastDate(65),
    }
  });

  console.log('💳 Creating Mock Payment Transaction...');
  await prisma.paymentTransaction.create({
    data: {
      userId: user.id,
      provider: 'paddle',
      plan: 'premium_annual',
      amountCents: 9900, // $99.00
      currency: 'USD',
      reference: `PADDLE_DEMO_${Date.now()}`,
      status: 'SUCCESS',
      paidAt: pastDate(65),
      subscriptionStartsAt: pastDate(65),
      subscriptionEndsAt: pastDate(-300),
    }
  });

  // 4. Generate Speaking Sessions (Progressing from 6.0 to 8.0 over 30 days)
  console.log('🎙️ Generating Speaking Sessions (progressing over 30 days)...');
  const totalSpeakingDays = 30;
  const speakingSessionsToCreate = 45;
  const speakingSessions: any[] = [];

  for (let i = 0; i < speakingSessionsToCreate; i++) {
    // Distribute sessions over the 60 days
    const daysAgo = totalSpeakingDays - Math.floor((i / speakingSessionsToCreate) * totalSpeakingDays);
    const sessionDate = pastDate(daysAgo);
    
    // Score logic: gradual improvement
    const baseScore = 6.0 + (i / Math.max(1, speakingSessionsToCreate - 1)) * 2.0; // Min 6.0, max 8.0
    const overall = randomScore(baseScore - 0.5, baseScore + 0.5);
    const fcs = randomScore(overall - 0.5, overall + 0.5);
    const lrs = randomScore(overall - 0.5, overall + 0.5);
    const gas = randomScore(overall - 0.5, overall + 0.5);
    const ps = randomScore(overall - 0.5, overall + 0.5);

    const wpm = randomInt(110, 150) + (i / 2); // WPM improves slightly
    const totalWords = randomInt(80, 250);
    const fillers = Math.max(0, randomInt(10, 20) - (i / 3)); // Fillers decrease
    
    const question = sample(speakingQuestions, 1)[0];

    const session = await prisma.practiceSession.create({
      data: {
        userId: user.id,
        questionId: question.id,
        part: question.part,
        audioDurationSeconds: (totalWords / wpm) * 60,
        transcript: "This is a dummy transcript generated for the demo user based on the selected question topic. The user talked about various aspects demonstrating their vocabulary and grammar capabilities. " + question.questionText,
        transcriptWithTimestamps: { data: [{ word: "This", start: 0.1, end: 0.3 }] },
        overallBandScore: overall,
        fluencyCoherenceScore: fcs,
        lexicalResourceScore: lrs,
        grammarAccuracyScore: gas,
        pronunciationScore: ps,
        wordsPerMinute: wpm,
        totalWords: totalWords,
        fillerWordCount: Math.round(fillers),
        fillerWordsDetail: fillerDetail,
        pauseCount: randomInt(1, 5),
        longPauseCount: randomInt(0, 2),
        pauseLocations: pauseLocations,
        feedbackFluency: "Great improvement in fluency. Try to reduce filler words.",
        feedbackVocabulary: "Good use of topic-specific vocabulary.",
        feedbackGrammar: "Watch out for subject-verb agreement in complex sentences.",
        feedbackPronunciation: "Clear pronunciation, intonation is natural.",
        feedbackOverall: "A solid effort. Keep practicing to maintain this level.",
        vocabularySuggestions: [{ original: "good", suggested: "excellent", context: "It was a good experience" }],
        grammarCorrections: [{ original: "He go", suggested: "He goes", context: "He go to the store" }],
        mispronouncedWords: ["specifically", "rural"],
        modelAnswer: "A model answer demonstrating a Band 9 response to this specific question...",
        enhancedModelAnswer: { tips: ["Use more idioms", "Extend your answer with an example"] },
        prepTimeUsedSeconds: question.part === 2 ? 60 : null,
        speakingTimeSeconds: (totalWords / wpm) * 60,
        completedAt: sessionDate,
        createdAt: sessionDate,
      }
    });

    speakingSessions.push(session);
  }

  // 5. Generate Writing Sessions (Progressing from 6.0 to 8.0 over 30 days)
  console.log('✍️ Generating Writing Sessions (progressing over 30 days)...');
  const writingSessionsToCreate = 35;
  const writingEssays: any[] = [];
  
  for (let i = 0; i < writingSessionsToCreate; i++) {
    const daysAgo = totalSpeakingDays - Math.floor((i / writingSessionsToCreate) * totalSpeakingDays);
    const sessionDate = pastDate(daysAgo);

    const baseScore = 6.0 + (i / Math.max(1, writingSessionsToCreate - 1)) * 2.0; // Min 6.0, max 8.0
    const overall = randomScore(baseScore - 0.5, baseScore + 0.5);
    const trs = randomScore(overall - 0.5, overall + 0.5);
    const ccs = randomScore(overall - 0.5, overall + 0.5);
    const lrs = randomScore(overall - 0.5, overall + 0.5);
    const gas = randomScore(overall - 0.5, overall + 0.5);

    const question = sample(writingQuestions, 1)[0];
    const isTask1 = question.taskType === TaskType.TASK1;
    const wordCount = isTask1 ? randomInt(150, 200) : randomInt(250, 350);
    const timeSpent = isTask1 ? randomInt(15 * 60, 25 * 60) : randomInt(35 * 60, 45 * 60);

    const submission = await prisma.essaySubmission.create({
      data: {
        userId: user.id,
        questionId: question.id,
        essayText: "This is a sample essay written by the demo user. It contains multiple paragraphs discussing the topic at hand. The user has tried to incorporate complex sentence structures and advanced vocabulary. " + question.prompt,
        wordCount: wordCount,
        timeSpentSeconds: timeSpent,
        taskResponseScore: trs,
        coherenceCohesionScore: ccs,
        lexicalResourceScore: lrs,
        grammarAccuracyScore: gas,
        overallBandScore: overall,
        sessionType: 'PRACTICE',
        submittedAt: sessionDate,
      }
    });

    // Create Feedback for the essay
    const feedback = await prisma.essayFeedback.create({
      data: {
        essayId: submission.id,
        taskResponseFeedback: "Good task response. You addressed all parts of the prompt.",
        coherenceCohesionFeedback: "Paragraphing is logical, but use more cohesive devices.",
        lexicalResourceFeedback: "Some good vocabulary used, but watch out for repetitive words.",
        grammarAccuracyFeedback: "Overall good control, a few minor errors with articles.",
        overallFeedback: "A strong essay that clearly meets the requirements of the task.",
        annotations: [
          { startIndex: 10, endIndex: 20, color: "green", type: "vocabulary", explanation: "Excellent phrase" },
          { startIndex: 50, endIndex: 60, color: "red", type: "grammar", explanation: "Article missing" }
        ],
        examinerInsights: [
          { sentence: "The chart shows...", issue: "Basic opening", bandImpact: "-0.5" }
        ],
        priorityFixes: [
          { issue: "Article misuse", explanation: "You often drop 'the' before specific nouns.", drillType: "GRAMMAR" }
        ],
        detectedErrors: [
          { category: "GRAMMAR", specificError: "article_misuse", sentence: "I went to hospital.", correction: "I went to the hospital." }
        ],
        vocabularySuggestions: [
          { original: "important", suggested: "crucial", context: "It is an important factor." }
        ],
        createdAt: sessionDate,
      }
    });

    writingEssays.push({ submission, feedback });
  }

  // 6. Generate Weaknesses & Drill Attempts
  console.log('🏋️ Generating Weaknesses & Drills...');
  
  const weaknesses = [
    { category: 'GRAMMAR', specificError: 'article_misuse', displayName: 'Article Misuse', severity: 'HIGH' },
    { category: 'VOCABULARY', specificError: 'basic_adjectives', displayName: 'Basic Adjectives', severity: 'MEDIUM' },
    { category: 'COHERENCE', specificError: 'weak_transitions', displayName: 'Weak Transitions', severity: 'LOW' }
  ];

  const createdWeaknesses = await Promise.all(
    weaknesses.map(w => prisma.writingWeakness.create({
      data: {
        userId: user.id,
        category: w.category as any,
        specificError: w.specificError,
        displayName: w.displayName,
        severity: w.severity as any,
        frequency: randomInt(5, 20),
        status: 'IMPROVING',
        lastOccurrence: pastDate(randomInt(1, 10)),
        createdAt: pastDate(40),
        updatedAt: new Date()
      }
    }))
  );

  const drills = await prisma.writingDrill.findMany({ take: 10 });
  if (drills.length > 0) {
    for (let i = 0; i < 20; i++) {
        const drill = sample(drills, 1)[0];
        const attemptDate = pastDate(randomInt(1, 40));
        await prisma.drillAttempt.create({
            data: {
                userId: user.id,
                drillId: drill.id,
                userAnswer: "This was my attempt",
                isCorrect: Math.random() > 0.3, // 70% chance correct
                timeSpentSeconds: randomInt(30, 120),
                attemptedAt: attemptDate,
            }
        });
    }
  }

  // 7. Generate Mock Tests
  console.log('📝 Generating Full Mock Tests linking Practice Sessions...');
  
  // Create 3 mock tests, assigning some existing speaking sessions
  for (let i = 0; i < 3; i++) {
    const mockTestDate = pastDate(10 + (i * 15)); // Spread them out
    
    // Grab 3 random sequential parts for speaking
    const p1 = sample(speakingSessions.filter(s => s.part === 1), 1)[0];
    const p2 = sample(speakingSessions.filter(s => s.part === 2), 1)[0];
    const p3 = sample(speakingSessions.filter(s => s.part === 3), 1)[0];

    // Average score of the parts
    const overall = ((Number(p1.overallBandScore) + Number(p2.overallBandScore) + Number(p3.overallBandScore)) / 3).toFixed(1);

    const mockTest = await prisma.mockTest.create({
      data: {
        userId: user.id,
        timingMode: "strict",
        currentPart: 3,
        currentQuestion: 3,
        status: "completed",
        overallScore: Number(overall),
        crossPartAnalysis: {
            fluencyTrend: "Improving across parts",
            vocabularyRange: "Adequate but repetitive in Part 3"
        },
        startedAt: new Date(mockTestDate.getTime() - 15 * 60000), // 15 mins earlier
        completedAt: mockTestDate,
      }
    });

    // Update the sessions to link to this mock test
    await prisma.practiceSession.updateMany({
        where: { id: { in: [p1.id, p2.id, p3.id] } },
        data: { mockTestId: mockTest.id }
    });
  }

  // 8. Generate Progress Aggregations
  console.log('📊 Updating User Progress aggregations...');
  
  await prisma.userProgress.create({
    data: {
      userId: user.id,
      avgOverallScore: 7.5,
      avgFluencyScore: 7.5,
      avgLexicalScore: 7.0,
      avgGrammarScore: 7.5,
      avgPronunciationScore: 7.5,
      totalSessions: speakingSessions.length,
      totalPracticeMinutes: (speakingSessions.reduce((acc, s) => acc + (Number(s.audioDurationSeconds) || 0), 0) / 60),
      currentStreakDays: 5,
      longestStreakDays: 14,
      lastPracticeDate: new Date(),
      weakAreas: ["Idioms", "Complex Grammar", "Part 3 Elaboration"],
      strongAreas: ["Pronunciation clarity", "Vocabulary related to work"],
      part1AvgScore: 7.5,
      part2AvgScore: 7.5,
      part3AvgScore: 7.0,
    }
  });

  await prisma.writingProgress.create({
      data: {
          userId: user.id,
          avgOverallScore: 7.5,
          avgTaskResponse: 7.5,
          avgCoherence: 7.0,
          avgLexical: 7.5,
          avgGrammar: 7.5,
          avgTask1Score: 7.5,
          avgTask2Score: 7.5,
          totalEssays: writingEssays.length,
          totalDrillsCompleted: 20,
          totalPracticeMinutes: (writingEssays.reduce((acc, e) => acc + (e.submission.timeSpentSeconds), 0) / 60),
          milestones: ["First Essay Submitted", "Band 8 Achieved", "10 Essasy streak"],
          examReadyTask1: true,
          examReadyTask2: true,
      }
  })

  console.log('🎉 Demo Seeder Complete! Login with demouser@bandready.app / Demo@123');
}

main()
  .catch((e) => {
    console.error('❌ Demo Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
