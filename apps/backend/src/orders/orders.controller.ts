import { Controller, Post, Get, Patch, Body, Param, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiBody } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../generated/prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@ApiTags('Orders')
@ApiBearerAuth()
@Controller('orders')
export class OrdersController {
      constructor(private readonly ordersService: OrdersService) {}

      @Post()
      @UseGuards(JwtAuthGuard)
      @ApiOperation({ summary: 'Create a new order' })
      @ApiResponse({ status: 201, description: 'Order created successfully.' })
      @ApiResponse({ status: 400, description: 'Bad Request.' })
      @HttpCode(HttpStatus.CREATED)
      async create(@CurrentUser() user: User, @Body() createOrderDto: CreateOrderDto) {
            const order = await this.ordersService.create(user.id, createOrderDto);
            return order.toJSON();
      }

      @Get()
      @UseGuards(JwtAuthGuard)
      @ApiOperation({ summary: 'Get all orders for current user' })
      @ApiResponse({ status: 200, description: 'Return list of orders.' })
      async findAll(@CurrentUser() user: User) {
            const orders = await this.ordersService.findAll(user.id);
            return orders.map((order) => order.toJSON());
      }

      @Get(':id')
      @UseGuards(JwtAuthGuard, RolesGuard)
      @Roles(Role.ADMIN)
      @ApiOperation({ summary: 'Get order by ID (Admin only)' })
      @ApiResponse({ status: 200, description: 'Return order details.' })
      @ApiResponse({ status: 404, description: 'Order not found.' })
      @ApiResponse({ status: 403, description: 'Forbidden. Admin access required.' })
      async findOne(@Param('id') id: string, @CurrentUser() user: User) {
            // Only admins can access this endpoint
            const order = await this.ordersService.findOne(id, undefined);
            return order.toJSON();
      }

      @Patch(':id/cancel')
      @UseGuards(JwtAuthGuard)
      @ApiOperation({ summary: 'Cancel order' })
      @ApiResponse({ status: 200, description: 'Order canceled successfully.' })
      @ApiResponse({ status: 404, description: 'Order not found.' })
      @ApiResponse({ status: 400, description: 'Order cannot be canceled.' })
      async cancel(@CurrentUser() user: User, @Param('id') id: string) {
            const order = await this.ordersService.cancel(user.id, id);
            return order.toJSON();
      }
}
