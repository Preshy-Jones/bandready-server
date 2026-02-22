import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PracticeModule } from './practice/practice.module';
import { WritingModule } from './writing/writing.module';
import { PrismaModule } from './common/prisma/prisma.module';
import { PaymentsModule } from './payments/payments.module';
import { BullModule } from '@nestjs/bullmq';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    BullModule.forRoot({
      connection: {
        url: process.env.REDIS_URL,
        tls: process.env.REDIS_URL?.includes('upstash.io') ? { rejectUnauthorized: false } : undefined,
      },
      defaultJobOptions: {
        removeOnComplete: 100,
        removeOnFail: 1000,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      },
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    PracticeModule,
    WritingModule,
    PaymentsModule,
  ],
})
export class AppModule {}
