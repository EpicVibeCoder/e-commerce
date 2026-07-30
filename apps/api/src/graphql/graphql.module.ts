import { Module } from "@nestjs/common";
import { GraphQLModule } from "@nestjs/graphql";
import { ApolloDriver, ApolloDriverConfig } from "@nestjs/apollo";
import { join } from "node:path";
import { ConfigService } from "@nestjs/config";
import { ProductsModule } from "src/products/products.module";
import { CategoriesModule } from "src/categories/categories.module";
import { ProductsResolver } from "./resolvers/products.resolver";
import { CategoriesResolver } from "./resolvers/categories.resolver";
import type { EnvironmentVariables } from "src/config/env.validation";
import { AppEnv } from "src/config/env.validation";

@Module({
  imports: [
    ProductsModule,
    CategoriesModule,
    GraphQLModule.forRootAsync<ApolloDriverConfig>({
      driver: ApolloDriver,
      inject: [ConfigService],
      useFactory: (config: ConfigService<EnvironmentVariables, true>) => {
        const appEnv = config.get("APP_ENV", { infer: true });
        return {
          path: "/graphql",
          autoSchemaFile: join(process.cwd(), "src/schema.gql"),
          sortSchema: true,
          playground: appEnv !== AppEnv.production,
          introspection: appEnv !== AppEnv.production,
        };
      },
    }),
  ],
  providers: [ProductsResolver, CategoriesResolver],
})
export class AppGraphQLModule {}