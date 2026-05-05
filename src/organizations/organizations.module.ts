import { Module } from '@nestjs/common';
import { OrganizationsController } from './organizations.controller';
import { OrganizationsService } from './organizations.service';
import { PdfReportService } from './reports/pdf-report.service';
import { AssignmentsController } from './assignments/assignments.controller';
import { AssignmentsService } from './assignments/assignments.service';

@Module({
  controllers: [OrganizationsController, AssignmentsController],
  providers: [OrganizationsService, PdfReportService, AssignmentsService],
  exports: [OrganizationsService, PdfReportService, AssignmentsService],
})
export class OrganizationsModule {}
