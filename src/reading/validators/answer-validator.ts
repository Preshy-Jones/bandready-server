import { Prisma, ReadingQuestionType } from '@prisma/client';

export interface AnswerEvaluation {
  isCorrect: boolean;
  score: number;
  total: number;
  persistedAnswer: Prisma.JsonValue;
  acceptedAnswers: string[] | Record<string, string>;
  details?: Record<
    string,
    { isCorrect: boolean; userAnswer: string; correctAnswer: string }
  >;
}

export function evaluateReadingAnswer(
  questionType: ReadingQuestionType,
  userAnswer: unknown,
  correctAnswer: Prisma.JsonValue,
): AnswerEvaluation {
  switch (questionType) {
    case ReadingQuestionType.MULTIPLE_CHOICE:
      return evaluateMultipleChoice(userAnswer, correctAnswer);
    case ReadingQuestionType.TRUE_FALSE_NOT_GIVEN:
    case ReadingQuestionType.YES_NO_NOT_GIVEN:
      return evaluateExactMatch(userAnswer, correctAnswer);
    case ReadingQuestionType.MATCHING_HEADINGS:
    case ReadingQuestionType.MATCHING_INFORMATION:
    case ReadingQuestionType.MATCHING_FEATURES:
    case ReadingQuestionType.MATCHING_SENTENCE_ENDINGS:
      return evaluateMatching(userAnswer, correctAnswer);
    case ReadingQuestionType.SENTENCE_COMPLETION:
    case ReadingQuestionType.SHORT_ANSWER:
      return evaluateTextAnswer(userAnswer, correctAnswer);
    case ReadingQuestionType.SUMMARY_COMPLETION:
    case ReadingQuestionType.DIAGRAM_LABEL:
      return evaluateMultiGapTextAnswer(userAnswer, correctAnswer);
    default:
      return evaluateExactMatch(userAnswer, correctAnswer);
  }
}

function evaluateMultipleChoice(
  userAnswer: unknown,
  correctAnswer: Prisma.JsonValue,
): AnswerEvaluation {
  const normUser = Array.isArray(userAnswer)
    ? userAnswer.map((u) => normalizeAnswerValue(u)).sort()
    : [normalizeAnswerValue(userAnswer)];

  const acceptedRaw = extractAcceptedAnswers(correctAnswer);
  const accepted = acceptedRaw.map((a) => normalizeAnswerValue(a)).sort();

  let correctCount = 0;
  for (const u of normUser) {
    if (accepted.includes(u)) {
      correctCount++;
    }
  }

  // MC total is the number of correct options required
  const total = accepted.length;
  // It's fully correct only if ALL required options are selected and NO extra incorrect options are selected
  // But standard MC gives 1 mark per correct selection, assuming they are separate questions.
  // In IELTS, usually separate questions (e.g., Q13, Q14), so each holds 1 mark.
  // If it's a multi-select mapped to ONE question, then score is correctCount.
  const isCorrect = correctCount === total && normUser.length === total;

  return {
    isCorrect,
    score: correctCount,
    total,
    persistedAnswer: wrapAnswer(userAnswer),
    acceptedAnswers: acceptedRaw,
  };
}

function evaluateExactMatch(
  userAnswer: unknown,
  correctAnswer: Prisma.JsonValue,
): AnswerEvaluation {
  const normUser = normalizeAnswerValue(userAnswer);
  const acceptedRaw = extractAcceptedAnswers(correctAnswer);
  const accepted = acceptedRaw.map((a) => normalizeAnswerValue(a));

  const isCorrect = accepted.includes(normUser);

  return {
    isCorrect,
    score: isCorrect ? 1 : 0,
    total: 1,
    persistedAnswer: wrapAnswer(userAnswer),
    acceptedAnswers: acceptedRaw,
  };
}

