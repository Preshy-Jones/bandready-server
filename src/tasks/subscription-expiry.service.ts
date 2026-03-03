import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../common/prisma/prisma.service';
import { MailService } from '../mail/mail.service';

@Injectable()
export class SubscriptionExpiryService {
  private readonly logger = new Logger(SubscriptionExpiryService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async handleSubscriptionExpiryReminders() {
    this.logger.log('Running daily subscription expiry reminder check...');

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let reminderCount = 0;

    for (const daysLeft of [3, 1]) {
      const targetDate = new Date(today);
      targetDate.setDate(targetDate.getDate() + daysLeft);
      const nextDay = new Date(targetDate);
      nextDay.setDate(nextDay.getDate() + 1);

      const expiringUsers = await this.prisma.user.findMany({
        where: {
          subscriptionTier: 'premium',
          subscriptionExpiresAt: { gte: targetDate, lt: nextDay },
        },
        select: { email: true, fullName: true },
      });

      for (const user of expiringUsers) {
        await this.mailService.sendSubscriptionExpiryReminder(user.email, user.fullName, daysLeft);
        reminderCount++;
      }
    }

    this.logger.log(`Completed subscription expiry check. Sent ${reminderCount} reminders.`);
  }
}
