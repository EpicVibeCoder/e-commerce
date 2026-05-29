export type { OrderStatus as OrderStatusType, PaymentStatus as PaymentStatusType, PaymentProvider as PaymentProviderType, Role as RoleType, ProductStatus as ProductStatusType} from "./enums";

export interface PaginationQuery {
      page?: number;
      limit?: number;
}

export interface PaginatedResult<T> {
      data: T[];
      total: number;
      page: number;
      limit: number;
}
