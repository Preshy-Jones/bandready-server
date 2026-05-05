import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AssignmentsService } from './assignments.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { OrgAdminGuard } from '../guards/org-admin.guard';
import { OrgPermissionGuard } from '../guards/org-permission.guard';
import { OrgPermissions } from '../decorators/org-permissions.decorator';

@Controller('api/organizations/:orgId/assignments')
export class AssignmentsController {
  constructor(private readonly assignmentsService: AssignmentsService) {}

  @Get()
  @UseGuards(JwtAuthGuard, OrgAdminGuard)
  async getAssignments(
    @Param('orgId') orgId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.assignmentsService.getAssignments(orgId, {
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
    });
  }

  @Post()
  @UseGuards(JwtAuthGuard, OrgAdminGuard, OrgPermissionGuard)
  @OrgPermissions('CREATE_COHORTS') // Assuming creating assignments requires similar permission
  async createAssignment(
    @Param('orgId') orgId: string,
    @Body() dto: any,
    @Request() req,
  ) {
    // req.orgAdmin.id specifies who assigned it
    return this.assignmentsService.createAssignment(orgId, dto, req.orgAdmin.id);
  }

  @Get(':assignmentId')
  @UseGuards(JwtAuthGuard, OrgAdminGuard)
  async getAssignmentDetail(
    @Param('orgId') orgId: string,
    @Param('assignmentId') assignmentId: string,
  ) {
    return this.assignmentsService.getAssignmentDetail(orgId, assignmentId);
  }
}
