import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { User } from './entities/user.entity';
import * as bcrypt from 'bcrypt';
import { UpdateUserDto } from './dto/update-user.dto';
import { ForbiddenException } from '@nestjs/common';

@Injectable()
export class UsersService {
      constructor(private readonly prisma: PrismaService) {}

      async create(email: string, password: string, firstName: string, lastName: string): Promise<User> {
            // Check if user exists
            const existingUser = await this.prisma.user.findUnique({
                  where: { email },
            });

            if (existingUser) {
                  throw new ConflictException('User with this email already exists');
            }

            // Hash password
            const hashedPassword = await bcrypt.hash(password, 10);

            // Create user
            const prismaUser = await this.prisma.user.create({
                  data: {
                        email,
                        password: hashedPassword,
                        firstName,
                        lastName,
                  },
            });

            return User.fromPrisma(prismaUser);
      }

      async findByEmail(email: string): Promise<User | null> {
            const prismaUser = await this.prisma.user.findUnique({
                  where: { email },
            });

            if (!prismaUser) {
                  return null;
            }

            return User.fromPrisma(prismaUser);
      }

      async findById(id: string): Promise<User | null> {
            const prismaUser = await this.prisma.user.findUnique({
                  where: { id },
            });

            if (!prismaUser) {
                  return null;
            }

            return User.fromPrisma(prismaUser);
      }

      async validatePassword(user: User, password: string): Promise<boolean> {
            const prismaUser = await this.prisma.user.findUnique({
                  where: { id: user.id },
                  select: { password: true },
            });

            if (!prismaUser) {
                  return false;
            }

            return bcrypt.compare(password, prismaUser.password);
      }
      /**
       * Get user's orders (simple query, no Orders module required)
       * Req 2.1.1: Users can view their own orders
       */
      async getUserOrders(userId: string) {
            return this.prisma.order.findMany({
                  where: { userId },
                  include: {
                        items: {
                              include: {
                                    product: {
                                          select: {
                                                id: true,
                                                name: true,
                                                sku: true,
                                          },
                                    },
                              },
                        },
                  },
                  orderBy: {
                        createdAt: 'desc',
                  },
            });
      }
      /**
       * Get user's payments (simple query, no Payments module required)
       * Req 2.1.1: Users can view their own payments
       */
      async getUserPayments(userId: string) {
            // Get all orders for the user first
            const orders = await this.prisma.order.findMany({
                  where: { userId },
                  select: { id: true },
            });

            const orderIds = orders.map((order) => order.id);

            if (orderIds.length === 0) {
                  return [];
            }

            return this.prisma.payment.findMany({
                  where: {
                        orderId: {
                              in: orderIds,
                        },
                  },
                  include: {
                        order: {
                              select: {
                                    id: true,
                                    totalAmount: true,
                                    status: true,
                              },
                        },
                  },
                  orderBy: {
                        createdAt: 'desc',
                  },
            });
      }
      /**
       * Update user by ID
       * Admin can update any user, users can update their own profile
       */
      async update(id: string, updateUserDto: UpdateUserDto, currentUserId: string, currentUserRole: string): Promise<User> {
            const user = await this.findById(id);

            if (!user) {
                  throw new NotFoundException(`User with ID ${id} not found`);
            }

            // Check authorization: Admin can update anyone, users can only update themselves
            if (currentUserRole !== 'ADMIN' && currentUserId !== id) {
                  throw new ForbiddenException('You can only update your own profile');
            }

            const updatedUser = await this.prisma.user.update({
                  where: { id },
                  data: {
                        ...(updateUserDto.firstName && { firstName: updateUserDto.firstName }),
                        ...(updateUserDto.lastName && { lastName: updateUserDto.lastName }),
                  },
            });

            return User.fromPrisma(updatedUser);
      }
}
