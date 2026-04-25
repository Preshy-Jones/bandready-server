import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { SpeechAnalysisService } from './speech-analysis.service';
import { S3Service } from './s3.service';
import { Prisma } from '@prisma/client';
import { PracticeService } from '../practice.service';

interface AudioProcessJob {
  sessionId: string;
  userId: string;
  audioBufferBase64: string; // BullMQ needs serializable data
  prepTimeUsedSeconds?: number;
  speakingTimeSeconds?: number;
}

@Injectable()
@Processor('audio-processing')
export class AudioProcessingProcessor extends WorkerHost {
  private readonly logger = new Logger(AudioProcessingProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly speechAnalysis: SpeechAnalysisService,
    private readonly s3Service: S3Service,
    private readonly practiceService: PracticeService, // We'll inject this to reuse the updateUserProgress method
  ) {
    super();
  }

  async process(job: Job<AudioProcessJob, any, string>): Promise<any> {
    const { sessionId, userId, audioBufferBase64, prepTimeUsedSeconds, speakingTimeSeconds } = job.data;
    this.logger.log(`Processing audio job for session ${sessionId} / user ${userId}`);

    try {
      const audioBuffer = Buffer.from(audioBufferBase64, 'base64');

      // 1. Get session with question
      const session = await this.prisma.practiceSession.findUnique({
        where: { id: sessionId },
        select: {
          part: true,
          user: {
            select: { nativeLanguage: true }
          },
          question: {
            select: {
              questionText: true,
              cueCardPoints: true,
            },
          },
        },
      });

      if (!session) {
        throw new Error(`Session ${sessionId} not found`);
      }

      // 2. Upload audio to S3 and transcribe in parallel
      this.logger.debug(`Transcribing audio and uploading to S3 in parallel for session ${sessionId}...`);
      const [audioKey, transcription] = await Promise.all([
        this.s3Service.uploadAudio(audioBuffer, userId, sessionId).catch((error) => {
          this.logger.warn(`S3 upload failed for session ${sessionId}: ${error.message}`);
          return null;
        }),
        this.speechAnalysis.transcribeAudio(audioBuffer),
      ]);
      
      // 4. Calculate metrics from transcription
      const audioMetrics = this.speechAnalysis.calculateAudioMetrics(transcription);

      // 5. Get AI assessment using Claude
      this.logger.debug(`Generating assessment via Claude for session ${sessionId}...`);
      const assessment = await this.speechAnalysis.assessSpeech({
        part: session.part as 1 | 2 | 3,
        question: session.question.questionText,
        transcript: transcription.text,
        audioMetrics,
        cueCardPoints: session.question.cueCardPoints as string[] | undefined,
        nativeLanguage: session.user?.nativeLanguage,
      });

      // 6. Update session with results
      this.logger.debug(`Saving assessment to DB for session ${sessionId}...`);
      await this.prisma.practiceSession.update({
        where: { id: sessionId },
        data: {
          audioUrl: audioKey,
          audioDurationSeconds: audioMetrics.durationSeconds,
          transcript: transcription.text,
          transcriptWithTimestamps: transcription.words as Prisma.InputJsonValue,
          
          overallBandScore: assessment.scores.overall,
          fluencyCoherenceScore: assessment.scores.fluency,
          lexicalResourceScore: assessment.scores.lexical,
          grammarAccuracyScore: assessment.scores.grammar,
          pronunciationScore: assessment.scores.pronunciation,
          
          wordsPerMinute: audioMetrics.wordsPerMinute,
          totalWords: audioMetrics.totalWords,
          fillerWordCount: audioMetrics.fillerWords.reduce((sum, f) => sum + f.count, 0),
          fillerWordsDetail: audioMetrics.fillerWords as Prisma.InputJsonValue,
          pauseCount: audioMetrics.pauseCount,
          longPauseCount: audioMetrics.longPauseCount,
          
          feedbackFluency: assessment.feedback.fluency,
          feedbackVocabulary: assessment.feedback.vocabulary,
          feedbackGrammar: assessment.feedback.grammar,
          feedbackPronunciation: assessment.feedback.pronunciation,
          feedbackOverall: assessment.feedback.overall,
          
          vocabularySuggestions: assessment.suggestions.vocabulary as Prisma.InputJsonValue,
          grammarCorrections: assessment.suggestions.grammar as Prisma.InputJsonValue,
          
          prepTimeUsedSeconds: prepTimeUsedSeconds,
          speakingTimeSeconds: speakingTimeSeconds,
          completedAt: new Date(),
        },
        select: { id: true },
      });

      // 7. Update user progress
      await this.practiceService.updateUserProgress(userId);

      this.logger.log(`Successfully finished audio job for session ${sessionId}`);
      return { success: true, sessionId };
    } catch (error) {
      this.logger.error(`Failed to process audio job for session ${sessionId}: ${error.message}`, error.stack);
      throw error;
    }
  }
}
