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
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: prompt }],
    });

    // Extract JSON from response
    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude');
    }

    const jsonMatch = content.text.match(/```json\n?([\s\S]*?)\n?```/);
    const jsonStr = jsonMatch ? jsonMatch[1] : content.text;
    
    return JSON.parse(jsonStr);
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
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude');
    }

    const jsonMatch = content.text.match(/```json\n?([\s\S]*?)\n?```/);
    const jsonStr = jsonMatch ? jsonMatch[1] : content.text;

    return JSON.parse(jsonStr);
  }
}
