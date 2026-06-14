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

@Module({
      imports: [
            ConfigModule.forRoot({
                  isGlobal: true,
                  envFilePath: [join(process.cwd(), "../../.env")],
                  validate: validateEnv,
            }),
            PrismaModule,
            AuthModule,
            UsersModule,
            HealthModule,
      ],
      controllers: [AppController],
      providers: [AppService],
})
export class AppModule {}
