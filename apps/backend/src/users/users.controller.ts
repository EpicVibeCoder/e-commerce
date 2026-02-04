import { Controller, Get, Patch, Param, Body, UseGuards, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from './entities/user.entity';
import { UpdateUserDto } from './dto/update-user.dto';
import { Role } from '../generated/prisma/client';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
      constructor(private readonly usersService: UsersService) {}

      @Get('profile')
      @UseGuards(JwtAuthGuard)
      @ApiOperation({ summary: 'Get current user profile' })
      @ApiResponse({ status: 200, description: 'Return current user profile.' })
      async getProfile(@CurrentUser() user: User) {
            return user.toJSON();
      }
      /**
       * Get user's orders
       * Req 2.1.1: Users can view their own orders
       */
      @Get('orders')
      @UseGuards(JwtAuthGuard)
      @ApiOperation({ summary: 'Get current user orders' })
      @ApiResponse({ status: 200, description: 'Return list of user orders.' })
      async getUserOrders(@CurrentUser() user: User) {
            const orders = await this.usersService.getUserOrders(user.id);
            return orders.map((order) => ({
                  id: order.id,
                  userId: order.userId,
                  totalAmount: Number(order.totalAmount),
                  status: order.status,
                  items: order.items.map((item) => ({
                        id: item.id,
                        productId: item.productId,
                        product: item.product,
                        quantity: item.quantity,
                        price: Number(item.price),
                        subtotal: Number(item.subtotal),
                  })),
                  createdAt: order.createdAt,
                  updatedAt: order.updatedAt,
            }));
      }
      /**
       * Get user's payments
       * Req 2.1.1: Users can view their own payments
       */
      @Get('payments')
      @UseGuards(JwtAuthGuard)
      @ApiOperation({ summary: 'Get current user payments' })
      @ApiResponse({ status: 200, description: 'Return list of user payments.' })
      async getUserPayments(@CurrentUser() user: User) {
            const payments = await this.usersService.getUserPayments(user.id);
            return payments.map((payment) => ({
                  id: payment.id,
                  orderId: payment.orderId,
                  order: payment.order,
                  provider: payment.provider,
                  transactionId: payment.transactionId,
                  status: payment.status,
                  intentResponse: payment.intentResponse,
                  createdAt: payment.createdAt,
                  updatedAt: payment.updatedAt,
            }));
      }
      /**
       * Get user by ID (Admin only)
       * Req 2.1.1: Admin can view any user
       */
      @Get(':id')
      @UseGuards(JwtAuthGuard, RolesGuard)
      @Roles(Role.ADMIN)
      @ApiOperation({ summary: 'Get user by ID (Admin only)' })
      @ApiResponse({ status: 200, description: 'Return user profile.' })
      @ApiResponse({ status: 404, description: 'User not found.' })
      @ApiResponse({ status: 403, description: 'Forbidden. Admin access required.' })
      async getUserById(@Param('id') id: string) {
            const user = await this.usersService.findById(id);
            if (!user) {
                  throw new NotFoundException(`User with ID ${id} not found`);
            }
            return user.toJSON();
      }
      /**
       * Update user by ID
       * Admin can update any user, users can update their own profile
       * Req 2.1.1
       */
      @Patch(':id')
      @UseGuards(JwtAuthGuard)
      @ApiOperation({ summary: 'Update user profile' })
      @ApiResponse({ status: 200, description: 'User updated successfully.' })
      @ApiResponse({ status: 404, description: 'User not found.' })
      async updateUser(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto, @CurrentUser() currentUser: User) {
            const updatedUser = await this.usersService.update(id, updateUserDto, currentUser.id, currentUser.role);
            return updatedUser.toJSON();
      }
}
