import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { ConfigModule } from "@nestjs/config";
import { validateEnv } from "src/config/env.validation";
import { join } from "node:path";
import { PrismaModule } from "src/prisma/prisma.module";
import { AuthModule } from "src/auth/auth.module";
import { UsersModule } from "src/users/users.module";
import { HealthModule } from "src/health/health.module";
import { RedisModule } from "./redis/redis.module";
import { CategoriesModule } from "./categories/categories.module";
import { ProductsModule } from "./products/products.module";
import { MailModule } from "./mail/mail.module";
import { GraphQLModule } from "@nestjs/graphql";
import { ApolloDriver, ApolloDriverConfig } from "@nestjs/apollo";
import { HealthResolver } from "./graphql/health.resolver";
import { ProductsResolver } from "./graphql/products.resolver";
@Module({
      imports: [
            ConfigModule.forRoot({
                  isGlobal: true,
                  envFilePath: [join(process.cwd(), "../../.env")],
                  validate: validateEnv,
            }),
            GraphQLModule.forRoot<ApolloDriverConfig>({
                  driver: ApolloDriver,
                  autoSchemaFile: join(process.cwd(), "src/schema.gql"),
                  sortSchema: true,
                  path: "/graphql",
            }),
            PrismaModule,
            AuthModule,
            UsersModule,
            HealthModule,
            RedisModule,
            CategoriesModule,
            ProductsModule,
            MailModule,
      ],
      controllers: [AppController],
      providers: [AppService, HealthResolver, ProductsResolver],
})
export class AppModule {}
