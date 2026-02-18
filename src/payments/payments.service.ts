import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, timingSafeEqual } from 'crypto';
import { PrismaService } from '../common/prisma/prisma.service';
import { PaymentStatus } from '@prisma/client';

type PlanKey = 'monthly' | 'quarterly' | 'yearly';

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
  private readonly planConfig: Record<PlanKey, { amountKobo: number; durationDays: number }>;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.planConfig = {
      monthly: {
        amountKobo: Number(this.configService.get('PAYSTACK_PREMIUM_MONTHLY_AMOUNT_KOBO') || 500000),
        durationDays: Number(this.configService.get('PAYSTACK_PREMIUM_MONTHLY_DURATION_DAYS') || 30),
      },
      quarterly: {
        amountKobo: Number(this.configService.get('PAYSTACK_PREMIUM_QUARTERLY_AMOUNT_KOBO') || 1350000),
        durationDays: Number(this.configService.get('PAYSTACK_PREMIUM_QUARTERLY_DURATION_DAYS') || 90),
      },
      yearly: {
        amountKobo: Number(this.configService.get('PAYSTACK_PREMIUM_YEARLY_AMOUNT_KOBO') || 5000000),
        durationDays: Number(this.configService.get('PAYSTACK_PREMIUM_YEARLY_DURATION_DAYS') || 365),
      },
    };
  }

  getPublicConfig() {
    return {
      publicKey: this.configService.get<string>('PAYSTACK_PUBLIC_KEY') || null,
      plans: this.planConfig,
    };
  }

  async initializePaystackTransaction(userId: string, plan: PlanKey = 'monthly') {
    const paystackSecretKey = this.configService.get<string>('PAYSTACK_SECRET_KEY');
    if (!paystackSecretKey) {
      throw new InternalServerErrorException('Paystack is not configured');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, fullName: true },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    const selectedPlan = this.planConfig[plan];
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

    return {
      reference: verification.reference,
      status: 'success',
      subscriptionTier: 'premium',
      subscriptionExpiresAt: (await this.prisma.user.findUnique({
        where: { id: userId },
        select: { subscriptionExpiresAt: true },
      }))?.subscriptionExpiresAt,
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

    const plan = verification.metadata?.plan || 'monthly';
    const configuredPlan = this.planConfig[plan] || this.planConfig.monthly;
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

      await tx.user.update({
        where: { id: requestedUserId },
        data: {
          subscriptionTier: 'premium',
          subscriptionExpiresAt: subscriptionEnd,
          paystackCustomerCode: verification.customer?.customer_code || undefined,
        },
      });

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
}
