import { Test, TestingModule } from "@nestjs/testing";

import { ProductsService } from "./products.service";
import { PrismaService } from "src/prisma/prisma.service";
import { Prisma } from "src/generated/prisma/client";
import { ProductStatus } from "src/generated/prisma/enums";
import { BadRequestException, ConflictException, NotFoundException } from "@nestjs/common";

describe("ProductsService", () => {
      let service: ProductsService;
      let prisma: PrismaService;

      const mockCategory = {
            id: "category-1",
            name: "Electronics",
            slug: "electronics",
      };

      const mockProduct = {
            id: "product-1",
            name: "Test Product",
            sku: "TEST-SKU-1",
            description: "Test Description",
            price: new Prisma.Decimal("99.99"),
            stock: 10,
            status: ProductStatus.active,
            categoryId: "category-1",
            category: mockCategory,
            createdAt: new Date(),
            updatedAt: new Date(),
      };

      beforeEach(async () => {
            const module: TestingModule = await Test.createTestingModule({
                  providers: [
                        ProductsService,
                        {
                              provide: PrismaService,
                              useValue: {
                                    category: {
                                          findUnique: vi.fn(),
                                    },
                                    product: {
                                          findMany: vi.fn(),
                                          count: vi.fn(),
                                          findUnique: vi.fn(),
                                          findFirst: vi.fn(),
                                          create: vi.fn(),
                                          update: vi.fn(),
                                          delete: vi.fn(),
                                    },
                              },
                        },
                  ],
            }).compile();

            service = module.get<ProductsService>(ProductsService);
            prisma = module.get<PrismaService>(PrismaService);
      });

      it("should be defined", () => {
            expect(service).toBeDefined();
      });

      describe("findAll", () => {
            it("should return paginated list of products with meta info", async () => {
                  const findManySpy = vi.spyOn(prisma.product, "findMany").mockResolvedValue([mockProduct]);
                  vi.spyOn(prisma.product, "count").mockResolvedValue(1);

                  const result = await service.findAll({ page: 1, limit: 10 });

                  expect(findManySpy).toHaveBeenCalledWith(
                        expect.objectContaining({
                              skip: 0,
                              take: 10,
                        }),
                  );
                  expect(result).toEqual({
                        data: [
                              {
                                    id: mockProduct.id,
                                    name: mockProduct.name,
                                    sku: mockProduct.sku,
                                    description: mockProduct.description,
                                    price: "99.99",
                                    stock: mockProduct.stock,
                                    status: mockProduct.status,
                                    categoryId: mockProduct.categoryId,
                                    category: {
                                          id: mockCategory.id,
                                          name: mockCategory.name,
                                          slug: mockCategory.slug,
                                    },
                                    createdAt: mockProduct.createdAt,
                                    updatedAt: mockProduct.updatedAt,
                              },
                        ],
                        meta: {
                              page: 1,
                              limit: 10,
                              total: 1,
                              totalPages: 1,
                        },
                  });
            });

            it("should default page to 1 and limit to 20 if not provided", async () => {
                  const findManySpy = vi.spyOn(prisma.product, "findMany").mockResolvedValue([]);
                  vi.spyOn(prisma.product, "count").mockResolvedValue(0);

                  await service.findAll({});

                  expect(findManySpy).toHaveBeenCalledWith(
                        expect.objectContaining({
                              skip: 0,
                              take: 20,
                        }),
                  );
            });
      });

      describe("findOne", () => {
            it("should return a product when it exists", async () => {
                  vi.spyOn(prisma.product, "findUnique").mockResolvedValue(mockProduct);

                  const result = await service.findOne("product-1");

                  expect(result.id).toBe("product-1");
                  expect(result.price).toBe("99.99");
            });

            it("should throw NotFoundException when product is not found", async () => {
                  vi.spyOn(prisma.product, "findUnique").mockResolvedValue(null);

                  await expect(service.findOne("non-existent")).rejects.toThrow(NotFoundException);
            });
      });

      describe("create", () => {
            const createDto = {
                  name: "New Product",
                  sku: "new-sku",
                  price: "49.99",
                  stock: 5,
                  categoryId: "category-1",
                  status: ProductStatus.active,
            };

            it("should create a product with valid fields", async () => {
                  const findUniqueSpy = vi.spyOn(prisma.product, "findUnique").mockResolvedValue(null);
                  const categoryFindUniqueSpy = vi.spyOn(prisma.category, "findUnique").mockResolvedValue({
                        ...mockCategory,
                        parentId: null,
                        sortOrder: 0,
                  });
                  vi.spyOn(prisma.product, "create").mockResolvedValue({
                        ...mockProduct,
                        sku: "NEW-SKU",
                        name: "New Product",
                        price: new Prisma.Decimal("49.99"),
                        stock: 5,
                  });

                  const result = await service.create(createDto);

                  expect(findUniqueSpy).toHaveBeenCalledWith({ where: { sku: "NEW-SKU" } });
                  expect(categoryFindUniqueSpy).toHaveBeenCalledWith({ where: { id: "category-1" } });
                  expect(result.sku).toBe("NEW-SKU");
                  expect(result.price).toBe("49.99");
            });

            it("should throw ConflictException if SKU already exists", async () => {
                  vi.spyOn(prisma.product, "findUnique").mockResolvedValue(mockProduct);

                  await expect(service.create(createDto)).rejects.toThrow(ConflictException);
            });

            it("should throw NotFoundException if category does not exist", async () => {
                  vi.spyOn(prisma.product, "findUnique").mockResolvedValue(null);
                  vi.spyOn(prisma.category, "findUnique").mockResolvedValue(null);

                  await expect(service.create(createDto)).rejects.toThrow(NotFoundException);
            });

            it("should throw BadRequestException if price is zero or negative", async () => {
                  vi.spyOn(prisma.product, "findUnique").mockResolvedValue(null);
                  vi.spyOn(prisma.category, "findUnique").mockResolvedValue({
                        ...mockCategory,
                        parentId: null,
                        sortOrder: 0,
                  });

                  await expect(
                        service.create({
                              ...createDto,
                              price: "0.00",
                        }),
                  ).rejects.toThrow(BadRequestException);
            });
      });

      describe("update", () => {
            const updateDto = {
                  name: "Updated Product",
                  price: "129.99",
            };

            it("should update product fields when valid", async () => {
                  vi.spyOn(prisma.product, "findUnique").mockResolvedValue(mockProduct);
                  vi.spyOn(prisma.product, "update").mockResolvedValue({
                        ...mockProduct,
                        name: "Updated Product",
                        price: new Prisma.Decimal("129.99"),
                  });

                  const result = await service.update("product-1", updateDto);

                  expect(result.name).toBe("Updated Product");
                  expect(result.price).toBe("129.99");
            });

            it("should throw NotFoundException if product doesn't exist", async () => {
                  vi.spyOn(prisma.product, "findUnique").mockResolvedValue(null);

                  await expect(service.update("non-existent", updateDto)).rejects.toThrow(NotFoundException);
            });

            it("should check and throw ConflictException if changing to an existing SKU", async () => {
                  vi.spyOn(prisma.product, "findUnique").mockResolvedValue(mockProduct);
                  vi.spyOn(prisma.product, "findFirst").mockResolvedValue({ ...mockProduct, id: "another-product" });

                  await expect(service.update("product-1", { sku: "existing-sku" })).rejects.toThrow(ConflictException);
            });

            it("should assert and throw NotFoundException if changing to non-existent category", async () => {
                  vi.spyOn(prisma.product, "findUnique").mockResolvedValue(mockProduct);
                  vi.spyOn(prisma.category, "findUnique").mockResolvedValue(null);

                  await expect(service.update("product-1", { categoryId: "non-existent" })).rejects.toThrow(NotFoundException);
            });
      });

      describe("remove", () => {
            it("should archive (soft delete) product if it has order items", async () => {
                  const productWithOrderItems = {
                        ...mockProduct,
                        _count: { orderItems: 1 },
                  };

                  vi.spyOn(prisma.product, "findUnique").mockResolvedValue(productWithOrderItems);
                  const updateSpy = vi.spyOn(prisma.product, "update").mockResolvedValue(mockProduct);

                  const result = await service.remove("product-1");

                  expect(updateSpy).toHaveBeenCalledWith({
                        where: { id: "product-1" },
                        data: { status: ProductStatus.archived },
                  });
                  expect(result).toEqual({ id: "product-1", deleted: false, archived: true });
            });

            it("should hard delete product if it has no order items", async () => {
                  const productWithoutOrderItems = {
                        ...mockProduct,
                        _count: { orderItems: 0 },
                  };

                  vi.spyOn(prisma.product, "findUnique").mockResolvedValue(productWithoutOrderItems);
                  const deleteSpy = vi.spyOn(prisma.product, "delete").mockResolvedValue(mockProduct);

                  const result = await service.remove("product-1");

                  expect(deleteSpy).toHaveBeenCalledWith({ where: { id: "product-1" } });
                  expect(result).toEqual({ id: "product-1", deleted: true, archived: false });
            });

            it("should throw NotFoundException if product does not exist", async () => {
                  vi.spyOn(prisma.product, "findUnique").mockResolvedValue(null);

                  await expect(service.remove("non-existent")).rejects.toThrow(NotFoundException);
            });
      });

      describe("recommendations", () => {
            it("returns active products from the same category, excluding the source", async () => {
                  const otherProduct = {
                        ...mockProduct,
                        id: "product-2",
                        sku: "TEST-SKU-2",
                        name: "Other Product",
                  };

                  vi.spyOn(prisma.product, "findUnique").mockResolvedValue({
                        id: "product-1",
                        categoryId: "category-1",
                  } as never);

                  const findManySpy = vi.spyOn(prisma.product, "findMany").mockResolvedValue([otherProduct]);

                  const result = await service.recommendations("product-1", 8);

                  expect(findManySpy).toHaveBeenCalledWith(
                        expect.objectContaining({
                              where: {
                                    categoryId: "category-1",
                                    status: ProductStatus.active,
                                    id: { not: "product-1" },
                              },
                              take: 8,
                              orderBy: { createdAt: "desc" },
                        }),
                  );
                  expect(result).toHaveLength(1);
                  expect(result[0].id).toBe("product-2");
                  expect(result[0].price).toBe("99.99");
            });

            it("throws NotFoundException when source product does not exist", async () => {
                  vi.spyOn(prisma.product, "findUnique").mockResolvedValue(null);

                  await expect(service.recommendations("missing")).rejects.toThrow(NotFoundException);
            });

            it("caps limit at 20", async () => {
                  vi.spyOn(prisma.product, "findUnique").mockResolvedValue({
                        id: "product-1",
                        categoryId: "category-1",
                  } as never);

                  const findManySpy = vi.spyOn(prisma.product, "findMany").mockResolvedValue([]);

                  await service.recommendations("product-1", 100);

                  expect(findManySpy).toHaveBeenCalledWith(expect.objectContaining({ take: 20 }));
            });

            it("defaults limit to 8", async () => {
                  vi.spyOn(prisma.product, "findUnique").mockResolvedValue({
                        id: "product-1",
                        categoryId: "category-1",
                  } as never);

                  const findManySpy = vi.spyOn(prisma.product, "findMany").mockResolvedValue([]);

                  await service.recommendations("product-1");

                  expect(findManySpy).toHaveBeenCalledWith(expect.objectContaining({ take: 8 }));
            });
      });
});
