import { Args, ID, Query, Resolver, Int } from "@nestjs/graphql";
import { ProductModel, ProductConnectionModel } from "../models/product.model";
import { ProductsService } from "src/products/products.service";
import { PaginationInput, ProductFilterInput } from "../inputs/product.inputs";


@Resolver(() => ProductModel)
export class ProductsResolver {
  constructor(private readonly productsService: ProductsService) {}

  @Query(() => ProductConnectionModel)
  products(
    @Args("filter", { nullable: true }) filter?: ProductFilterInput,
    @Args("pagination", { nullable: true }) pagination?: PaginationInput,
  ) {
    return this.productsService.findAll({
      page: pagination?.page,
      limit: pagination?.limit,
      status: filter?.status,
      categoryId: filter?.categoryId,
    });
  }

  @Query(() => ProductModel, { nullable: true })
  product(@Args("id", { type: () => ID }) id: string) {
    return this.productsService.findOne(id);
  }

  @Query(() => [ProductModel])
  recommendations(
    @Args("productId", { type: () => ID }) productId: string,
    @Args("limit", { type: () => Int, defaultValue: 8 }) limit: number,
  ) {
    return this.productsService.recommendations(productId, limit);
  }
}