import { Query, Resolver } from "@nestjs/graphql";
import { CategoriesService } from "src/categories/categories.service";
import { CategoryType } from "./types/category.type";

@Resolver(() => CategoryType)
export class CategoriesResolver {
      constructor(private readonly categoriesService: CategoriesService) {}

      @Query(() => [CategoryType], { name: "categoryTree" })
      async categoryTree(): Promise<CategoryType[]> {
            return this.categoriesService.getTree();
      }
}
