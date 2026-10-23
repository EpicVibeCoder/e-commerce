import { Module } from "@nestjs/common";
import { CategoryLoaderProvider } from "./category-loader.provider";

@Module({
      providers: [CategoryLoaderProvider],
      exports: [CategoryLoaderProvider],
})
export class LoadersModule {}
