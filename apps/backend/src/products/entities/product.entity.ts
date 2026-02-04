import { Product as PrismaProduct, ProductStatus } from '../../generated/prisma/client';
import { Category } from '../../categories/entities/category.entity';

type PrismaProductWithCategory = PrismaProduct & {
      category?: {
            id: string;
            name: string;
            slug: string;
      };
};

export class Product {
      constructor(
            public readonly id: string,
            public readonly name: string,
            public readonly sku: string,
            public readonly description: string | null,
            public readonly price: number,
            public readonly stock: number,
            public readonly status: ProductStatus,
            public readonly categoryId: string,
            public readonly createdAt: Date,
            public readonly updatedAt: Date,
            public category?: Category,
      ) {}

      static fromPrisma(prismaProduct: PrismaProductWithCategory): Product {
            const product = new Product(
                  prismaProduct.id,
                  prismaProduct.name,
                  prismaProduct.sku,
                  prismaProduct.description,
                  Number(prismaProduct.price),
                  prismaProduct.stock,
                  prismaProduct.status,
                  prismaProduct.categoryId,
                  prismaProduct.createdAt,
                  prismaProduct.updatedAt,
            );

            if (prismaProduct.category) {
                  product.category = Category.fromPrisma(prismaProduct.category as any);
            }

            return product;
      }

      /**
       * Check if product is active
       */
      isActive(): boolean {
            return this.status === ProductStatus.ACTIVE;
      }

      /**
       * Check if product is in stock
       */
      isInStock(): boolean {
            return this.stock > 0;
      }

      /**
       * Check if product has sufficient stock for quantity
       */
      hasStock(quantity: number): boolean {
            return this.stock >= quantity;
      }

      /**
       * Get formatted price
       */
      getFormattedPrice(): string {
            return `$${this.price.toFixed(2)}`;
      }

      /**
       * Convert to JSON
       */
      toJSON(): any {
            return {
                  id: this.id,
                  name: this.name,
                  sku: this.sku,
                  description: this.description,
                  price: Number(this.price),
                  stock: this.stock,
                  status: this.status,
                  categoryId: this.categoryId,
                  category: this.category
                        ? {
                                id: this.category.id,
                                name: this.category.name,
                                slug: this.category.slug,
                          }
                        : undefined,
                  createdAt: this.createdAt,
                  updatedAt: this.updatedAt,
            };
      }
}
