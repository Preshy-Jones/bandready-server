import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
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

@Module({
  imports: [ConfigModule, PrismaModule, UsersModule],
  controllers: [
    DiagnosticController,
    EssayController,
    DrillController,
    ProgressController,
  ],
  providers: [
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
