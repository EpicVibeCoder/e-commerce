import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { ProductsService } from '../products/products.service';
import { OrderStatus, Prisma } from '../generated/prisma/client';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly productsService: ProductsService,
  ) {}

  async create(userId: string, createOrderDto: CreateOrderDto): Promise<Order> {
    const { items } = createOrderDto;

    // 1. Fetch all products to validate existence and price
    const productIds = items.map((item) => item.productId);
    const uniqueProductIds = [...new Set(productIds)];

    const products = await this.prisma.product.findMany({
      where: { id: { in: uniqueProductIds } },
    });

    if (products.length !== uniqueProductIds.length) {
      throw new NotFoundException('One or more products not found');
    }

    // Map for quick lookup
    const productMap = new Map(products.map((p) => [p.id, p]));

    // 2. Calculate totals and prepare order items data purely for DB insertion
    const orderItemsData: { productId: string; quantity: number; price: number; subtotal: number }[] = [];

    for (const item of items) {
      const product = productMap.get(item.productId);

      if (!product) {
        throw new NotFoundException(`Product with ID ${item.productId} not found`);
      }

      // Stock check
      if (product.stock < item.quantity) {
        throw new BadRequestException(`Insufficient stock for product ${product.name}`);
      }

      const price = Number(product.price);

      // Req 2.2.3: Use OrderItem class for deterministic calculation
      const subtotal = OrderItem.calculateSubtotal(price, item.quantity);

      orderItemsData.push({
        productId: item.productId,
        quantity: item.quantity,
        price: price,
        subtotal: subtotal,
      });
    }

    // Req 2.2.3: Use Order class for deterministic calculation
    const totalAmount = Order.calculateTotal(orderItemsData);

    // 3. Create Order and OrderItems in a transaction
    const createdOrder = await this.prisma.$transaction(async (prisma) => {
      return prisma.order.create({
        data: {
          userId,
          totalAmount,
          status: OrderStatus.PENDING,
          items: {
            create: orderItemsData.map((d) => ({
              product: { connect: { id: d.productId } },
              quantity: d.quantity,
              price: d.price,
              subtotal: d.subtotal,
            })),
          },
        },
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      });
    });

    return Order.fromPrisma(createdOrder);
  }

  async findAll(userId: string): Promise<Order[]> {
    const orders = await this.prisma.order.findMany({
      where: { userId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return orders.map((o) => Order.fromPrisma(o));
  }

  async findOne(id: string, userId?: string): Promise<Order> {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    if (userId && order.userId !== userId) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    return Order.fromPrisma(order);
  }

  async cancel(userId: string, id: string): Promise<Order> {
    const orderData = await this.prisma.order.findUnique({
      where: { id },
      include: { items: true }, // Include items to construct Entity correctly
    });

    if (!orderData || orderData.userId !== userId) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    const orderEntity = Order.fromPrisma(orderData);

    // Req 2.2.1: Use OOP method
    if (!orderEntity.canBeCanceled()) {
      throw new BadRequestException('Only pending orders can be canceled');
    }

    const updatedOrder = await this.prisma.order.update({
      where: { id },
      data: { status: OrderStatus.CANCELED },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    return Order.fromPrisma(updatedOrder);
  }

  /**
   * Req 2.1.6: Mark as Paid and Reduce Stock (Transactional)
   */
  async markAsPaid(id: string): Promise<Order> {
    return this.prisma.$transaction(async (prisma) => {
      const orderData = await prisma.order.findUnique({
        where: { id },
        include: { items: true },
      });

      if (!orderData) {
        throw new NotFoundException(`Order with ID ${id} not found`);
      }

      const orderEntity = Order.fromPrisma(orderData);

      if (orderEntity.isPaid()) {
        return orderEntity; // Already paid
      }

      // Req 2.2.3: Safe stock reduction algorithm
      for (const item of orderEntity.items) {
        await prisma.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              decrement: item.quantity,
            },
          },
        });
      }

      // Update Order Status
      const updatedOrder = await prisma.order.update({
        where: { id },
        data: { status: OrderStatus.PAID },
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      });

      return Order.fromPrisma(updatedOrder);
    });
  }
}
