// Enums
export enum Role {
    CUSTOMER = 'CUSTOMER',
    ADMIN = 'ADMIN',
  }
  
  export enum ProductStatus {
    ACTIVE = 'ACTIVE',
    INACTIVE = 'INACTIVE',
  }
  
  export enum OrderStatus {
    PENDING = 'PENDING',
    PAID = 'PAID',
    CANCELED = 'CANCELED',
  }
  
  export enum PaymentProvider {
    STRIPE = 'STRIPE',
    BKASH = 'BKASH',
  }
  
  export enum PaymentStatus {
    PENDING = 'PENDING',
    SUCCESS = 'SUCCESS',
    FAILED = 'FAILED',
  }
  
  // User Types
  export interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: Role;
    isActive: boolean;
    createdAt: Date | string;
    updatedAt: Date | string;
  }
  
  // Category Types
  export interface Category {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    parentId: string | null;
    createdAt: Date | string;
    updatedAt: Date | string;
    children?: Category[];
  }
  
  // Product Types
  export interface Product {
    id: string;
    name: string;
    sku: string;
    description: string | null;
    price: number;
    stock: number;
    status: ProductStatus;
    categoryId: string;
    createdAt: Date | string;
    updatedAt: Date | string;
    category?: {
      id: string;
      name: string;
      slug: string;
    };
  }
  
  // Order Types
  export interface OrderItem {
    id: string;
    orderId: string;
    productId: string;
    quantity: number;
    price: number;
    subtotal: number;
    product?: Product;
  }
  
  export interface Order {
    id: string;
    userId: string;
    totalAmount: number;
    status: OrderStatus;
    createdAt: Date | string;
    updatedAt: Date | string;
    items: OrderItem[];
  }
  
  // Payment Types
  export interface Payment {
    id: string;
    orderId: string;
    provider: PaymentProvider;
    transactionId: string;
    status: PaymentStatus;
    intentResponse?: any;
    createdAt: Date | string;
    updatedAt: Date | string;
  }
  
  // API Request/Response Types
  export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    message?: string;
    error?: string;
  }
  
  export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }
  
  // Auth Types
  export interface LoginRequest {
    email: string;
    password: string;
  }
  
  export interface RegisterRequest {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }
  
  export interface AuthResponse {
    user: User;
    token: string;
  }
  
  // Product Request Types
  export interface CreateProductRequest {
    name: string;
    sku: string;
    description?: string;
    price: number;
    stock: number;
    categoryId: string;
  }
  
  export interface UpdateProductRequest {
    name?: string;
    description?: string;
    price?: number;
    stock?: number;
    status?: ProductStatus;
    categoryId?: string;
  }
  
  // Category Request Types
  export interface CreateCategoryRequest {
    name: string;
    slug: string;
    description?: string;
    parentId?: string;
  }
  
  export interface UpdateCategoryRequest {
    name?: string;
    slug?: string;
    description?: string;
    parentId?: string;
  }
  
  // Order Request Types
  export interface CreateOrderRequest {
    items: {
      productId: string;
      quantity: number;
    }[];
  }
  
  // Payment Request Types
  export interface InitiatePaymentRequest {
    orderId: string;
    provider: PaymentProvider;
  }