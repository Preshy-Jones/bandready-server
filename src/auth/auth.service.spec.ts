import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { MailService } from '../mail/mail.service';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('AuthService', () => {
  let authService: AuthService;
  let usersService: jest.Mocked<UsersService>;
  let jwtService: jest.Mocked<JwtService>;
  let mailService: jest.Mocked<MailService>;

  beforeEach(async () => {
    // Define mock objects
    const mockUsersService = {
      findByEmail: jest.fn(),
      findByGoogleId: jest.fn(),
      findById: jest.fn(),
      createWithPassword: jest.fn(),
      createFromGoogle: jest.fn(),
      linkGoogleAccount: jest.fn(),
      update: jest.fn(),
    };

    const mockJwtService = {
      sign: jest.fn(),
    };

    const mockMailService = {
      sendVerificationOtp: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: MailService, useValue: mockMailService },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    usersService = module.get(UsersService);
    jwtService = module.get(JwtService);
    mailService = module.get(MailService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should throw BadRequestException if email is already in use', async () => {
      usersService.findByEmail.mockResolvedValue({ id: 'any' } as any);
      
      await expect(
        authService.register({ email: 'test@test.com', password: 'pass', fullName: 'Test' })
      ).rejects.toThrow(BadRequestException);
    });

    it('should successfully register a new user and trigger OTP', async () => {
      usersService.findByEmail.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPass');
      
      const mockCreatedUser = { id: 'user-id', email: 'test@test.com' };
      usersService.createWithPassword.mockResolvedValue(mockCreatedUser as any);
      usersService.update.mockResolvedValue(mockCreatedUser as any);
      mailService.sendVerificationOtp.mockResolvedValue(true);

      const result = await authService.register({
        email: 'test@test.com',
        password: 'pass',
        fullName: 'Test User'
      });

      expect(bcrypt.hash).toHaveBeenCalledWith('pass', 10);
      expect(usersService.createWithPassword).toHaveBeenCalled();
      expect(usersService.update).toHaveBeenCalledWith('user-id', expect.objectContaining({
        isEmailVerified: false,
        emailVerificationOtp: expect.any(String),
      }));
      expect(mailService.sendVerificationOtp).toHaveBeenCalled();
      expect(result).toEqual({
        message: 'Registration successful. Please verify your email.',
        requiresOtp: true,
        email: 'test@test.com'
      });
    });
  });

  describe('login', () => {
    it('should throw UnauthorizedException if user not found', async () => {
      usersService.findByEmail.mockResolvedValue(null);

      await expect(
        authService.login({ email: 'test@test.com', password: 'pass' })
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if user has no passwordHash (Google)', async () => {
      usersService.findByEmail.mockResolvedValue({ id: 'user', email: 'test@test.com' } as any); // no passwordHash

      await expect(
        authService.login({ email: 'test@test.com', password: 'pass' })
      ).rejects.toThrow('Please sign in with Google');
    });

    it('should throw UnauthorizedException on wrong password', async () => {
      usersService.findByEmail.mockResolvedValue({
        id: 'user',
        email: 'test@test.com',
        passwordHash: 'hash'
      } as any);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        authService.login({ email: 'test@test.com', password: 'pass' })
      ).rejects.toThrow('Invalid email or password');
    });

    it('should require OTP if email is not verified', async () => {
      usersService.findByEmail.mockResolvedValue({
        id: 'user',
        email: 'test@test.com',
        passwordHash: 'hash',
        isEmailVerified: false
      } as any);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mailService.sendVerificationOtp.mockResolvedValue(true);
      usersService.update.mockResolvedValue({} as any);

      await expect(
        authService.login({ email: 'test@test.com', password: 'pass' })
      ).rejects.toMatchObject({
        response: expect.objectContaining({ requiresOtp: true }),
      });
      expect(mailService.sendVerificationOtp).toHaveBeenCalled();
    });

    it('should return user and tokens if successfully authenticated', async () => {
      const mockUser = {
        id: 'user1',
        email: 'test@test.com',
        fullName: 'Test',
        passwordHash: 'hash',
        isEmailVerified: true,
        role: 'USER',
      };
      
      usersService.findByEmail.mockResolvedValue(mockUser as any);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      jwtService.sign.mockReturnValue('mocked-token');

      const result = await authService.login({ email: 'test@test.com', password: 'pass' });

      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: 'user1',
        email: 'test@test.com',
        role: 'USER',
      });
      expect(result).toHaveProperty('accessToken', 'mocked-token');
      expect(result.user).toHaveProperty('id', 'user1');
    });
  });

  describe('validateGoogleUser', () => {
    it('should find existing google user', async () => {
      const gUser = { googleId: 'g123', email: 'test@google.com', fullName: 'Google User' };
      usersService.findByGoogleId.mockResolvedValue({ id: 'user1', googleId: 'g123' } as any);

      const result = await authService.validateGoogleUser(gUser);
      expect(result).toEqual(expect.objectContaining({ id: 'user1', isNew: false }));
    });

    it('should link existing email user to new google id', async () => {
      const gUser = { googleId: 'g123', email: 'test@google.com', fullName: 'Google User' };
      usersService.findByGoogleId.mockResolvedValue(null);
      usersService.findByEmail.mockResolvedValue({ id: 'user1', email: 'test@google.com' } as any);
      usersService.linkGoogleAccount.mockResolvedValue({ id: 'user1', googleId: 'g123' } as any);

      const result = await authService.validateGoogleUser(gUser);
      expect(usersService.linkGoogleAccount).toHaveBeenCalledWith('user1', 'g123', undefined);
      expect(result).toEqual(expect.objectContaining({ id: 'user1', isNew: false }));
    });

    it('should fully create a new user from google payload', async () => {
      const gUser = { googleId: 'g123', email: 'test@google.com', fullName: 'Google User' };
      usersService.findByGoogleId.mockResolvedValue(null);
      usersService.findByEmail.mockResolvedValue(null);
      usersService.createFromGoogle.mockResolvedValue({ id: 'user2', email: 'test@google.com' } as any);

      const result = await authService.validateGoogleUser(gUser);
      expect(usersService.createFromGoogle).toHaveBeenCalledWith(gUser);
      expect(result).toEqual(expect.objectContaining({ id: 'user2', isNew: true }));
    });
  });
});
