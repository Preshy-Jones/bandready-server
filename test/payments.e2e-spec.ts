import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { PaymentsModule } from './../src/payments/payments.module';
import { PaymentsService } from './../src/payments/payments.service';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './../src/auth/strategies/jwt.strategy';
import { ConfigModule } from '@nestjs/config';
import { UsersService } from './../src/users/users.service';
import { AuthService } from './../src/auth/auth.service';
import { AuthGuard } from '@nestjs/passport';

describe('PaymentsController (e2e)', () => {
  let app: INestApplication;
  let mockPaymentsService: Partial<PaymentsService>;
  let mockUsersService: Partial<UsersService>;
  let jwtService: JwtService;
  let validToken: string;

  beforeAll(async () => {
    mockPaymentsService = {
      getPublicConfig: jest.fn().mockResolvedValue({ provider: 'polar', models: ['packs'] }),
      getProviderForCountry: jest.fn().mockResolvedValue('polar'),
      initializePolarCheckout: jest.fn().mockResolvedValue({ url: 'https://checkout.sandbox.polar.sh/123' }),
      handlePolarWebhook: jest.fn().mockResolvedValue({ received: true }),
    };

    mockUsersService = {
      findById: jest.fn().mockResolvedValue({ id: 'user_1', email: 'test@example.com' }),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          ignoreEnvFile: true,
          load: [() => ({ JWT_SECRET: 'test-secret' })],
        }),
        PassportModule.register({ defaultStrategy: 'jwt' }),
        JwtModule.register({ secret: 'test-secret' }),
        PaymentsModule
      ],
      providers: [
        JwtStrategy,
        { provide: UsersService, useValue: mockUsersService },
        { 
          provide: AuthService, 
          useValue: { validateJwtPayload: jest.fn().mockResolvedValue({ id: 'user_1', email: 'test@example.com' }) } 
        }
      ]
    })
      .overrideGuard(AuthGuard('jwt'))
      .useValue({
        canActivate: (context: any) => {
          const req = context.switchToHttp().getRequest();
          req.user = { id: 'user_1', email: 'test@example.com' };
          return true;
        }
      })
      .overrideProvider(PaymentsService)
      .useValue(mockPaymentsService)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();

    jwtService = moduleFixture.get<JwtService>(JwtService);
    validToken = jwtService.sign({ sub: 'user_1', email: 'test@example.com' });
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Public Configuration endpoints', () => {
    it('/payments/config (GET)', async () => {
      const resp = await request(app.getHttpServer()).get('/payments/config?country=NG');
      expect(resp.status).toBe(200);
      expect(mockPaymentsService.getPublicConfig).toHaveBeenCalledWith('NG');
    });

    it('/payments/provider (GET)', async () => {
      const resp = await request(app.getHttpServer()).get('/payments/provider?country=IN');
      expect(resp.status).toBe(200);
      expect(resp.body).toHaveProperty('provider', 'polar');
    });
  });

  describe('Protected Polar Checkout endpoint', () => {
    it('/payments/polar/checkout (POST) returns checkout url when authorized', async () => {
      const resp = await request(app.getHttpServer())
        .post('/payments/polar/checkout')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ plan: 'starter', model: 'packs' });
        
      expect(resp.status).toBe(201);
      expect(resp.body).toHaveProperty('url');
      expect(mockPaymentsService.initializePolarCheckout).toHaveBeenCalledWith('user_1', 'starter', 'packs', undefined);
    });
  });

  describe('Webhook endpoint', () => {
    it('/payments/polar/webhook (POST) succeeds without auth guard', async () => {
      const resp = await request(app.getHttpServer())
        .post('/payments/polar/webhook')
        .set('webhook-signature', 'valid')
        .send({ type: 'order.paid' });
        
      expect(resp.status).toBe(200);
      expect(mockPaymentsService.handlePolarWebhook).toHaveBeenCalled();
    });
  });
});
