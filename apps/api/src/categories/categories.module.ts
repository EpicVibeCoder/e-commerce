import { Module } from "@nestjs/common";
import { AuthModule } from "src/auth/auth.module";
import { CategoriesController } from "./categories.controller";
import { CategoriesService } from "./categories.service";
import { RedisModule } from "src/redis/redis.module";

@Module({
      controllers: [CategoriesController],
      providers: [CategoriesService],
      imports: [AuthModule, RedisModule],
      exports: [CategoriesService],
})
export class CategoriesModule {}
