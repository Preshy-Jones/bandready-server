import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminAnalyticsController } from './admin-analytics.controller';
import { AdminUsersController } from './admin-users.controller';
import { AdminContentController } from './admin-content.controller';
import { AdminPaymentsController } from './admin-payments.controller';
import { AdminMailController } from './admin-mail.controller';
import { AdminUsageController } from './admin-usage.controller';

@Module({
  controllers: [
    AdminAnalyticsController,
    AdminUsersController,
    AdminContentController,
    AdminPaymentsController,
    AdminMailController,
    AdminUsageController,
  ],
  providers: [AdminService],
})
export class AdminModule {}
