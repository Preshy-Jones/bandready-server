export function buildReadingAnalysisPrompt(data: {
  testType: string;
  rawScore: number;
  totalQuestions: number;
  bandScore: number;
  timeSpentSeconds: number;
  questionTypeBreakdown: Record<string, { total: number; correct: number }>;
  incorrectAnswers: Array<{
    questionNumber: number;
    questionType: string;
    questionText: string;
    userAnswer: string;
    correctAnswer: string;
    skillTested: string;
    explanation: string;
  }>;
}): { system: string; user: string } {
  const system = `You are an expert IELTS Reading examiner and coach. Your job is to analyze a student's practice session data and provide detailed, actionable, and structured feedback.
You must return only raw JSON matching this TypeScript interface precisely, without markdown blocks (\`\`\`) or any other text.

interface ReadingAnalysisResponse {
  summary: string; // 2-3 sentence overview of their performance. E.g "Solid performance overall, achieving a Band 7.0. You demonstrated strong skimming abilities but struggled significantly with True/False/Not Given questions..."
  strengths: string[]; // 2-3 specific strengths
  weaknesses: string[]; // 2-3 specific weaknesses
  questionTypeAnalysis: {
    type: string; // The specific question type, e.g., "TRUE_FALSE_NOT_GIVEN"
    performance: 'strong' | 'average' | 'weak';
    insight: string; // Why the user likely struggles or excels here based on their specific incorrect answers.
    tip: string; // A specific, actionable strategy to improve.
  }[];
  skillScores: {
    skimming: number; // Score from 0 to 100
    scanning: number; // Score from 0 to 100
    inference: number; // Score from 0 to 100
    detailRecognition: number; // Score from 0 to 100
    vocabularyInContext: number; // Score from 0 to 100
  };
  timeManagementFeedback: string; // Brief feedback on their time management. (Average is ~90s per question or 20 mins per passage).
  recommendedPractice: string[]; // Top 3 concrete recommendations for what to practice next.
}`;

  const formatIncorrectAnswer = (ans: any) => `
- Question ${ans.questionNumber} (${ans.questionType}):
  Question text: "${ans.questionText}"
  Skill tested: ${ans.skillTested || 'General inference'}
  User's answer: "${Array.isArray(ans.userAnswer) ? ans.userAnswer.join(', ') : ans.userAnswer || '[BLANK]'}"
  Correct answer: "${Array.isArray(ans.correctAnswer) ? ans.correctAnswer.join(', ') : ans.correctAnswer}"
  Explanation: "${ans.explanation}"`;

  const incorrectDetails = data.incorrectAnswers.length > 0 
    ? data.incorrectAnswers.map(formatIncorrectAnswer).join('\n')
    : 'None! Perfect score.';

  const user = `Please analyze the following IELTS ${data.testType} Reading session.

Overall Performance:
- Raw Score: ${data.rawScore} / ${data.totalQuestions}
- Estimated Band Score: ${data.bandScore}
- Total Time Spent: ${Math.floor(data.timeSpentSeconds / 60)} minutes ${data.timeSpentSeconds % 60} seconds (${Math.round(data.timeSpentSeconds / Math.max(1, data.totalQuestions))} seconds per question average)

Question Type Breakdown (Total / Correct):
${Object.entries(data.questionTypeBreakdown).map(([type, stats]) => `- ${type}: ${stats.correct} / ${stats.total}`).join('\n')}

Incorrect Answers Details:
${incorrectDetails}

Based on this data, return the strictly formatted JSON analysis.`;

  return { system, user };
}
