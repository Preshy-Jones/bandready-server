import { ReadingQuestionType } from '@prisma/client';
import { evaluateReadingAnswer, AnswerEvaluation } from './answer-validator';

describe('Answer Validator', () => {
  // ──────────────────────────────────────────
  // MULTIPLE CHOICE
  // ──────────────────────────────────────────
  describe('MULTIPLE_CHOICE', () => {
    const type = ReadingQuestionType.MULTIPLE_CHOICE;

    it('single correct answer returns isCorrect: true', () => {
      const result = evaluateReadingAnswer(type, 'B', 'B');
      expect(result.isCorrect).toBe(true);
      expect(result.score).toBe(1);
      expect(result.total).toBe(1);
    });

    it('single wrong answer returns isCorrect: false', () => {
      const result = evaluateReadingAnswer(type, 'A', 'B');
      expect(result.isCorrect).toBe(false);
      expect(result.score).toBe(0);
    });

    it('case-insensitive match', () => {
      const result = evaluateReadingAnswer(type, 'b', 'B');
      expect(result.isCorrect).toBe(true);
    });

    it('multi-select: all correct returns isCorrect: true', () => {
      const result = evaluateReadingAnswer(type, ['A', 'C'], ['A', 'C']);
      expect(result.isCorrect).toBe(true);
      expect(result.score).toBe(2);
      expect(result.total).toBe(2);
    });

    it('multi-select: partial match returns isCorrect: false', () => {
      const result = evaluateReadingAnswer(type, ['A', 'D'], ['A', 'C']);
      expect(result.isCorrect).toBe(false);
      expect(result.score).toBe(1);
      expect(result.total).toBe(2);
    });

    it('multi-select: extra selections returns isCorrect: false', () => {
      const result = evaluateReadingAnswer(type, ['A', 'B', 'C'], ['A', 'C']);
      expect(result.isCorrect).toBe(false);
    });

    it('correctAnswer as object with answer key', () => {
      const result = evaluateReadingAnswer(type, 'B', { answer: 'B' });
      expect(result.isCorrect).toBe(true);
    });

    it('correctAnswer as object with answers array', () => {
      const result = evaluateReadingAnswer(type, ['A', 'C'], { answers: ['A', 'C'] });
      expect(result.isCorrect).toBe(true);
    });
  });

  // ──────────────────────────────────────────
  // TRUE / FALSE / NOT GIVEN
  // ──────────────────────────────────────────
  describe('TRUE_FALSE_NOT_GIVEN', () => {
    const type = ReadingQuestionType.TRUE_FALSE_NOT_GIVEN;

    it('exact match TRUE', () => {
      const result = evaluateReadingAnswer(type, 'TRUE', 'TRUE');
      expect(result.isCorrect).toBe(true);
    });

    it('exact match FALSE', () => {
      const result = evaluateReadingAnswer(type, 'FALSE', 'FALSE');
      expect(result.isCorrect).toBe(true);
    });

    it('exact match NOT GIVEN', () => {
      const result = evaluateReadingAnswer(type, 'NOT GIVEN', 'NOT GIVEN');
      expect(result.isCorrect).toBe(true);
    });

    it('case-insensitive', () => {
      const result = evaluateReadingAnswer(type, 'true', 'TRUE');
      expect(result.isCorrect).toBe(true);
    });

    it('wrong answer', () => {
      const result = evaluateReadingAnswer(type, 'TRUE', 'FALSE');
      expect(result.isCorrect).toBe(false);
      expect(result.score).toBe(0);
      expect(result.total).toBe(1);
    });
  });

  // ──────────────────────────────────────────
  // YES / NO / NOT GIVEN
  // ──────────────────────────────────────────
  describe('YES_NO_NOT_GIVEN', () => {
    const type = ReadingQuestionType.YES_NO_NOT_GIVEN;

    it('exact match YES', () => {
      const result = evaluateReadingAnswer(type, 'YES', 'YES');
      expect(result.isCorrect).toBe(true);
    });

    it('exact match NO', () => {
      const result = evaluateReadingAnswer(type, 'NO', 'NO');
      expect(result.isCorrect).toBe(true);
    });

    it('wrong answer', () => {
      const result = evaluateReadingAnswer(type, 'YES', 'NOT GIVEN');
      expect(result.isCorrect).toBe(false);
    });
  });

  // ──────────────────────────────────────────
  // MATCHING (Headings, Information, Features, Sentence Endings)
  // ──────────────────────────────────────────
  describe('MATCHING_HEADINGS', () => {
    const type = ReadingQuestionType.MATCHING_HEADINGS;

    it('all pairs correct', () => {
      const correct = { A: 'ii', B: 'iv', C: 'i' };
      const user = { A: 'ii', B: 'iv', C: 'i' };
      const result = evaluateReadingAnswer(type, user, correct);
      expect(result.isCorrect).toBe(true);
      expect(result.score).toBe(3);
      expect(result.total).toBe(3);
    });

    it('partial match scores correctly', () => {
      const correct = { A: 'ii', B: 'iv', C: 'i' };
      const user = { A: 'ii', B: 'iii', C: 'i' };
      const result = evaluateReadingAnswer(type, user, correct);
      expect(result.isCorrect).toBe(false);
      expect(result.score).toBe(2);
      expect(result.total).toBe(3);
      expect(result.details).toBeDefined();
      expect(result.details!['B'].isCorrect).toBe(false);
      expect(result.details!['A'].isCorrect).toBe(true);
    });

    it('missing answers score 0 for those keys', () => {
      const correct = { A: 'ii', B: 'iv' };
      const user = { A: 'ii' };
      const result = evaluateReadingAnswer(type, user, correct);
      expect(result.score).toBe(1);
      expect(result.total).toBe(2);
      expect(result.details!['B'].isCorrect).toBe(false);
    });

    it('case-insensitive matching', () => {
      const correct = { A: 'ii' };
      const user = { A: 'II' };
      const result = evaluateReadingAnswer(type, user, correct);
      expect(result.isCorrect).toBe(true);
    });
  });

  describe('MATCHING_INFORMATION', () => {
    const type = ReadingQuestionType.MATCHING_INFORMATION;

    it('all correct', () => {
      const result = evaluateReadingAnswer(type, { '1': 'C', '2': 'A' }, { '1': 'C', '2': 'A' });
      expect(result.isCorrect).toBe(true);
      expect(result.score).toBe(2);
    });
  });

  describe('MATCHING_FEATURES', () => {
    const type = ReadingQuestionType.MATCHING_FEATURES;

    it('scores per pair', () => {
      const result = evaluateReadingAnswer(
        type,
        { '1': 'A', '2': 'B', '3': 'C' },
        { '1': 'A', '2': 'C', '3': 'C' },
      );
      expect(result.score).toBe(2);
      expect(result.total).toBe(3);
    });
  });

  describe('MATCHING_SENTENCE_ENDINGS', () => {
    const type = ReadingQuestionType.MATCHING_SENTENCE_ENDINGS;

    it('single string answer (individual question)', () => {
      const result = evaluateReadingAnswer(type, 'D', 'D');
      expect(result.isCorrect).toBe(true);
    });
  });

  // ──────────────────────────────────────────
  // SENTENCE COMPLETION
  // ──────────────────────────────────────────
  describe('SENTENCE_COMPLETION', () => {
    const type = ReadingQuestionType.SENTENCE_COMPLETION;

    it('exact match', () => {
      const result = evaluateReadingAnswer(type, 'oxygen', 'oxygen');
      expect(result.isCorrect).toBe(true);
    });

    it('case-insensitive', () => {
      const result = evaluateReadingAnswer(type, 'Oxygen', 'oxygen');
      expect(result.isCorrect).toBe(true);
    });

    it('spelling tolerance: 1 char off for 5+ char word', () => {
      const result = evaluateReadingAnswer(type, 'oxigen', 'oxygen');
      expect(result.isCorrect).toBe(true);
    });

    it('no tolerance for short words (≤4 chars)', () => {
      const result = evaluateReadingAnswer(type, 'teh', 'the');
      expect(result.isCorrect).toBe(false);
    });

    it('spelling tolerance: 2 chars off is rejected', () => {
      const result = evaluateReadingAnswer(type, 'oxign', 'oxygen');
      expect(result.isCorrect).toBe(false);
    });

    it('multiple accepted answers', () => {
      const result = evaluateReadingAnswer(type, 'worldwide', ['worldwide', 'global']);
      expect(result.isCorrect).toBe(true);
    });

    it('accepts alternative from array', () => {
      const result = evaluateReadingAnswer(type, 'global', ['worldwide', 'global']);
      expect(result.isCorrect).toBe(true);
    });
  });

  // ──────────────────────────────────────────
  // SHORT ANSWER
  // ──────────────────────────────────────────
  describe('SHORT_ANSWER', () => {
    const type = ReadingQuestionType.SHORT_ANSWER;

    it('exact match', () => {
      const result = evaluateReadingAnswer(type, 'carbon dioxide', 'carbon dioxide');
      expect(result.isCorrect).toBe(true);
    });

    it('British/American spelling equivalence: colour/color', () => {
      const result = evaluateReadingAnswer(type, 'color', 'colour');
      expect(result.isCorrect).toBe(true);
    });

    it('British/American spelling equivalence: behaviour/behavior', () => {
      const result = evaluateReadingAnswer(type, 'behavior', 'behaviour');
      expect(result.isCorrect).toBe(true);
    });

    it('British/American: reverse direction also works', () => {
      const result = evaluateReadingAnswer(type, 'colour', 'color');
      expect(result.isCorrect).toBe(true);
    });

    it('British/American: centre/center', () => {
      const result = evaluateReadingAnswer(type, 'center', 'centre');
      expect(result.isCorrect).toBe(true);
    });

    it('trims whitespace', () => {
      const result = evaluateReadingAnswer(type, '  oxygen  ', 'oxygen');
      expect(result.isCorrect).toBe(true);
    });
  });

  // ──────────────────────────────────────────
  // SUMMARY COMPLETION
  // ──────────────────────────────────────────
  describe('SUMMARY_COMPLETION', () => {
    const type = ReadingQuestionType.SUMMARY_COMPLETION;

    it('multi-gap: all correct', () => {
      const correct = { gap1: 'oxygen', gap2: 'nitrogen' };
      const user = { gap1: 'oxygen', gap2: 'nitrogen' };
      const result = evaluateReadingAnswer(type, user, correct);
      expect(result.isCorrect).toBe(true);
      expect(result.score).toBe(2);
      expect(result.total).toBe(2);
    });

    it('multi-gap: partial correct', () => {
      const correct = { gap1: 'oxygen', gap2: 'nitrogen' };
      const user = { gap1: 'oxygen', gap2: 'helium' };
      const result = evaluateReadingAnswer(type, user, correct);
      expect(result.isCorrect).toBe(false);
      expect(result.score).toBe(1);
      expect(result.total).toBe(2);
      expect(result.details!['gap1'].isCorrect).toBe(true);
      expect(result.details!['gap2'].isCorrect).toBe(false);
    });

    it('multi-gap: spelling tolerance per gap', () => {
      const correct = { gap1: 'oxygen', gap2: 'nitrogen' };
      const user = { gap1: 'oxigen', gap2: 'nitrogen' };
      const result = evaluateReadingAnswer(type, user, correct);
      expect(result.isCorrect).toBe(true);
      expect(result.score).toBe(2);
    });

    it('multi-gap: missing gaps score 0', () => {
      const correct = { gap1: 'oxygen', gap2: 'nitrogen', gap3: 'helium' };
      const user = { gap1: 'oxygen' };
      const result = evaluateReadingAnswer(type, user, correct);
      expect(result.score).toBe(1);
      expect(result.total).toBe(3);
    });

    it('single value falls back to text answer', () => {
      const result = evaluateReadingAnswer(type, 'oxygen', 'oxygen');
      expect(result.isCorrect).toBe(true);
    });

    it('accepted answers with object format per gap', () => {
      const correct = { gap1: { answers: ['oxygen', 'O2'] }, gap2: 'nitrogen' };
      const user = { gap1: 'O2', gap2: 'nitrogen' };
      const result = evaluateReadingAnswer(type, user, correct);
      expect(result.isCorrect).toBe(true);
      expect(result.score).toBe(2);
    });
  });

  // ──────────────────────────────────────────
  // DIAGRAM LABEL
  // ──────────────────────────────────────────
  describe('DIAGRAM_LABEL', () => {
    const type = ReadingQuestionType.DIAGRAM_LABEL;

    it('multi-label: all correct', () => {
      const correct = { label1: 'valve', label2: 'pump' };
      const user = { label1: 'valve', label2: 'pump' };
      const result = evaluateReadingAnswer(type, user, correct);
      expect(result.isCorrect).toBe(true);
      expect(result.score).toBe(2);
    });

    it('multi-label: partial correct with details', () => {
      const correct = { label1: 'valve', label2: 'pump' };
      const user = { label1: 'valve', label2: 'motor' };
      const result = evaluateReadingAnswer(type, user, correct);
      expect(result.isCorrect).toBe(false);
      expect(result.score).toBe(1);
      expect(result.details!['label1'].isCorrect).toBe(true);
      expect(result.details!['label2'].isCorrect).toBe(false);
    });

    it('spelling tolerance on labels', () => {
      const correct = { label1: 'valve' };
      const user = { label1: 'valvr' };
      const result = evaluateReadingAnswer(type, user, correct);
      expect(result.isCorrect).toBe(true);
    });
  });

  // ──────────────────────────────────────────
  // EDGE CASES
  // ──────────────────────────────────────────
  describe('Edge cases', () => {
    it('null user answer returns not correct', () => {
      const result = evaluateReadingAnswer(ReadingQuestionType.TRUE_FALSE_NOT_GIVEN, null, 'TRUE');
      expect(result.isCorrect).toBe(false);
    });

    it('undefined user answer returns not correct', () => {
      const result = evaluateReadingAnswer(ReadingQuestionType.SHORT_ANSWER, undefined, 'oxygen');
      expect(result.isCorrect).toBe(false);
    });

    it('empty string user answer returns not correct', () => {
      const result = evaluateReadingAnswer(ReadingQuestionType.SENTENCE_COMPLETION, '', 'oxygen');
      expect(result.isCorrect).toBe(false);
    });

    it('persistedAnswer wraps string values', () => {
      const result = evaluateReadingAnswer(ReadingQuestionType.TRUE_FALSE_NOT_GIVEN, 'TRUE', 'TRUE');
      expect(result.persistedAnswer).toEqual({ value: 'TRUE' });
    });

    it('persistedAnswer wraps object values', () => {
      const result = evaluateReadingAnswer(
        ReadingQuestionType.MATCHING_HEADINGS,
        { A: 'ii' },
        { A: 'ii' },
      );
      expect(result.persistedAnswer).toEqual({ A: 'ii' });
    });

    it('unknown question type falls back to exact match', () => {
      const result = evaluateReadingAnswer(
        'UNKNOWN_TYPE' as ReadingQuestionType,
        'test',
        'test',
      );
      expect(result.isCorrect).toBe(true);
    });
  });
});
