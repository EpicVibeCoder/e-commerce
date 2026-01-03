import { OrderItem as PrismaOrderItem } from '../../generated/prisma/client';
import { Product } from '../../products/entities/product.entity';

export class OrderItem {
  constructor(
    public readonly id: string,
    public readonly orderId: string,
    public readonly productId: string,
    public readonly quantity: number,
    public readonly price: number,
    public readonly subtotal: number,
    public readonly product?: Product,
  ) {}

  /**
   * Deterministic algorithm to calculate subtotal
   * Req 2.2.3: Algorithm Requirement
   */
  static calculateSubtotal(price: number, quantity: number): number {
    return Number((price * quantity).toFixed(2));
  }

  static fromPrisma(data: PrismaOrderItem & { product?: any }): OrderItem {
    let product: Product | undefined;

    if (data.product) {
      product = Product.fromPrisma(data.product);
    }

    return new OrderItem(data.id, data.orderId, data.productId, data.quantity, Number(data.price), Number(data.subtotal), product);
  }

  toJSON(): any {
    return {
      id: this.id,
      productId: this.productId,
      quantity: this.quantity,
      price: this.price,
      subtotal: this.subtotal,
      product: this.product ? this.product.toJSON() : undefined,
    };
  }
}
