import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';
import { ConflictException, NotFoundException, ForbiddenException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { Role } from '../generated/prisma/enums';

jest.mock('../generated/prisma/client', () => ({
  PrismaClient: jest.fn(),
  Role: { CUSTOMER: 'CUSTOMER', ADMIN: 'ADMIN' },
  ProductStatus: { ACTIVE: 'ACTIVE', INACTIVE: 'INACTIVE' },
  OrderStatus: { PENDING: 'PENDING', PAID: 'PAID', CANCELED: 'CANCELED' },
  PaymentProvider: { STRIPE: 'STRIPE', BKASH: 'BKASH' },
  PaymentStatus: { PENDING: 'PENDING', SUCCESS: 'SUCCESS', FAILED: 'FAILED' },
}));

// Mock bcrypt
jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashedpassword'),
  compare: jest.fn().mockResolvedValue(true),
}));

describe('UsersService', () => {
  let service: UsersService;
  let prisma: PrismaService;
  let bcryptHash: jest.Mock;
  let bcryptCompare: jest.Mock;

  const mockUser = {
    id: 'user-id',
    email: 'test@example.com',
    password: 'hashedpassword',
    firstName: 'Test',
    lastName: 'User',
    role: Role.CUSTOMER,
    isActive: true,
  };

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    order: {
      findMany: jest.fn(),
    },
    payment: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    prisma = module.get<PrismaService>(PrismaService);

    // Setup bcrypt mocks reference if needed, but since it's global mock we can use require('bcrypt') or just expect calls if we want.
    // However, the test expects imports to work.
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new user', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockPrismaService.user.create.mockResolvedValue(mockUser);

      const result = await service.create('test@example.com', 'password', 'Test', 'User');

      expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { email: 'test@example.com' } });
      expect(bcrypt.hash).toHaveBeenCalledWith('password', 10);
      expect(prisma.user.create).toHaveBeenCalled();
      expect(result).toBeInstanceOf(User);
      expect(result.email).toBe(mockUser.email);
    });

    it('should throw ConflictException if user already exists', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      await expect(service.create('test@example.com', 'password', 'Test', 'User')).rejects.toThrow(ConflictException);
    });
  });

  describe('findByEmail', () => {
    it('should return a user if found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.findByEmail('test@example.com');

      expect(result).toBeInstanceOf(User);
      expect(result!.email).toBe(mockUser.email);
    });

    it('should return null if not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      const result = await service.findByEmail('notfound@example.com');

      expect(result).toBeNull();
    });
  });

  describe('findById', () => {
    it('should return a user if found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.findById('user-id');

      expect(result).toBeInstanceOf(User);
      expect(result!.id).toBe(mockUser.id);
    });
  });

  describe('update', () => {
    it('should update user profile', async () => {
      const updateUserDto = { firstName: 'Updated' };
      const updatedUser = { ...mockUser, firstName: 'Updated' };

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.user.update.mockResolvedValue(updatedUser);

      const result = await service.update('user-id', updateUserDto, 'user-id', 'CUSTOMER');

      expect(prisma.user.update).toHaveBeenCalled();
      expect(result.firstName).toBe('Updated');
    });

    it('should throw ForbiddenException if user tries to update another user', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      await expect(service.update('user-id', {}, 'other-id', 'CUSTOMER')).rejects.toThrow(ForbiddenException);
    });

    it('should allow Admin to update any user', async () => {
      const updateUserDto = { firstName: 'Updated' };
      const updatedUser = { ...mockUser, firstName: 'Updated' };

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.user.update.mockResolvedValue(updatedUser);

      const result = await service.update('user-id', updateUserDto, 'admin-id', 'ADMIN');

      expect(prisma.user.update).toHaveBeenCalled();
      expect(result.firstName).toBe('Updated');
    });

    it('should throw NotFoundException if user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      await expect(service.update('user-id', {}, 'user-id', 'CUSTOMER')).rejects.toThrow(NotFoundException);
    });
  });
});
