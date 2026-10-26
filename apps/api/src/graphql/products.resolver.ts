import { Args, ID, Query, Resolver, Int, Parent, ResolveField } from "@nestjs/graphql";
import { NotFoundException } from "@nestjs/common";
import { ProductsService } from "src/products/products.service";
import { ProductType } from "./types/product.type";
import { ProductConnection, ProductFilterInput, PaginationInput } from "./types/product-connection.type";
import { CategoryLoaderProvider } from "./loaders/category-loader.provider";
import { CategoryType } from "./types/category.type";

@Resolver(() => ProductType)
export class ProductsResolver {
      constructor(
            private readonly productsService: ProductsService,
            private readonly categoryLoader: CategoryLoaderProvider,
      ) {}

      @Query(() => ProductType, { name: "product", nullable: true })
      async product(@Args("id", { type: () => ID }) id: string): Promise<ProductType | null> {
            try {
                  return await this.productsService.findOne(id);
            } catch (err) {
                  if (err instanceof NotFoundException) return null;
                  throw err;
            }
      }

      @Query(() => ProductConnection, { name: "products" })
      async products(@Args("filter", { type: () => ProductFilterInput, nullable: true }) filter?: ProductFilterInput, @Args("pagination", { type: () => PaginationInput, nullable: true }) pagination?: PaginationInput): Promise<ProductConnection> {
            return this.productsService.findAll({
                  status: filter?.status,
                  categoryId: filter?.categoryId,
                  page: pagination?.page,
                  limit: pagination?.limit,
            });
      }

      @Query(() => [ProductType], { name: "recommendations" })
      async recommendations(@Args("productId", { type: () => ID }) productId: string, @Args("limit", { type: () => Int, nullable: true, defaultValue: 8 }) limit?: number): Promise<ProductType[]> {
            return this.productsService.recommendations(productId, limit ?? 8);
      }

      @ResolveField(() => CategoryType, { nullable: true })
      async category(@Parent() product: ProductType): Promise<CategoryType | null> {
            return this.categoryLoader.loader.load(product.categoryId);
      }
}
