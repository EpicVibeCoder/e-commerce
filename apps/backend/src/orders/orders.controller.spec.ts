import { Test, TestingModule } from '@nestjs/testing';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { OrderStatus } from '../generated/prisma/enums';
import { Order } from './entities/order.entity';
import { User } from '../users/entities/user.entity';

jest.mock('../generated/prisma/client', () => ({
      PrismaClient: jest.fn(),
      Role: { CUSTOMER: 'CUSTOMER', ADMIN: 'ADMIN' },
      ProductStatus: { ACTIVE: 'ACTIVE', INACTIVE: 'INACTIVE' },
      OrderStatus: { PENDING: 'PENDING', PAID: 'PAID', CANCELED: 'CANCELED' },
      PaymentProvider: { STRIPE: 'STRIPE', BKASH: 'BKASH' },
      PaymentStatus: { PENDING: 'PENDING', SUCCESS: 'SUCCESS', FAILED: 'FAILED' },
}));

describe('OrdersController', () => {
      let controller: OrdersController;
      let service: OrdersService;

      const mockUser = {
            id: 'user-id',
      } as User;

      const mockOrder = new Order('order-id', 'user-id', 100, OrderStatus.PENDING, new Date(), new Date(), []);

      const mockOrdersService = {
            create: jest.fn(),
            findAll: jest.fn(),
            findOne: jest.fn(),
            cancel: jest.fn(),
      };

      beforeEach(async () => {
            const module: TestingModule = await Test.createTestingModule({
                  controllers: [OrdersController],
                  providers: [
                        {
                              provide: OrdersService,
                              useValue: mockOrdersService,
                        },
                  ],
            }).compile();

            controller = module.get<OrdersController>(OrdersController);
            service = module.get<OrdersService>(OrdersService);
      });

      it('should be defined', () => {
            expect(controller).toBeDefined();
      });

      describe('create', () => {
            it('should create an order', async () => {
                  mockOrdersService.create.mockResolvedValue(mockOrder);
                  const createDto = { items: [] } as any;
                  const result = await controller.create(mockUser, createDto);
                  expect(result.id).toBe(mockOrder.id);
            });
      });

      describe('findAll', () => {
            it('should return all orders', async () => {
                  mockOrdersService.findAll.mockResolvedValue([mockOrder]);
                  const result = await controller.findAll(mockUser);
                  expect(result).toHaveLength(1);
            });
      });

      describe('findOne', () => {
            it('should return an order', async () => {
                  mockOrdersService.findOne.mockResolvedValue(mockOrder);
                  const result = await controller.findOne('order-id', mockUser);
                  expect(result.id).toBe(mockOrder.id);
            });
      });

      describe('cancel', () => {
            it('should cancel an order', async () => {
                  const canceledOrder = new Order(
                        mockOrder.id,
                        mockOrder.userId,
                        mockOrder.totalAmount,
                        OrderStatus.CANCELED,
                        mockOrder.createdAt,
                        mockOrder.updatedAt,
                        mockOrder.items,
                  );
                  mockOrdersService.cancel.mockResolvedValue(canceledOrder);

                  const result = await controller.cancel(mockUser, 'order-id');
                  expect(result.status).toBe(OrderStatus.CANCELED);
            });
      });
});
