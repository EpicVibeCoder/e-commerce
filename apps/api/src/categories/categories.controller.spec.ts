import { Test, TestingModule } from "@nestjs/testing";
import { JwtAuthGuard } from "src/auth/guards/jwt-auth.guard";
import { RolesGuard } from "src/auth/guards/roles.guard";
import { CategoriesController } from "./categories.controller";
import { CategoriesService } from "./categories.service";

describe("CategoriesController", () => {
      let controller: CategoriesController;

      beforeEach(async () => {
            const module: TestingModule = await Test.createTestingModule({
                  controllers: [CategoriesController],
                  providers: [
                        {
                              provide: CategoriesService,
                              useValue: {/* existing mocks */},
                        },
                  ],
            })
                  .overrideGuard(JwtAuthGuard)
                  .useValue({ canActivate: () => true })
                  .overrideGuard(RolesGuard)
                  .useValue({ canActivate: () => true })
                  .compile();

            controller = module.get<CategoriesController>(CategoriesController);
      });

      it("should be defined", () => {
            expect(controller).toBeDefined();
      });
});
