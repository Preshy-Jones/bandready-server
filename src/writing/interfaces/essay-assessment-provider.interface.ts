import { EssayFeedbackResponse } from '../dto/essay-feedback.dto';

export const ESSAY_ASSESSMENT_PROVIDER = 'ESSAY_ASSESSMENT_PROVIDER';

export interface IEssayAssessmentProvider {
  assess(systemPrompt: string, userPrompt: string): Promise<EssayFeedbackResponse>;
}
