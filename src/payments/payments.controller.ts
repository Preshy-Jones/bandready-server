import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '@prisma/client';
import { PaymentsService } from './payments.service';

type InitializePaymentDto = {
  plan?: 'monthly' | 'quarterly' | 'yearly';
};

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get('config')
  getPublicConfig() {
    return this.paymentsService.getPublicConfig();
  }

  @Get('billing/history')
  @UseGuards(AuthGuard('jwt'))
  async getBillingHistory(
    @CurrentUser() user: User,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.paymentsService.getBillingHistory(
      user.id,
      limit ? Number(limit) : 20,
      offset ? Number(offset) : 0,
    );
  }

  @Post('paystack/initialize')
  @UseGuards(AuthGuard('jwt'))
  async initializePaystackPayment(
    @CurrentUser() user: User,
    @Body() dto: InitializePaymentDto,
  ) {
    return this.paymentsService.initializePaystackTransaction(user.id, dto?.plan || 'monthly');
  }

  @Get('paystack/verify/:reference')
  @UseGuards(AuthGuard('jwt'))
  async verifyPaystackPayment(
    @CurrentUser() user: User,
    @Param('reference') reference: string,
  ) {
    return this.paymentsService.verifyPaystackTransaction(reference, user.id);
  }

  @Post('paystack/webhook')
  @HttpCode(200)
  async paystackWebhook(
    @Req() req: Request & { rawBody?: Buffer },
    @Headers('x-paystack-signature') signature?: string,
  ) {
    return this.paymentsService.handlePaystackWebhook(req.rawBody, signature);
  }
}
