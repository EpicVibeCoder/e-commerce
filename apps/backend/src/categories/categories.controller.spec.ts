import { Test, TestingModule } from '@nestjs/testing';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';
import { Category } from './entities/category.entity';

jest.mock('../generated/prisma/client', () => ({
      PrismaClient: jest.fn(),
      Role: { CUSTOMER: 'CUSTOMER', ADMIN: 'ADMIN' },
      ProductStatus: { ACTIVE: 'ACTIVE', INACTIVE: 'INACTIVE' },
      OrderStatus: { PENDING: 'PENDING', PAID: 'PAID', CANCELED: 'CANCELED' },
      PaymentProvider: { STRIPE: 'STRIPE', BKASH: 'BKASH' },
      PaymentStatus: { PENDING: 'PENDING', SUCCESS: 'SUCCESS', FAILED: 'FAILED' },
}));

describe('CategoriesController', () => {
      let controller: CategoriesController;
      let service: CategoriesService;

      const mockCategory = new Category('category-id', 'Category', 'category', null, null, new Date(), new Date(), []);

      const mockCategoriesService = {
            create: jest.fn(),
            findAll: jest.fn(),
            findById: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
      };

      beforeEach(async () => {
            const module: TestingModule = await Test.createTestingModule({
                  controllers: [CategoriesController],
                  providers: [
                        {
                              provide: CategoriesService,
                              useValue: mockCategoriesService,
                        },
                  ],
            }).compile();

            controller = module.get<CategoriesController>(CategoriesController);
            service = module.get<CategoriesService>(CategoriesService);
      });

      it('should be defined', () => {
            expect(controller).toBeDefined();
      });

      describe('create', () => {
            it('should create category', async () => {
                  mockCategoriesService.create.mockResolvedValue(mockCategory);
                  const result = await controller.create({ name: 'Test' } as any);
                  expect(result.data.id).toBe(mockCategory.id);
            });
      });

      describe('findAll', () => {
            it('should return all categories', async () => {
                  mockCategoriesService.findAll.mockResolvedValue([mockCategory]);
                  const result = await controller.findAll();
                  expect(result.data).toHaveLength(1);
            });
      });

      describe('findOne', () => {
            it('should return a category', async () => {
                  mockCategoriesService.findById.mockResolvedValue(mockCategory);
                  const result = await controller.findOne('category-id');
                  expect(result.data.id).toBe(mockCategory.id);
            });
      });

      describe('update', () => {
            it('should update category', async () => {
                  mockCategoriesService.update.mockResolvedValue(mockCategory);
                  const result = await controller.update('category-id', {});
                  expect(result.data.id).toBe(mockCategory.id);
            });
      });

      describe('remove', () => {
            it('should remove category', async () => {
                  mockCategoriesService.delete.mockResolvedValue(undefined);
                  await controller.remove('category-id');
                  expect(service.delete).toHaveBeenCalledWith('category-id');
            });
      });
});
