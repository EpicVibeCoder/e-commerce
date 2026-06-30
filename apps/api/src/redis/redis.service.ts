import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Redis from "ioredis";
import type { EnvironmentVariables } from "src/config/env.validation";

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
      private readonly logger = new Logger(RedisService.name);
      private client!: Redis;

      constructor(private readonly config: ConfigService<EnvironmentVariables, true>) {}

      async onModuleInit(): Promise<void> {
            const url = this.config.get("REDIS_URL", { infer: true });
            if (!url) {
                  throw new Error("REDIS_URL is required but not set");
            }

            this.client = new Redis(url, {
                  maxRetriesPerRequest: 3,
                  lazyConnect: true,
                  retryStrategy: () => null,
            });

            this.client.on("error", (err) => {
                  this.logger.error(`Redis client error: ${err.message}`);
            });

            await this.client.connect();
            this.logger.log("Redis connected");
      }

      async onModuleDestroy(): Promise<void> {
            if (this.client) {
                  await this.client.quit();
            }
      }

      async get(key: string): Promise<string | null> {
            return this.client.get(key);
      }

      async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
            if (ttlSeconds) {
                  await this.client.set(key, value, "EX", ttlSeconds);
                  return;
            }
            await this.client.set(key, value);
      }

      async del(...keys: string[]): Promise<number> {
            if (!keys.length) return 0;
            return this.client.del(...keys);
      }

      async getJson<T>(key: string): Promise<T | null> {
            const raw = await this.get(key);
            if (raw === null) return null;
            return JSON.parse(raw) as T;
      }

      async setJson(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
            await this.set(key, JSON.stringify(value), ttlSeconds);
      }
}
