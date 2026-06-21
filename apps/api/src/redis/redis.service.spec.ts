import { Test, TestingModule } from "@nestjs/testing";
import { ConfigService } from "@nestjs/config";
import { RedisService } from "./redis.service";

const mockRedis = {
      connect: jest.fn().mockResolvedValue(undefined),
      quit: jest.fn().mockResolvedValue(undefined),
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
};

jest.mock("ioredis", () => jest.fn().mockImplementation(() => mockRedis));

describe("RedisService", () => {
      let module: TestingModule;
      let service: RedisService;
      let configGet: jest.Mock;

      beforeEach(async () => {
            jest.clearAllMocks();
            configGet = jest.fn().mockReturnValue("redis://localhost:6379");

            module = await Test.createTestingModule({
                  providers: [
                        RedisService,
                        {
                              provide: ConfigService,
                              useValue: { get: configGet },
                        },
                  ],
            }).compile();

            await module.init();

            service = module.get(RedisService);
      });

      afterEach(async () => {
            await module.close();
      });

      it("should be defined", () => {
            expect(service).toBeDefined();
      });

      it("connects to Redis on module init", () => {
            expect(configGet).toHaveBeenCalledWith("REDIS_URL", { infer: true });
            expect(mockRedis.connect).toHaveBeenCalledTimes(1);
      });

      it("throws when REDIS_URL is missing", async () => {
            await module.close();

            configGet.mockReturnValue(undefined);

            const failingModule = await Test.createTestingModule({
                  providers: [
                        RedisService,
                        {
                              provide: ConfigService,
                              useValue: { get: configGet },
                        },
                  ],
            }).compile();

            const failingService = failingModule.get(RedisService);

            await expect(failingService.onModuleInit()).rejects.toThrow(
                  "REDIS_URL is required but not set",
            );
      });

      it("gets and sets string values", async () => {
            mockRedis.get.mockResolvedValue("hello");

            await expect(service.get("key")).resolves.toBe("hello");
            expect(mockRedis.get).toHaveBeenCalledWith("key");

            await service.set("key", "value");
            expect(mockRedis.set).toHaveBeenCalledWith("key", "value");

            await service.set("key", "value", 60);
            expect(mockRedis.set).toHaveBeenCalledWith("key", "value", "EX", 60);
      });

      it("gets and sets JSON", async () => {
            mockRedis.get.mockResolvedValue('{"a":1}');

            await expect(service.getJson<{ a: number }>("k")).resolves.toEqual({ a: 1 });

            await service.setJson("k", { b: 2 });
            expect(mockRedis.set).toHaveBeenCalledWith("k", '{"b":2}');
      });

      it("returns null from getJson when key is missing", async () => {
            mockRedis.get.mockResolvedValue(null);

            await expect(service.getJson("missing")).resolves.toBeNull();
      });

      it("deletes keys", async () => {
            mockRedis.del.mockResolvedValue(2);

            await expect(service.del("a", "b")).resolves.toBe(2);
            expect(mockRedis.del).toHaveBeenCalledWith("a", "b");
      });

      it("returns 0 from del when no keys are passed", async () => {
            await expect(service.del()).resolves.toBe(0);
            expect(mockRedis.del).not.toHaveBeenCalled();
      });

      it("quits Redis on module destroy", async () => {
            await module.close();

            expect(mockRedis.quit).toHaveBeenCalledTimes(1);
      });
});
