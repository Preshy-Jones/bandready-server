import { Test, TestingModule } from '@nestjs/testing';
import { PaymentsService } from './payments.service';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../common/prisma/prisma.service';
import { UnauthorizedException, InternalServerErrorException } from '@nestjs/common';
import { Webhook } from 'standardwebhooks';
import { PaymentStatus } from '@prisma/client';

jest.mock('standardwebhooks');

describe('PaymentsService', () => {
  let paymentsService: PaymentsService;
  let configService: jest.Mocked<ConfigService>;
  let prismaService: jest.Mocked<PrismaService>;

  beforeEach(async () => {
    const mockConfigService = {
      get: jest.fn(),
    };

    const mockPrismaService = {
      appSetting: {
        findUnique: jest.fn(),
      },
      user: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      paymentTransaction: {
        findUnique: jest.fn(),
        create: jest.fn(),
        upsert: jest.fn(),
      },
      $transaction: jest.fn().mockImplementation(async (cb) => {
        // execute callback directly in test
        return cb(mockPrismaService);
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        { provide: ConfigService, useValue: mockConfigService },
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    paymentsService = module.get<PaymentsService>(PaymentsService);
    configService = module.get(ConfigService);
    prismaService = module.get(PrismaService) as any;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('handlePolarWebhook', () => {
    it('throws InternalServerErrorException if secret is not configured', async () => {
      configService.get.mockReturnValue(undefined);

      await expect(
        paymentsService.handlePolarWebhook(Buffer.from('{}'), {})
      ).rejects.toThrow(InternalServerErrorException);
    });

    it('throws UnauthorizedException if body is missing', async () => {
      configService.get.mockReturnValue('secret');
      
      await expect(
        paymentsService.handlePolarWebhook(undefined, {})
      ).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException if webhook signature verification fails', async () => {
      configService.get.mockReturnValue('secret');
      
      // Mock standardwebhooks to throw
      (Webhook.prototype.verify as jest.Mock).mockImplementation(() => {
        throw new Error('Verification failed');
      });

      await expect(
        paymentsService.handlePolarWebhook(Buffer.from('{}'), { 'webhook-signature': 'invalid' })
      ).rejects.toThrow(UnauthorizedException);
    });

    it('processes order.paid pack purchase idempotently', async () => {
      configService.get.mockReturnValue('secret');
      
      const eventPayload = {
        type: 'order.paid',
        data: {
          id: 'order_123',
          customer_id: 'cust_abc',
          metadata: {
            userId: 'user_1',
            model: 'packs',
            plan: 'starter',
            packTier: 'india'
          }
        }
      };

      (Webhook.prototype.verify as jest.Mock).mockReturnValue(eventPayload);

      // Setup idempotency check to pass (no existing transaction)
      (prismaService.paymentTransaction.findUnique as jest.Mock).mockResolvedValue(null);
      // User exists
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user_1',
        speakingBalance: 0,
        writingBalance: 0
      });

      // Update user for the pack config (starter pack: 3 session, 5 writing)
      (prismaService.user.update as jest.Mock).mockResolvedValue({});

      // Create transaction record
      (prismaService.paymentTransaction.create as jest.Mock).mockResolvedValue({});
      (prismaService.paymentTransaction.upsert as jest.Mock).mockResolvedValue({});

      const res = await paymentsService.handlePolarWebhook(Buffer.from('{}'), { 'webhook-signature': 'valid' });

      // expect top level return
      expect(res).toEqual({ received: true });
      expect(prismaService.paymentTransaction.findUnique).toHaveBeenCalledWith({
        where: { polarCheckoutId: 'order_123' },
      });
      expect(prismaService.user.update).toHaveBeenCalledWith(expect.objectContaining({
        where: { id: 'user_1' },
      }));
    });

    it('returns early if idempotency check fails (already processed)', async () => {
      configService.get.mockReturnValue('secret');
      
      const eventPayload = {
        type: 'order.paid',
        data: {
          id: 'order_123',
          metadata: { userId: 'user_1' }
        }
      };
      (Webhook.prototype.verify as jest.Mock).mockReturnValue(eventPayload);

      // Return a SUCCESS transaction to trigger idempotency skip
      (prismaService.paymentTransaction.findUnique as jest.Mock).mockResolvedValue({
        status: PaymentStatus.SUCCESS
      });

      const res = await paymentsService.handlePolarWebhook(Buffer.from('{}'), { 'webhook-signature': 'valid' });
      expect(res).toEqual({ received: true });

      // Ensure user was not queried or updated
      expect(prismaService.user.update).not.toHaveBeenCalled();
    });
  });
});
