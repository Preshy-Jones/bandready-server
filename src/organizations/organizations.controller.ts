import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { OrganizationsService } from './organizations.service';
import { PdfReportService } from './reports/pdf-report.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../admin/admin.guard';
import { OrgAdminGuard } from './guards/org-admin.guard';
import { OrgPermissionGuard } from './guards/org-permission.guard';
import { OrgPermissions } from './decorators/org-permissions.decorator';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { AddStudentDto } from './dto/add-student.dto';
import { InviteAdminDto } from './dto/invite-admin.dto';
import { CreateCohortDto } from './dto/create-cohort.dto';
import { UpdateCohortDto } from './dto/update-cohort.dto';
import { BulkAddStudentsDto } from './dto/bulk-add-students.dto';

@Controller('api/organizations')
export class OrganizationsController {
  constructor(
    private readonly organizationsService: OrganizationsService,
    private readonly pdfReportService: PdfReportService,
  ) {}

  // ─── Org Admin Profile (no orgId needed) ──────────────────────

  /**
   * GET /api/organizations/me
   * Returns the requesting user's org admin profile + organization.
   * Used by the B2B web app after login to determine which org they belong to.
   */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMyOrganization(@Request() req) {
    const profile = await this.organizationsService.getOrgAdminProfile(req.user.id);
    if (!profile) {
      return { error: 'NOT_ORG_ADMIN', message: 'You are not an admin of any organization' };
    }
    return profile;
  }

  // ─── Platform Admin: Create Organization ──────────────────────

  /**
   * POST /api/organizations
   * Creates a new organization. Only platform ADMINs can do this.
   */
  @Post()
  @UseGuards(JwtAuthGuard, AdminGuard)
  async createOrganization(@Body() dto: CreateOrganizationDto) {
    return this.organizationsService.createOrganization(dto);
  }

  // ─── Org-Scoped Routes ────────────────────────────────────────

  /**
   * GET /api/organizations/:orgId
   */
  @Get(':orgId')
  @UseGuards(JwtAuthGuard, OrgAdminGuard)
  async getOrganization(@Param('orgId') orgId: string) {
    return this.organizationsService.getOrganization(orgId);
  }

  /**
   * PATCH /api/organizations/:orgId
   */
  @Patch(':orgId')
  @UseGuards(JwtAuthGuard, OrgAdminGuard, OrgPermissionGuard)
  @OrgPermissions('ORG_SETTINGS')
  async updateOrganization(
    @Param('orgId') orgId: string,
    @Body() dto: UpdateOrganizationDto,
  ) {
    return this.organizationsService.updateOrganization(orgId, dto);
  }

  /**
   * GET /api/organizations/:orgId/stats
   */
  @Get(':orgId/stats')
  @UseGuards(JwtAuthGuard, OrgAdminGuard)
  async getOrganizationStats(@Param('orgId') orgId: string) {
    return this.organizationsService.getOrganizationStats(orgId);
  }

  // ─── Admin Management ─────────────────────────────────────────

  /**
   * GET /api/organizations/:orgId/admins
   */
  @Get(':orgId/admins')
  @UseGuards(JwtAuthGuard, OrgAdminGuard)
  async getAdmins(@Param('orgId') orgId: string) {
    return this.organizationsService.getAdmins(orgId);
  }

  /**
   * POST /api/organizations/:orgId/admins/invite
   */
  @Post(':orgId/admins/invite')
  @UseGuards(JwtAuthGuard, OrgAdminGuard, OrgPermissionGuard)
  @OrgPermissions('INVITE_ADMINS')
  async inviteAdmin(
    @Param('orgId') orgId: string,
    @Body() dto: InviteAdminDto,
    @Request() req,
  ) {
    return this.organizationsService.inviteAdmin(orgId, dto, req.orgAdmin.id);
  }

  // ─── Student Management ───────────────────────────────────────

  /**
   * GET /api/organizations/:orgId/students
   */
  @Get(':orgId/students')
  @UseGuards(JwtAuthGuard, OrgAdminGuard, OrgPermissionGuard)
  @OrgPermissions('VIEW_ALL_STUDENTS')
  async getStudents(
    @Param('orgId') orgId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('cohortId') cohortId?: string,
    @Query('status') status?: string,
  ) {
    return this.organizationsService.getStudents(orgId, {
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
      search,
      cohortId,
      status,
    });
  }

  // ─── Bulk Student Upload ──────────────────────────────────────

  @Post(':orgId/students/bulk')
  @UseGuards(JwtAuthGuard, OrgAdminGuard, OrgPermissionGuard)
  @OrgPermissions('ADD_STUDENTS')
  async bulkAddStudents(
    @Param('orgId') orgId: string,
    @Body() dto: BulkAddStudentsDto,
  ) {
    return this.organizationsService.bulkAddStudents(orgId, dto);
  }

  /**
   * POST /api/organizations/:orgId/students
   */
  @Post(':orgId/students')
  @UseGuards(JwtAuthGuard, OrgAdminGuard, OrgPermissionGuard)
  @OrgPermissions('ADD_STUDENTS')
  async addStudent(
    @Param('orgId') orgId: string,
    @Body() dto: AddStudentDto,
  ) {
    return this.organizationsService.addStudent(orgId, dto);
  }

  /**
   * GET /api/organizations/:orgId/students/:userId
   */
  @Get(':orgId/students/:userId')
  @UseGuards(JwtAuthGuard, OrgAdminGuard)
  async getStudentDetail(
    @Param('orgId') orgId: string,
    @Param('userId') userId: string,
  ) {
    return this.organizationsService.getStudentDetail(orgId, userId);
  }

