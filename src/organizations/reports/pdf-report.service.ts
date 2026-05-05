import { Injectable, Logger } from '@nestjs/common';
import * as PDFDocument from 'pdfkit';

@Injectable()
export class PdfReportService {
  private readonly logger = new Logger(PdfReportService.name);

  async generateStudentReport(
    orgId: string,
    studentData: any, // Expecting extended student progress data
    opts: { reportType: 'FULL' | 'SUMMARY' | 'PARENT' }
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50, size: 'A4' });
        const buffers: Buffer[] = [];
        
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => resolve(Buffer.concat(buffers)));

        // Basic Styling & Content for MVP
        doc.fontSize(24).font('Helvetica-Bold').text('Student Progress Report', { align: 'center' });
        doc.moveDown(1);
        doc.fontSize(14).font('Helvetica').text(`Organization: ${studentData.organization?.name || 'BandReady Center'}`, { align: 'center' });
        doc.text(`Student: ${studentData.user.fullName || studentData.user.email}`, { align: 'center' });
        doc.moveDown(2);

        // Score Summary 
        doc.fontSize(18).font('Helvetica-Bold').text('Score Summary');
        doc.moveDown(0.5);
        doc.fontSize(12).font('Helvetica');
        
        doc.text(`Current Estimate: ${studentData.currentEstimate.toFixed(1)} Band`);
        doc.text(`Target Score: ${studentData.targetScore.toFixed(1)} Band`);
        doc.text(`Gap: ${studentData.gap.toFixed(1)} Band`);
        
        doc.moveDown(1.5);

        // Skill Breakdown
        doc.fontSize(18).font('Helvetica-Bold').text('Skill Breakdown');
        doc.moveDown(0.5);
        doc.fontSize(12).font('Helvetica');

        const skills = studentData.skillBreakdown;
        doc.text(`Speaking: ${skills.speaking.score.toFixed(1)} (${skills.speaking.sessions} sessions)`);
        doc.text(`Writing: ${skills.writing.score.toFixed(1)} (${skills.writing.essays} essays)`);
        doc.text(`Reading: ${skills.reading.score.toFixed(1)} (${skills.reading.tests} tests)`);
        doc.text(`Listening: ${skills.listening.score.toFixed(1)} (${skills.listening.tests} tests)`);

        doc.moveDown(2);

        if (opts.reportType === 'FULL') {
          // Insights
          doc.fontSize(18).font('Helvetica-Bold').text('AI Insights & Priorities');
          doc.moveDown(0.5);
          doc.fontSize(12).font('Helvetica');
          
          if (studentData.aiInsights && studentData.aiInsights.length > 0) {
            studentData.aiInsights.forEach((insight: string) => {
              doc.text(`• ${insight}`);
            });
          } else {
            doc.text('No high-priority weaknesses identified recently. Keep practicing consistently.');
          }
        }

        doc.end();
      } catch (err) {
        this.logger.error('Error generating PDF', err);
        reject(err);
      }
    });
  }

  async generateCohortReport(
    orgId: string,
    cohortData: any, // Expecting extended cohort progress data
    opts: { reportType: 'SUMMARY' | 'DETAILED' }
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50, size: 'A4' });
        const buffers: Buffer[] = [];
        
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => resolve(Buffer.concat(buffers)));

        doc.fontSize(24).font('Helvetica-Bold').text('Cohort Progress Report', { align: 'center' });
        doc.moveDown(1);
        doc.fontSize(14).font('Helvetica').text(`Cohort: ${cohortData.name || 'Unnamed'}`, { align: 'center' });
        doc.text(`Total Students: ${cohortData.totalStudents}`, { align: 'center' });
        doc.moveDown(2);

        // Score Summary 
        doc.fontSize(18).font('Helvetica-Bold').text('Cohort Performance');
        doc.moveDown(0.5);
        doc.fontSize(12).font('Helvetica');
        
        doc.text(`Average Score: ${cohortData.averageScore.toFixed(1)} Band`);
        doc.text(`Target Score: ${cohortData.targetScore.toFixed(1)} Band`);
        doc.text(`On Track: ${cohortData.onTrackCount} students`);
        doc.text(`Needs Attention: ${cohortData.atRiskCount} students`);

        doc.moveDown(2);
        
        if (opts.reportType === 'DETAILED') {
          doc.fontSize(18).font('Helvetica-Bold').text('Student List');
          doc.moveDown(0.5);
          
          cohortData.studentList.forEach((s: any) => {
            doc.fontSize(12).font('Helvetica-Bold').text(s.fullName || s.email);
            doc.font('Helvetica').text(`Current: ${s.currentEstimate.toFixed(1)} | Target: ${s.targetBandScore.toFixed(1)} | Status: ${s.isAtRisk ? 'At Risk' : s.isOnTrack ? 'On Track' : 'Needs Practice'}`);
            doc.moveDown(0.5);
          });
        }

        doc.end();
      } catch (err) {
        this.logger.error('Error generating PDF', err);
        reject(err);
      }
    });
  }
}
