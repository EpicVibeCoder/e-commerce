import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { RedisService } from "src/redis/redis.service";
import { REDIS_KEYS } from "src/redis/redis-keys";
import type { CreateCategoryDto } from "./dto/create-category.dto.js";
import type { UpdateCategoryDto } from "./dto/update-category.dto.js";

type CategoryRecord = {
      id: string;
      name: string;
      slug: string;
      parentId: string | null;
      sortOrder: number;
};

@Injectable()
export class CategoriesService {
      constructor(
            private readonly prisma: PrismaService,
            private readonly redis: RedisService,
      ) {}

      async findAll() {
            const categories = await this.prisma.category.findMany({
                  orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
                  include: {
                        _count: { select: { products: true, children: true } },
                  },
            });

            return categories.map((category) => this.toResponse(category));
      }

      async findOne(id: string) {
            const category = await this.prisma.category.findUnique({
                  where: { id },
                  include: {
                        _count: { select: { products: true, children: true } },
                  },
            });

            if (!category) {
                  throw new NotFoundException("Category not found");
            }

            return this.toResponse(category);
      }

      async create(dto: CreateCategoryDto) {
            const slug = dto.slug.trim().toLowerCase();

            const existingSlug = await this.prisma.category.findUnique({ where: { slug } });
            if (existingSlug) {
                  throw new ConflictException(`Category slug "${slug}" already exists`);
            }

            if (dto.parentId) {
                  await this.assertParentExists(dto.parentId);
            }

            const category = await this.prisma.category.create({
                  data: {
                        name: dto.name.trim(),
                        slug,
                        parentId: dto.parentId ?? null,
                        sortOrder: dto.sortOrder ?? 0,
                  },
                  include: {
                        _count: { select: { products: true, children: true } },
                  },
            });

            await this.invalidateCategoryTreeCache();
            return this.toResponse(category);
      }

      async update(id: string, dto: UpdateCategoryDto) {
            const existing = await this.prisma.category.findUnique({ where: { id } });
            if (!existing) {
                  throw new NotFoundException("Category not found");
            }

            if (dto.slug !== undefined) {
                  const slug = dto.slug.trim().toLowerCase();
                  const duplicate = await this.prisma.category.findFirst({
                        where: { slug, NOT: { id } },
                  });
                  if (duplicate) {
                        throw new ConflictException(`Category slug "${slug}" already exists`);
                  }
            }

            if (dto.parentId !== undefined) {
                  if (dto.parentId === id) {
                        throw new BadRequestException("Category cannot be its own parent");
                  }

                  if (dto.parentId) {
                        await this.assertParentExists(dto.parentId);
                        await this.assertNoParentCycle(id, dto.parentId);
                  }
            }

            const category = await this.prisma.category.update({
                  where: { id },
                  data: {
                        ...(dto.name !== undefined && { name: dto.name.trim() }),
                        ...(dto.slug !== undefined && { slug: dto.slug.trim().toLowerCase() }),
                        ...(dto.parentId !== undefined && { parentId: dto.parentId ?? null }),
                        ...(dto.sortOrder !== undefined && { sortOrder: dto.sortOrder }),
                  },
                  include: {
                        _count: { select: { products: true, children: true } },
                  },
            });

            await this.invalidateCategoryTreeCache();
            return this.toResponse(category);
      }

      async remove(id: string) {
            const category = await this.prisma.category.findUnique({
                  where: { id },
                  include: {
                        _count: { select: { products: true, children: true } },
                  },
            });

            if (!category) {
                  throw new NotFoundException("Category not found");
            }

            if (category._count.children > 0) {
                  throw new ConflictException("Cannot delete category with child categories");
            }

            if (category._count.products > 0) {
                  throw new ConflictException("Cannot delete category with products");
            }

            await this.prisma.category.delete({ where: { id } });
            await this.invalidateCategoryTreeCache();

            return { id, deleted: true };
      }

      private async assertParentExists(parentId: string): Promise<void> {
            const parent = await this.prisma.category.findUnique({ where: { id: parentId } });
            if (!parent) {
                  throw new NotFoundException("Parent category not found");
            }
      }

      private async assertNoParentCycle(categoryId: string, newParentId: string): Promise<void> {
            let currentId: string | null = newParentId;

            while (currentId) {
                  if (currentId === categoryId) {
                        throw new BadRequestException("Category hierarchy cycle detected");
                  }

                  const ancestor: CategoryRecord | null = await this.prisma.category.findUnique({
                        where: { id: currentId },
                        select: { id: true, name: true, slug: true, parentId: true, sortOrder: true },
                  });

                  if (!ancestor) {
                        throw new NotFoundException("Parent category not found");
                  }

                  currentId = ancestor.parentId;
            }
      }

      private async invalidateCategoryTreeCache(): Promise<void> {
            await this.redis.del(REDIS_KEYS.categoryTree);
      }

      private toResponse(category: {
            id: string;
            name: string;
            slug: string;
            parentId: string | null;
            sortOrder: number;
            _count: { products: number; children: number };
      }) {
            return {
                  id: category.id,
                  name: category.name,
                  slug: category.slug,
                  parentId: category.parentId,
                  sortOrder: category.sortOrder,
                  productCount: category._count.products,
                  childCount: category._count.children,
            };
      }
}