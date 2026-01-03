import { Test, TestingModule } from '@nestjs/testing';
import { OrdersService } from './orders.service';
import { PrismaService } from '../prisma/prisma.service';
import { ProductsService } from '../products/products.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { OrderStatus } from '../generated/prisma/enums';
import { Order } from './entities/order.entity';

jest.mock('../generated/prisma/client', () => ({
  PrismaClient: jest.fn(),
  Role: { CUSTOMER: 'CUSTOMER', ADMIN: 'ADMIN' },
  ProductStatus: { ACTIVE: 'ACTIVE', INACTIVE: 'INACTIVE' },
  OrderStatus: { PENDING: 'PENDING', PAID: 'PAID', CANCELED: 'CANCELED' },
  PaymentProvider: { STRIPE: 'STRIPE', BKASH: 'BKASH' },
  PaymentStatus: { PENDING: 'PENDING', SUCCESS: 'SUCCESS', FAILED: 'FAILED' },
}));

describe('OrdersService', () => {
  let service: OrdersService;
  let prisma: PrismaService;

  const mockOrder = {
    id: 'order-id',
    userId: 'user-id',
    totalAmount: 100,
    status: OrderStatus.PENDING,
    items: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    toJSON: jest.fn(),
  };

  const mockItems = [
    {
      productId: 'product-id',
      quantity: 1,
      price: 100,
      subtotal: 100,
    },
  ];

  const mockPrismaService = {
    product: {
      findMany: jest.fn(),
      update: jest.fn(),
    },
    order: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn((callback) => callback(mockPrismaService)),
  };

  const mockProductsService = {};

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: ProductsService,
          useValue: mockProductsService,
        },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create an order', async () => {
      const createDto = {
        items: [{ productId: 'product-id', quantity: 1 }],
      };

      const mockProduct = {
        id: 'product-id',
        price: 100,
        stock: 10,
      };

      mockPrismaService.product.findMany.mockResolvedValue([mockProduct]);
      mockPrismaService.order.create.mockResolvedValue(mockOrder);

      const result = await service.create('user-id', createDto as any);

      expect(prisma.product.findMany).toHaveBeenCalled();
      expect(prisma.order.create).toHaveBeenCalled();
      expect(result).toBeInstanceOf(Order);
    });

    it('should throw NotFoundException if product not found', async () => {
      mockPrismaService.product.findMany.mockResolvedValue([]);
      const createDto = {
        items: [{ productId: 'product-id', quantity: 1 }],
      };

      await expect(service.create('user-id', createDto as any)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if stock insufficient', async () => {
      const mockProduct = {
        id: 'product-id',
        price: 100,
        stock: 0,
      };
      mockPrismaService.product.findMany.mockResolvedValue([mockProduct]);
      const createDto = {
        items: [{ productId: 'product-id', quantity: 1 }],
      };

      await expect(service.create('user-id', createDto as any)).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAll', () => {
    it('should return all orders', async () => {
      mockPrismaService.order.findMany.mockResolvedValue([mockOrder]);
      const result = await service.findAll('user-id');
      expect(result).toHaveLength(1);
    });
  });

  describe('findOne', () => {
    it('should return an order', async () => {
      mockPrismaService.order.findUnique.mockResolvedValue(mockOrder);
      const result = await service.findOne('order-id', 'user-id');
      expect(result).toBeInstanceOf(Order);
    });

    it('should throw NotFoundException if order not found', async () => {
      mockPrismaService.order.findUnique.mockResolvedValue(null);
      await expect(service.findOne('order-id', 'user-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('cancel', () => {
    it('should cancel pending order', async () => {
      mockPrismaService.order.findUnique.mockResolvedValue(mockOrder);
      mockPrismaService.order.update.mockResolvedValue({ ...mockOrder, status: OrderStatus.CANCELED });

      const result = await service.cancel('user-id', 'order-id');
      expect(result.status).toBe(OrderStatus.CANCELED);
    });
  });
});
