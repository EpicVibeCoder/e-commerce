import { UseGuards } from "@nestjs/common";
import { Query, Resolver } from "@nestjs/graphql";
import { GqlAuthGuard } from "src/auth/guards/gql-auth.guard";
import { CurrentUser } from "src/auth/decorators/current-user.decorator";
import type { JwtPayload } from "src/auth/types/jwt-payload";
import { UsersService } from "src/users/users.service";
import { OrderType } from "./types/order.type";

@Resolver(() => OrderType)
export class OrdersResolver {
      constructor(private readonly usersService: UsersService) {}

      @Query(() => [OrderType], { name: "myOrders" })
      @UseGuards(GqlAuthGuard)
      myOrders(@CurrentUser() user: JwtPayload) {
            return this.usersService.getMyOrders(user.sub);
      }
}
