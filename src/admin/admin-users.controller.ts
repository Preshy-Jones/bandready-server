import { Controller, Get, Patch, Delete, Param, Query, Body, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AdminGuard } from './admin.guard';
import { AdminService } from './admin.service';

@Controller('admin/users')
@UseGuards(AuthGuard('jwt'), AdminGuard)
export class AdminUsersController {
  constructor(private readonly adminService: AdminService) {}

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

  @Get(':id')
  async getUserDetail(@Param('id') id: string) {
    return this.adminService.getUserDetail(id);
  }

  @Patch(':id')
  async updateUser(@Param('id') id: string, @Body() body: any) {
    return this.adminService.updateUser(id, body);
  }

  @Delete(':id')
  async deleteUser(@Param('id') id: string) {
    // Soft-delete: set a suspended flag or similar
    return this.adminService.updateUser(id, {
      subscriptionTier: 'suspended',
    });
  }
}