function evaluateMatching(
  userAnswer: unknown,
  correctAnswer: Prisma.JsonValue,
): AnswerEvaluation {
  // Matching questions typically have a map of item -> answer, e.g., { "A": "ii", "B": "iv" }
  // This helps score them at the question-set level if grouped, but if individual questions,
  // it might just be String match. Let's handle both.

  if (typeof correctAnswer === 'object' && correctAnswer !== null && !Array.isArray(correctAnswer)) {
    // Grouped matching: { "A": "ii", "B": "iv" }
    const correctMap = correctAnswer as Record<string, string>;
    const userMap = (typeof userAnswer === 'object' && userAnswer !== null && !Array.isArray(userAnswer)
      ? userAnswer
      : {}) as Record<string, string>;

    let score = 0;
    const total = Object.keys(correctMap).length;
    const details: Record<string, { isCorrect: boolean; userAnswer: string; correctAnswer: string }> = {};

    for (const [key, expectedRaw] of Object.entries(correctMap)) {
      const userRaw = userMap[key] || '';
      const normUser = normalizeAnswerValue(userRaw);
      const normExpected = normalizeAnswerValue(expectedRaw);
      const isCorrect = normExpected === normUser;

      if (isCorrect) score++;

      details[key] = {
        isCorrect,
        userAnswer: String(userRaw),
        correctAnswer: String(expectedRaw),
      };
    }

    // Usually grouped returns score out of total.
    return {
      isCorrect: score === total,
      score,
      total,
      persistedAnswer: wrapAnswer(userAnswer),
      acceptedAnswers: correctMap,
      details,
    };
  } else {
    // Individual matching question
    return evaluateExactMatch(userAnswer, correctAnswer);
  }
}

function evaluateTextAnswer(
  userAnswer: unknown,
  correctAnswer: Prisma.JsonValue,
): AnswerEvaluation {
  const normUserRaw = String(userAnswer || '').trim();
  const normUser = normalizeAnswerValue(userAnswer);
  const acceptedRaw = extractAcceptedAnswers(correctAnswer);
  const accepted = acceptedRaw.map((a) => normalizeAnswerValue(a));

  let isCorrect = accepted.includes(normUser);

  // If strict exact match fails, try spelling variations
  if (!isCorrect) {
    const userTokens = normUser.split(' ');
    for (const acc of accepted) {
      const accTokens = acc.split(' ');
      if (userTokens.length === accTokens.length) {
        let allTokensMatch = true;
        for (let i = 0; i < userTokens.length; i++) {
          if (!isSpellingVariation(userTokens[i], accTokens[i])) {
            allTokensMatch = false;
            break;
          }
        }
        if (allTokensMatch) {
          isCorrect = true;
          break;
        }
      }
    }
  }

  return {
    isCorrect,
    score: isCorrect ? 1 : 0,
    total: 1,
    persistedAnswer: wrapAnswer(userAnswer),
    acceptedAnswers: acceptedRaw,
  };
}

function evaluateMultiGapTextAnswer(
  userAnswer: unknown,
  correctAnswer: Prisma.JsonValue,
): AnswerEvaluation {
  // Similar to matching, could be an object { "gap1": "answer", "gap2": "answer" }
  if (typeof correctAnswer === 'object' && correctAnswer !== null && !Array.isArray(correctAnswer)) {
    const correctMap = correctAnswer as Record<string, Prisma.JsonValue>;
    const userMap = (typeof userAnswer === 'object' && userAnswer !== null && !Array.isArray(userAnswer)
      ? userAnswer
      : {}) as Record<string, unknown>;

    let score = 0;
    const total = Object.keys(correctMap).length;
    const details: Record<string, { isCorrect: boolean; userAnswer: string; correctAnswer: string }> = {};

    const acceptedFlattened: Record<string, string> = {};

    for (const [key, expectedObj] of Object.entries(correctMap)) {
      const userRaw = userMap[key] || '';
      
      const evalItem = evaluateTextAnswer(userRaw, expectedObj);
      if (evalItem.isCorrect) score++;

      details[key] = {
        isCorrect: evalItem.isCorrect,
        userAnswer: String(userRaw),
        // Just take the first accepted answer as the display correct answer
        correctAnswer: evalItem.acceptedAnswers[0] || '',
      };
      acceptedFlattened[key] = evalItem.acceptedAnswers[0] || '';
    }

    return {
      isCorrect: score === total,
      score,
      total,
      persistedAnswer: wrapAnswer(userAnswer),
      acceptedAnswers: acceptedFlattened,
      details,
    };
  } else {
    // Single gap
    return evaluateTextAnswer(userAnswer, correctAnswer);
  }
}

