import { Controller, Get, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "src/auth/guards/jwt-auth.guard";
import { UsersService } from "./users.service";
import { CurrentUser } from "src/auth/decorators/current-user.decorator";
import type { JwtPayload } from "src/auth/types/jwt-payload";

@ApiTags("users")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("users")
export class UsersController {
      constructor(private readonly usersService: UsersService) {}

      @Get("me")
      me(@CurrentUser() user: JwtPayload) {
            return this.usersService.getMe(user.sub);
      }
      @Get("me/orders")
      myOrders(@CurrentUser() user: JwtPayload) {
            return this.usersService.getMyOrders(user.sub);
      }
      @Get("me/payments")
      myPayments(@CurrentUser() user: JwtPayload) {
            return this.usersService.getMyPayments(user.sub);
      }
}
