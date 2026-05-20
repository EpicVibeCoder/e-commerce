export enum OrderStatus {
      Pending = "pending",
      Confirmed = "confirmed",
      Processing = "processing",
      Shipped = "shipped",
      Delivered = "delivered",
      Cancelled = "cancelled",
}

export enum PaymentStatus {
      Pending = "pending",
      Succeeded = "succeeded",
      Failed = "failed",
      Refunded = "refunded",
      Cancelled = "cancelled",
}

export enum PaymentProvider {
      Stripe = "stripe",
      SSLCommerz = "sslcommerz",
}

export enum Role {
      Customer = "customer",
      Admin = "admin",
      SuperAdmin = "super_admin",
}
