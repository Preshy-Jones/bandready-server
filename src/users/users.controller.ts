import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UsersService } from './users.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '@prisma/client';

class UpdateProfileDto {
  fullName?: string;
  nativeLanguage?: string;
  country?: string;
}

class UpdateGoalsDto {
  targetBandScore?: number;
  targetExamDate?: string;
}

@Controller('users')
@UseGuards(AuthGuard('jwt'))
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('profile')
  async getProfile(@CurrentUser() user: User) {
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      avatarUrl: user.avatarUrl,
      nativeLanguage: user.nativeLanguage,
      country: user.country,
      targetBandScore: user.targetBandScore,
      targetExamDate: user.targetExamDate,
      subscriptionTier: user.subscriptionTier,
      subscriptionExpiresAt: user.subscriptionExpiresAt,
      dailySessionsUsed: user.dailySessionsUsed,
      createdAt: user.createdAt,
    };
  }

  @Put('profile')
  async updateProfile(
    @CurrentUser() user: User,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(user.id, dto);
  }

  @Put('goals')
  async updateGoals(
    @CurrentUser() user: User,
    @Body() dto: UpdateGoalsDto,
  ) {
    console.log('[UsersController] updateGoals DTO received:', dto);
    
    const data: { targetBandScore?: number; targetExamDate?: Date } = {};
    
    if (dto.targetBandScore !== undefined) {
      data.targetBandScore = dto.targetBandScore;
    }
    if (dto.targetExamDate) {
      data.targetExamDate = new Date(dto.targetExamDate);
    }
    
    console.log('[UsersController] calling usersService.updateGoals with:', data);
    
    return this.usersService.updateGoals(user.id, data);
  }
}
