import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminAnalyticsController } from './admin-analytics.controller';
import { AdminUsersController } from './admin-users.controller';
import { AdminContentController } from './admin-content.controller';
import { AdminPaymentsController } from './admin-payments.controller';

@Module({
  controllers: [
    AdminAnalyticsController,
    AdminUsersController,
    AdminContentController,
    AdminPaymentsController,
  ],
  providers: [AdminService],
})
export class AdminModule {}
