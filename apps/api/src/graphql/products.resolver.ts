import { Args, ID, Query, Resolver } from "@nestjs/graphql";
import { NotFoundException } from "@nestjs/common";
import { ProductsService } from "src/products/products.service";
import { ProductType } from "./types/product.type";
import { ProductConnection,ProductFilterInput,PaginationInput } from "./types/product-connection.type";

@Resolver(() => ProductType)
export class ProductsResolver {
      constructor(private readonly productsService: ProductsService) {}

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
}
