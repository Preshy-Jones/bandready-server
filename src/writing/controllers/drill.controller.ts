import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
  Logger,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { DrillService } from '../services/drill.service';
import { WeaknessProfileService } from '../services/weakness-profile.service';
import { SubmitDrillDto } from '../dto/drill-submission.dto';
import { DrillType, WeaknessCategory, Difficulty } from '@prisma/client';

@Controller('writing/drills')
@UseGuards(JwtAuthGuard)
export class DrillController {
  private readonly logger = new Logger(DrillController.name);

  constructor(
    private drillService: DrillService,
    private weaknessService: WeaknessProfileService,
  ) {}

  /**
   * Get drills with filters
   */
  @Get()
  async getDrills(
    @Query('type') type?: DrillType,
    @Query('category') category?: WeaknessCategory,
    @Query('difficulty') difficulty?: Difficulty,
    @Query('targetWeakness') targetWeakness?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.drillService.getDrills({
      type,
      category,
      difficulty,
      targetWeakness,
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
    });
  }

  /**
   * Get recommended drills based on user's weaknesses
   */
  @Get('recommended/:userId')
  async getRecommendedDrills(
    @Param('userId') userId: string,
    @Query('limit') limit?: string,
  ) {
    const drills = await this.weaknessService.getRecommendedDrills(
      userId,
      limit ? parseInt(limit, 10) : 5,
    );

    return drills;
  }

  /**
   * Get single drill by ID
   */
  @Get(':drillId')
  async getDrill(@Param('drillId') drillId: string) {
    return this.drillService.getDrillById(drillId);
  }

  /**
   * Submit drill attempt
   */
  @Post(':drillId/submit')
  async submitDrill(
    @CurrentUser() user: any,
    @Param('drillId') drillId: string,
    @Body() dto: SubmitDrillDto,
  ) {
    this.logger.log(`User ${user.id} submitting drill ${drillId}`);

    const feedback = await this.drillService.submitDrill(
      user.id,
      drillId,
      dto.userAnswer,
      dto.timeSpentSeconds,
    );

    return feedback;
  }

  /**
   * Get drill completion progress
   */
  @Get('progress/:userId')
  async getDrillProgress(@Param('userId') userId: string) {
    return this.drillService.getDrillProgress(userId);
  }
}
