import { Controller, Get, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { UsersService } from "./users.service";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import type { JwtPayload } from "../auth/types/jwt-payload";

@ApiTags("users")
@ApiBearerAuth("access-token")
@UseGuards(JwtAuthGuard)
@Controller("users")
export class UsersController {
      constructor(private readonly usersService: UsersService) {}

      @Get("me")
      @ApiOperation({ summary: "Get the current user", description: "Get the current user's information" })
      me(@CurrentUser() user: JwtPayload) {
            return this.usersService.getMe(user.sub);
      }
      @Get("me/orders")
      @ApiOperation({ summary: "Get the current user's orders", description: "Get the current user's orders" })
      myOrders(@CurrentUser() user: JwtPayload) {
            return this.usersService.getMyOrders(user.sub);
      }
      @Get("me/payments")
      @ApiOperation({ summary: "Get the current user's payments", description: "Get the current user's payments" })
      myPayments(@CurrentUser() user: JwtPayload) {
            return this.usersService.getMyPayments(user.sub);
      }
}
