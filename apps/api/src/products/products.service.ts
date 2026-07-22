import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "src/generated/prisma/client";
import { ProductStatus } from "src/generated/prisma/enums";
import { PrismaService } from "src/prisma/prisma.service";
import { Product } from "src/domain/product";
import { DomainError } from "src/domain/domain-error";
import type { CreateProductDto } from "./dto/create-product.dto.js";
import type { UpdateProductDto } from "./dto/update-product.dto.js";
import type { ListProductsQueryDto } from "./dto/list-products.dto.js";

type ProductResponse = {
      id: string;
      name: string;
      sku: string;
      description: string | null;
      price: string;
      stock: number;
      status: ProductStatus;
      categoryId: string;
      category: { id: string; name: string; slug: string };
      createdAt: Date;
      updatedAt: Date;
};

@Injectable()
export class ProductsService {
      constructor(private readonly prisma: PrismaService) {}

      async findAll(query: ListProductsQueryDto) {
            const page = Number(query.page ?? 1);
            const limit = Number(query.limit ?? 20);
            const skip = (page - 1) * limit;

            const where: Prisma.ProductWhereInput = {};
            if (query.status) {
                  where.status = query.status;
            }
            if (query.categoryId) {
                  where.categoryId = query.categoryId;
            }

            const [products, total] = await Promise.all([
                  this.prisma.product.findMany({
                        where,
                        skip,
                        take: limit,
                        include: {
                              category: {
                                    select: {
                                          id: true,
                                          name: true,
                                          slug: true,
                                    },
                              },
                        },
                        orderBy: { createdAt: "desc" },
                  }),
                  this.prisma.product.count({ where }),
            ]);

            const totalPages = Math.ceil(total / limit);

            return {
                  data: products.map((product) => this.toResponse(product)),
                  meta: {
                        page,
                        limit,
                        total,
                        totalPages,
                  },
            };
      }

      async findOne(id: string) {
            const product = await this.prisma.product.findUnique({
                  where: { id },
                  include: {
                        category: {
                              select: {
                                    id: true,
                                    name: true,
                                    slug: true,
                              },
                        },
                  },
            });

            if (!product) {
                  throw new NotFoundException("Product not found");
            }

            return this.toResponse(product);
      }

      async recommendations(productId: string, limit = 8): Promise<ProductResponse[]> {
            const source = await this.prisma.product.findUnique({
                  where: { id: productId },
                  select: { id: true, categoryId: true },
            });
            if (!source) {
                  throw new NotFoundException("Product not found");
            }
            const take = Math.min(Math.max(limit, 1), 20);
            const products = await this.prisma.product.findMany({
                  where: {
                        categoryId: source.categoryId,
                        status: ProductStatus.active,
                        id: { not: productId },
                  },
                  take,
                  orderBy: { createdAt: "desc" },
                  include: {
                        category: {
                              select: { id: true, name: true, slug: true },
                        },
                  },
            });
            return products.map((product) => this.toResponse(product));
      }

      async create(dto: CreateProductDto) {
            const sku = dto.sku.trim().toUpperCase();

            const existingSku = await this.prisma.product.findUnique({ where: { sku } });
            if (existingSku) {
                  throw new ConflictException(`Product SKU "${sku}" already exists`);
            }

            await this.assertCategoryExists(dto.categoryId);

            const status = dto.status ?? ProductStatus.active;
            this.validateProduct({
                  id: "new",
                  name: dto.name,
                  sku,
                  price: dto.price,
                  stock: dto.stock,
                  status,
                  categoryId: dto.categoryId,
            });

            const product = await this.prisma.product.create({
                  data: {
                        name: dto.name.trim(),
                        sku,
                        description: dto.description?.trim() ?? null,
                        price: new Prisma.Decimal(dto.price),
                        stock: dto.stock,
                        status,
                        categoryId: dto.categoryId,
                  },
                  include: {
                        category: {
                              select: {
                                    id: true,
                                    name: true,
                                    slug: true,
                              },
                        },
                  },
            });

            return this.toResponse(product);
      }

