import { Body, Controller, Get, Put, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AdminGuard } from './admin.guard';
import { AdminService } from './admin.service';

@Controller('admin/payments')
@UseGuards(AuthGuard('jwt'), AdminGuard)
export class AdminPaymentsController {
  constructor(private readonly adminService: AdminService) {}

  @Get()
  async getTransactions(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('provider') provider?: string,
    @Query('status') status?: string,
  ) {
    return this.adminService.getTransactions({
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      provider,
      status,
    });
  }

  @Get('revenue')
  async getRevenueStats() {
    return this.adminService.getRevenueStats();
  }

  @Get('settings')
  async getPaymentSettings() {
    return this.adminService.getAppSetting('global_payment_provider');
  }

  @Put('settings')
  async updatePaymentSettings(@Body() dto: { provider: 'paddle' | 'polar' }) {
    return this.adminService.setAppSetting('global_payment_provider', dto.provider);
  }
}
