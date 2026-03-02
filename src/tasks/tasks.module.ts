import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ExamRemindersService } from './exam-reminders.service';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [ScheduleModule, MailModule],
  providers: [ExamRemindersService],
})
export class TasksModule {}
