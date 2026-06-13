import { Test, TestingModule } from "@nestjs/testing";
import { UsersController } from "./users.controller";
import { UsersService } from "./users.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";

describe("UsersController", () => {
      let controller: UsersController;

      beforeEach(async () => {
            const module: TestingModule = await Test.createTestingModule({
                  controllers: [UsersController],
                  providers: [
                        {
                              provide: UsersService,
                              useValue: {
                                    getMe: jest.fn(),
                                    getMyOrders: jest.fn(),
                                    getMyPayments: jest.fn(),
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
