import { ConfigService } from "@nestjs/config";
import type { JwtModuleOptions } from "@nestjs/jwt";
import type { EnvironmentVariables } from "./env.validation.js";

export function getJwtModuleOptions(config: ConfigService<EnvironmentVariables, true>): JwtModuleOptions {
      return {
            secret: config.get("JWT_SECRET", { infer: true }),
            signOptions: {
                  expiresIn: config.get("JWT_EXPIRATION", { infer: true }),
            },
      };
}
