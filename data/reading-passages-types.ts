// Shared types for reading passage seed data

export interface VocabularyTerm {
  term: string;
  definition: string;
}

export interface ReadingPassageSeed {
  title: string;
  content: string;
  wordCount: number;
  difficultyLevel: 'EASY' | 'MEDIUM' | 'HARD';
  testType: 'ACADEMIC' | 'GENERAL_TRAINING';
  topicCategory: string;
  sourceAttribution?: string;
  paragraphs: { label: string; content: string }[];
  questionSets: ReadingQuestionSetSeed[];
  vocabularyTerms?: VocabularyTerm[];
}

export interface ReadingQuestionSetSeed {
  questionType:
    | 'MULTIPLE_CHOICE'
    | 'TRUE_FALSE_NOT_GIVEN'
    | 'YES_NO_NOT_GIVEN'
    | 'MATCHING_HEADINGS'
    | 'MATCHING_INFORMATION'
    | 'MATCHING_FEATURES'
    | 'MATCHING_SENTENCE_ENDINGS'
    | 'SENTENCE_COMPLETION'
    | 'SUMMARY_COMPLETION'
    | 'SHORT_ANSWER'
    | 'DIAGRAM_LABEL';
  instructions: string;
  setData?: any;
  questions: ReadingQuestionSeed[];
}

export interface ReadingQuestionSeed {
  questionNumber: number;
  questionData: any;
  correctAnswer: any;
  explanation?: string;
  skillTested?: string;
}
