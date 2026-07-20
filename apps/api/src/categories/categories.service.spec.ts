import { Test, TestingModule } from "@nestjs/testing";
import { CategoriesService } from "./categories.service";
import { PrismaService } from "src/prisma/prisma.service";
import { RedisService } from "src/redis/redis.service";
import { REDIS_KEYS, REDIS_TTL_SECONDS } from "src/redis/redis-keys";

describe("CategoriesService", () => {
      let service: CategoriesService;
      const categoryRepository = {
            findMany: jest.fn(),
            findUnique: jest.fn(),
            findFirst: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
      };
      const redis = {
            getJson: jest.fn(),
            setJson: jest.fn(),
            del: jest.fn(),
      };
      beforeEach(async () => {
            jest.clearAllMocks();
            const module: TestingModule = await Test.createTestingModule({
                  providers: [
                        CategoriesService,
                        {
                              provide: PrismaService,
                              useValue: { category: categoryRepository },
                        },
                        {
                              provide: RedisService,
                              useValue: redis,
                        },
                  ],
            }).compile();
            service = module.get<CategoriesService>(CategoriesService);
      });
      it("should be defined", () => {
            expect(service).toBeDefined();
      });
      it("returns the cached category tree without querying Prisma", async () => {
            const cachedTree = [
                  {
                        id: "root",
                        name: "Electronics",
                        slug: "electronics",
                        parentId: null,
                        sortOrder: 0,
                        productCount: 2,
                        childCount: 0,
                        children: [],
                  },
            ];
            redis.getJson.mockResolvedValue(cachedTree);
            await expect(service.getTree()).resolves.toEqual(cachedTree);
            expect(categoryRepository.findMany).not.toHaveBeenCalled();
            expect(redis.setJson).not.toHaveBeenCalled();
      });
      it("builds and caches the category tree on a cache miss", async () => {
            redis.getJson.mockResolvedValue(null);
            categoryRepository.findMany.mockResolvedValue([
                  {
                        id: "root",
                        name: "Electronics",
                        slug: "electronics",
                        parentId: null,
                        sortOrder: 0,
                        _count: { products: 1, children: 1 },
                  },
                  {
                        id: "child",
                        name: "Phones",
                        slug: "phones",
                        parentId: "root",
                        sortOrder: 0,
                        _count: { products: 2, children: 0 },
                  },
            ]);
            const result = await service.getTree();
            expect(result[0].children[0]).toEqual(
                  expect.objectContaining({
                        id: "child",
                        children: [],
                  }),
            );
            expect(redis.setJson).toHaveBeenCalledWith(REDIS_KEYS.categoryTree, result, REDIS_TTL_SECONDS.categoryTree);
      });

      it("invalidates the category-tree cache after creating a category", async () => {
            categoryRepository.findUnique.mockResolvedValue(null);
            categoryRepository.create.mockResolvedValue({
                  id: "new-category",
                  name: "Laptops",
                  slug: "laptops",
                  parentId: null,
                  sortOrder: 0,
                  _count: { products: 0, children: 0 },
            });
            await service.create({
                  name: "Laptops",
                  slug: "laptops",
            });
            expect(redis.del).toHaveBeenCalledWith(REDIS_KEYS.categoryTree);
      });
});
