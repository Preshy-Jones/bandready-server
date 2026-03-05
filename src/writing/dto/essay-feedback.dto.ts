export interface EssayScores {
  taskResponse?: number;
  taskAchievement?: number; // For Task 1
  coherenceCohesion: number;
  lexicalResource: number;
  grammaticalRangeAccuracy: number;
  overall: number;
}

export interface EssayCriterionFeedback {
  justification: string;
  strengths: string[];
  weaknesses: string[];
}

export interface EssayFeedbackText {
  taskResponse?: EssayCriterionFeedback;
  taskAchievement?: EssayCriterionFeedback; // For Task 1
  coherenceCohesion: EssayCriterionFeedback;
  lexicalResource: EssayCriterionFeedback;
  grammaticalRangeAccuracy: EssayCriterionFeedback;
}

export interface Annotation {
  startIndex: number;
  endIndex: number;
  color: 'red' | 'yellow' | 'green' | 'blue';
  type: string;
  explanation: string;
}

export interface ExaminerInsight {
  sentence: string;
  quality: 'strength' | 'weakness' | 'neutral';
  explanation: string;
  bandImpact: string;
}

export interface DetectedError {
  category: 'GRAMMAR' | 'VOCABULARY' | 'COHERENCE' | 'TASK_RESPONSE';
  specificError: string;
  sentence: string;
  correction: string;
}

export interface PriorityFix {
  issue: string;
  explanation: string;
  targetCriterion: string;
  currentBand: number;
  potentialBand: number;
}

export interface VocabularySuggestion {
  original: string;
  suggested: string;
  reason: string;
}

export interface EssayFeedbackResponse {
  wordCount?: number;
  scores: EssayScores;
  feedback: EssayFeedbackText;
  annotations: Annotation[];
  examinerInsights: ExaminerInsight[];
  detectedErrors: DetectedError[];
  priorityFixes: PriorityFix[];
  vocabularySuggestions?: VocabularySuggestion[];
  examinerNotes?: string;
}
