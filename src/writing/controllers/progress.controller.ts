import {
  Controller,
  Get,
  Query,
  UseGuards,
  Logger,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
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
  @Get()
  async getProgress(@CurrentUser() user: any) {
    const progress = await this.progressService.getProgress(user.id);
    return progress;
  }

  /**
   * Get score trends over time
   */
  @Get('trend')
  async getScoreTrend(
    @CurrentUser() user: any,
    @Query('days') days?: string,
  ) {
    const numDays = days ? parseInt(days, 10) : 30;
    const trend = await this.progressService.getScoreTrend(user.id, numDays);

    return {
      trend,
      period: numDays,
    };
  }

  /**
   * Get error frequency for visualization
   */
  @Get('error-frequency')
  async getErrorFrequency(@CurrentUser() user: any) {
    const errorFrequency = await this.progressService.getErrorFrequency(user.id);

    return errorFrequency;
  }

  /**
   * Get weakness profile
   */
  @Get('weaknesses')
  async getWeaknessProfile(@CurrentUser() user: any) {
    const weaknesses = await this.weaknessService.getWeaknessProfile(user.id);

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
