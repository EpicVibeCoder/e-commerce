import { Injectable, Scope } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { createCategoryLoader, type CategoryLoader } from "./category.loader";

export const CATEGORY_LOADER = "CATEGORY_LOADER";

@Injectable({ scope: Scope.REQUEST })
export class CategoryLoaderProvider {
      readonly loader: CategoryLoader;

      constructor(prisma: PrismaService) {
            this.loader = createCategoryLoader(prisma);
      }
}
