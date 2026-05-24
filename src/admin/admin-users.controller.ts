import { Controller, Get, Patch, Delete, Post, Param, Query, Body, UseGuards, Res } from '@nestjs/common';
import { Response } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { AdminGuard } from './admin.guard';
import { AdminService } from './admin.service';
import { PaymentsService } from '../payments/payments.service';

@Controller('admin/users')
@UseGuards(AuthGuard('jwt'), AdminGuard)
export class AdminUsersController {
  constructor(
    private readonly adminService: AdminService,
    private readonly paymentsService: PaymentsService,
  ) {}

  @Get()
  async getUsers(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('tier') tier?: string,
    @Query('verified') verified?: string,
    @Query('country') country?: string,
  ) {
    return this.adminService.getUsers({
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      search,
      tier,
      verified,
      country,
    });
  }

  @Get('export')
  async exportUsers(
    @Res() res: Response,
    @Query('search') search?: string,
    @Query('tier') tier?: string,
    @Query('verified') verified?: string,
    @Query('country') country?: string,
  ) {
    const csv = await this.adminService.exportUsers({ search, tier, verified, country });
    const filename = `users-${new Date().toISOString().split('T')[0]}.csv`;
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);
  }

  @Get(':id')
  async getUserDetail(@Param('id') id: string) {
    return this.adminService.getUserDetail(id);
  }

  @Patch(':id')
  async updateUser(@Param('id') id: string, @Body() body: any) {
    return this.adminService.updateUser(id, body);
  }

  @Post(':id/cancel-subscription')
  async cancelUserSubscription(@Param('id') id: string) {
    return this.paymentsService.cancelSubscription(id);
  }

  @Delete(':id')
  async deleteUser(@Param('id') id: string) {
    // Soft-delete: set a suspended flag or similar
    return this.adminService.updateUser(id, {
      subscriptionTier: 'suspended',
    });
  }
}
