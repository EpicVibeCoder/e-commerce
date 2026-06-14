import type { Role } from "src/generated/prisma/enums";

export type JwtPayload = {
      sub: string;
      email: string;
      role: Role;
};
