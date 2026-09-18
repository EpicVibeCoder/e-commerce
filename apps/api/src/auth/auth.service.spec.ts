import { Test, TestingModule } from "@nestjs/testing";

import { AuthService } from "src/auth/auth.service";
import { PrismaService } from "src/prisma/prisma.service";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";

describe("AuthService", () => {
      let service: AuthService;

      beforeEach(async () => {
            const module: TestingModule = await Test.createTestingModule({
                  providers: [
                        AuthService,
                        {
                              provide: PrismaService,
                              useValue: {
                                    user: {
                                          findUnique: vi.fn(),
                                          create: vi.fn(),
                                    },
                              },
                        },
                        {
                              provide: JwtService,
                              useValue: {
                                    signAsync: vi.fn(),
                              },
                        },
                        {
                              provide: ConfigService,
                              useValue: { get: vi.fn() },
                        },
                  ],
            }).compile();

            service = module.get<AuthService>(AuthService);
      });

      it("should be defined", () => {
            expect(service).toBeDefined();
      });
});
