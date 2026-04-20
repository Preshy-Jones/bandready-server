import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminAnalyticsController } from './admin-analytics.controller';
import { AdminUsersController } from './admin-users.controller';
import { AdminContentController } from './admin-content.controller';
import { AdminPaymentsController } from './admin-payments.controller';
import { AdminMailController } from './admin-mail.controller';

@Module({
  controllers: [
    AdminAnalyticsController,
    AdminUsersController,
    AdminContentController,
    AdminPaymentsController,
    AdminMailController,
  ],
  providers: [AdminService],
})
export class AdminModule {}
