import { Query, Resolver } from "@nestjs/graphql";
import { CategorySummaryModel } from "../models/product.model";
import { CategoriesService } from "src/categories/categories.service";
@Resolver()
export class CategoriesResolver {
      constructor(private readonly categoriesService: CategoriesService) {}

      @Query(() => [CategorySummaryModel])
      categoryTree() {
            return this.categoriesService.getTree();
      }
}
