import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, timingSafeEqual } from 'crypto';
import { PrismaService } from '../common/prisma/prisma.service';
import { PaymentStatus } from '@prisma/client';

type PlanKey = string;
type PaymentProvider = 'paystack' | 'paddle';

// Countries where Paystack is available and preferred (Nigeria only — pack-based model)
const PAYSTACK_COUNTRIES = new Set(['NG']);

type PaystackInitializeResponse = {
  status: boolean;
  message: string;
  data: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
};

type PaystackVerifyResponse = {
  status: boolean;
  message: string;
  data: {
    status: string;
    amount: number;
    currency: string;
    reference: string;
    paid_at?: string;
    customer?: { email?: string; customer_code?: string };
    metadata?: {
      userId?: string;
      plan?: PlanKey;
      subscriptionDurationDays?: number;
    };
  };
};

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private readonly paystackPlanConfig: Record<PlanKey, { amountKobo: number; durationDays: number; sessionCount?: number; writingCount?: number }>;
  private readonly paddlePlanConfig: Record<PlanKey, { amountCents: number; durationDays: number; priceId: string }>;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    // Paystack plans (NGN Kobo) — Session packs only, Nigeria only
    this.paystackPlanConfig = {
      starter: { amountKobo: 75000, durationDays: 0, sessionCount: 5, writingCount: 8 },
      standard: { amountKobo: 200000, durationDays: 0, sessionCount: 15, writingCount: 25 },
      pro: { amountKobo: 450000, durationDays: 0, sessionCount: 40, writingCount: 65 },
      ultimate: { amountKobo: 1000000, durationDays: 0, sessionCount: 100, writingCount: 160 },
    };

    // Paddle plans (USD Cents)
    this.paddlePlanConfig = {
      // Rest of World (ROW)
      monthly: { amountCents: 999, durationDays: 30, priceId: this.configService.get('PADDLE_MONTHLY_PRICE_ID') || '' },
      yearly: { amountCents: 9999, durationDays: 365, priceId: this.configService.get('PADDLE_YEARLY_PRICE_ID') || '' },
      
      // South Asia
      monthly_sa: { amountCents: 499, durationDays: 30, priceId: this.configService.get('PADDLE_SA_MONTHLY_PRICE_ID') || '' },
      yearly_sa: { amountCents: 4999, durationDays: 365, priceId: this.configService.get('PADDLE_SA_YEARLY_PRICE_ID') || '' },
    };
  }

  getProviderForCountry(countryCode?: string | null): PaymentProvider {
    if (countryCode && PAYSTACK_COUNTRIES.has(countryCode.toUpperCase())) {
      return 'paystack';
    }
    return 'paddle';
  }

  getPublicConfig(countryCode?: string | null) {
    const provider = this.getProviderForCountry(countryCode);
    return {
      provider,
      paystack: {
        publicKey: this.configService.get<string>('PAYSTACK_PUBLIC_KEY') || null,
        plans: this.paystackPlanConfig,
        currency: 'NGN',
      },
      paddle: {
        clientToken: this.configService.get<string>('PADDLE_CLIENT_TOKEN') || null,
        environment: this.configService.get<string>('PADDLE_ENVIRONMENT') || 'sandbox',
        plans: Object.fromEntries(
          Object.entries(this.paddlePlanConfig).map(([key, val]) => [
            key,
            { amountCents: val.amountCents, durationDays: val.durationDays, priceId: val.priceId },
          ]),
        ),
        currency: 'USD',
      },
    };
  }

  async initializePaystackTransaction(userId: string, plan: PlanKey = 'starter') {
    const paystackSecretKey = this.configService.get<string>('PAYSTACK_SECRET_KEY');
    if (!paystackSecretKey) {
      throw new InternalServerErrorException('Paystack is not configured');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, fullName: true, country: true },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (!user.country || !PAYSTACK_COUNTRIES.has(user.country.toUpperCase())) {
      throw new ForbiddenException('Paystack payments are only available in Nigeria');
    }

    const selectedPlan = this.paystackPlanConfig[plan];
    if (!selectedPlan) {
      throw new BadRequestException('Invalid plan selected');
    }

    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';

    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${paystackSecretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: user.email,
        amount: selectedPlan.amountKobo,
        currency: 'NGN',
        callback_url: `${frontendUrl}/settings?payment=paystack`,
        metadata: {
          userId: user.id,
          plan,
          subscriptionDurationDays: selectedPlan.durationDays,
          custom_fields: [
            {
              display_name: 'Customer Name',
              variable_name: 'customer_name',
              value: user.fullName || user.email,
            },
            {
              display_name: 'Product',
              variable_name: 'product',
              value: `IELTS Premium ${plan}`,
            },
          ],
        },
      }),
    });

    const result = (await response.json()) as PaystackInitializeResponse;

    if (!response.ok || !result.status) {
      throw new BadRequestException(result.message || 'Failed to initialize payment');
    }

    await this.prisma.paymentTransaction.upsert({
      where: { reference: result.data.reference },
      update: {
        userId,
        provider: 'paystack',
        plan,
        amountKobo: selectedPlan.amountKobo,
        currency: 'NGN',
        status: PaymentStatus.PENDING,
        metadata: {
          userId,
          plan,
          subscriptionDurationDays: selectedPlan.durationDays,
        },
      },
      create: {
        userId,
        provider: 'paystack',
        plan,
        amountKobo: selectedPlan.amountKobo,
        currency: 'NGN',
        reference: result.data.reference,
        status: PaymentStatus.PENDING,
        metadata: {
          userId,
          plan,
          subscriptionDurationDays: selectedPlan.durationDays,
        },
      },
    });

    return {
      authorizationUrl: result.data.authorization_url,
      accessCode: result.data.access_code,
      reference: result.data.reference,
      amountKobo: selectedPlan.amountKobo,
      currency: 'NGN',
      plan,
    };
  }

  async getBillingHistory(userId: string, limit = 20, offset = 0) {
    const safeLimit = Math.min(Math.max(limit, 1), 100);
    const safeOffset = Math.max(offset, 0);

    const [records, total] = await this.prisma.$transaction([
      this.prisma.paymentTransaction.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip: safeOffset,
        take: safeLimit,
        select: {
          id: true,
          provider: true,
          plan: true,
          amountKobo: true,
          amountCents: true,
          currency: true,
          reference: true,
          status: true,
          paidAt: true,
          subscriptionStartsAt: true,
          subscriptionEndsAt: true,
          createdAt: true,
        },
      }),
      this.prisma.paymentTransaction.count({ where: { userId } }),
    ]);

    return {
      records,
      total,
      hasMore: safeOffset + records.length < total,
    };
  }

  async verifyPaystackTransaction(reference: string, userId: string) {
    const verification = await this.fetchVerification(reference);
    await this.applySuccessfulPayment(verification, userId);

    const updatedUser = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { subscriptionTier: true, subscriptionExpiresAt: true, speakingBalance: true, writingBalance: true },
    });

    return {
      reference: verification.reference,
      status: 'success',
      subscriptionTier: updatedUser?.subscriptionTier || 'free',
      subscriptionExpiresAt: updatedUser?.subscriptionExpiresAt || null,
      speakingBalance: updatedUser?.speakingBalance || 0,
      writingBalance: updatedUser?.writingBalance || 0,
    };
  }

  async handlePaystackWebhook(rawBody: Buffer | undefined, signature: string | undefined) {
    const secretKey = this.configService.get<string>('PAYSTACK_SECRET_KEY');
    if (!secretKey) {
      throw new InternalServerErrorException('Paystack is not configured');
    }

    if (!rawBody || !signature) {
      throw new UnauthorizedException('Missing webhook signature');
    }

    const hash = createHmac('sha512', secretKey).update(rawBody).digest('hex');
    const expectedBuffer = Buffer.from(hash);
    const signatureBuffer = Buffer.from(signature);

    if (
      expectedBuffer.length !== signatureBuffer.length ||
      !timingSafeEqual(expectedBuffer, signatureBuffer)
    ) {
      throw new UnauthorizedException('Invalid webhook signature');
    }

    const event = JSON.parse(rawBody.toString('utf-8')) as {
      event?: string;
      data?: { reference?: string; metadata?: { userId?: string } };
    };

    if (event.event !== 'charge.success' || !event.data?.reference) {
      return { received: true };
    }

    const verification = await this.fetchVerification(event.data.reference);
    const webhookUserId = verification.metadata?.userId;
    if (!webhookUserId) {
      return { received: true };
    }

    await this.applySuccessfulPayment(verification, webhookUserId);
    return { received: true };
  }

  private async fetchVerification(reference: string) {
    const paystackSecretKey = this.configService.get<string>('PAYSTACK_SECRET_KEY');
    if (!paystackSecretKey) {
      throw new InternalServerErrorException('Paystack is not configured');
    }

    const response = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${paystackSecretKey}`,
      },
    });

    const result = (await response.json()) as PaystackVerifyResponse;
    if (!response.ok || !result.status || result.data.status !== 'success') {
      throw new BadRequestException(result.message || 'Payment verification failed');
    }

    return result.data;
  }

  private async applySuccessfulPayment(
    verification: PaystackVerifyResponse['data'],
    requestedUserId: string,
  ) {
    const metadataUserId = verification.metadata?.userId;
    if (!metadataUserId) {
      throw new BadRequestException('Payment metadata is incomplete');
    }

    if (metadataUserId !== requestedUserId) {
      throw new ForbiddenException('This payment does not belong to the authenticated user');
    }

    const plan = verification.metadata?.plan || 'starter';
    const configuredPlan = this.paystackPlanConfig[plan] || this.paystackPlanConfig.starter;
    const requiredAmount = configuredPlan.amountKobo;

    if (verification.amount < requiredAmount) {
      throw new BadRequestException('Payment amount is insufficient for premium upgrade');
    }

    const paymentDate = verification.paid_at ? new Date(verification.paid_at) : new Date();
    await this.prisma.$transaction(async (tx) => {
      const existingTransaction = await tx.paymentTransaction.findUnique({
        where: { reference: verification.reference },
      });

      if (existingTransaction?.status === PaymentStatus.SUCCESS) {
        return;
      }

      const user = await tx.user.findUnique({
        where: { id: requestedUserId },
        select: {
          id: true,
          email: true,
          subscriptionExpiresAt: true,
        },
      });

      if (!user) {
        throw new BadRequestException('User not found');
      }

      const paidEmail = verification.customer?.email?.toLowerCase();
      if (paidEmail && paidEmail !== user.email.toLowerCase()) {
        throw new ForbiddenException('Payment customer does not match the authenticated account');
      }

      const subscriptionStart = user.subscriptionExpiresAt && user.subscriptionExpiresAt > paymentDate
        ? user.subscriptionExpiresAt
        : paymentDate;
      const subscriptionEnd = new Date(subscriptionStart);
      subscriptionEnd.setDate(subscriptionEnd.getDate() + configuredPlan.durationDays);

      const sessionCount = configuredPlan.sessionCount;
      const writingCount = configuredPlan.writingCount;

      if (sessionCount || writingCount) {
        await tx.user.update({
          where: { id: requestedUserId },
          data: {
            speakingBalance: sessionCount ? { increment: sessionCount } : undefined,
            writingBalance: writingCount ? { increment: writingCount } : undefined,
            paystackCustomerCode: verification.customer?.customer_code || undefined,
          },
        });
      } else {
        await tx.user.update({
          where: { id: requestedUserId },
          data: {
            subscriptionTier: 'premium',
            subscriptionExpiresAt: subscriptionEnd,
            paystackCustomerCode: verification.customer?.customer_code || undefined,
          },
        });
      }

      await tx.paymentTransaction.upsert({
        where: { reference: verification.reference },
        update: {
          userId: requestedUserId,
          provider: 'paystack',
          plan,
          amountKobo: verification.amount,
          currency: verification.currency || 'NGN',
          status: PaymentStatus.SUCCESS,
          paidAt: paymentDate,
          subscriptionStartsAt: subscriptionStart,
          subscriptionEndsAt: subscriptionEnd,
          metadata: {
            ...(typeof existingTransaction?.metadata === 'object' && existingTransaction?.metadata ? existingTransaction.metadata as Record<string, unknown> : {}),
            verifiedAt: new Date().toISOString(),
            rawMetadata: verification.metadata || null,
          },
        },
        create: {
          userId: requestedUserId,
          provider: 'paystack',
          plan,
          amountKobo: verification.amount,
          currency: verification.currency || 'NGN',
          reference: verification.reference,
          status: PaymentStatus.SUCCESS,
          paidAt: paymentDate,
          subscriptionStartsAt: subscriptionStart,
          subscriptionEndsAt: subscriptionEnd,
          metadata: {
            userId: requestedUserId,
            rawMetadata: verification.metadata || null,
          },
        },
      });
    });
  }

  // ==========================================
  // PADDLE METHODS
  // ==========================================

  async initializePaddleCheckout(userId: string, plan: PlanKey = 'monthly') {
    const paddleApiKey = this.configService.get<string>('PADDLE_API_KEY');
    if (!paddleApiKey) {
      throw new InternalServerErrorException('Paddle is not configured');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, fullName: true, paddleCustomerId: true, country: true },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (user.country && PAYSTACK_COUNTRIES.has(user.country.toUpperCase())) {
      throw new ForbiddenException('Nigerian users must purchase session packs, not subscriptions');
    }

    const selectedPlan = this.paddlePlanConfig[plan];
    if (!selectedPlan || !selectedPlan.priceId) {
      throw new BadRequestException('Invalid plan selected or Paddle price not configured');
    }

    const paddleEnv = this.configService.get<string>('PADDLE_ENVIRONMENT') || 'sandbox';
    const baseUrl = paddleEnv === 'production'
      ? 'https://api.paddle.com'
      : 'https://sandbox-api.paddle.com';

    // Build the transaction request
    const transactionPayload: Record<string, unknown> = {
      items: [
        {
          price_id: selectedPlan.priceId,
          quantity: 1,
        },
      ],
      custom_data: {
        userId: user.id,
        plan,
        subscriptionDurationDays: selectedPlan.durationDays,
      },
    };

    // If user already has a Paddle customer ID, use it
    if (user.paddleCustomerId) {
      transactionPayload.customer_id = user.paddleCustomerId;
    } else {
      // Create inline customer
      transactionPayload.customer = {
        email: user.email,
      };
    }

    const response = await fetch(`${baseUrl}/transactions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${paddleApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(transactionPayload),
    });

    const result = await response.json() as {
      data?: {
        id: string;
        customer_id?: string;
        checkout?: { url?: string };
      };
      error?: { detail?: string };
    };

    if (!response.ok || !result.data) {
      this.logger.error('Paddle transaction creation failed', result);
      throw new BadRequestException(result.error?.detail || 'Failed to create Paddle transaction');
    }

    const reference = `paddle_${result.data.id}`;

    // Store paddle customer ID if new
    if (result.data.customer_id && !user.paddleCustomerId) {
      await this.prisma.user.update({
        where: { id: userId },
        data: { paddleCustomerId: result.data.customer_id },
      });
    }

    // Create pending transaction record
    await this.prisma.paymentTransaction.create({
      data: {
        userId,
        provider: 'paddle',
        plan,
        amountCents: selectedPlan.amountCents,
        currency: 'USD',
        reference,
        paddleTransactionId: result.data.id,
        status: PaymentStatus.PENDING,
        metadata: {
          userId,
          plan,
          subscriptionDurationDays: selectedPlan.durationDays,
          paddleTransactionId: result.data.id,
        },
      },
    });

    return {
      transactionId: result.data.id,
      checkoutUrl: result.data.checkout?.url || null,
      reference,
      amountCents: selectedPlan.amountCents,
      currency: 'USD',
      plan,
    };
  }

  async handlePaddleWebhook(rawBody: Buffer | undefined, signature: string | undefined) {
    const webhookSecret = this.configService.get<string>('PADDLE_WEBHOOK_SECRET');
    if (!webhookSecret) {
      throw new InternalServerErrorException('Paddle webhook secret is not configured');
    }

    if (!rawBody || !signature) {
      throw new UnauthorizedException('Missing webhook signature');
    }

    // Paddle uses h1= signature format: ts=timestamp;h1=hash
    const parts = signature.split(';');
    const tsPart = parts.find(p => p.startsWith('ts='));
    const h1Part = parts.find(p => p.startsWith('h1='));

    if (!tsPart || !h1Part) {
      throw new UnauthorizedException('Invalid webhook signature format');
    }

    const ts = tsPart.replace('ts=', '');
    const h1 = h1Part.replace('h1=', '');
    const signedPayload = `${ts}:${rawBody.toString('utf-8')}`;
    const expectedHash = createHmac('sha256', webhookSecret).update(signedPayload).digest('hex');

    if (expectedHash !== h1) {
      throw new UnauthorizedException('Invalid webhook signature');
    }

    const event = JSON.parse(rawBody.toString('utf-8')) as {
      event_type?: string;
      data?: {
        id?: string;
        status?: string;
        customer_id?: string;
        custom_data?: {
          userId?: string;
          plan?: PlanKey;
          subscriptionDurationDays?: number;
        };
        details?: {
          totals?: { total?: string; currency_code?: string };
        };
        billed_at?: string;
      };
    };

    this.logger.log(`Paddle webhook received: ${event.event_type}`);

    if (event.event_type !== 'transaction.completed' || !event.data?.id) {
      return { received: true };
    }

    const transactionId = event.data.id;
    const customData = event.data.custom_data;
    const userId = customData?.userId;

    if (!userId) {
      this.logger.warn('Paddle webhook missing userId in custom_data');
      return { received: true };
    }

    const plan = customData?.plan || 'monthly';
    const configuredPlan = this.paddlePlanConfig[plan] || this.paddlePlanConfig.monthly;
    const paymentDate = event.data.billed_at ? new Date(event.data.billed_at) : new Date();

    await this.prisma.$transaction(async (tx) => {
      // Check if we already processed this
      const existingTransaction = await tx.paymentTransaction.findUnique({
        where: { paddleTransactionId: transactionId },
      });

      if (existingTransaction?.status === PaymentStatus.SUCCESS) {
        return;
      }

      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { id: true, subscriptionExpiresAt: true },
      });

      if (!user) {
        this.logger.warn(`Paddle webhook: user ${userId} not found`);
        return;
      }

      const subscriptionStart = user.subscriptionExpiresAt && user.subscriptionExpiresAt > paymentDate
        ? user.subscriptionExpiresAt
        : paymentDate;
      const subscriptionEnd = new Date(subscriptionStart);
      subscriptionEnd.setDate(subscriptionEnd.getDate() + configuredPlan.durationDays);

      // Update user subscription
      await tx.user.update({
        where: { id: userId },
        data: {
          subscriptionTier: 'premium',
          subscriptionExpiresAt: subscriptionEnd,
          paddleCustomerId: event.data?.customer_id || undefined,
        },
      });

      const amountCents = event.data?.details?.totals?.total
        ? Math.round(Number(event.data.details.totals.total))
        : configuredPlan.amountCents;

      const reference = `paddle_${transactionId}`;

      // Upsert payment transaction
      await tx.paymentTransaction.upsert({
        where: { paddleTransactionId: transactionId },
        update: {
          status: PaymentStatus.SUCCESS,
          paidAt: paymentDate,
          amountCents,
          currency: event.data?.details?.totals?.currency_code || 'USD',
          subscriptionStartsAt: subscriptionStart,
          subscriptionEndsAt: subscriptionEnd,
          metadata: {
            ...(typeof existingTransaction?.metadata === 'object' && existingTransaction?.metadata
              ? (existingTransaction.metadata as Record<string, unknown>)
              : {}),
            verifiedAt: new Date().toISOString(),
            paddleEventType: event.event_type,
          },
        },
        create: {
          userId,
          provider: 'paddle',
          plan,
          amountCents,
          currency: event.data?.details?.totals?.currency_code || 'USD',
          reference,
          paddleTransactionId: transactionId,
          status: PaymentStatus.SUCCESS,
          paidAt: paymentDate,
          subscriptionStartsAt: subscriptionStart,
          subscriptionEndsAt: subscriptionEnd,
          metadata: {
            userId,
            plan,
            paddleEventType: event.event_type,
          },
        },
      });
    });

    return { received: true };
  }
}
