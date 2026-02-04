import { Test, TestingModule } from '@nestjs/testing';
import { CategoriesService } from './categories.service';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

jest.mock('../generated/prisma/client', () => ({
      PrismaClient: jest.fn(),
      Role: { CUSTOMER: 'CUSTOMER', ADMIN: 'ADMIN' },
      ProductStatus: { ACTIVE: 'ACTIVE', INACTIVE: 'INACTIVE' },
      OrderStatus: { PENDING: 'PENDING', PAID: 'PAID', CANCELED: 'CANCELED' },
      PaymentProvider: { STRIPE: 'STRIPE', BKASH: 'BKASH' },
      PaymentStatus: { PENDING: 'PENDING', SUCCESS: 'SUCCESS', FAILED: 'FAILED' },
}));

describe('CategoriesService', () => {
      let service: CategoriesService;

      const mockCategory = {
            id: 'category-id',
            name: 'Category',
            slug: 'category',
            parentId: null,
            children: [],
            products: [],
      };

      const mockPrismaService = {
            category: {
                  findUnique: jest.fn(),
                  create: jest.fn(),
                  update: jest.fn(),
                  delete: jest.fn(),
                  findMany: jest.fn(),
            },
      };

      const mockRedisService = {
            get: jest.fn(),
            set: jest.fn(),
            del: jest.fn(),
      };

      beforeEach(async () => {
            const module: TestingModule = await Test.createTestingModule({
                  providers: [
                        CategoriesService,
                        {
                              provide: PrismaService,
                              useValue: mockPrismaService,
                        },
                        {
                              provide: RedisService,
                              useValue: mockRedisService,
                        },
                  ],
            }).compile();

            service = module.get<CategoriesService>(CategoriesService);

            // Reset mocks before each test
            jest.clearAllMocks();
      });

      describe('create', () => {
            it('should throw ConflictException if slug exists', async () => {
                  mockPrismaService.category.findUnique.mockResolvedValue(mockCategory);
                  const createDto: CreateCategoryDto = { name: 'Cat', slug: 'category' };

                  await expect(service.create(createDto)).rejects.toThrow(ConflictException);
                  expect(mockPrismaService.category.findUnique).toHaveBeenCalledWith({
                        where: { slug: 'category' },
                  });
            });

            it('should throw NotFoundException if parent not found', async () => {
                  mockPrismaService.category.findUnique
                        .mockResolvedValueOnce(null) // slug check returns null
                        .mockResolvedValueOnce(null); // parent check returns null
                  const createDto: CreateCategoryDto = {
                        name: 'Cat',
                        slug: 'cat',
                        parentId: 'parent-id',
                  };

                  await expect(service.create(createDto)).rejects.toThrow(NotFoundException);
                  expect(mockPrismaService.category.findUnique).toHaveBeenCalledTimes(2);
            });
      });

      describe('update', () => {
            it('should throw BadRequestException if parent is self', async () => {
                  mockPrismaService.category.findUnique.mockResolvedValue(mockCategory);
                  const updateDto: UpdateCategoryDto = { parentId: 'category-id' };

                  await expect(service.update('category-id', updateDto)).rejects.toThrow(BadRequestException);
            });
      });

      describe('delete', () => {
            it('should prevent delete if has children', async () => {
                  const catWithChild = { ...mockCategory, children: [{ id: 'child' }] };
                  mockPrismaService.category.findUnique.mockResolvedValue(catWithChild);

                  await expect(service.delete('category-id')).rejects.toThrow(BadRequestException);
                  expect(mockPrismaService.category.findUnique).toHaveBeenCalledWith({
                        where: { id: 'category-id' },
                        include: { children: true, products: true },
                  });
            });

            it('should prevent delete if has products', async () => {
                  const catWithProd = { ...mockCategory, products: [{ id: 'prod' }] };
                  mockPrismaService.category.findUnique.mockResolvedValue(catWithProd);

                  await expect(service.delete('category-id')).rejects.toThrow(BadRequestException);
            });
      });

      describe('findAll (getCategoryHierarchy) - caching', () => {
            it('should return from cache if available', async () => {
                  mockRedisService.get.mockResolvedValue([mockCategory]);

                  const result = await service.findAll();

                  expect(result).toHaveLength(1);
                  expect(mockPrismaService.category.findMany).not.toHaveBeenCalled();
                  expect(mockRedisService.get).toHaveBeenCalledWith('category_tree');
            });

            it('should fetch from db and cache if not in cache', async () => {
                  mockRedisService.get.mockResolvedValue(null);
                  mockPrismaService.category.findMany.mockResolvedValue([mockCategory]);

                  const result = await service.findAll();

                  expect(mockPrismaService.category.findMany).toHaveBeenCalled();
                  expect(mockRedisService.set).toHaveBeenCalledWith('category_tree', expect.any(Array), 3600);
                  expect(result).toHaveLength(1);
            });
      });
});
