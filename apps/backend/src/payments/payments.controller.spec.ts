import { Test, TestingModule } from '@nestjs/testing';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { PaymentProvider, PaymentStatus } from '../generated/prisma/enums';
import { User } from '../users/entities/user.entity';
import { Payment } from './entities/payment.entity';

jest.mock('../generated/prisma/client', () => ({
  PrismaClient: jest.fn(),
  Role: { CUSTOMER: 'CUSTOMER', ADMIN: 'ADMIN' },
  ProductStatus: { ACTIVE: 'ACTIVE', INACTIVE: 'INACTIVE' },
  OrderStatus: { PENDING: 'PENDING', PAID: 'PAID', CANCELED: 'CANCELED' },
  PaymentProvider: { STRIPE: 'STRIPE', BKASH: 'BKASH' },
  PaymentStatus: { PENDING: 'PENDING', SUCCESS: 'SUCCESS', FAILED: 'FAILED' },
}));

describe('PaymentsController', () => {
  let controller: PaymentsController;
  let service: PaymentsService;

  const mockUser = { id: 'user-id' } as User;

  const mockPayment = new Payment('payment-id', 'order-id', PaymentProvider.STRIPE, 'txn_123', PaymentStatus.SUCCESS, {}, new Date(), new Date());

  const mockPaymentResponse = {
    payment: mockPayment.toJSON(), // Or just use mockPayment instance if service returns it?
    clientSecret: 'secret',
    paymentUrl: 'url',
  };

  const mockPaymentsService = {
    initiatePayment: jest.fn(),
    findAll: jest.fn(),
    confirmPayment: jest.fn(),
    handleWebhook: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PaymentsController],
      providers: [
        {
          provide: PaymentsService,
          useValue: mockPaymentsService,
        },
      ],
    }).compile();

    controller = module.get<PaymentsController>(PaymentsController);
    service = module.get<PaymentsService>(PaymentsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('initiate', () => {
    it('should initiate payment', async () => {
      mockPaymentsService.initiatePayment.mockResolvedValue({
        payment: mockPayment,
        clientSecret: 'secret',
        paymentUrl: 'url',
      });
      const dto = { orderId: 'order-id', provider: PaymentProvider.STRIPE };
      const result = await controller.initiate(mockUser, dto);
      expect(result.clientSecret).toBe('secret');
    });
  });

  describe('findAll', () => {
    it('should return all payments', async () => {
      mockPaymentsService.findAll.mockResolvedValue([mockPayment]);
      const result = await controller.findAll(mockUser);
      expect(result).toHaveLength(1);
    });
  });
});
