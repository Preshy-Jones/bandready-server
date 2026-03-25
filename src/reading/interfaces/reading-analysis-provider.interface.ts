import { ReadingAnalysisResponse } from '../dto/reading-analysis.dto';

export const READING_ANALYSIS_PROVIDER = 'READING_ANALYSIS_PROVIDER';

export interface IReadingAnalysisProvider {
  analyze(systemPrompt: string, userPrompt: string): Promise<ReadingAnalysisResponse>;
}
