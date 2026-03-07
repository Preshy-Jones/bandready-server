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
import { PaymentStatus, Prisma } from '@prisma/client';
import { Polar } from '@polar-sh/sdk';
import { Webhook } from 'standardwebhooks';

type PlanKey = string;
type PaymentProvider = 'paystack' | 'paddle' | 'polar';
type GlobalProvider = 'paddle' | 'polar';
type PaymentModel = 'packs' | 'subscriptions';

interface RegionEntry {
  provider: 'paystack' | 'global';
  models: PaymentModel[];
  packTier?: string;
}

const REGION_CONFIG: Record<string, RegionEntry> = {
  NG: { provider: 'paystack', models: ['packs'], packTier: 'nigeria' },
  IN: { provider: 'global',   models: ['packs'], packTier: 'india' },
  PK: { provider: 'global',   models: ['packs'], packTier: 'india' },
  BD: { provider: 'global',   models: ['packs'], packTier: 'india' },
  NP: { provider: 'global',   models: ['packs'], packTier: 'india' },
  LK: { provider: 'global',   models: ['packs'], packTier: 'india' },
  PH: { provider: 'global',   models: ['packs'], packTier: 'india' },
  _default: { provider: 'global', models: ['subscriptions'] },
};

function getRegionConfig(countryCode?: string | null): RegionEntry {
  if (!countryCode) return REGION_CONFIG._default;
  return REGION_CONFIG[countryCode.toUpperCase()] ?? REGION_CONFIG._default;
}

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
  private readonly paystackPlanConfig: Record<PlanKey, { amountKobo: number; durationDays: number; sessionCount?: number; writingCount?: number; drillValidityDays?: number }>;
  private readonly paddlePlanConfig: Record<PlanKey, { amountCents: number; durationDays: number; priceId: string }>;
  private readonly packTiers: Record<string, Record<string, {
    amountCents: number; sessionCount?: number; writingCount?: number; drillValidityDays?: number;
  }>> = {
    india: {
      starter:  { amountCents: 299,  sessionCount: 3,  writingCount: 5 },
      standard: { amountCents: 999,  sessionCount: 12, writingCount: 20, drillValidityDays: 45 },
      pro:      { amountCents: 1999, sessionCount: 30, writingCount: 50, drillValidityDays: 60 },
      ultimate: { amountCents: 2999, sessionCount: 60, writingCount: 100, drillValidityDays: 90 },
    },
    row: {
      starter:  { amountCents: 499,  sessionCount: 3,  writingCount: 5 },
      standard: { amountCents: 1499, sessionCount: 12, writingCount: 20, drillValidityDays: 45 },
      pro:      { amountCents: 2999, sessionCount: 30, writingCount: 50, drillValidityDays: 60 },
      ultimate: { amountCents: 4999, sessionCount: 60, writingCount: 100, drillValidityDays: 90 },
    },
  };

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    // Paystack plans (NGN Kobo) — Session packs only, Nigeria only
    // Sessions never expire. drillValidityDays = how long unlimited drills last from purchase.
    this.paystackPlanConfig = {
      starter: { amountKobo: 50000, durationDays: 0, sessionCount: 3, writingCount: 5 },
      standard: { amountKobo: 200000, durationDays: 0, sessionCount: 12, writingCount: 20, drillValidityDays: 45 },
      pro: { amountKobo: 550000, durationDays: 0, sessionCount: 30, writingCount: 50, drillValidityDays: 60 },
      ultimate: { amountKobo: 800000, durationDays: 0, sessionCount: 60, writingCount: 100, drillValidityDays: 90 },
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

  private async getActivePackProvider(): Promise<GlobalProvider> {
    const setting = await this.prisma.appSetting.findUnique({
      where: { key: 'active_pack_provider' },
    });
    return (setting?.value as GlobalProvider) || 'polar';
  }

  private async getActiveSubscriptionProvider(): Promise<GlobalProvider> {
    const setting = await this.prisma.appSetting.findUnique({
      where: { key: 'active_subscription_provider' },
    });
    return (setting?.value as GlobalProvider) || 'paddle';
  }

  async getProviderForCountry(countryCode?: string | null): Promise<PaymentProvider> {
    const region = getRegionConfig(countryCode);
    if (region.provider === 'paystack') return 'paystack';
    return this.getActiveSubscriptionProvider();
  }

  async getPublicConfig(countryCode?: string | null) {
    const region = getRegionConfig(countryCode);

    const activePackProvider = region.provider === 'paystack' ? 'paystack' : await this.getActivePackProvider();
    const activeSubscriptionProvider = region.provider === 'paystack' ? 'paystack' : await this.getActiveSubscriptionProvider();

    const packTier = region.packTier || null;
    const packs = packTier && packTier !== 'nigeria' ? this.packTiers[packTier] || {} : {};

    return {
      provider: activeSubscriptionProvider,
      activePackProvider,
      activeSubscriptionProvider,
      models: region.models,
      packTier,
      packs,
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
      polar: {
        packs,
        plans: Object.fromEntries(
          Object.entries(this.paddlePlanConfig).map(([key, val]) => [
            key,
            { amountCents: val.amountCents, durationDays: val.durationDays },
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

    const region = getRegionConfig(user.country);
    if (region.provider !== 'paystack') {
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
      subscriptionTier: updatedUser?.subscriptionTier || 'none',
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

  private async applyPackPurchase(
    tx: Prisma.TransactionClient,
    userId: string,
    packConfig: { sessionCount?: number; writingCount?: number; drillValidityDays?: number },
  ) {
    let drillsExpireAt: Date | undefined;
    if (packConfig.drillValidityDays) {
      const currentUser = await tx.user.findUnique({
        where: { id: userId },
        select: { drillsExpireAt: true },
      });
      const drillStart = currentUser?.drillsExpireAt && currentUser.drillsExpireAt > new Date()
        ? currentUser.drillsExpireAt
        : new Date();
      drillsExpireAt = new Date(drillStart);
      drillsExpireAt.setDate(drillsExpireAt.getDate() + packConfig.drillValidityDays);
    }

    await tx.user.update({
      where: { id: userId },
      data: {
        speakingBalance: packConfig.sessionCount ? { increment: packConfig.sessionCount } : undefined,
        writingBalance: packConfig.writingCount ? { increment: packConfig.writingCount } : undefined,
        drillsExpireAt: drillsExpireAt || undefined,
      },
    });
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
        await this.applyPackPurchase(tx, requestedUserId, configuredPlan);
        // Update paystackCustomerCode separately
        if (verification.customer?.customer_code) {
          await tx.user.update({
            where: { id: requestedUserId },
            data: { paystackCustomerCode: verification.customer.customer_code },
          });
        }
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

  async applySubscriptionPurchase(
    tx: Prisma.TransactionClient,
    userId: string,
    durationDays: number,
    paymentDate: Date,
    providerCustomerId?: string,
    provider: 'paddle' | 'polar' = 'paddle'
  ) {
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { id: true, subscriptionExpiresAt: true },
    });

    if (!user) return null;

    const subscriptionStart = user.subscriptionExpiresAt && user.subscriptionExpiresAt > paymentDate
      ? user.subscriptionExpiresAt
      : paymentDate;
    const subscriptionEnd = new Date(subscriptionStart);
    subscriptionEnd.setDate(subscriptionEnd.getDate() + durationDays);

    const updateData: any = {
      subscriptionTier: 'premium',
      subscriptionExpiresAt: subscriptionEnd,
    };
    if (providerCustomerId) {
      if (provider === 'paddle') updateData.paddleCustomerId = providerCustomerId;
      if (provider === 'polar') updateData.polarCustomerId = providerCustomerId;
    }

    await tx.user.update({
      where: { id: userId },
      data: updateData,
    });

    return { subscriptionStart, subscriptionEnd };
  }

  // ==========================================
  // PADDLE METHODS
  // ==========================================

  async initializePaddleCheckout(userId: string, plan: PlanKey = 'monthly', model: PaymentModel = 'subscriptions', countryCode?: string | null) {
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

    const resolvedCountry = countryCode || user.country;
    const region = getRegionConfig(resolvedCountry);
    if (region.provider === 'paystack') {
      throw new ForbiddenException('Nigerian users must purchase session packs via Paystack');
    }

    let priceId: string;
    let amountCents: number;
    let customData: any = { userId, plan, model };

    if (model === 'packs') {
      if (!region.packTier || region.packTier === 'nigeria') {
        throw new BadRequestException('Pack purchases are not available for this region via Paddle');
      }
      const tierPacks = this.packTiers[region.packTier];
      const packConfig = tierPacks?.[plan];
      if (!packConfig) {
        throw new BadRequestException(`Invalid pack plan "${plan}" for tier "${region.packTier}"`);
      }
      const envKey = `PADDLE_PACK_${region.packTier.toUpperCase()}_${plan.toUpperCase()}`;
      priceId = this.configService.get<string>(envKey) || '';
      if (!priceId) {
        throw new InternalServerErrorException(`Paddle price not configured for ${envKey}`);
      }
      amountCents = packConfig.amountCents;
      customData.packTier = region.packTier;
    } else {
      const selectedPlan = this.paddlePlanConfig[plan];
      if (!selectedPlan || !selectedPlan.priceId) {
        throw new BadRequestException('Invalid subscription plan selected or Paddle price not configured');
      }
      priceId = selectedPlan.priceId;
      amountCents = selectedPlan.amountCents;
      customData.subscriptionDurationDays = selectedPlan.durationDays;
    }

    const paddleEnv = this.configService.get<string>('PADDLE_ENVIRONMENT') || 'sandbox';
    const baseUrl = paddleEnv === 'production'
      ? 'https://api.paddle.com'
      : 'https://sandbox-api.paddle.com';

    // Build the transaction request
    const transactionPayload: Record<string, unknown> = {
      items: [
        {
          price_id: priceId,
          quantity: 1,
        },
      ],
      custom_data: customData,
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
        amountCents,
        currency: 'USD',
        reference,
        paddleTransactionId: result.data.id,
        status: PaymentStatus.PENDING,
        metadata: {
          userId,
          plan,
          paddleTransactionId: result.data.id,
          ...customData,
        },
      },
    });

    return {
      transactionId: result.data.id,
      checkoutUrl: result.data.checkout?.url || null,
      reference,
      amountCents,
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

    const expectedBuffer = Buffer.from(expectedHash);
    const h1Buffer = Buffer.from(h1);
    if (expectedBuffer.length !== h1Buffer.length || !timingSafeEqual(expectedBuffer, h1Buffer)) {
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
    const customData = event.data.custom_data as any;
    const userId = customData?.userId;

    if (!userId) {
      this.logger.warn('Paddle webhook missing userId in custom_data');
      return { received: true };
    }

    const plan = customData?.plan || 'monthly';
    const model = customData?.model || 'subscriptions';
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

      let subscriptionStartsAt: Date | undefined;
      let subscriptionEndsAt: Date | undefined;
      let baseAmountCents = 0;

      if (model === 'packs') {
        const packTier = customData.packTier || 'india';
        const packConfig = this.packTiers[packTier]?.[plan];
        if (packConfig) {
          await this.applyPackPurchase(tx, userId, packConfig);
          baseAmountCents = packConfig.amountCents;
          
          if (event.data?.customer_id) {
            await tx.user.update({
              where: { id: userId },
              data: { paddleCustomerId: event.data.customer_id },
            });
          }
        }
      } else {
        const configuredPlan = this.paddlePlanConfig[plan] || this.paddlePlanConfig.monthly;
        baseAmountCents = configuredPlan.amountCents;
        const subResult = await this.applySubscriptionPurchase(
          tx, 
          userId, 
          configuredPlan.durationDays, 
          paymentDate, 
          event.data?.customer_id, 
          'paddle'
        );
        if (subResult) {
            subscriptionStartsAt = subResult.subscriptionStart;
            subscriptionEndsAt = subResult.subscriptionEnd;
        }
      }

      const amountCents = event.data?.details?.totals?.total
        ? Math.round(Number(event.data.details.totals.total))
        : baseAmountCents;

      const reference = `paddle_${transactionId}`;

      // Upsert payment transaction
      await tx.paymentTransaction.upsert({
        where: { paddleTransactionId: transactionId },
        update: {
          status: PaymentStatus.SUCCESS,
          paidAt: paymentDate,
          amountCents,
          currency: event.data?.details?.totals?.currency_code || 'USD',
          subscriptionStartsAt,
          subscriptionEndsAt,
          metadata: {
            ...(typeof existingTransaction?.metadata === 'object' && existingTransaction?.metadata
              ? (existingTransaction.metadata as Record<string, unknown>)
              : {}),
            verifiedAt: new Date().toISOString(),
            paddleEventType: event.event_type,
            model,
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
          subscriptionStartsAt,
          subscriptionEndsAt,
          metadata: {
            userId,
            plan,
            model,
            paddleEventType: event.event_type,
          },
        },
      });
    });

    return { received: true };
  }

  // ==========================================
  // POLAR METHODS
  // ==========================================

  async initializePolarCheckout(userId: string, plan: PlanKey = 'starter', model: PaymentModel = 'packs', countryCode?: string) {
    const polarAccessToken = this.configService.get<string>('POLAR_ACCESS_TOKEN');
    if (!polarAccessToken) {
      throw new InternalServerErrorException('Polar is not configured');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, fullName: true, polarCustomerId: true, country: true },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    const resolvedCountry = countryCode || user.country;
    const region = getRegionConfig(resolvedCountry);

    if (region.provider === 'paystack' && model === 'packs') {
      throw new ForbiddenException('Nigerian users must use Paystack for session packs');
    }

    let polarProductId: string;
    let amountCents: number;
    let customData: any = { userId, plan, model };

    if (model === 'packs') {
      if (!region.packTier || region.packTier === 'nigeria') {
        throw new BadRequestException('Pack purchases are not available for this region via Polar');
      }

      const tierPacks = this.packTiers[region.packTier];
      if (!tierPacks) {
        throw new BadRequestException(`Pack tier "${region.packTier}" is not configured`);
      }

      const packConfig = tierPacks[plan];
      if (!packConfig) {
        throw new BadRequestException(`Invalid pack plan "${plan}" for tier "${region.packTier}"`);
      }

      // Look up the Polar product ID from env
      const envKey = `POLAR_PRODUCT_${region.packTier.toUpperCase()}_${plan.toUpperCase()}`;
      polarProductId = this.configService.get<string>(envKey) || '';
      amountCents = packConfig.amountCents;
      customData.packTier = region.packTier;
      
    } else {
      // Subscriptions
      const subConfig = this.paddlePlanConfig[plan]; // Reuse paddle durations and fallback prices mapping
      if (!subConfig) {
        throw new BadRequestException(`Invalid subscription plan "${plan}"`);
      }
      
      let regionPrefix = plan.includes('sa') ? 'SA' : 'ROW';
      let planSuffix = plan.includes('monthly') ? 'MONTHLY' : 'YEARLY';
      
      const envKey = `POLAR_SUB_${regionPrefix}_${planSuffix}`;
      polarProductId = this.configService.get<string>(envKey) || '';
      amountCents = subConfig.amountCents;
      customData.subscriptionDurationDays = subConfig.durationDays;
    }

    if (!polarProductId) {
      throw new InternalServerErrorException(`Polar product not configured (missing env var)`);
    }

    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
    const reference = `polar_${Date.now()}_${userId.slice(0, 8)}`;

    const polar = new Polar({
      accessToken: polarAccessToken,
      server: this.configService.get<string>('POLAR_ENVIRONMENT') === 'production' ? 'production' : 'sandbox',
    });

    try {
      // Create Polar checkout via SDK
      const checkout = await polar.checkouts.create({
        products: [polarProductId],
        successUrl: `${frontendUrl}/settings?payment=polar&status=success`,
        customerEmail: user.email,
        metadata: {
          userId: user.id,
          plan,
          model,
            ...customData,
          reference,
        },
      });

      if (!checkout.id || !checkout.url) {
        throw new Error('Missing ID or URL in Polar response');
      }

      // Create pending transaction record
      await this.prisma.paymentTransaction.create({
        data: {
          userId,
          provider: 'polar',
          plan,
          amountCents,
          currency: 'USD',
          reference,
          polarCheckoutId: checkout.id,
          status: PaymentStatus.PENDING,
          metadata: {
            userId,
            plan,
            polarCheckoutId: checkout.id,
            ...customData
          },
        },
      });

      return {
        checkoutUrl: checkout.url,
        reference,
        amountCents,
        currency: 'USD',
        plan,
      };
    } catch (error: any) {
      this.logger.error('Polar checkout creation failed', error);
      throw new BadRequestException(error.message || 'Failed to create Polar checkout');
    }
  }

  async handlePolarWebhook(rawBody: Buffer | undefined, headers: Record<string, string>) {
    console.log("rawbody", rawBody);
    
    const webhookSecret = this.configService.get<string>('POLAR_WEBHOOK_SECRET');
    if (!webhookSecret) {
      throw new InternalServerErrorException('Polar webhook secret is not configured');
    }

    if (!rawBody) {
      throw new UnauthorizedException('Missing webhook body');
    }

    let event: {
      type?: string;
      data?: {
        id?: string;
        status?: string;
        customer_id?: string;
        checkout_id?: string;
        metadata?: {
          userId?: string;
          plan?: string;
          packTier?: string;
          reference?: string;
          model?: string;
        };
        amount?: number;
        currency?: string;
      };
    };

    try {
      const webhookSecretB64 = Buffer.from(webhookSecret, 'utf-8').toString('base64');
      const webhook = new Webhook(webhookSecretB64);
      event = webhook.verify(rawBody.toString('utf-8'), headers) as any;
    } catch (error) {
      this.logger.error('Polar webhook signature verification failed', error);
      throw new UnauthorizedException('Invalid webhook signature');
    }

    console.log("event", event);
    
    this.logger.log(`Polar webhook received: ${event.type}`);

    if (event.type !== 'order.paid' || !event.data?.id) {
      return { received: true };
    }

    const checkoutId = event.data.checkout_id || event.data.id; // fallback to order id if checkout_id missing
    const metadata = event.data.metadata;
    const userId = metadata?.userId;

    if (!userId) {
      this.logger.warn('Polar webhook missing userId in metadata');
      return { received: true };
    }

    const plan = metadata?.plan || 'starter';
    const model = metadata?.model || 'packs';
    const paymentDate = new Date(); // Polar paid time not clearly in root event data, fallback

    await this.prisma.$transaction(async (tx) => {
      // Check idempotency
      const existingTransaction = await tx.paymentTransaction.findUnique({
        where: { polarCheckoutId: checkoutId },
      });

      if (existingTransaction?.status === PaymentStatus.SUCCESS) {
        return;
      }

      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { id: true },
      });

      if (!user) {
        this.logger.warn(`Polar webhook: user ${userId} not found`);
        return;
      }

      let subscriptionStartsAt: Date | undefined;
      let subscriptionEndsAt: Date | undefined;
      let baseAmountCents = 0;

      if (model === 'packs') {
        const packTier = metadata?.packTier || 'india';
        const packConfig = this.packTiers[packTier]?.[plan];
        if (packConfig) {
          await this.applyPackPurchase(tx, userId, packConfig);
          baseAmountCents = packConfig.amountCents;
          
          if (event.data?.customer_id) {
            await tx.user.update({
              where: { id: userId },
              data: { polarCustomerId: event.data.customer_id },
            });
          }
        } else {
             this.logger.warn(`Polar webhook: unknown pack tier/plan: ${packTier}/${plan}`);
        }
      } else {
        const configuredPlan = this.paddlePlanConfig[plan] || this.paddlePlanConfig.monthly; // reuse
        baseAmountCents = configuredPlan.amountCents;
        const subResult = await this.applySubscriptionPurchase(
          tx, 
          userId, 
          configuredPlan.durationDays, 
          paymentDate, 
          event.data?.customer_id, 
          'polar'
        );
        if (subResult) {
            subscriptionStartsAt = subResult.subscriptionStart;
            subscriptionEndsAt = subResult.subscriptionEnd;
        }
      }

      const reference = metadata?.reference || `polar_${checkoutId}`;

      // Upsert payment transaction
      await tx.paymentTransaction.upsert({
        where: { polarCheckoutId: checkoutId },
        update: {
          status: PaymentStatus.SUCCESS,
          paidAt: paymentDate,
          amountCents: event.data?.amount || baseAmountCents,
          currency: event.data?.currency || 'USD',
          subscriptionStartsAt,
          subscriptionEndsAt,
          metadata: {
            ...(typeof existingTransaction?.metadata === 'object' && existingTransaction?.metadata
              ? (existingTransaction.metadata as Record<string, unknown>)
              : {}),
            verifiedAt: new Date().toISOString(),
            polarEventType: event.type,
            model,
          },
        },
        create: {
          userId,
          provider: 'polar',
          plan,
          amountCents: event.data?.amount || baseAmountCents,
          currency: event.data?.currency || 'USD',
          reference,
          polarCheckoutId: checkoutId,
          status: PaymentStatus.SUCCESS,
          paidAt: paymentDate,
          subscriptionStartsAt,
          subscriptionEndsAt,
          metadata: {
            userId,
            plan,
            model,
            polarEventType: event.type,
          },
        },
      });
    });

    return { received: true };
  }
}