      async update(id: string, dto: UpdateProductDto) {
            const existing = await this.prisma.product.findUnique({ where: { id } });
            if (!existing) {
                  throw new NotFoundException("Product not found");
            }

            let sku = existing.sku;
            if (dto.sku !== undefined) {
                  sku = dto.sku.trim().toUpperCase();
                  const duplicate = await this.prisma.product.findFirst({
                        where: { sku, NOT: { id } },
                  });
                  if (duplicate) {
                        throw new ConflictException(`Product SKU "${sku}" already exists`);
                  }
            }

            if (dto.categoryId !== undefined) {
                  await this.assertCategoryExists(dto.categoryId);
            }

            const merged = {
                  id,
                  name: dto.name !== undefined ? dto.name : existing.name,
                  sku,
                  price: dto.price !== undefined ? dto.price : existing.price.toString(),
                  stock: dto.stock !== undefined ? dto.stock : existing.stock,
                  status: dto.status !== undefined ? dto.status : existing.status,
                  categoryId: dto.categoryId !== undefined ? dto.categoryId : existing.categoryId,
            };
            this.validateProduct(merged);

            const product = await this.prisma.product.update({
                  where: { id },
                  data: {
                        ...(dto.name !== undefined && { name: dto.name.trim() }),
                        ...(dto.sku !== undefined && { sku }),
                        ...(dto.description !== undefined && { description: dto.description?.trim() ?? null }),
                        ...(dto.price !== undefined && { price: new Prisma.Decimal(dto.price) }),
                        ...(dto.stock !== undefined && { stock: dto.stock }),
                        ...(dto.status !== undefined && { status: dto.status }),
                        ...(dto.categoryId !== undefined && { categoryId: dto.categoryId }),
                  },
                  include: {
                        category: {
                              select: {
                                    id: true,
                                    name: true,
                                    slug: true,
                              },
                        },
                  },
            });

            return this.toResponse(product);
      }

      async remove(id: string) {
            const product = await this.prisma.product.findUnique({
                  where: { id },
                  include: {
                        _count: {
                              select: { orderItems: true },
                        },
                  },
            });

            if (!product) {
                  throw new NotFoundException("Product not found");
            }

            // If product has orderItems → soft delete (archive)
            if (product._count.orderItems > 0) {
                  await this.prisma.product.update({
                        where: { id },
                        data: { status: ProductStatus.archived },
                  });
                  return { id, deleted: false, archived: true };
            }

            // Else hard delete
            await this.prisma.product.delete({ where: { id } });
            return { id, deleted: true, archived: false };
      }

      private validateProduct(props: { id: string; name: string; sku: string; price: string | number; stock: number; status: ProductStatus; categoryId: string }): void {
            try {
                  Product.fromPersistence(props);
            } catch (err) {
                  if (err instanceof DomainError) throw new BadRequestException(err.message);
                  throw err;
            }
      }

      private async assertCategoryExists(categoryId: string): Promise<void> {
            const category = await this.prisma.category.findUnique({ where: { id: categoryId } });
            if (!category) {
                  throw new NotFoundException("Category not found");
            }
      }

      private toResponse(product: {
            id: string;
            name: string;
            sku: string;
            description: string | null;
            price: Prisma.Decimal;
            stock: number;
            status: ProductStatus;
            categoryId: string;
            category: {
                  id: string;
                  name: string;
                  slug: string;
            };
            createdAt: Date;
            updatedAt: Date;
      }) {
            return {
                  id: product.id,
                  name: product.name,
                  sku: product.sku,
                  description: product.description,
                  price: product.price.toString(),
                  stock: product.stock,
                  status: product.status,
                  categoryId: product.categoryId,
                  category: {
                        id: product.category.id,
                        name: product.category.name,
                        slug: product.category.slug,
                  },
                  createdAt: product.createdAt,
                  updatedAt: product.updatedAt,
            };
      }
}
