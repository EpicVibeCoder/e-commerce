import { Test, TestingModule } from "@nestjs/testing";
import { CategoriesService } from "./categories.service";
import { PrismaService } from "src/prisma/prisma.service";
import { RedisService } from "src/redis/redis.service";

describe("CategoriesService", () => {
      let service: CategoriesService;
      beforeEach(async () => {
            const module: TestingModule = await Test.createTestingModule({
                  providers: [
                        CategoriesService,
                        {
                              provide: PrismaService,
                              useValue: {
                                    category: {
                                          findMany: jest.fn(),
                                          findUnique: jest.fn(),
                                          findFirst: jest.fn(),
                                          create: jest.fn(),
                                          update: jest.fn(),
                                          delete: jest.fn(),
                                    },
                              },
                        },
                        {
                              provide: RedisService,
                              useValue: { del: jest.fn() },
                        },
                  ],
            }).compile();
            service = module.get<CategoriesService>(CategoriesService);
      });
      it("should be defined", () => {
            expect(service).toBeDefined();
      });
});
