import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import type { JwtPayload } from "../types/jwt-payload.js";
import { GqlExecutionContext } from "@nestjs/graphql";

export const CurrentUser = createParamDecorator((_data: unknown, ctx: ExecutionContext): JwtPayload => {
      if (ctx.getType<"graphql">() === "graphql") {
            return GqlExecutionContext.create(ctx).getContext().req.user;
      }
      return ctx.switchToHttp().getRequest<{ user: JwtPayload }>().user;
});
