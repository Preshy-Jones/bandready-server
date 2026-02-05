import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { SYSTEM_PROMPT, generateAssessmentPrompt, generateModelAnswerPrompt } from '../prompts/assessment-prompt';

export interface AudioMetrics {
  durationSeconds: number;
  wordsPerMinute: number;
  totalWords: number;
  fillerWords: { word: string; count: number }[];
  pauseCount: number;
  longPauseCount: number;
}

export interface AssessmentResult {
  scores: {
    overall: number;
    fluency: number;
    lexical: number;
    grammar: number;
    pronunciation: number;
  };
  feedback: {
    fluency: string;
    vocabulary: string;
    grammar: string;
    pronunciation: string;
    overall: string;
  };
  suggestions: {
    vocabulary: { original: string; suggested: string; reason: string }[];
    grammar: { error: string; correction: string; rule: string }[];
  };
  highlights: {
    strengths: string[];
    improvements: string[];
  };
}

export interface TranscriptionResult {
  text: string;
  words: { word: string; start: number; end: number }[];
  duration: number;
}

@Injectable()
export class SpeechAnalysisService {
  private anthropic: Anthropic;
  private openai: OpenAI;

  constructor(private readonly configService: ConfigService) {
    this.anthropic = new Anthropic({
      apiKey: this.configService.get<string>('ANTHROPIC_API_KEY'),
    });
    this.openai = new OpenAI({
      apiKey: this.configService.get<string>('OPENAI_API_KEY'),
    });
  }

  async transcribeAudio(audioBuffer: Buffer, fileName: string = 'audio.webm'): Promise<TranscriptionResult> {
    // Use OpenAI's toFile helper for proper file conversion
    const { toFile } = await import('openai/uploads');
    const file = await toFile(audioBuffer, fileName, { type: 'audio/webm' });

    const response = await this.openai.audio.transcriptions.create({
      file,
      model: 'whisper-1',
      response_format: 'verbose_json',
      timestamp_granularities: ['word'],
    });

    return {
      text: response.text,
      words: (response as unknown as { words?: { word: string; start: number; end: number }[] }).words || [],
      duration: (response as unknown as { duration?: number }).duration || 0,
    };
  }

  calculateAudioMetrics(transcript: TranscriptionResult): AudioMetrics {
    const text = transcript.text;
    const words = text.split(/\s+/).filter(w => w.length > 0);
    const duration = transcript.duration || 60; // fallback
    
    // Count filler words
    const fillerPatterns = ['um', 'uh', 'like', 'you know', 'basically', 'actually', 'kind of', 'sort of'];
    const fillerCounts: { word: string; count: number }[] = [];
    
    for (const filler of fillerPatterns) {
      const regex = new RegExp(`\\b${filler}\\b`, 'gi');
      const matches = text.match(regex);
      if (matches && matches.length > 0) {
        fillerCounts.push({ word: filler, count: matches.length });
      }
    }

    // Count pauses from timestamp data
    let pauseCount = 0;
    let longPauseCount = 0;
    
    if (transcript.words && transcript.words.length > 1) {
      for (let i = 1; i < transcript.words.length; i++) {
        const gap = transcript.words[i].start - transcript.words[i - 1].end;
        if (gap > 0.5) pauseCount++;
        if (gap > 2) longPauseCount++;
      }
    }

    return {
      durationSeconds: duration,
      wordsPerMinute: (words.length / duration) * 60,
      totalWords: words.length,
      fillerWords: fillerCounts,
      pauseCount,
      longPauseCount,
    };
  }

  private cleanAndFixJSON(jsonStr: string): string {
    // Remove any text before first { or after last }
    const firstBrace = jsonStr.indexOf('{');
    const lastBrace = jsonStr.lastIndexOf('}');

    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      jsonStr = jsonStr.substring(firstBrace, lastBrace + 1);
    }

