import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ExamRemindersService } from './exam-reminders.service';
import { SubscriptionExpiryService } from './subscription-expiry.service';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [ScheduleModule, MailModule],
  providers: [ExamRemindersService, SubscriptionExpiryService],
})
export class TasksModule {}
