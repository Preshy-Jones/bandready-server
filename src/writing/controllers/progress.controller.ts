import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  Logger,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { ProgressService } from '../services/progress.service';
import { WeaknessProfileService } from '../services/weakness-profile.service';

@Controller('writing/progress')
@UseGuards(JwtAuthGuard)
export class ProgressController {
  private readonly logger = new Logger(ProgressController.name);

  constructor(
    private progressService: ProgressService,
    private weaknessService: WeaknessProfileService,
  ) {}

  /**
   * Get overall writing progress
   */
  @Get(':userId')
  async getProgress(@Param('userId') userId: string) {
    const progress = await this.progressService.getProgress(userId);
    return progress;
  }

  /**
   * Get score trends over time
   */
  @Get(':userId/trend')
  async getScoreTrend(
    @Param('userId') userId: string,
    @Query('days') days?: string,
  ) {
    const numDays = days ? parseInt(days, 10) : 30;
    const trend = await this.progressService.getScoreTrend(userId, numDays);

    return {
      trend,
      period: numDays,
    };
  }

  /**
   * Get error frequency for visualization
   */
  @Get(':userId/error-frequency')
  async getErrorFrequency(@Param('userId') userId: string) {
    const errorFrequency = await this.progressService.getErrorFrequency(userId);

    return errorFrequency;
  }

  /**
   * Get weakness profile
   */
  @Get(':userId/weaknesses')
  async getWeaknessProfile(@Param('userId') userId: string) {
    const weaknesses = await this.weaknessService.getWeaknessProfile(userId);

    return {
      weaknesses,
      summary: {
        total: weaknesses.length,
        high: weaknesses.filter((w) => w.severity === 'HIGH').length,
        medium: weaknesses.filter((w) => w.severity === 'MEDIUM').length,
        low: weaknesses.filter((w) => w.severity === 'LOW').length,
        improving: weaknesses.filter((w) => w.status === 'IMPROVING').length,
      },
    };
  }
}
