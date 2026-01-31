import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { PracticeController } from './practice.controller';
import { PracticeService } from './practice.service';
import { SpeechAnalysisService } from './services/speech-analysis.service';
import { S3Service } from './services/s3.service';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    MulterModule.register({
      limits: {
        fileSize: 50 * 1024 * 1024, // 50MB max
      },
    }),
    UsersModule,
  ],
  controllers: [PracticeController],
  providers: [PracticeService, SpeechAnalysisService, S3Service],
})
export class PracticeModule {}
