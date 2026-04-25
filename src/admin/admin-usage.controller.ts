import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminGuard } from './admin.guard';

@Controller('admin/usage')
@UseGuards(AdminGuard)
export class AdminUsageController {
  constructor(private readonly adminService: AdminService) {}

  @Get('speaking')
  async getSpeakingUsage(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    return this.adminService.getSpeakingUsage(
      Number(page) || 1,
      Number(limit) || 20,
      search,
    );
  }

  @Get('writing')
  async getWritingUsage(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    return this.adminService.getWritingUsage(
      Number(page) || 1,
      Number(limit) || 20,
      search,
    );
  }

  @Get('reading')
  async getReadingUsage(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    return this.adminService.getReadingUsage(
      Number(page) || 1,
      Number(limit) || 20,
      search,
    );
  }

  @Get('drills')
  async getDrillUsage(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    return this.adminService.getDrillUsage(
      Number(page) || 1,
      Number(limit) || 20,
      search,
    );
  }
}
