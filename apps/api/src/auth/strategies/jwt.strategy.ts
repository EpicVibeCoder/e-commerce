import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import type { EnvironmentVariables } from "src/config/env.validation";
import type { JwtPayload } from "../types/jwt-payload.js";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
      constructor(config: ConfigService<EnvironmentVariables, true>) {
            super({
                  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
                  ignoreExpiration: false,
                  secretOrKey: config.get("JWT_SECRET", { infer: true }),
            });
      }

      validate(payload: JwtPayload): JwtPayload {
            return payload;
      }
}
