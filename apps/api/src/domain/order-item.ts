import { DomainError } from "./domain-error.js";
import { multiplyMoney, parseMoney } from "./money.js";
import type { OrderItemPersistence } from "./types.js";

export class OrderItem {
      readonly id?: string;
      readonly orderId?: string;
      readonly productId: string;
      readonly quantity: number;
      readonly price: string;
      readonly subtotal: string;

      constructor(props: { productId: string; quantity: number; price: string | number; id?: string; orderId?: string; subtotal?: string | number }) {
            if (!props.productId.trim()) {
                  throw new DomainError("Order item productId is required");
            }
            if (!Number.isInteger(props.quantity) || props.quantity <= 0) {
                  throw new DomainError(`Quantity must be a positive integer, got ${props.quantity}`);
            }

            const price = parseMoney(props.price);
            if (Number(price) <= 0) {
                  throw new DomainError("Order item unit price must be greater than zero");
            }

            const expectedSubtotal = multiplyMoney(price, props.quantity);
            const subtotal = props.subtotal !== undefined ? parseMoney(props.subtotal) : expectedSubtotal;
            if (subtotal !== expectedSubtotal) {
                  throw new DomainError(`Subtotal ${subtotal} does not match quantity × price (${expectedSubtotal})`);
            }

            this.id = props.id;
            this.orderId = props.orderId;
            this.productId = props.productId;
            this.quantity = props.quantity;
            this.price = price;
            this.subtotal = subtotal;
      }

      static fromPersistence(data: OrderItemPersistence): OrderItem {
            return new OrderItem({
                  id: data.id,
                  orderId: data.orderId,
                  productId: data.productId,
                  quantity: data.quantity,
                  price: data.price,
                  subtotal: data.subtotal,
            });
      }
}
