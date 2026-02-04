import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { Role } from '../generated/prisma/enums';
import { UpdateUserDto } from './dto/update-user.dto';
import { NotFoundException } from '@nestjs/common';

jest.mock('../generated/prisma/client', () => ({
      PrismaClient: jest.fn(),
      Role: { CUSTOMER: 'CUSTOMER', ADMIN: 'ADMIN' },
      ProductStatus: { ACTIVE: 'ACTIVE', INACTIVE: 'INACTIVE' },
      OrderStatus: { PENDING: 'PENDING', PAID: 'PAID', CANCELED: 'CANCELED' },
      PaymentProvider: { STRIPE: 'STRIPE', BKASH: 'BKASH' },
      PaymentStatus: { PENDING: 'PENDING', SUCCESS: 'SUCCESS', FAILED: 'FAILED' },
}));

describe('UsersController', () => {
      let controller: UsersController;
      let service: UsersService;

      const mockUser = new User('user-id', 'test@example.com', 'Test', 'User', Role.CUSTOMER, true, new Date(), new Date());

      const mockUsersService = {
            getUserOrders: jest.fn(),
            getUserPayments: jest.fn(),
            findById: jest.fn(),
            update: jest.fn(),
      };

      beforeEach(async () => {
            const module: TestingModule = await Test.createTestingModule({
                  controllers: [UsersController],
                  providers: [
                        {
                              provide: UsersService,
                              useValue: mockUsersService,
                        },
                  ],
            }).compile();

            controller = module.get<UsersController>(UsersController);
            service = module.get<UsersService>(UsersService);
      });

      it('should be defined', () => {
            expect(controller).toBeDefined();
      });

      describe('getProfile', () => {
            it('should return current user profile', async () => {
                  const result = await controller.getProfile(mockUser);
                  expect(result).toHaveProperty('id', mockUser.id);
                  expect(result).toHaveProperty('email', mockUser.email);
            });
      });

      describe('getUserOrders', () => {
            it('should return user orders', async () => {
                  const mockOrders = [
                        {
                              id: 'order-1',
                              userId: 'user-id',
                              totalAmount: 100,
                              status: 'PENDING',
                              items: [],
                              createdAt: new Date(),
                              updatedAt: new Date(),
                        },
                  ];
                  mockUsersService.getUserOrders.mockResolvedValue(mockOrders);

                  const result = await controller.getUserOrders(mockUser);

                  expect(service.getUserOrders).toHaveBeenCalledWith(mockUser.id);
                  expect(result).toHaveLength(1);
                  expect(result[0].id).toBe('order-1');
            });
      });

      describe('getUserPayments', () => {
            it('should return user payments', async () => {
                  const mockPayments = [
                        {
                              id: 'payment-1',
                              orderId: 'order-1',
                              order: {},
                              provider: 'STRIPE',
                              transactionId: 'txn_123',
                              status: 'COMPLETED',
                              intentResponse: {},
                              createdAt: new Date(),
                              updatedAt: new Date(),
                        },
                  ];
                  mockUsersService.getUserPayments.mockResolvedValue(mockPayments);

                  const result = await controller.getUserPayments(mockUser);

                  expect(service.getUserPayments).toHaveBeenCalledWith(mockUser.id);
                  expect(result).toHaveLength(1);
                  expect(result[0].id).toBe('payment-1');
            });
      });

      describe('getUserById', () => {
            it('should return user by id', async () => {
                  mockUsersService.findById.mockResolvedValue(mockUser);

                  const result = await controller.getUserById('user-id');

                  expect(service.findById).toHaveBeenCalledWith('user-id');
                  expect(result).toHaveProperty('id', mockUser.id);
            });

            it('should throw NotFoundException if user not found', async () => {
                  mockUsersService.findById.mockResolvedValue(null);

                  await expect(controller.getUserById('user-id')).rejects.toThrow(NotFoundException);
            });
      });

      describe('updateUser', () => {
            it('should update user', async () => {
                  const updateUserDto: UpdateUserDto = { firstName: 'Updated' };
                  const updatedUser = new User(
                        mockUser.id,
                        mockUser.email,
                        'Updated',
                        mockUser.lastName,
                        mockUser.role,
                        mockUser.isActive,
                        mockUser.createdAt,
                        mockUser.updatedAt,
                  );

                  mockUsersService.update.mockResolvedValue(updatedUser);

                  const result = await controller.updateUser('user-id', updateUserDto, mockUser);

                  expect(service.update).toHaveBeenCalledWith('user-id', updateUserDto, mockUser.id, mockUser.role);
                  expect(result).toHaveProperty('firstName', 'Updated');
            });
      });
});
