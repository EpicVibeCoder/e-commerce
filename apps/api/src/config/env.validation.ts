import { plainToInstance, Type } from "class-transformer";
import { assertRequiredEnv, isUnset } from "@repo/shared";
import { IsEnum, IsInt, IsNotEmpty, IsString, Matches, Max, Min, MinLength, ValidateIf, validateSync } from "class-validator";

export enum NodeEnv {
      Development = "development",
      Production = "production",
      Test = "test",
}

export class EnvironmentVariables {
      @IsEnum(NodeEnv)
      APP_ENV!: NodeEnv;

      @Type(() => Number)
      @IsInt()
      @Min(1)
      @Max(65535)
      PORT!: number;

      @IsString()
      @IsNotEmpty()
      DATABASE_URL!: string;

      @IsString()
      @IsNotEmpty()
      CORS_ORIGINS!: string;

      @ValidateIf((_, value) => !isUnset(value))
      @IsString()
      @Matches(/^redis(s)?:\/\/.+/, {
            message: "REDIS_URL must be a redis:// or rediss:// connection string",
      })
      REDIS_URL?: string;

      @ValidateIf((o: EnvironmentVariables) => o.APP_ENV === NodeEnv.Production)
      @IsString()
      @IsNotEmpty()
      @MinLength(32)
      JWT_SECRET?: string;
}

export function validateEnv(config: Record<string, unknown>) {
      assertRequiredEnv(config);

      const validated = plainToInstance(EnvironmentVariables, config, {
            enableImplicitConversion: true,
      });

      const errors = validateSync(validated, {
            skipMissingProperties: false,
            forbidUnknownValues: false,
      });

      if (errors.length > 0) {
            const messages = errors.flatMap((e) => Object.values(e.constraints ?? {}));
            throw new Error(`Environment validation failed:\n${messages.join("\n")}`);
      }

      return validated;
}
