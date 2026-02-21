export type { OrderStatus as OrderStatusType, PaymentStatus as PaymentStatusType, PaymentProvider as PaymentProviderType, Role as RoleType } from './enums';

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