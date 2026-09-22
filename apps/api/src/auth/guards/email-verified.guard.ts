import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service.js";
import type { JwtPayload } from "../types/jwt-payload.js";

@Injectable()
export class EmailVerifiedGuard implements CanActivate {
      constructor(private readonly prisma: PrismaService) {}

      async canActivate(context: ExecutionContext): Promise<boolean> {
            const { user } = context.switchToHttp().getRequest<{ user?: JwtPayload }>();

            if (!user?.sub) {
                  throw new ForbiddenException("Email verification required to perform this action");
            }

            const record = await this.prisma.user.findUnique({
                  where: { id: user.sub },
                  select: { emailVerifiedAt: true },
            });

            if (!record?.emailVerifiedAt) {
                  throw new ForbiddenException("Email verification required to perform this action");
            }

            return true;
      }
}
