import { Test, TestingModule } from '@nestjs/testing';
import { PaymentsService } from './payments.service';
import { PrismaService } from '../prisma/prisma.service';
import { OrdersService } from '../orders/orders.service';
import { StripeStrategy } from './strategies/stripe.strategy';
import { BkashStrategy } from './strategies/bkash.strategy';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { PaymentProvider, PaymentStatus, OrderStatus } from '../generated/prisma/enums';
import { Payment } from './entities/payment.entity';

jest.mock('../generated/prisma/client', () => ({
      PrismaClient: jest.fn(),
      Role: { CUSTOMER: 'CUSTOMER', ADMIN: 'ADMIN' },
      ProductStatus: { ACTIVE: 'ACTIVE', INACTIVE: 'INACTIVE' },
      OrderStatus: { PENDING: 'PENDING', PAID: 'PAID', CANCELED: 'CANCELED' },
      PaymentProvider: { STRIPE: 'STRIPE', BKASH: 'BKASH' },
      PaymentStatus: { PENDING: 'PENDING', SUCCESS: 'SUCCESS', FAILED: 'FAILED' },
}));

describe('PaymentsService', () => {
      let service: PaymentsService;
      let prisma: PrismaService;
      let ordersService: OrdersService;
      let stripeStrategy: StripeStrategy;

      const mockOrder = {
            id: 'order-id',
            userId: 'user-id',
            totalAmount: 100,
            status: OrderStatus.PENDING,
      };

      const mockPayment = {
            id: 'payment-id',
            orderId: 'order-id',
            provider: PaymentProvider.STRIPE,
            transactionId: 'txn_123',
            status: PaymentStatus.PENDING,
            intentResponse: {},
      };

      const mockPrismaService = {
            order: {
                  findUnique: jest.fn(),
            },
            payment: {
                  findFirst: jest.fn(),
                  create: jest.fn(),
                  findUnique: jest.fn(),
                  update: jest.fn(),
                  findMany: jest.fn(),
            },
      };

      const mockOrdersService = {
            markAsPaid: jest.fn(),
      };

      const mockStripeStrategy = {
            createPaymentIntent: jest.fn(),
            confirmPayment: jest.fn(),
            handleWebhook: jest.fn(),
      };

      const mockBkashStrategy = {
            createPaymentIntent: jest.fn(),
            confirmPayment: jest.fn(),
            handleWebhook: jest.fn(),
      };

      beforeEach(async () => {
            const module: TestingModule = await Test.createTestingModule({
                  providers: [
                        PaymentsService,
                        {
                              provide: PrismaService,
                              useValue: mockPrismaService,
                        },
                        {
                              provide: OrdersService,
                              useValue: mockOrdersService,
                        },
                        {
                              provide: StripeStrategy,
                              useValue: mockStripeStrategy,
                        },
                        {
                              provide: BkashStrategy,
                              useValue: mockBkashStrategy,
                        },
                  ],
            }).compile();

            service = module.get<PaymentsService>(PaymentsService);
            prisma = module.get<PrismaService>(PrismaService);
            ordersService = module.get<OrdersService>(OrdersService);
            stripeStrategy = module.get<StripeStrategy>(StripeStrategy);
      });

      it('should be defined', () => {
            expect(service).toBeDefined();
      });

      describe('initiatePayment', () => {
            it('should initiate payment', async () => {
                  const dto = { orderId: 'order-id', provider: PaymentProvider.STRIPE };
                  mockPrismaService.order.findUnique.mockResolvedValue(mockOrder);
                  mockPrismaService.payment.findFirst.mockResolvedValue(null);
                  mockStripeStrategy.createPaymentIntent.mockResolvedValue({
                        transactionId: 'txn_123',
                        clientSecret: 'secret',
                        paymentUrl: 'url',
                  });
                  mockPrismaService.payment.create.mockResolvedValue(mockPayment);

                  const result = await service.initiatePayment('user-id', dto);

                  expect(stripeStrategy.createPaymentIntent).toHaveBeenCalled();
                  expect(prisma.payment.create).toHaveBeenCalled();
                  expect(result.clientSecret).toBe('secret');
            });

            it('should throw NotFoundException if order not found', async () => {
                  mockPrismaService.order.findUnique.mockResolvedValue(null);
                  const dto = { orderId: 'order-id', provider: PaymentProvider.STRIPE };
                  await expect(service.initiatePayment('user-id', dto)).rejects.toThrow(NotFoundException);
            });
      });

      describe('confirmPayment', () => {
            it('should confirm payment and mark order as paid', async () => {
                  mockStripeStrategy.confirmPayment.mockResolvedValue({ status: 'SUCCESS', transactionId: 'txn_123' });
                  mockPrismaService.payment.findUnique.mockResolvedValue(mockPayment);
                  mockPrismaService.payment.update.mockResolvedValue({ ...mockPayment, status: PaymentStatus.SUCCESS });

                  const result = await service.confirmPayment(PaymentProvider.STRIPE, 'txn_123');

                  expect(ordersService.markAsPaid).toHaveBeenCalledWith('order-id');
                  expect(result.status).toBe('SUCCESS');
            });
      });

      describe('handleWebhook', () => {
            it('should handle webhook and update payment', async () => {
                  mockStripeStrategy.handleWebhook.mockResolvedValue({ status: 'SUCCESS', transactionId: 'txn_123' });
                  mockPrismaService.payment.findUnique.mockResolvedValue(mockPayment);
                  mockPrismaService.payment.update.mockResolvedValue({ ...mockPayment, status: PaymentStatus.SUCCESS });

                  await service.handleWebhook(PaymentProvider.STRIPE, {}, 'sig');

                  expect(ordersService.markAsPaid).toHaveBeenCalledWith('order-id');
            });
      });
});
