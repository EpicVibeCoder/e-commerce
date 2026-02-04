import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Category } from './entities/category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { ConflictException, BadRequestException } from '@nestjs/common';
import { RedisService } from 'src/redis/redis.service';

@Injectable()
export class CategoriesService {
      private readonly CACHE_KEY = 'category_tree';
      private readonly CACHE_TTL = 3600; // 1 hour in seconds

      constructor(
            private readonly prisma: PrismaService,
            private readonly redisService: RedisService,
      ) {}

      /**
       * Depth-First Search to build category hierarchy
       * Req 2.2.5: DFS algorithm for category tree traversal
       */
      private buildCategoryTree(categories: any[], parentId: string | null = null): Category[] {
            const result: Category[] = [];

            // Find all categories with matching parentId
            const children = categories.filter((cat) => cat.parentId === parentId);

            // Recursively process each child (DFS)
            for (const child of children) {
                  const category = Category.fromPrisma(child);

                  // Recursively get children of this category
                  category.children = this.buildCategoryTree(categories, child.id);

                  result.push(category);
            }

            return result;
      }

      /**
       * Get complete category hierarchy with DFS
       * Cached in Redis (Req 2.2.5)
       */
      async getCategoryHierarchy(): Promise<Category[]> {
            // Try to get from cache first
            const cached = await this.redisService.get<any[]>(this.CACHE_KEY);
            if (cached) {
                  // Reconstruct Category instances from cached plain objects
                  return cached.map((cat: any) => Category.fromPlain(cat));
            }

            // Fetch all categories from database
            const categories = await this.prisma.category.findMany({
                  include: {
                        children: true,
                  },
            });

            // Build tree using DFS algorithm
            const tree = this.buildCategoryTree(categories, null);

            // Cache the result in Redis (TTL in seconds)
            await this.redisService.set(this.CACHE_KEY, tree, this.CACHE_TTL);

            return tree;
      }

      /**
       * Get all related category IDs using DFS traversal
       * Req 2.2.5: DFS for product recommendations
       * Traverses: parent, siblings, and all descendants
       */
      async getRelatedCategoryIds(categoryId: string): Promise<string[]> {
            const category = await this.prisma.category.findUnique({
                  where: { id: categoryId },
            });

            if (!category) {
                  return [];
            }

            const relatedIds = new Set<string>([categoryId]);

            // Get category tree from cache or build it
            const categoryTree = await this.getCategoryHierarchy();

            // Helper function to find category in tree
            const findCategoryInTree = (tree: Category[], targetId: string): Category | null => {
                  for (const cat of tree) {
                        if (cat.id === targetId) {
                              return cat;
                        }
                        const found = findCategoryInTree(cat.children, targetId);
                        if (found) return found;
                  }
                  return null;
            };

            const categoryNode = findCategoryInTree(categoryTree, categoryId);
            if (!categoryNode) {
                  return Array.from(relatedIds);
            }

            // DFS to collect all related categories
            const collectRelatedCategories = (node: Category, visited: Set<string>) => {
                  if (visited.has(node.id)) return;
                  visited.add(node.id);

                  // Add parent if exists
                  if (node.parentId) {
                        const findParent = (tree: Category[], parentId: string): Category | null => {
                              for (const cat of tree) {
                                    if (cat.id === parentId) return cat;
                                    const found = findParent(cat.children, parentId);
                                    if (found) return found;
                              }
                              return null;
                        };
                        const parent = findParent(categoryTree, node.parentId);
                        if (parent && !visited.has(parent.id)) {
                              visited.add(parent.id);
                              collectRelatedCategories(parent, visited);
                        }
                  }

                  // Add all children (descendants) using DFS
                  const traverseChildren = (children: Category[]) => {
                        for (const child of children) {
                              if (!visited.has(child.id)) {
                                    visited.add(child.id);
                                    traverseChildren(child.children);
                              }
                        }
                  };
                  traverseChildren(node.children);

                  // Add siblings (same parent)
                  if (node.parentId) {
                        const findSiblings = (tree: Category[], parentId: string): Category[] => {
                              const findParentNode = (nodes: Category[]): Category | null => {
                                    for (const cat of nodes) {
                                          if (cat.id === parentId) return cat;
                                          const found = findParentNode(cat.children);
                                          if (found) return found;
                                    }
                                    return null;
                              };
                              const parentNode = findParentNode(tree);
                              if (parentNode) {
                                    return parentNode.children.filter((c) => c.id !== node.id);
                              }
                              return [];
                        };
                        const siblings = findSiblings(categoryTree, node.parentId);
                        siblings.forEach((sibling) => {
                              if (!visited.has(sibling.id)) {
                                    visited.add(sibling.id);
                                    traverseChildren(sibling.children);
                              }
                        });
                  }
            };

            collectRelatedCategories(categoryNode, relatedIds);

            return Array.from(relatedIds);
      }

