import type { Role } from "../../generated/prisma/enums.js";

export type JwtPayload = {
      sub: string;
      email: string;
      role: Role;
};
