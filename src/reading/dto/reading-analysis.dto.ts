export interface ReadingAnalysisResponse {
  summary: string;
  strengths: string[];
  weaknesses: string[];
  questionTypeAnalysis: {
    type: string;
    performance: 'strong' | 'average' | 'weak';
    insight: string;
    tip: string;
  }[];
  skillScores: {
    skimming: number;
    scanning: number;
    inference: number;
    detailRecognition: number;
    vocabularyInContext: number;
  };
  timeManagementFeedback: string;
  recommendedPractice: string[];
}