      /**
       * Invalidate cache (call after category create/update/delete)
       */
      async invalidateCache(): Promise<void> {
            await this.redisService.del(this.CACHE_KEY);
      }

      /**
       * Get single category by ID
       */
      async findById(id: string): Promise<Category> {
            const category = await this.prisma.category.findUnique({
                  where: { id },
                  include: {
                        children: true,
                        parent: true,
                  },
            });

            if (!category) {
                  throw new NotFoundException(`Category with ID ${id} not found`);
            }

            return Category.fromPrisma(category);
      }
      async create(createCategoryDto: CreateCategoryDto): Promise<Category> {
            // Check if slug already exists
            const existingCategory = await this.prisma.category.findUnique({
                  where: { slug: createCategoryDto.slug },
            });

            if (existingCategory) {
                  throw new ConflictException(`Category with slug "${createCategoryDto.slug}" already exists`);
            }

            // Validate parent exists if parentId provided
            if (createCategoryDto.parentId) {
                  const parent = await this.prisma.category.findUnique({
                        where: { id: createCategoryDto.parentId },
                  });
                  if (!parent) {
                        throw new NotFoundException(`Parent category with ID ${createCategoryDto.parentId} not found`);
                  }
            }

            const category = await this.prisma.category.create({
                  data: {
                        name: createCategoryDto.name,
                        slug: createCategoryDto.slug,
                        description: createCategoryDto.description,
                        parentId: createCategoryDto.parentId || null,
                  },
                  include: {
                        children: true,
                        parent: true,
                  },
            });

            // Invalidate cache after creation
            await this.invalidateCache();

            return Category.fromPrisma(category);
      }

      async update(id: string, updateCategoryDto: UpdateCategoryDto): Promise<Category> {
            // Check if category exists
            const existingCategory = await this.prisma.category.findUnique({
                  where: { id },
            });

            if (!existingCategory) {
                  throw new NotFoundException(`Category with ID ${id} not found`);
            }

            // Check if slug is being updated and if it's already taken
            if (updateCategoryDto.slug && updateCategoryDto.slug !== existingCategory.slug) {
                  const slugExists = await this.prisma.category.findUnique({
                        where: { slug: updateCategoryDto.slug },
                  });
                  if (slugExists) {
                        throw new ConflictException(`Category with slug "${updateCategoryDto.slug}" already exists`);
                  }
            }

            // Validate parent exists if parentId provided
            if (updateCategoryDto.parentId !== undefined) {
                  if (updateCategoryDto.parentId === id) {
                        throw new BadRequestException('Category cannot be its own parent');
                  }
                  if (updateCategoryDto.parentId) {
                        const parent = await this.prisma.category.findUnique({
                              where: { id: updateCategoryDto.parentId },
                        });
                        if (!parent) {
                              throw new NotFoundException(`Parent category with ID ${updateCategoryDto.parentId} not found`);
                        }
                  }
            }

            const category = await this.prisma.category.update({
                  where: { id },
                  data: {
                        ...(updateCategoryDto.name && { name: updateCategoryDto.name }),
                        ...(updateCategoryDto.slug && { slug: updateCategoryDto.slug }),
                        ...(updateCategoryDto.description !== undefined && { description: updateCategoryDto.description }),
                        ...(updateCategoryDto.parentId !== undefined && { parentId: updateCategoryDto.parentId }),
                  },
                  include: {
                        children: true,
                        parent: true,
                  },
            });

            // Invalidate cache after update
            await this.invalidateCache();

            return Category.fromPrisma(category);
      }

      async delete(id: string): Promise<void> {
            const category = await this.prisma.category.findUnique({
                  where: { id },
                  include: {
                        children: true,
                        products: true,
                  },
            });

            if (!category) {
                  throw new NotFoundException(`Category with ID ${id} not found`);
            }

            // Check if category has children
            if (category.children.length > 0) {
                  throw new BadRequestException('Cannot delete category with child categories');
            }

            // Check if category has products
            if (category.products.length > 0) {
                  throw new BadRequestException('Cannot delete category with associated products');
            }

            await this.prisma.category.delete({
                  where: { id },
            });

            // Invalidate cache after deletion
            await this.invalidateCache();
      }

      async findAll(): Promise<Category[]> {
            return this.getCategoryHierarchy();
      }
}
