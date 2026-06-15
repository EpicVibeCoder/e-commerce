import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { getJwtModuleOptions } from "src/config/jwt.config";
import type { EnvironmentVariables } from "src/config/env.validation";
import { AuthController } from "./auth.controller.js";
import { AuthService } from "./auth.service.js";
import { JwtStrategy } from "./strategies/jwt.strategy.js";
import { JwtAuthGuard } from "./guards/jwt-auth.guard.js";
import { RolesGuard } from "./guards/roles.guard.js";

@Module({
      imports: [
            PassportModule.register({ defaultStrategy: "jwt" }),
            JwtModule.registerAsync({
                  imports: [ConfigModule],
                  inject: [ConfigService],
                  useFactory: (config: ConfigService<EnvironmentVariables, true>) => getJwtModuleOptions(config),
            }),
      ],
      controllers: [AuthController],
      providers: [AuthService, JwtStrategy,JwtAuthGuard,RolesGuard],
      exports: [AuthService, JwtModule, PassportModule,JwtAuthGuard,RolesGuard],
})
export class AuthModule {}
