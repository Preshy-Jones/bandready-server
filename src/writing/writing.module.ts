import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PrismaModule } from '../common/prisma/prisma.module';
import { UsersModule } from '../users/users.module';

// Controllers
import { DiagnosticController } from './controllers/diagnostic.controller';
import { EssayController } from './controllers/essay.controller';
import { DrillController } from './controllers/drill.controller';
import { ProgressController } from './controllers/progress.controller';

// Services
import { EssayAssessmentService } from './services/essay-assessment.service';
import { WeaknessProfileService } from './services/weakness-profile.service';
import { DrillService } from './services/drill.service';
import { ProgressService } from './services/progress.service';

// Providers
import { ESSAY_ASSESSMENT_PROVIDER } from './interfaces/essay-assessment-provider.interface';
import { AnthropicEssayProvider } from './providers/anthropic-essay.provider';
import { OpenAIEssayProvider } from './providers/openai-essay.provider';

const essayProviderFactory = {
  provide: ESSAY_ASSESSMENT_PROVIDER,
  useFactory: (configService: ConfigService) => {
    const which = configService.get<string>('WRITING_AI_PROVIDER', 'openai');
    if (which === 'anthropic') {
      return new AnthropicEssayProvider(
        configService.getOrThrow<string>('ANTHROPIC_API_KEY'),
      );
    }
    return new OpenAIEssayProvider(
      configService.getOrThrow<string>('OPENAI_API_KEY'),
    );
  },
  inject: [ConfigService],
};

@Module({
  imports: [ConfigModule, PrismaModule, UsersModule],
  controllers: [
    DiagnosticController,
    EssayController,
    DrillController,
    ProgressController,
  ],
  providers: [
    essayProviderFactory,
    EssayAssessmentService,
    WeaknessProfileService,
    DrillService,
    ProgressService,
  ],
  exports: [
    EssayAssessmentService,
    WeaknessProfileService,
    DrillService,
    ProgressService,
  ],
})
export class WritingModule {}
