import { ForbiddenException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Role } from "src/generated/prisma/enums";
import { RolesGuard } from "./roles.guard";

describe("RolesGuard", () => {
      const reflector = {
            getAllAndOverride: vi.fn(),
      } as unknown as Reflector;

      const guard = new RolesGuard(reflector);

      const context = (user?: { role: Role }) =>
            ({
                  getHandler: () => ({}),
                  getClass: () => ({}),
                  switchToHttp: () => ({
                        getRequest: () => ({ user }),
                  }),
            }) as never;

      it("allows when no roles metadata", () => {
            vi.spyOn(reflector, "getAllAndOverride").mockReturnValue(undefined);
            expect(guard.canActivate(context({ role: Role.customer }))).toBe(true);
      });

      it("allows admin for admin route", () => {
            vi.spyOn(reflector, "getAllAndOverride").mockReturnValue([Role.admin]);
            expect(guard.canActivate(context({ role: Role.admin }))).toBe(true);
      });

      it("forbids customer on admin route", () => {
            vi.spyOn(reflector, "getAllAndOverride").mockReturnValue([Role.admin]);
            expect(() => guard.canActivate(context({ role: Role.customer }))).toThrow(ForbiddenException);
      });

      it("allows super_admin on admin route", () => {
            vi.spyOn(reflector, "getAllAndOverride").mockReturnValue([Role.admin]);
            expect(guard.canActivate(context({ role: Role.super_admin }))).toBe(true);
      });
});
