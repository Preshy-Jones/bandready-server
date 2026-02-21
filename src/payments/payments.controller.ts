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
  getPublicConfig(@Query('country') country?: string) {
    return this.paymentsService.getPublicConfig(country || null);
  }

  @Get('provider')
  getProvider(@Query('country') country?: string) {
    return { provider: this.paymentsService.getProviderForCountry(country || null) };
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

  // ==========================================
  // PAYSTACK ENDPOINTS
  // ==========================================

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

  // ==========================================
  // PADDLE ENDPOINTS
  // ==========================================

  @Post('paddle/checkout')
  @UseGuards(AuthGuard('jwt'))
  async initializePaddleCheckout(
    @CurrentUser() user: User,
    @Body() dto: InitializePaymentDto,
  ) {
    return this.paymentsService.initializePaddleCheckout(user.id, dto?.plan || 'monthly');
  }

  @Post('paddle/webhook')
  @HttpCode(200)
  async paddleWebhook(
    @Req() req: Request & { rawBody?: Buffer },
    @Headers('paddle-signature') signature?: string,
  ) {
    return this.paymentsService.handlePaddleWebhook(req.rawBody, signature);
  }
}
