export interface EssayScores {
  taskResponse?: number;
  taskAchievement?: number; // For Task 1
  coherenceCohesion: number;
  lexicalResource: number;
  grammaticalRangeAccuracy: number;
  overall: number;
}

export interface EssayFeedbackText {
  taskResponse?: string;
  taskAchievement?: string; // For Task 1
  coherenceCohesion: string;
  lexicalResource: string;
  grammaticalRangeAccuracy: string;
  overall: string;
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
  issue: string;
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
  drillType: string;
}

export interface VocabularySuggestion {
  original: string;
  suggested: string;
  context: string;
}

export interface EssayFeedbackResponse {
  scores: EssayScores;
  feedback: EssayFeedbackText;
  annotations: Annotation[];
  examinerInsights: ExaminerInsight[];
  detectedErrors: DetectedError[];
  priorityFixes: PriorityFix[];
  vocabularySuggestions?: VocabularySuggestion[];
}
