import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Role } from "src/generated/prisma/enums";
import type { JwtPayload } from "../types/jwt-payload.js";
import { ROLES_KEY } from "../decorators/roles.decorator.js";

@Injectable()
export class RolesGuard implements CanActivate {
      constructor(private readonly reflector: Reflector) {}

      canActivate(context: ExecutionContext): boolean {
            const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
                  context.getHandler(),
                  context.getClass(),
            ]);

            if (!requiredRoles?.length) {
                  return true;
            }

            const { user } = context.switchToHttp().getRequest<{ user?: JwtPayload }>();

            if (!user) {
                  throw new ForbiddenException("Insufficient permissions");
            }

            if (user.role === Role.super_admin) {
                  return true;
            }

            if (!requiredRoles.includes(user.role)) {
                  throw new ForbiddenException("Insufficient permissions");
            }

            return true;
      }
}