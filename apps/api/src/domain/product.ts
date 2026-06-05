import { ProductStatus } from '../generated/prisma/enums.js';
import { DomainError } from './domain-error.js';
import { parseMoney } from './money.js';
import type { ProductPersistence } from './types.js';

export class Product {
  readonly id: string;
  readonly name: string;
  readonly sku: string;
  readonly price: string;
  readonly stock: number;
  readonly status: ProductStatus;
  readonly categoryId: string;

  constructor(props: {
    id: string;
    name: string;
    sku: string;
    price: string | number;
    stock: number;
    status: ProductStatus;
    categoryId: string;
  }) {
    if (!props.name.trim()) {
      throw new DomainError('Product name is required');
    }
    if (!props.sku.trim()) {
      throw new DomainError('Product SKU is required');
    }
    if (!props.categoryId.trim()) {
      throw new DomainError('Product categoryId is required');
    }

    const price = parseMoney(props.price);
    if (Number(price) <= 0) {
      throw new DomainError('Product price must be greater than zero');
    }
    if (!Number.isInteger(props.stock) || props.stock < 0) {
      throw new DomainError(
        `Stock must be a non-negative integer, got ${props.stock}`,
      );
    }

    this.id = props.id;
    this.name = props.name.trim();
    this.sku = props.sku.trim();
    this.price = price;
    this.stock = props.stock;
    this.status = props.status;
    this.categoryId = props.categoryId;
  }

  static fromPersistence(data: ProductPersistence): Product {
    return new Product(data);
  }

  isActive(): boolean {
    return this.status === ProductStatus.active;
  }

  canFulfillQuantity(quantity: number): boolean {
    return (
      Number.isInteger(quantity) &&
      quantity > 0 &&
      this.isActive() &&
      this.stock >= quantity
    );
  }

  assertCanPurchase(quantity: number): void {
    if (!this.isActive()) {
      throw new DomainError(
        `Product ${this.sku} is not available for purchase`,
      );
    }
    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw new DomainError(
        `Quantity must be a positive integer, got ${quantity}`,
      );
    }
    if (this.stock < quantity) {
      throw new DomainError(
        `Insufficient stock for ${this.sku}: requested ${quantity}, available ${this.stock}`,
      );
    }
  }
}
