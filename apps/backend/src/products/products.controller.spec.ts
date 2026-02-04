import { Test, TestingModule } from '@nestjs/testing';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { ProductStatus } from '../generated/prisma/enums';
import { Product } from './entities/product.entity';

jest.mock('../generated/prisma/client', () => ({
      PrismaClient: jest.fn(),
      Role: { CUSTOMER: 'CUSTOMER', ADMIN: 'ADMIN' },
      ProductStatus: { ACTIVE: 'ACTIVE', INACTIVE: 'INACTIVE' },
      OrderStatus: { PENDING: 'PENDING', PAID: 'PAID', CANCELED: 'CANCELED' },
      PaymentProvider: { STRIPE: 'STRIPE', BKASH: 'BKASH' },
      PaymentStatus: { PENDING: 'PENDING', SUCCESS: 'SUCCESS', FAILED: 'FAILED' },
}));

describe('ProductsController', () => {
      let controller: ProductsController;
      let service: ProductsService;

      const mockProduct = new Product(
            'product-id',
            'Test Product',
            'TST-123',
            'Description',
            100,
            10,
            ProductStatus.ACTIVE,
            'category-id',
            new Date(),
            new Date(),
            {
                  id: 'category-id',
                  name: 'Category',
                  slug: 'category',
            } as any,
      );

      const mockProductsService = {
            findAll: jest.fn(),
            findById: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            findBySku: jest.fn(),
            findByCategoryId: jest.fn(),
      };

      beforeEach(async () => {
            const module: TestingModule = await Test.createTestingModule({
                  controllers: [ProductsController],
                  providers: [
                        {
                              provide: ProductsService,
                              useValue: mockProductsService,
                        },
                  ],
            }).compile();

            controller = module.get<ProductsController>(ProductsController);
            service = module.get<ProductsService>(ProductsService);
      });

      it('should be defined', () => {
            expect(controller).toBeDefined();
      });

      describe('findAll', () => {
            it('should return all products', async () => {
                  mockProductsService.findAll.mockResolvedValue([mockProduct]);
                  const result = await controller.findAll();
                  expect(result.data).toHaveLength(1);
            });
      });

      describe('findOne', () => {
            it('should return a product', async () => {
                  mockProductsService.findById.mockResolvedValue(mockProduct);
                  const result = await controller.findOne('product-id');
                  expect(result.data.id).toBe(mockProduct.id);
            });
      });

      describe('create', () => {
            it('should create a product', async () => {
                  mockProductsService.create.mockResolvedValue(mockProduct);
                  const createDto = { name: 'Test' } as any;
                  const result = await controller.create(createDto);
                  expect(result.data.id).toBe(mockProduct.id);
            });
      });
});
