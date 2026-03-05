import Anthropic from '@anthropic-ai/sdk';
import { BadRequestException, Logger } from '@nestjs/common';
import { EssayFeedbackResponse } from '../dto/essay-feedback.dto';
import { IEssayAssessmentProvider } from '../interfaces/essay-assessment-provider.interface';

export class AnthropicEssayProvider implements IEssayAssessmentProvider {
  private readonly logger = new Logger(AnthropicEssayProvider.name);
  private readonly client: Anthropic;

  constructor(apiKey: string) {
    this.client = new Anthropic({ apiKey });
  }

  async assess(systemPrompt: string, userPrompt: string): Promise<EssayFeedbackResponse> {
    const response = await this.client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 4096,
      temperature: 0.3,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new BadRequestException('Unexpected response format from Claude');
    }

    // New prompt instructs no code fences — parse directly.
    // Fallback strips fences in case the model ignores the instruction.
    let jsonText = content.text.trim();
    const fenceMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (fenceMatch) jsonText = fenceMatch[1];

    try {
      return JSON.parse(jsonText) as EssayFeedbackResponse;
    } catch {
      this.logger.error('Failed to parse JSON from Claude response');
      this.logger.debug('Response:', content.text);
      throw new BadRequestException('Failed to parse assessment response');
    }
  }
}
