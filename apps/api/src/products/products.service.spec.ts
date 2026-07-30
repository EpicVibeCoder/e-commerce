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
                                          findUnique: jest.fn(),
                                    },
                                    product: {
                                          findMany: jest.fn(),
                                          count: jest.fn(),
                                          findUnique: jest.fn(),
                                          findFirst: jest.fn(),
                                          create: jest.fn(),
                                          update: jest.fn(),
                                          delete: jest.fn(),
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
                  const findManySpy = jest.spyOn(prisma.product, "findMany").mockResolvedValue([mockProduct]);
                  jest.spyOn(prisma.product, "count").mockResolvedValue(1);

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
                  const findManySpy = jest.spyOn(prisma.product, "findMany").mockResolvedValue([]);
                  jest.spyOn(prisma.product, "count").mockResolvedValue(0);

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
                  jest.spyOn(prisma.product, "findUnique").mockResolvedValue(mockProduct);

                  const result = await service.findOne("product-1");

                  expect(result.id).toBe("product-1");
                  expect(result.price).toBe("99.99");
            });

            it("should throw NotFoundException when product is not found", async () => {
                  jest.spyOn(prisma.product, "findUnique").mockResolvedValue(null);

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
                  const findUniqueSpy = jest.spyOn(prisma.product, "findUnique").mockResolvedValue(null);
                  const categoryFindUniqueSpy = jest.spyOn(prisma.category, "findUnique").mockResolvedValue({
                        ...mockCategory,
                        parentId: null,
                        sortOrder: 0,
                  });
                  jest.spyOn(prisma.product, "create").mockResolvedValue({
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
                  jest.spyOn(prisma.product, "findUnique").mockResolvedValue(mockProduct);

                  await expect(service.create(createDto)).rejects.toThrow(ConflictException);
            });

            it("should throw NotFoundException if category does not exist", async () => {
                  jest.spyOn(prisma.product, "findUnique").mockResolvedValue(null);
                  jest.spyOn(prisma.category, "findUnique").mockResolvedValue(null);

                  await expect(service.create(createDto)).rejects.toThrow(NotFoundException);
            });

            it("should throw BadRequestException if price is zero or negative", async () => {
                  jest.spyOn(prisma.product, "findUnique").mockResolvedValue(null);
                  jest.spyOn(prisma.category, "findUnique").mockResolvedValue({
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
                  jest.spyOn(prisma.product, "findUnique").mockResolvedValue(mockProduct);
                  jest.spyOn(prisma.product, "update").mockResolvedValue({
                        ...mockProduct,
                        name: "Updated Product",
                        price: new Prisma.Decimal("129.99"),
                  });

                  const result = await service.update("product-1", updateDto);

                  expect(result.name).toBe("Updated Product");
                  expect(result.price).toBe("129.99");
            });

            it("should throw NotFoundException if product doesn't exist", async () => {
                  jest.spyOn(prisma.product, "findUnique").mockResolvedValue(null);

                  await expect(service.update("non-existent", updateDto)).rejects.toThrow(NotFoundException);
            });

            it("should check and throw ConflictException if changing to an existing SKU", async () => {
                  jest.spyOn(prisma.product, "findUnique").mockResolvedValue(mockProduct);
                  jest.spyOn(prisma.product, "findFirst").mockResolvedValue({ ...mockProduct, id: "another-product" });

                  await expect(service.update("product-1", { sku: "existing-sku" })).rejects.toThrow(ConflictException);
            });

            it("should assert and throw NotFoundException if changing to non-existent category", async () => {
                  jest.spyOn(prisma.product, "findUnique").mockResolvedValue(mockProduct);
                  jest.spyOn(prisma.category, "findUnique").mockResolvedValue(null);

                  await expect(service.update("product-1", { categoryId: "non-existent" })).rejects.toThrow(NotFoundException);
            });
      });

      describe("remove", () => {
            it("should archive (soft delete) product if it has order items", async () => {
                  const productWithOrderItems = {
                        ...mockProduct,
                        _count: { orderItems: 1 },
                  };

                  jest.spyOn(prisma.product, "findUnique").mockResolvedValue(productWithOrderItems);
                  const updateSpy = jest.spyOn(prisma.product, "update").mockResolvedValue(mockProduct);

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

                  jest.spyOn(prisma.product, "findUnique").mockResolvedValue(productWithoutOrderItems);
                  const deleteSpy = jest.spyOn(prisma.product, "delete").mockResolvedValue(mockProduct);

                  const result = await service.remove("product-1");

                  expect(deleteSpy).toHaveBeenCalledWith({ where: { id: "product-1" } });
                  expect(result).toEqual({ id: "product-1", deleted: true, archived: false });
            });

            it("should throw NotFoundException if product does not exist", async () => {
                  jest.spyOn(prisma.product, "findUnique").mockResolvedValue(null);

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

                  jest.spyOn(prisma.product, "findUnique").mockResolvedValue({
                        id: "product-1",
                        categoryId: "category-1",
                  } as never);

                  const findManySpy = jest.spyOn(prisma.product, "findMany").mockResolvedValue([otherProduct]);

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
                  jest.spyOn(prisma.product, "findUnique").mockResolvedValue(null);

                  await expect(service.recommendations("missing")).rejects.toThrow(NotFoundException);
            });

            it("caps limit at 20", async () => {
                  jest.spyOn(prisma.product, "findUnique").mockResolvedValue({
                        id: "product-1",
                        categoryId: "category-1",
                  } as never);

                  const findManySpy = jest.spyOn(prisma.product, "findMany").mockResolvedValue([]);

                  await service.recommendations("product-1", 100);

                  expect(findManySpy).toHaveBeenCalledWith(expect.objectContaining({ take: 20 }));
            });

            it("defaults limit to 8", async () => {
                  jest.spyOn(prisma.product, "findUnique").mockResolvedValue({
                        id: "product-1",
                        categoryId: "category-1",
                  } as never);

                  const findManySpy = jest.spyOn(prisma.product, "findMany").mockResolvedValue([]);

                  await service.recommendations("product-1");

                  expect(findManySpy).toHaveBeenCalledWith(expect.objectContaining({ take: 8 }));
            });
      });
});
