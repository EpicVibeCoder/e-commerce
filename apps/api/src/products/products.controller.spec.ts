import { Test, TestingModule } from "@nestjs/testing";
import { ProductsController } from "./products.controller";
import { ProductsService } from "./products.service";
import { ProductStatus } from "src/generated/prisma/enums";

describe("ProductsController", () => {
      let controller: ProductsController;
      const findAll = jest.fn();
      const findOne = jest.fn();
      const create = jest.fn();
      const update = jest.fn();
      const remove = jest.fn();

      const mockProduct = {
            id: "product-1",
            name: "Test Product",
            sku: "TEST-SKU",
            description: "Test Description",
            price: "99.99",
            stock: 10,
            status: ProductStatus.active,
            categoryId: "category-1",
            category: { id: "category-1", name: "Electronics", slug: "electronics" },
            createdAt: new Date(),
            updatedAt: new Date(),
      };

      beforeEach(async () => {
            findAll.mockResolvedValue({
                  data: [mockProduct],
                  meta: { page: 1, limit: 10, total: 1, totalPages: 1 },
            });
            findOne.mockResolvedValue(mockProduct);
            create.mockResolvedValue(mockProduct);
            update.mockResolvedValue(mockProduct);
            remove.mockResolvedValue({ id: "product-1", deleted: true, archived: false });
            const module: TestingModule = await Test.createTestingModule({
                  controllers: [ProductsController],
                  providers: [
                        {
                              provide: ProductsService,
                              useValue: { findAll, findOne, create, update, remove },
                        },
                  ],
            }).compile();

            controller = module.get<ProductsController>(ProductsController);
      });

      it("should be defined", () => {
            expect(controller).toBeDefined();
      });

      describe("findAll", () => {
            it("should return all products", async () => {
                  const query = { page: 1, limit: 10 };
                  const result = await controller.findAll(query);
                  expect(findAll).toHaveBeenCalledWith(query);
                  expect(result.data).toEqual([mockProduct]);
            });
      });

      describe("findOne", () => {
            it("should return a single product by id", async () => {
                  const result = await controller.findOne("product-1");
                  expect(findOne).toHaveBeenCalledWith("product-1");
                  expect(result).toEqual(mockProduct);
            });
      });

      describe("create", () => {
            it("should create a new product", async () => {
                  const dto = {
                        name: "Test Product",
                        sku: "TEST-SKU",
                        price: "99.99",
                        stock: 10,
                        categoryId: "category-1",
                  };
                  const result = await controller.create(dto);
                  expect(create).toHaveBeenCalledWith(dto);
                  expect(result).toEqual(mockProduct);
            });
      });

      describe("update", () => {
            it("should update a product", async () => {
                  const dto = { name: "Updated Name" };
                  const result = await controller.update("product-1", dto);
                  expect(update).toHaveBeenCalledWith("product-1", dto);
                  expect(result).toEqual(mockProduct);
            });
      });

      describe("remove", () => {
            it("should remove a product", async () => {
                  const result = await controller.remove("product-1");
                  expect(remove).toHaveBeenCalledWith("product-1");
                  expect(result).toEqual({ id: "product-1", deleted: true, archived: false });
            });
      });
});
