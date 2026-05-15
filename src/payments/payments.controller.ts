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
import { IsOptional, IsString } from 'class-validator';

// Helper to extract the trusted country code from CDN headers
function extractCountryFromHeaders(req: Request): string | null {
  const country =
    req.headers['x-vercel-ip-country'] ||
    req.headers['cf-ipcountry'] ||
    req.headers['x-country-code'];

  if (typeof country === 'string') {
    return country.toUpperCase();
  }
  return null;
}

export class InitializePaymentDto {
  @IsOptional()
  @IsString()
  plan?: string;

  @IsOptional()
  @IsString()
  model?: 'packs' | 'subscriptions';
}

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get('config')
  async getPublicConfig(@Query('country') country?: string) {
    return this.paymentsService.getPublicConfig(country || null);
  }

  @Get('provider')
  async getProvider(@Query('country') country?: string) {
    return { provider: await this.paymentsService.getProviderForCountry(country || null) };
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

  @Post('cancel')
  @UseGuards(AuthGuard('jwt'))
  async cancelSubscription(@CurrentUser() user: User) {
    return this.paymentsService.cancelSubscription(user.id);
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
    return this.paymentsService.initializePaystackTransaction(user.id, dto?.plan || 'starter');
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
    @Req() req: Request,
    @Query('country') requestedCountry?: string,
  ) {
    const isDev = process.env.NODE_ENV === 'development';
    const headerCountry = extractCountryFromHeaders(req);
    // In production, we ONLY trust the CDN header. In dev, we allow the requested country for local testing.
    const resolvedCountry = (isDev ? (headerCountry || requestedCountry) : headerCountry) || undefined;

    return this.paymentsService.initializePaddleCheckout(
      user.id,
      dto?.plan || 'monthly',
      dto?.model || 'subscriptions',
      resolvedCountry
    );
  }

  @Post('paddle/webhook')
  @HttpCode(200)
  async paddleWebhook(
    @Req() req: Request & { rawBody?: Buffer },
    @Headers('paddle-signature') signature?: string,
  ) {
    return this.paymentsService.handlePaddleWebhook(req.rawBody, signature);
  }

  // ==========================================
  @Post('polar/checkout')
  @UseGuards(AuthGuard('jwt'))
  async initializePolarCheckout(
    @CurrentUser() user: User,
    @Body() dto: InitializePaymentDto,
    @Req() req: Request,
    @Query('country') requestedCountry?: string,
  ) {
    const isDev = process.env.NODE_ENV === 'development';
    const headerCountry = extractCountryFromHeaders(req);
    // In production, we ONLY trust the CDN header. In dev, we allow the requested country for local testing.
    const resolvedCountry = (isDev ? (headerCountry || requestedCountry) : headerCountry) || undefined;

    return this.paymentsService.initializePolarCheckout(
      user.id,
      dto?.plan || 'starter',
      dto?.model || 'packs',
      resolvedCountry
    );
  }

  @Post('polar/webhook')
  @HttpCode(200)
  async polarWebhook(
    @Req() req: Request & { rawBody?: Buffer },
    @Headers() headers: Record<string, string>,
  ) {
    return this.paymentsService.handlePolarWebhook(req.rawBody, headers);
  }
}
