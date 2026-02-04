import { Order as PrismaOrder, OrderStatus } from '../../generated/prisma/client';
import { OrderItem } from './order-item.entity';

export class Order {
      constructor(
            public readonly id: string,
            public readonly userId: string,
            public readonly totalAmount: number,
            public readonly status: OrderStatus,
            public readonly createdAt: Date,
            public readonly updatedAt: Date,
            public readonly items: OrderItem[] = [],
      ) {}

      /**
       * Deterministic algorithm to calculate total from items
       * Req 2.2.3: Algorithm Requirement
       */
      static calculateTotal(items: { subtotal: number }[]): number {
            const total = items.reduce((sum, item) => sum + item.subtotal, 0);
            return Number(total.toFixed(2));
      }

      static fromPrisma(data: PrismaOrder & { items?: any[] }): Order {
            let items: OrderItem[] = [];

            if (data.items && Array.isArray(data.items)) {
                  items = data.items.map((item) => OrderItem.fromPrisma(item));
            }

            return new Order(data.id, data.userId, Number(data.totalAmount), data.status, data.createdAt, data.updatedAt, items);
      }

      /**
       * Req 2.2.1: OOP Requirement - Logic Methods
       */
      isPending(): boolean {
            return this.status === OrderStatus.PENDING;
      }

      isPaid(): boolean {
            return this.status === OrderStatus.PAID;
      }

      isCanceled(): boolean {
            return this.status === OrderStatus.CANCELED;
      }

      canBeCanceled(): boolean {
            return this.isPending();
      }

      toJSON(): any {
            return {
                  id: this.id,
                  userId: this.userId,
                  totalAmount: this.totalAmount,
                  status: this.status,
                  items: this.items.map((item) => item.toJSON()),
                  createdAt: this.createdAt,
                  updatedAt: this.updatedAt,
            };
      }
}
