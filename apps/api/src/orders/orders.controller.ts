import { Body, Controller, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "src/auth/guards/jwt-auth.guard";
import { EmailVerifiedGuard } from "src/auth/guards/email-verified.guard";
import { CurrentUser } from "src/auth/decorators/current-user.decorator";
import type { JwtPayload } from "src/auth/types/jwt-payload";
import { OrdersService } from "./orders.service";
import { CreateOrderDto } from "./dto/create-order.dto";

@ApiTags("orders")
@ApiBearerAuth("access-token")
@Controller("orders")
export class OrdersController {
      constructor(private readonly ordersService: OrdersService) {}

      @Post()
      @UseGuards(JwtAuthGuard, EmailVerifiedGuard)
      @ApiOperation({ summary: "Create an order (email verified required)" })
      create(@CurrentUser() user: JwtPayload, @Body() dto: CreateOrderDto) {
            return this.ordersService.create(user.sub, dto);
      }

      @Get(":id")
      @UseGuards(JwtAuthGuard, EmailVerifiedGuard)
      @ApiOperation({ summary: "Get an order (email verified required)" })
      findOne(@CurrentUser() user: JwtPayload, @Param("id") id: string) {
            return this.ordersService.findOne(user.sub, id);
      }

      @Patch(":id/cancel")
      @UseGuards(JwtAuthGuard, EmailVerifiedGuard)
      @ApiOperation({ summary: "Cancel an order (email verified required)" })
      cancel(@CurrentUser() user: JwtPayload, @Param("id") id: string) {
            return this.ordersService.cancel(user.sub, id);
      }
}