  /**
   * GET /api/organizations/:orgId/students/:userId/progress
   */
  @Get(':orgId/students/:userId/progress')
  @UseGuards(JwtAuthGuard, OrgAdminGuard)
  async getStudentProgress(
    @Param('orgId') orgId: string,
    @Param('userId') userId: string,
  ) {
    return this.organizationsService.getStudentProgress(orgId, userId);
  }

  /**
   * DELETE /api/organizations/:orgId/students/:userId
   */
  @Delete(':orgId/students/:userId')
  @UseGuards(JwtAuthGuard, OrgAdminGuard, OrgPermissionGuard)
  @OrgPermissions('REMOVE_STUDENTS')
  async removeStudent(
    @Param('orgId') orgId: string,
    @Param('userId') userId: string,
  ) {
    await this.organizationsService.removeStudent(orgId, userId);
    return { message: 'Student removed from organization' };
  }

  // ─── Cohort Management ────────────────────────────────────────

  @Get(':orgId/cohorts')
  @UseGuards(JwtAuthGuard, OrgAdminGuard)
  async getCohorts(
    @Param('orgId') orgId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    return this.organizationsService.getCohorts(orgId, {
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
      search,
    });
  }

  @Post(':orgId/cohorts')
  @UseGuards(JwtAuthGuard, OrgAdminGuard, OrgPermissionGuard)
  @OrgPermissions('CREATE_COHORTS')
  async createCohort(
    @Param('orgId') orgId: string,
    @Body() dto: CreateCohortDto,
  ) {
    return this.organizationsService.createCohort(orgId, dto);
  }

  @Get(':orgId/cohorts/:cohortId')
  @UseGuards(JwtAuthGuard, OrgAdminGuard)
  async getCohortDetail(
    @Param('orgId') orgId: string,
    @Param('cohortId') cohortId: string,
  ) {
    return this.organizationsService.getCohortDetail(orgId, cohortId);
  }

  @Patch(':orgId/cohorts/:cohortId')
  @UseGuards(JwtAuthGuard, OrgAdminGuard, OrgPermissionGuard)
  @OrgPermissions('CREATE_COHORTS')
  async updateCohort(
    @Param('orgId') orgId: string,
    @Param('cohortId') cohortId: string,
    @Body() dto: UpdateCohortDto,
  ) {
    return this.organizationsService.updateCohort(orgId, cohortId, dto);
  }

  @Get(':orgId/cohorts/:cohortId/progress')
  @UseGuards(JwtAuthGuard, OrgAdminGuard)
  async getCohortProgress(
    @Param('orgId') orgId: string,
    @Param('cohortId') cohortId: string,
  ) {
    return this.organizationsService.getCohortProgress(orgId, cohortId);
  }

  @Post(':orgId/cohorts/:cohortId/students')
  @UseGuards(JwtAuthGuard, OrgAdminGuard, OrgPermissionGuard)
  @OrgPermissions('CREATE_COHORTS')
  async addStudentsToCohort(
    @Param('orgId') orgId: string,
    @Param('cohortId') cohortId: string,
    @Body() dto: { userIds: string[] },
  ) {
    await this.organizationsService.addStudentsToCohort(orgId, cohortId, dto.userIds);
    return { message: 'Students added to cohort' };
  }

  @Delete(':orgId/cohorts/:cohortId/students/:userId')
  @UseGuards(JwtAuthGuard, OrgAdminGuard, OrgPermissionGuard)
  @OrgPermissions('CREATE_COHORTS')
  async removeStudentFromCohort(
    @Param('orgId') orgId: string,
    @Param('cohortId') cohortId: string,
    @Param('userId') userId: string,
  ) {
    await this.organizationsService.removeStudentFromCohort(orgId, cohortId, userId);
    return { message: 'Student removed from cohort' };
  }

  // ─── PDF Reports ──────────────────────────────────────────────

  @Get(':orgId/reports/student/:userId')
  @UseGuards(JwtAuthGuard, OrgAdminGuard)
  async getStudentReport(
    @Param('orgId') orgId: string,
    @Param('userId') userId: string,
    @Query('type') type: 'FULL' | 'SUMMARY' = 'FULL',
    @Res() res: Response,
  ) {
    const studentData = await this.organizationsService.getStudentProgress(orgId, userId);
    const pdfBuffer = await this.pdfReportService.generateStudentReport(orgId, studentData, { reportType: type });
    
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=student-report-${userId}.pdf`,
      'Content-Length': pdfBuffer.length,
    });
    res.end(pdfBuffer);
  }

  @Get(':orgId/reports/cohort/:cohortId')
  @UseGuards(JwtAuthGuard, OrgAdminGuard)
  async getCohortReport(
    @Param('orgId') orgId: string,
    @Param('cohortId') cohortId: string,
    @Query('type') type: 'SUMMARY' | 'DETAILED' = 'SUMMARY',
    @Res() res: Response,
  ) {
    const cohortData = await this.organizationsService.getCohortProgress(orgId, cohortId);
    const pdfBuffer = await this.pdfReportService.generateCohortReport(orgId, cohortData, { reportType: type });
    
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=cohort-report-${cohortId}.pdf`,
      'Content-Length': pdfBuffer.length,
    });
    res.end(pdfBuffer);
  }
}
