import type { OrderStatus, PaymentProvider, PaymentStatus, ProductStatus, Role } from "../generated/prisma/enums.js";

export type UserPersistence = {
      id: string;
      email: string;
      role: Role;
      name?: string | null;
      avatar?: string | null;
};

export type ProductPersistence = {
      id: string;
      name: string;
      sku: string;
      price: string | number;
      stock: number;
      status: ProductStatus;
      categoryId: string;
};

export type OrderPersistence = {
      id: string;
      userId: string;
      status: OrderStatus;
      totalAmount: string | number;
};

export type OrderItemPersistence = {
      id?: string;
      orderId?: string;
      productId: string;
      quantity: number;
      price: string | number;
      subtotal?: string | number;
};

export type PaymentPersistence = {
      id: string;
      orderId: string;
      provider: PaymentProvider;
      transactionId: string;
      status: PaymentStatus;
};

export type OrderLineInput = {
      productId: string;
      quantity: number;
      unitPrice: string | number;
};