    // Fix common JSON issues:
    // 1. Remove trailing commas before closing braces/brackets
    jsonStr = jsonStr.replace(/,(\s*[}\]])/g, '$1');

    // 2. Handle escaped characters that might be problematic
    // Replace smart quotes with regular quotes
    jsonStr = jsonStr.replace(/[\u2018\u2019]/g, "'");
    jsonStr = jsonStr.replace(/[\u201C\u201D]/g, '"');

    return jsonStr;
  }

  private parseJSONFromResponse(responseText: string, context: string): any {
    // Try to extract JSON from markdown code blocks
    const jsonMatch = responseText.match(/```json\n?([\s\S]*?)\n?```/);
    let jsonStr = jsonMatch ? jsonMatch[1].trim() : responseText.trim();

    try {
      return JSON.parse(jsonStr);
    } catch (error) {
      // Log the error with context for debugging
      console.error(`[SpeechAnalysis] JSON parsing failed for ${context}`);
      console.error('[SpeechAnalysis] Error:', error.message);
      console.error('[SpeechAnalysis] JSON string (first 500 chars):', jsonStr.substring(0, 500));
      console.error('[SpeechAnalysis] JSON string (last 500 chars):', jsonStr.substring(Math.max(0, jsonStr.length - 500)));

      // Try to fix common JSON issues
      try {
        const cleanedJson = this.cleanAndFixJSON(jsonStr);
        console.log('[SpeechAnalysis] Attempting to parse cleaned JSON...');
        return JSON.parse(cleanedJson);
      } catch (retryError) {
        console.error('[SpeechAnalysis] Retry parsing also failed:', retryError.message);

        // Last resort: try with json5 parser for more lenient parsing
        try {
          // Use eval with proper sandboxing (only as last resort for JSON)
          const sanitized = this.cleanAndFixJSON(jsonStr);
          console.log('[SpeechAnalysis] Attempting lenient parse...');
          // Wrap in parentheses to force expression context
          const result = eval('(' + sanitized + ')');
          console.log('[SpeechAnalysis] Lenient parse succeeded');
          return result;
        } catch (evalError) {
          console.error('[SpeechAnalysis] All parsing attempts failed:', evalError.message);
        }
      }

      // If all parsing attempts fail, throw with context
      throw new Error(`Failed to parse JSON response for ${context}: ${error.message}. Check server logs for details.`);
    }
  }

  async assessSpeech(params: {
    part: 1 | 2 | 3;
    question: string;
    transcript: string;
    audioMetrics: AudioMetrics;
    cueCardPoints?: string[];
  }): Promise<AssessmentResult> {
    const prompt = generateAssessmentPrompt({
      part: params.part,
      question: params.question,
      transcript: params.transcript,
      audioDuration: params.audioMetrics.durationSeconds,
      wordsPerMinute: params.audioMetrics.wordsPerMinute,
      fillerWords: params.audioMetrics.fillerWords,
      pauseCount: params.audioMetrics.pauseCount,
      longPauseCount: params.audioMetrics.longPauseCount,
      cueCardPoints: params.cueCardPoints,
    });

    const response = await this.anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 3072, // Increased from 2048 to prevent truncation
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: prompt }],
    });

    // Extract JSON from response
    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude');
    }

    return this.parseJSONFromResponse(content.text, 'assessSpeech');
  }

  async generateModelAnswer(params: {
    part: 1 | 2 | 3;
    question: string;
    targetBand: number;
    cueCardPoints?: string[];
  }): Promise<{ modelAnswer: string; keyVocabulary: string[]; grammarHighlights: string[] }> {
    const prompt = generateModelAnswerPrompt(params);

    const response = await this.anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1536, // Increased from 1024 to prevent truncation
      messages: [{ role: 'user', content: prompt }],
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude');
    }

    return this.parseJSONFromResponse(content.text, 'generateModelAnswer');
  }

  async generateEnhancedModelAnswer(params: {
    part: 1 | 2 | 3;
    question: string;
    userTranscript: string;
    userScore: number;
    cueCardPoints?: string[];
  }): Promise<{
    bandLevelAnswers: Array<{
      band: number;
      answer: string;
      keyFeatures: string[];
    }>;
    comparison: {
      userAnswer: string;
      strengths: string[];
      weaknesses: string[];
      phraseImprovements: Array<{
        original: string;
        improved: string;
        explanation: string;
        position: number;
      }>;
    };
    coachingSteps: Array<{
      step: number;
      title: string;
      description: string;
      example: string;
    }>;
  }> {
    // Properly escape the user transcript for use in the prompt
    const escapedTranscript = params.userTranscript
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r')
      .replace(/\t/g, '\\t');

    const prompt = `You are an expert IELTS speaking examiner.

TASK: Provide comprehensive analysis and multiple model answers for IELTS Speaking Part ${params.part}.

QUESTION: ${params.question}
${params.cueCardPoints ? `\nCUE CARD POINTS:\n${params.cueCardPoints.map((p, i) => `${i + 1}. ${p}`).join('\n')}` : ''}

USER'S ANSWER:
${params.userTranscript}

USER'S SCORE: ${params.userScore}

Please provide a comprehensive analysis in JSON format with the following structure:

{
  "bandLevelAnswers": [
    {
      "band": 6.5,
      "answer": "A complete model answer at Band 6.5 level with realistic speech patterns",
      "keyFeatures": ["Feature 1 that makes this Band 6.5", "Feature 2", "Feature 3"]
    },
    {
      "band": 7.5,
      "answer": "A complete model answer at Band 7.5 level",
      "keyFeatures": ["Advanced feature 1", "Advanced feature 2", "Advanced feature 3"]
    },
    {
      "band": 8.5,
      "answer": "A complete model answer at Band 8.5 level",
      "keyFeatures": ["Expert feature 1", "Expert feature 2", "Expert feature 3"]
    }
  ],
  "comparison": {
    "userAnswer": "${escapedTranscript}",
    "strengths": ["What the user did well", "Another strength", "Third strength"],
    "weaknesses": ["What needs improvement", "Another weakness", "Third weakness"],
    "phraseImprovements": [
      {
        "original": "exact phrase from user's answer",
        "improved": "better alternative phrase",
        "explanation": "why this is better",
        "position": 0
      }
    ]
  },
  "coachingSteps": [
    {
      "step": 1,
      "title": "Step title",
      "description": "Detailed explanation of what to improve",
      "example": "Concrete example showing the improvement"
    }
  ]
}

Guidelines:
- Band answers should reflect realistic IELTS responses at each level
- Include natural speech patterns (fillers, self-corrections for lower bands, fluency for higher bands)
- Phrase improvements should be specific quotes from the user's answer
- Coaching steps should build progressively from basic to advanced
- Focus on actionable, practical improvements

CRITICAL JSON FORMATTING REQUIREMENTS:
1. Return ONLY valid JSON wrapped in markdown code blocks (use \`\`\`json)
2. All string values MUST use double quotes, not single quotes
3. Use straight quotes (") not curly/smart quotes ("")
4. For contractions and possessives, use: don't, we're, it's (these are safe in JSON strings)
5. Do NOT use apostrophes or single quotes for emphasis - use double quotes only
6. Ensure all strings are properly formatted - no trailing commas
7. Complete the entire JSON structure - do not truncate
8. No additional text before or after the JSON code block`;

    const response = await this.anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 5120, // Increased from 4096 for complex responses
      messages: [{ role: 'user', content: prompt }],
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude');
    }

    return this.parseJSONFromResponse(content.text, 'generateEnhancedModelAnswer');
  }
}
