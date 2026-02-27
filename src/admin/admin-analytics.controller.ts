import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AdminGuard } from './admin.guard';
import { AdminService } from './admin.service';

@Controller('admin/analytics')
@UseGuards(AuthGuard('jwt'), AdminGuard)
export class AdminAnalyticsController {
  constructor(private readonly adminService: AdminService) {}

  @Get('overview')
  async getOverview() {
    return this.adminService.getOverviewStats();
  }

  @Get('signup-trend')
  async getSignupTrend(@Query('days') days?: string) {
    return this.adminService.getSignupTrend(days ? parseInt(days, 10) : 30);
  }
}
