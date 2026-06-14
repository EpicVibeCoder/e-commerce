import { OrderStatus } from "src/generated/prisma/enums";
import { DomainError } from "./domain-error.js";
import { OrderItem } from "./order-item.js";
import { parseMoney, sumMoney } from "./money.js";
import type { OrderLineInput, OrderPersistence } from "./types.js";

const TERMINAL_STATUSES: ReadonlySet<OrderStatus> = new Set([OrderStatus.delivered, OrderStatus.cancelled]);

const ALLOWED_TRANSITIONS: ReadonlyMap<OrderStatus, ReadonlySet<OrderStatus>> = new Map([
      [OrderStatus.pending, new Set([OrderStatus.confirmed, OrderStatus.cancelled])],
      [OrderStatus.confirmed, new Set([OrderStatus.processing, OrderStatus.cancelled])],
      [OrderStatus.processing, new Set([OrderStatus.shipped, OrderStatus.cancelled])],
      [OrderStatus.shipped, new Set([OrderStatus.delivered])],
      [OrderStatus.delivered, new Set()],
      [OrderStatus.cancelled, new Set()],
]);

export type CalculatedOrderLine = {
      productId: string;
      quantity: number;
      price: string;
      subtotal: string;
};

export type OrderTotals = {
      items: CalculatedOrderLine[];
      totalAmount: string;
};

export class Order {
      readonly id: string;
      readonly userId: string;
      readonly status: OrderStatus;
      readonly totalAmount: string;

      constructor(props: { id: string; userId: string; status: OrderStatus; totalAmount: string | number }) {
            if (!props.userId.trim()) {
                  throw new DomainError("Order userId is required");
            }
            this.id = props.id;
            this.userId = props.userId;
            this.status = props.status;
            this.totalAmount = parseMoney(props.totalAmount);
      }

      static fromPersistence(data: OrderPersistence): Order {
            return new Order(data);
      }

      static calculateTotals(lines: OrderLineInput[]): OrderTotals {
            if (lines.length === 0) {
                  throw new DomainError("Order must contain at least one line item");
            }

            const items = lines.map((line) => {
                  const item = new OrderItem({
                        productId: line.productId,
                        quantity: line.quantity,
                        price: line.unitPrice,
                  });
                  return {
                        productId: item.productId,
                        quantity: item.quantity,
                        price: item.price,
                        subtotal: item.subtotal,
                  };
            });

            return {
                  items,
                  totalAmount: sumMoney(items.map((i) => i.subtotal)),
            };
      }

      canTransitionTo(next: OrderStatus): boolean {
            if (this.status === next) {
                  return true;
            }
            if (TERMINAL_STATUSES.has(this.status)) {
                  return false;
            }
            return ALLOWED_TRANSITIONS.get(this.status)?.has(next) ?? false;
      }

      transitionTo(next: OrderStatus): Order {
            if (!this.canTransitionTo(next)) {
                  throw new DomainError(`Cannot transition order from ${this.status} to ${next}`);
            }
            return new Order({
                  id: this.id,
                  userId: this.userId,
                  status: next,
                  totalAmount: this.totalAmount,
            });
      }

      isCancellable(): boolean {
            return this.status === OrderStatus.pending || this.status === OrderStatus.confirmed || this.status === OrderStatus.processing;
      }
}
