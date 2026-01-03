import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import { Role } from '../generated/prisma/enums';

jest.mock('../generated/prisma/client', () => ({
  PrismaClient: jest.fn(),
  Role: { CUSTOMER: 'CUSTOMER', ADMIN: 'ADMIN' },
  ProductStatus: { ACTIVE: 'ACTIVE', INACTIVE: 'INACTIVE' },
  OrderStatus: { PENDING: 'PENDING', PAID: 'PAID', CANCELED: 'CANCELED' },
  PaymentProvider: { STRIPE: 'STRIPE', BKASH: 'BKASH' },
  PaymentStatus: { PENDING: 'PENDING', SUCCESS: 'SUCCESS', FAILED: 'FAILED' },
}));
jest.mock('../users/users.service');

describe('AuthService', () => {
  let service: AuthService;
  let usersService: UsersService;
  let jwtService: JwtService;

  const mockUser = {
    id: 'user-id',
    email: 'test@example.com',
    password: 'hashedpassword',
    firstName: 'Test',
    lastName: 'User',
    role: Role.CUSTOMER,
    isActive: true,
    canAuthenticate: () => true,
    toJSON: jest.fn().mockReturnValue({
      id: 'user-id',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      role: Role.CUSTOMER,
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: {
            create: jest.fn(),
            findByEmail: jest.fn(),
            validatePassword: jest.fn(),
            findById: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('mock-jwt-token'),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
    jwtService = module.get<JwtService>(JwtService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    it('should register a new user and return user data with token', async () => {
      const registerDto = {
        email: 'test@example.com',
        password: 'password',
        firstName: 'Test',
        lastName: 'User',
      };

      jest.spyOn(usersService, 'create').mockResolvedValue(mockUser as any);

      const result = await service.register(registerDto);

      expect(usersService.create).toHaveBeenCalledWith(registerDto.email, registerDto.password, registerDto.firstName, registerDto.lastName);
      expect(jwtService.sign).toHaveBeenCalled();
      expect(result).toEqual({
        access_token: 'mock-jwt-token',
        user: mockUser.toJSON(),
      });
    });
  });

  describe('login', () => {
    it('should return token and user info for valid credentials', async () => {
      const loginDto = { email: 'test@example.com', password: 'password' };

      jest.spyOn(usersService, 'findByEmail').mockResolvedValue(mockUser as any);
      jest.spyOn(usersService, 'validatePassword').mockResolvedValue(true);

      const result = await service.login(loginDto);

      expect(result).toEqual({
        access_token: 'mock-jwt-token',
        user: mockUser.toJSON(),
      });
    });

    it('should throw UnauthorizedException for invalid email', async () => {
      jest.spyOn(usersService, 'findByEmail').mockResolvedValue(null);

      await expect(service.login({ email: 'wrong@example.com', password: 'p' })).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for inactive user', async () => {
      const inactiveUser = { ...mockUser, canAuthenticate: () => false };
      jest.spyOn(usersService, 'findByEmail').mockResolvedValue(inactiveUser as any);

      await expect(service.login({ email: 'test@example.com', password: 'p' })).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for invalid password', async () => {
      jest.spyOn(usersService, 'findByEmail').mockResolvedValue(mockUser as any);
      jest.spyOn(usersService, 'validatePassword').mockResolvedValue(false);

      await expect(service.login({ email: 'test@example.com', password: 'wrong' })).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('validateUser', () => {
    it('should return user if valid', async () => {
      jest.spyOn(usersService, 'findById').mockResolvedValue(mockUser as any);

      const result = await service.validateUser({ sub: 'user-id', email: 'test@example.com', role: Role.CUSTOMER });

      expect(result).toBe(mockUser);
    });

    it('should throw UnauthorizedException if user not found', async () => {
      jest.spyOn(usersService, 'findById').mockResolvedValue(null);

      await expect(service.validateUser({ sub: 'user-id', email: 'test@example.com', role: Role.CUSTOMER })).rejects.toThrow(UnauthorizedException);
    });
  });
});
