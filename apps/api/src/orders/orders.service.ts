import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "src/generated/prisma/client";
import { OrderStatus, ProductStatus } from "src/generated/prisma/enums";
import { Order } from "src/domain/order";
import { DomainError } from "src/domain/domain-error";
import { PrismaService } from "src/prisma/prisma.service";
import type { CreateOrderDto } from "./dto/create-order.dto";

@Injectable()
export class OrdersService {
      constructor(private readonly prisma: PrismaService) {}

      async create(userId: string, dto: CreateOrderDto) {
            // Merge duplicate productIds (same product twice → one line)
            const quantityByProductId = new Map<string, number>();
            for (const item of dto.items) {
                  quantityByProductId.set(item.productId, (quantityByProductId.get(item.productId) ?? 0) + item.quantity);
            }
            const productIds = [...quantityByProductId.keys()];

            return this.prisma.$transaction(async (tx) => {
                  const products = await tx.product.findMany({
                        where: { id: { in: productIds } },
                  });

                  if (products.length !== productIds.length) {
                        const found = new Set(products.map((p) => p.id));
                        const missing = productIds.filter((id) => !found.has(id));
                        throw new NotFoundException(`Product(s) not found: ${missing.join(", ")}`);
                  }

                  const lines: { productId: string; quantity: number; unitPrice: string }[] = [];

                  for (const product of products) {
                        const quantity = quantityByProductId.get(product.id)!;

                        if (product.status !== ProductStatus.active) {
                              throw new BadRequestException(`Product "${product.name}" is not available`);
                        }
                        if (product.stock < quantity) {
                              throw new BadRequestException(`Insufficient stock for "${product.name}" (requested ${quantity}, available ${product.stock})`);
                        }

                        lines.push({
                              productId: product.id,
                              quantity,
                              unitPrice: product.price.toString(), // snapshot from DB — never trust client
                        });
                  }

                  let totals;
                  try {
                        totals = Order.calculateTotals(lines);
                  } catch (err) {
                        if (err instanceof DomainError) throw new BadRequestException(err.message);
                        throw err;
                  }

                  const order = await tx.order.create({
                        data: {
                              userId,
                              status: OrderStatus.pending,
                              totalAmount: new Prisma.Decimal(totals.totalAmount),
                              items: {
                                    create: totals.items.map((item) => ({
                                          productId: item.productId,
                                          quantity: item.quantity,
                                          price: new Prisma.Decimal(item.price),
                                          subtotal: new Prisma.Decimal(item.subtotal),
                                    })),
                              },
                        },
                        include: { items: true },
                  });

                  return this.toResponse(order);
            });
      }

      private toResponse(order: {
            id: string;
            userId: string;
            status: OrderStatus;
            totalAmount: Prisma.Decimal;
            createdAt: Date;
            updatedAt: Date;
            items: Array<{
                  id: string;
                  productId: string;
                  quantity: number;
                  price: Prisma.Decimal;
                  subtotal: Prisma.Decimal;
            }>;
      }) {
            return {
                  id: order.id,
                  userId: order.userId,
                  status: order.status,
                  totalAmount: order.totalAmount.toString(),
                  createdAt: order.createdAt,
                  updatedAt: order.updatedAt,
                  items: order.items.map((item) => ({
                        id: item.id,
                        productId: item.productId,
                        quantity: item.quantity,
                        price: item.price.toString(),
                        subtotal: item.subtotal.toString(),
                  })),
            };
      }
}
