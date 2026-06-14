import { Test, TestingModule } from "@nestjs/testing";
import { HealthController } from "src/health/health.controller";
import { HealthService } from "src/health/health.service";

describe("HealthController", () => {
      let controller: HealthController;

      beforeEach(async () => {
            const module: TestingModule = await Test.createTestingModule({
                  controllers: [HealthController],
                  providers: [
                        {
                              provide: HealthService,
                              useValue: {
                                    checkReady: jest.fn(),
                              },
                        },
                  ],
            }).compile();

            controller = module.get<HealthController>(HealthController);
      });

      it("should be defined", () => {
            expect(controller).toBeDefined();
      });
});
