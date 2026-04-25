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
    const packProvider = await this.adminService.getAppSetting('active_pack_provider');
    const subProvider = await this.adminService.getAppSetting('active_subscription_provider');
    const speechProvider = await this.adminService.getAppSetting('active_speech_provider');
    return {
      activePackProvider: packProvider?.value || 'paddle',
      activeSubscriptionProvider: subProvider?.value || 'paddle',
      activeSpeechProvider: speechProvider?.value || 'whisper', // Default to existing whisper
    };
  }

  @Put('settings')
  async updatePaymentSettings(@Body() dto: { activePackProvider: 'paddle' | 'polar', activeSubscriptionProvider: 'paddle' | 'polar', activeSpeechProvider?: 'whisper' | 'deepgram' }) {
    await this.adminService.setAppSetting('active_pack_provider', dto.activePackProvider);
    await this.adminService.setAppSetting('active_subscription_provider', dto.activeSubscriptionProvider);
    if (dto.activeSpeechProvider) {
      await this.adminService.setAppSetting('active_speech_provider', dto.activeSpeechProvider);
    }
    return { success: true };
  }
}