// Helpers

function wrapAnswer(answer: unknown): Prisma.JsonValue {
  if (
    answer === null ||
    typeof answer === 'string' ||
    typeof answer === 'number' ||
    typeof answer === 'boolean'
  ) {
    return { value: answer };
  }

  if (Array.isArray(answer)) {
    return { value: answer as Prisma.JsonArray };
  }

  if (typeof answer === 'object') {
    return answer as Prisma.JsonObject;
  }

  return { value: String(answer) };
}

function extractAcceptedAnswers(correctAnswer: Prisma.JsonValue): string[] {
  if (typeof correctAnswer === 'string') {
    return [correctAnswer];
  }

  if (Array.isArray(correctAnswer)) {
    return correctAnswer.map((item) => String(item));
  }

  if (correctAnswer && typeof correctAnswer === 'object') {
    const objectValue = correctAnswer as Record<string, Prisma.JsonValue>;
    if (typeof objectValue.answer === 'string') {
      return [objectValue.answer];
    }

    if (Array.isArray(objectValue.answers)) {
      return objectValue.answers.map((item) => String(item));
    }
  }

  return [String(correctAnswer)];
}

function normalizeAnswerValue(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }

  if (typeof value === 'object' && !Array.isArray(value)) {
    const record = value as Record<string, unknown>;
    if ('value' in record) {
      return normalizeAnswerValue(record.value);
    }
  }

  if (Array.isArray(value)) {
    return value.map((item) => normalizeAnswerValue(item)).join('|');
  }

  return String(value)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s/-]/g, ''); // Keep hyphens and slashes
}

function isSpellingVariation(userWord: string, correctWord: string): boolean {
  if (userWord === correctWord) return true;

  // British / American variations
  const BRITISH_AMERICAN_MAP: Record<string, string> = {
    colour: 'color',
    flavour: 'flavor',
    humour: 'humor',
    labour: 'labor',
    neighbour: 'neighbor',
    apologise: 'apologize',
    organise: 'organize',
    recognise: 'recognize',
    analyse: 'analyze',
    travelling: 'traveling',
    cancelled: 'canceled',
    programme: 'program',
    theatre: 'theater',
    centre: 'center',
    defence: 'defense',
    licence: 'license',
    behaviour: 'behavior',
  };

  if (
    BRITISH_AMERICAN_MAP[correctWord] === userWord ||
    BRITISH_AMERICAN_MAP[userWord] === correctWord
  ) {
    return true;
  }

  // Edit distance tolerance
  // Allow 1 character off for words > 4 characters
  if (correctWord.length >= 5) {
    const dist = levenshteinDistance(userWord, correctWord);
    if (dist <= 1) return true;
  }

  return false;
}

function levenshteinDistance(s: string, t: string): number {
  if (!s.length) return t.length;
  if (!t.length) return s.length;
  const arr: number[][] = [];
  for (let i = 0; i <= t.length; i++) {
    arr[i] = [i];
    for (let j = 1; j <= s.length; j++) {
      arr[i][j] =
        i === 0
          ? j
          : Math.min(
              arr[i - 1][j] + 1,
              arr[i][j - 1] + 1,
              arr[i - 1][j - 1] + (s[j - 1] === t[i - 1] ? 0 : 1)
            );
    }
  }
  return arr[t.length][s.length];
}
