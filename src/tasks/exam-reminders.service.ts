import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../common/prisma/prisma.service';
import { MailService } from '../mail/mail.service';

@Injectable()
export class ExamRemindersService {
  private readonly logger = new Logger(ExamRemindersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
  ) {}

  // Run every day at 09:00 AM server time (can be adjusted)
  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async handleExamReminders() {
    this.logger.log('Running daily exam reminder check...');
    
    // We want to find users whose targetExamDate is exactly 30, 14, or 3 days from "today".
    // Wait, the easiest way is to fetch users with an upcoming targetExamDate
    // and process them. Since user volume might be large, ideally we'd do this
    // in batches or with raw SQL, but for now we fetch users with a future exam date.
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const usersWithExams = await this.prisma.user.findMany({
      where: {
        targetExamDate: {
          gte: today, // Only future or today
        },
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        targetExamDate: true,
      },
    });

    let reminderCount = 0;

    for (const user of usersWithExams) {
      if (!user.targetExamDate) continue;

      const targetDate = new Date(user.targetExamDate);
      targetDate.setHours(0, 0, 0, 0);
      
      const diffTime = targetDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 30 || diffDays === 14 || diffDays === 3) {
        // Send email
        await this.mailService.sendExamReminder(
          user.email,
          user.fullName,
          diffDays
        );
        reminderCount++;
      }
    }

    this.logger.log(`Completed exam reminder check. Sent ${reminderCount} reminders.`);
  }
}
