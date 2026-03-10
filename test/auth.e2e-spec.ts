import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AuthModule } from './../src/auth/auth.module';
import { MailModule } from './../src/mail/mail.module';
import { UsersService } from './../src/users/users.service';
import { MailService } from './../src/mail/mail.service';
import { ConfigModule } from '@nestjs/config';

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let mockUsersService: Partial<UsersService>;
  let mockMailService: Partial<MailService>;

  beforeAll(async () => {
    mockUsersService = {
      findByEmail: jest.fn(),
      findByPasswordResetTokenHash: jest.fn(),
      createWithPassword: jest.fn(),
      update: jest.fn(),
    };

    mockMailService = {
      sendVerificationOtp: jest.fn().mockResolvedValue(true),
      sendPasswordResetEmail: jest.fn().mockResolvedValue(true),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        MailModule,
        AuthModule
      ],
    })
      .overrideProvider(UsersService)
      .useValue(mockUsersService)
      .overrideProvider(MailService)
      .useValue(mockMailService)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/auth/register (POST)', () => {
    it('returns 400 if email is missing', async () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({ password: 'password123', fullName: 'Test User' })
        .expect(400);
    });

    it('returns 201 and requires OTP when registration succeeds', async () => {
      (mockUsersService.findByEmail as jest.Mock).mockResolvedValue(null);
      (mockUsersService.createWithPassword as jest.Mock).mockResolvedValue({ id: 'user1', email: 'test@example.com' });
      
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({ email: 'test@example.com', password: 'password123', fullName: 'Test User' });
        
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('requiresOtp', true);
      expect(mockMailService.sendVerificationOtp).toHaveBeenCalled();
    });

    it('returns 400 if user already exists', async () => {
      (mockUsersService.findByEmail as jest.Mock).mockResolvedValue({ id: 'user1' });
      
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({ email: 'exists@example.com', password: 'password123', fullName: 'Test' })
        .expect(400);
    });
  });

  describe('/auth/forgot-password (POST)', () => {
    it('returns 200 for a valid email payload', async () => {
      (mockUsersService.findByEmail as jest.Mock).mockResolvedValue(null);

      const response = await request(app.getHttpServer())
        .post('/auth/forgot-password')
        .send({ email: 'test@example.com' });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        message: 'If an account matches this email, a password reset link has been sent.',
      });
    });
  });

  describe('/auth/reset-password (POST)', () => {
    it('returns 400 if password is too short', async () => {
      return request(app.getHttpServer())
        .post('/auth/reset-password')
        .send({ token: 'token', password: '123' })
        .expect(400);
    });
  });
});
