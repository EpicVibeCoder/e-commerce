import { Injectable, NotFoundException, ConflictException, BadRequestException, Inject } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Product } from './entities/product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductStatus } from '../generated/prisma/client';
import { CategoriesService } from 'src/categories/categories.service';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService,private readonly categoriesService: CategoriesService,
    private readonly redisService: RedisService,) {}

  /**
   * Create a new product (Admin only)
   * Req 2.1.2: Admin can create products
   */
  async create(createProductDto: CreateProductDto): Promise<Product> {
    // Check if SKU already exists
    const existingProduct = await this.prisma.product.findUnique({
      where: { sku: createProductDto.sku },
    });

    if (existingProduct) {
      throw new ConflictException(`Product with SKU "${createProductDto.sku}" already exists`);
    }

    // Validate category exists
    const category = await this.prisma.category.findUnique({
      where: { id: createProductDto.categoryId },
    });

    if (!category) {
      throw new NotFoundException(`Category with ID ${createProductDto.categoryId} not found`);
    }

    const product = await this.prisma.product.create({
      data: {
        name: createProductDto.name,
        sku: createProductDto.sku,
        description: createProductDto.description,
        price: createProductDto.price,
        stock: createProductDto.stock,
        status: createProductDto.status || ProductStatus.ACTIVE,
        categoryId: createProductDto.categoryId,
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

    return Product.fromPrisma(product);
  }

  /**
   * Get all products (public endpoint)
   * Req 2.1.2: Users can view product lists
   */
  async findAll(status?: ProductStatus): Promise<Product[]> {
    const where = status ? { status } : {};

    const products = await this.prisma.product.findMany({
      where,
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return products.map((product) => Product.fromPrisma(product));
  }

  /**
   * Get product by ID (public endpoint)
   * Req 2.1.2: Users can view product details
   */
  async findById(id: string): Promise<Product> {
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
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    return Product.fromPrisma(product);
  }

  /**
   * Get product by SKU (public endpoint)
   */
  async findBySku(sku: string): Promise<Product> {
    const product = await this.prisma.product.findUnique({
      where: { sku },
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
      throw new NotFoundException(`Product with SKU "${sku}" not found`);
    }

    return Product.fromPrisma(product);
  }

  /**
   * Update product (Admin only)
   * Req 2.1.2: Admin can update products
   */
  async update(id: string, updateProductDto: UpdateProductDto): Promise<Product> {
    // Check if product exists
    const existingProduct = await this.prisma.product.findUnique({
      where: { id },
    });

    if (!existingProduct) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    // Check if SKU is being updated and if it's already taken
    if (updateProductDto.sku && updateProductDto.sku !== existingProduct.sku) {
      const skuExists = await this.prisma.product.findUnique({
        where: { sku: updateProductDto.sku },
      });
      if (skuExists) {
        throw new ConflictException(`Product with SKU "${updateProductDto.sku}" already exists`);
      }
    }

    // Validate category exists if categoryId is being updated
    if (updateProductDto.categoryId) {
      const category = await this.prisma.category.findUnique({
        where: { id: updateProductDto.categoryId },
      });
      if (!category) {
        throw new NotFoundException(`Category with ID ${updateProductDto.categoryId} not found`);
      }
    }

    const product = await this.prisma.product.update({
      where: { id },
      data: {
        ...(updateProductDto.name && { name: updateProductDto.name }),
        ...(updateProductDto.sku && { sku: updateProductDto.sku }),
        ...(updateProductDto.description !== undefined && { description: updateProductDto.description }),
        ...(updateProductDto.price && { price: updateProductDto.price }),
        ...(updateProductDto.stock !== undefined && { stock: updateProductDto.stock }),
        ...(updateProductDto.status && { status: updateProductDto.status }),
        ...(updateProductDto.categoryId && { categoryId: updateProductDto.categoryId }),
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

    return Product.fromPrisma(product);
  }

  /**
   * Delete product (Admin only)
   * Req 2.1.2: Admin can delete products
   */
  async delete(id: string): Promise<{ message: string }> {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        orderItems: true,
      },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    // Check if product has associated order items
    if (product.orderItems.length > 0) {
      throw new BadRequestException('Cannot delete product with associated order items');
    }

    await this.prisma.product.delete({
      where: { id },
    });

    return { message: 'Product deleted successfully' };
  }

  /**
   * Reduce stock after successful payment
   * Req 2.1.6: Stock is reduced after successful payment
   * Req 2.2.3: Safe stock reduction algorithm
   */
  async reduceStock(productId: string, quantity: number): Promise<Product> {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${productId} not found`);
    }

    if (product.stock < quantity) {
      throw new BadRequestException(`Insufficient stock. Available: ${product.stock}, Requested: ${quantity}`);
    }

    const updatedProduct = await this.prisma.product.update({
      where: { id: productId },
      data: {
        stock: {
          decrement: quantity,
        },
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

    return Product.fromPrisma(updatedProduct);
  }
 /**
   * Get product recommendations using DFS category traversal
   * Req 2.2.5: Use DFS in Product Recommendation to traverse category tree
   * for recommending related products efficiently
   */
 async getRecommendations(productId: string, limit: number = 10): Promise<Product[]> {
  // Get the product to find its category
  const product = await this.prisma.product.findUnique({
    where: { id: productId },
    select: { categoryId: true },
  });

  if (!product) {
    throw new NotFoundException(`Product with ID ${productId} not found`);
  }

  // Cache key for recommendations
  const cacheKey = `product_recommendations:${productId}:${limit}`;
    
    // Try to get from cache
    const cached = await this.redisService.get<Product[]>(cacheKey);
    if (cached) {
      return cached;
    }

  // Get related category IDs using DFS
  const relatedCategoryIds = await this.categoriesService.getRelatedCategoryIds(product.categoryId);

  if (relatedCategoryIds.length === 0) {
    return [];
  }

  // Fetch products from related categories, excluding the original product
  const products = await this.prisma.product.findMany({
    where: {
      categoryId: { in: relatedCategoryIds },
      id: { not: productId },
      status: ProductStatus.ACTIVE,
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
    orderBy: {
      createdAt: 'desc',
    },
    take: limit,
  });

  const recommendations = products.map((p) => Product.fromPrisma(p));

  // Cache recommendations for 30 minutes (1800 seconds)
  await this.redisService.set(cacheKey, recommendations, 1800);

  return recommendations;
}
  /**
   * Get products by category ID
   */
  async findByCategoryId(categoryId: string, status?: ProductStatus): Promise<Product[]> {
    const where: any = { categoryId };
    if (status) {
      where.status = status;
    }

    const products = await this.prisma.product.findMany({
      where,
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return products.map((product) => Product.fromPrisma(product));
  }
}