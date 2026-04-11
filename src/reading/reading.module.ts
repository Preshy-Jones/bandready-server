import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PrismaModule } from '../common/prisma/prisma.module';
import { ReadingController } from './reading.controller';
import { ReadingService } from './reading.service';
import { ReadingAnalysisService } from './services/reading-analysis.service';
import { READING_ANALYSIS_PROVIDER } from './interfaces/reading-analysis-provider.interface';
import { AnthropicReadingProvider } from './providers/anthropic-reading.provider';

const readingAnalysisProviderFactory = {
  provide: READING_ANALYSIS_PROVIDER,
  useFactory: (configService: ConfigService) => {
    return new AnthropicReadingProvider(
      configService.getOrThrow<string>('ANTHROPIC_API_KEY'),
    );
  },
  inject: [ConfigService],
};

@Module({
  imports: [ConfigModule, PrismaModule],
  controllers: [ReadingController],
  providers: [ReadingService, ReadingAnalysisService, readingAnalysisProviderFactory],
  exports: [ReadingService, ReadingAnalysisService],
})
export class ReadingModule {}
