import OpenAI from 'openai';
import { BadRequestException, Logger } from '@nestjs/common';
import { EssayFeedbackResponse } from '../dto/essay-feedback.dto';
import { IEssayAssessmentProvider } from '../interfaces/essay-assessment-provider.interface';

export class OpenAIEssayProvider implements IEssayAssessmentProvider {
  private readonly logger = new Logger(OpenAIEssayProvider.name);
  private readonly client: OpenAI;

  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey });
  }

  async assess(systemPrompt: string, userPrompt: string): Promise<EssayFeedbackResponse> {
    const response = await this.client.chat.completions.create({
      model: 'gpt-4.1-mini',
      max_tokens: 4096,
      temperature: 0.3,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new BadRequestException('Unexpected response format from OpenAI');
    }

    try {
      return JSON.parse(content) as EssayFeedbackResponse;
    } catch {
      this.logger.error('Failed to parse JSON from OpenAI response');
      this.logger.debug('Response:', content);
      throw new BadRequestException('Failed to parse assessment response');
    }
  }
}
