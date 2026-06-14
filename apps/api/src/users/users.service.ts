import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { User } from "src/domain/user";

@Injectable()
export class UsersService {
      constructor(private readonly prisma: PrismaService) {}

      async getMe(userId: string) {
            const record = await this.prisma.user.findUnique({ where: { id: userId } });
            if (!record) throw new NotFoundException();
            const user = User.fromPersistence(record);
            return this.toPublicUser(user);
      }

      async getMyPayments(userId: string) {
            const payments = await this.prisma.payment.findMany({
                  where: { order: { userId } },
                  orderBy: { createdAt: "desc" },
            });
            return payments.map((payment) => ({
                  id: payment.id,
                  orderId: payment.orderId,
                  provider: payment.provider,
                  transactionId: payment.transactionId,
                  status: payment.status,
                  createdAt: payment.createdAt,
            }));
      }
      async getMyOrders(userId: string) {
            const orders = await this.prisma.order.findMany({
                  where: { userId },
                  orderBy: { createdAt: "desc" },
                  include: { items: true },
            });

            return orders.map((order) => ({
                  id: order.id,
                  status: order.status,
                  totalAmount: order.totalAmount.toString(),
                  createdAt: order.createdAt,
                  items: order.items.map((item) => ({
                        id: item.id,
                        productId: item.productId,
                        quantity: item.quantity,
                        price: item.price.toString(),
                        subtotal: item.subtotal.toString(),
                  })),
            }));
      }
      private toPublicUser(user: User) {
            return {
                  id: user.id,
                  email: user.email,
                  role: user.role,
                  name: user.name ?? null,
                  avatar: user.avatar ?? null,
            };
      }
}
