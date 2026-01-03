import { Category as PrismaCategory } from '../../generated/prisma/client';

type PrismaCategoryWithChildren = PrismaCategory & {
  children?: PrismaCategoryWithChildren[];
};

export class Category {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly slug: string,
    public readonly description: string | null,
    public readonly parentId: string | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public children: Category[] = [],
  ) {}

  static fromPrisma(prismaCategory: PrismaCategoryWithChildren): Category {
    const category = new Category(
      prismaCategory.id,
      prismaCategory.name,
      prismaCategory.slug,
      prismaCategory.description,
      prismaCategory.parentId,
      prismaCategory.createdAt,
      prismaCategory.updatedAt,
    );

    if (prismaCategory.children) {
      category.children = prismaCategory.children.map((child) => Category.fromPrisma(child));
    }

    

    return category;
  }

  /**
   * Reconstruct Category instance from plain object (e.g., from Redis cache)
   */
  static fromPlain(plain: any): Category {
    const category = new Category(
      plain.id,
      plain.name,
      plain.slug,
      plain.description,
      plain.parentId,
      new Date(plain.createdAt),
      new Date(plain.updatedAt),
    );

    if (plain.children && Array.isArray(plain.children)) {
      category.children = plain.children.map((child: any) => Category.fromPlain(child));
    }

    return category;
  }

  /**
   * Check if category is root (no parent)
   */
  isRoot(): boolean {
    return this.parentId === null;
  }

  /**
   * Get depth level in hierarchy
   */
  getDepth(): number {
    if (this.isRoot()) return 0;
    // This will be calculated during DFS traversal
    return 0; // Placeholder
  }

  /**
   * Convert to JSON with children
   */
  toJSON(): any {
    return {
      id: this.id,
      name: this.name,
      slug: this.slug,
      description: this.description,
      parentId: this.parentId,
      children: this.children.map((child) => child.toJSON()),
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
