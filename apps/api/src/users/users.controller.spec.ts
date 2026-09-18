import { Test, TestingModule } from "@nestjs/testing";

import { UsersController } from "src/users/users.controller";
import { UsersService } from "src/users/users.service";
import { JwtAuthGuard } from "src/auth/guards/jwt-auth.guard";

describe("UsersController", () => {
      let controller: UsersController;

      beforeEach(async () => {
            const module: TestingModule = await Test.createTestingModule({
                  controllers: [UsersController],
                  providers: [
                        {
                              provide: UsersService,
                              useValue: {
                                    getMe: vi.fn(),
                                    getMyOrders: vi.fn(),
                                    getMyPayments: vi.fn(),
                              },
                        },
                  ],
            })
                  .overrideGuard(JwtAuthGuard)
                  .useValue({ canActivate: () => true })
                  .compile();

            controller = module.get<UsersController>(UsersController);
      });

      it("should be defined", () => {
            expect(controller).toBeDefined();
      });
});
