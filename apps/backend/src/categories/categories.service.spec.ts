import { Test, TestingModule } from '@nestjs/testing';
import { CategoriesService } from './categories.service';
import { PrismaService } from '../prisma/prisma.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { Category } from './entities/category.entity';

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
  let prisma: PrismaService;
  let cacheManager: any;

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

  const mockCacheManager = {
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
          provide: CACHE_MANAGER,
          useValue: mockCacheManager,
        },
      ],
    }).compile();

    service = module.get<CategoriesService>(CategoriesService);
    prisma = module.get<PrismaService>(PrismaService);
    cacheManager = module.get(CACHE_MANAGER);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a category', async () => {
      const createDto = { name: 'Category', slug: 'category' } as any;
      mockPrismaService.category.findUnique.mockResolvedValue(null);
      mockPrismaService.category.create.mockResolvedValue(mockCategory);

      const result = await service.create(createDto);

      expect(prisma.category.create).toHaveBeenCalled();
      expect(cacheManager.del).toHaveBeenCalled();
      expect(result).toBeInstanceOf(Category);
    });

    it('should throw ConflictException if slug exists', async () => {
      mockPrismaService.category.findUnique.mockResolvedValue(mockCategory);
      const createDto = { name: 'Cat', slug: 'category' } as any;

      await expect(service.create(createDto)).rejects.toThrow(ConflictException);
    });

    it('should throw NotFoundException if parent not found', async () => {
      mockPrismaService.category.findUnique.mockReturnValueOnce(null).mockReturnValueOnce(null);
      const createDto = { name: 'Cat', slug: 'cat', parentId: 'parent-id' } as any;

      await expect(service.create(createDto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update category', async () => {
      mockPrismaService.category.findUnique.mockResolvedValue(mockCategory);
      mockPrismaService.category.update.mockResolvedValue({ ...mockCategory, name: 'Updated' });

      const result = await service.update('category-id', { name: 'Updated' });
      expect(result.name).toBe('Updated');
      expect(cacheManager.del).toHaveBeenCalled();
    });

    it('should throw BadRequestException if parent is self', async () => {
      mockPrismaService.category.findUnique.mockResolvedValue(mockCategory);
      await expect(service.update('category-id', { parentId: 'category-id' })).rejects.toThrow(BadRequestException);
    });
  });

  describe('delete', () => {
    it('should delete category', async () => {
      mockPrismaService.category.findUnique.mockResolvedValue(mockCategory);
      mockPrismaService.category.delete.mockResolvedValue(mockCategory);

      await service.delete('category-id');
      expect(prisma.category.delete).toHaveBeenCalled();
      expect(cacheManager.del).toHaveBeenCalled();
    });

    it('should prevent delete if has children', async () => {
      const catWithChild = { ...mockCategory, children: [{ id: 'child' }] };
      mockPrismaService.category.findUnique.mockResolvedValue(catWithChild);
      await expect(service.delete('category-id')).rejects.toThrow(BadRequestException);
    });

    it('should prevent delete if has products', async () => {
      const catWithProd = { ...mockCategory, products: [{ id: 'prod' }] };
      mockPrismaService.category.findUnique.mockResolvedValue(catWithProd);
      await expect(service.delete('category-id')).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAll (getCategoryHierarchy)', () => {
    it('should return from cache if available', async () => {
      mockCacheManager.get.mockResolvedValue([mockCategory]);
      const result = await service.findAll();
      expect(result).toHaveLength(1);
      expect(prisma.category.findMany).not.toHaveBeenCalled();
    });

    it('should fetch from db and cache if not in cache', async () => {
      mockCacheManager.get.mockResolvedValue(null);
      mockPrismaService.category.findMany.mockResolvedValue([mockCategory]);

      const result = await service.findAll();

      expect(prisma.category.findMany).toHaveBeenCalled();
      expect(cacheManager.set).toHaveBeenCalled();
      expect(result).toHaveLength(1);
    });
  });
});
