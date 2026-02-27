import { Controller, Get, Post, Patch, Delete, Param, Query, Body, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AdminGuard } from './admin.guard';
import { AdminService } from './admin.service';

@Controller('admin/content')
@UseGuards(AuthGuard('jwt'), AdminGuard)
export class AdminContentController {
  constructor(private readonly adminService: AdminService) {}

  // ─── Speaking Questions ─────────────────────────────────────

  @Get('speaking')
  async getSpeakingQuestions(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('part') part?: string,
    @Query('difficulty') difficulty?: string,
    @Query('active') active?: string,
  ) {
    return this.adminService.getSpeakingQuestions({
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      part: part ? parseInt(part, 10) : undefined,
      difficulty,
      active,
    });
  }

  @Post('speaking')
  async createSpeakingQuestion(@Body() body: any) {
    return this.adminService.createSpeakingQuestion(body);
  }

  @Patch('speaking/:id')
  async updateSpeakingQuestion(@Param('id') id: string, @Body() body: any) {
    return this.adminService.updateSpeakingQuestion(id, body);
  }

  @Delete('speaking/:id')
  async deleteSpeakingQuestion(@Param('id') id: string) {
    return this.adminService.deleteSpeakingQuestion(id);
  }

  // ─── Writing Questions ──────────────────────────────────────

  @Get('writing')
  async getWritingQuestions(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('taskType') taskType?: string,
    @Query('active') active?: string,
  ) {
    return this.adminService.getWritingQuestions({
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      taskType,
      active,
    });
  }

  @Post('writing')
  async createWritingQuestion(@Body() body: any) {
    return this.adminService.createWritingQuestion(body);
  }

  @Patch('writing/:id')
  async updateWritingQuestion(@Param('id') id: string, @Body() body: any) {
    return this.adminService.updateWritingQuestion(id, body);
  }

  @Delete('writing/:id')
  async deleteWritingQuestion(@Param('id') id: string) {
    return this.adminService.deleteWritingQuestion(id);
  }

  // ─── Writing Drills ─────────────────────────────────────────

  @Get('drills')
  async getDrills(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('type') type?: string,
    @Query('category') category?: string,
    @Query('active') active?: string,
  ) {
    return this.adminService.getDrills({
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      type,
      category,
      active,
    });
  }

  @Post('drills')
  async createDrill(@Body() body: any) {
    return this.adminService.createDrill(body);
  }

  @Patch('drills/:id')
  async updateDrill(@Param('id') id: string, @Body() body: any) {
    return this.adminService.updateDrill(id, body);
  }

  @Delete('drills/:id')
  async deleteDrill(@Param('id') id: string) {
    return this.adminService.deleteDrill(id);
  }
}
