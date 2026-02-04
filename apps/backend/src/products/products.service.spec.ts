import { Test, TestingModule } from '@nestjs/testing';
import { ProductsService } from './products.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { ProductStatus } from '../generated/prisma/enums';

jest.mock('../generated/prisma/client', () => ({
      PrismaClient: jest.fn(),
      Role: { CUSTOMER: 'CUSTOMER', ADMIN: 'ADMIN' },
      ProductStatus: { ACTIVE: 'ACTIVE', INACTIVE: 'INACTIVE' },
      OrderStatus: { PENDING: 'PENDING', PAID: 'PAID', CANCELED: 'CANCELED' },
      PaymentProvider: { STRIPE: 'STRIPE', BKASH: 'BKASH' },
      PaymentStatus: { PENDING: 'PENDING', SUCCESS: 'SUCCESS', FAILED: 'FAILED' },
}));

describe('ProductsService', () => {
      let service: ProductsService;
      let prisma: PrismaService;

      const mockProduct = {
            id: 'product-id',
            name: 'Test Product',
            sku: 'TST-123',
            description: 'Description',
            price: 100,
            stock: 10,
            status: ProductStatus.ACTIVE,
            categoryId: 'category-id',
            category: {
                  id: 'category-id',
                  name: 'Category',
                  slug: 'category',
            },
            orderItems: [],
      };

      const mockPrismaService = {
            product: {
                  create: jest.fn(),
                  findUnique: jest.fn(),
                  findMany: jest.fn(),
                  update: jest.fn(),
                  delete: jest.fn(),
            },
            category: {
                  findUnique: jest.fn(),
            },
      };

      beforeEach(async () => {
            const module: TestingModule = await Test.createTestingModule({
                  providers: [
                        ProductsService,
                        {
                              provide: PrismaService,
                              useValue: mockPrismaService,
                        },
                  ],
            }).compile();

            service = module.get<ProductsService>(ProductsService);
            prisma = module.get<PrismaService>(PrismaService);
      });

      it('should be defined', () => {
            expect(service).toBeDefined();
      });

      describe('create', () => {
            it('should create a product', async () => {
                  const createDto: CreateProductDto = {
                        name: 'Test Product',
                        sku: 'TST-123',
                        price: 100,
                        stock: 10,
                        categoryId: 'category-id',
                        status: ProductStatus.ACTIVE,
                  };

                  mockPrismaService.product.findUnique.mockResolvedValue(null);
                  mockPrismaService.category.findUnique.mockResolvedValue({ id: 'category-id' });
                  mockPrismaService.product.create.mockResolvedValue(mockProduct);

                  const result = await service.create(createDto);

                  expect(result).toBeDefined();
                  expect(result.sku).toBe(createDto.sku);
            });

            it('should throw ConflictException if SKU exists', async () => {
                  mockPrismaService.product.findUnique.mockResolvedValue(mockProduct);
                  const createDto: CreateProductDto = { ...mockProduct } as any;

                  await expect(service.create(createDto)).rejects.toThrow(ConflictException);
            });

            it('should throw NotFoundException if category not found', async () => {
                  mockPrismaService.product.findUnique.mockResolvedValue(null);
                  mockPrismaService.category.findUnique.mockResolvedValue(null);
                  const createDto: CreateProductDto = { ...mockProduct } as any;

                  await expect(service.create(createDto)).rejects.toThrow(NotFoundException);
            });
      });

      describe('findAll', () => {
            it('should return array of products', async () => {
                  mockPrismaService.product.findMany.mockResolvedValue([mockProduct]);
                  const result = await service.findAll();
                  expect(result).toHaveLength(1);
            });
      });

      describe('delete', () => {
            it('should delete product if no order items', async () => {
                  mockPrismaService.product.findUnique.mockResolvedValue(mockProduct);
                  mockPrismaService.product.delete.mockResolvedValue(mockProduct);

                  await service.delete('product-id');

                  expect(prisma.product.delete).toHaveBeenCalledWith({ where: { id: 'product-id' } });
            });

            it('should throw BadRequestException if product has order items', async () => {
                  const productWithOrders = { ...mockProduct, orderItems: [{ id: 'order-item-id' }] };
                  mockPrismaService.product.findUnique.mockResolvedValue(productWithOrders);

                  await expect(service.delete('product-id')).rejects.toThrow(BadRequestException);
            });
      });
});
