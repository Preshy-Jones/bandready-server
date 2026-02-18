import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PracticeModule } from './practice/practice.module';
import { WritingModule } from './writing/writing.module';
import { PrismaModule } from './common/prisma/prisma.module';
import { PaymentsModule } from './payments/payments.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
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
