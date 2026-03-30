import Anthropic from '@anthropic-ai/sdk';
import { IReadingAnalysisProvider } from '../interfaces/reading-analysis-provider.interface';
import { ReadingAnalysisResponse } from '../dto/reading-analysis.dto';

export class AnthropicReadingProvider implements IReadingAnalysisProvider {
  private readonly client: Anthropic;
  
  constructor(apiKey: string) {
    this.client = new Anthropic({ apiKey });
  }

  async analyze(systemPrompt: string, userPrompt: string): Promise<ReadingAnalysisResponse> {
    const response = await this.client.messages.create({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 3000,
      temperature: 0.3,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    });

    try {
      // Find the first JSON block or the entire text if it looks like JSON
      const content = response.content[0].type === 'text' ? response.content[0].text : '';
      const openIdx = content.indexOf('{');
      const closeIdx = content.lastIndexOf('}');
      if (openIdx === -1 || closeIdx === -1 || openIdx >= closeIdx) {
        throw new Error('AI response did not contain valid JSON');
      }
      const jsonStr = content.substring(openIdx, closeIdx + 1);
      return JSON.parse(jsonStr) as ReadingAnalysisResponse;
    } catch (error) {
      throw new Error(`Failed to parse Anthropic API response: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
