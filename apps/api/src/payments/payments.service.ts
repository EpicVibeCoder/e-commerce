import { BadRequestException, ForbiddenException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { OrderStatus, PaymentProvider, PaymentStatus } from "src/generated/prisma/enums";
import { PAYMENT_STRATEGIES, type CheckoutOrder, type InitiateContext, type InitiateResult, type PaymentStrategy, type WebhookResult } from "./strategies/payment-strategy.interface";
import type { CheckoutDto } from "./dto/checkout.dto";
import { PrismaService } from "src/prisma/prisma.service";
import type { IncomingHttpHeaders } from "node:http";

@Injectable()
export class PaymentsService {
      private readonly strategies = new Map<PaymentProvider, PaymentStrategy>();

      constructor(
            private readonly prisma: PrismaService,
            @Inject(PAYMENT_STRATEGIES) strategies: PaymentStrategy[],
      ) {
            for (const strategy of strategies) {
                  this.strategies.set(strategy.provider, strategy);
            }
      }

      initiate(provider: PaymentProvider, order: CheckoutOrder, ctx: InitiateContext): Promise<InitiateResult> {
            return this.getStrategy(provider).initiate(order, ctx);
      }

      handleWebhook(provider: PaymentProvider, headers: IncomingHttpHeaders, rawBody: Buffer): Promise<WebhookResult> {
            return this.getStrategy(provider).handleWebhook(headers, rawBody);
      }

      private getStrategy(provider: PaymentProvider): PaymentStrategy {
            const strategy = this.strategies.get(provider);
            if (!strategy) {
                  throw new BadRequestException(`Unsupported payment provider: ${provider}`);
            }
            return strategy;
      }
      async checkout(userId: string, dto: CheckoutDto) {
            const order = await this.prisma.order.findUnique({
                  where: { id: dto.orderId },
                  include: { payments: true },
            });
            if (!order) throw new NotFoundException("Order not found");
            if (order.userId !== userId) throw new ForbiddenException("You do not have access to this order");
            if (order.status !== OrderStatus.pending) {
                  throw new BadRequestException(`Order cannot be checked out in status: ${order.status}`);
            }
            const blocking = order.payments.find((p) => p.status === PaymentStatus.pending || p.status === PaymentStatus.succeeded);
            if (blocking) {
                  throw new BadRequestException(`Order already has a ${blocking.status} payment`);
            }
            const checkoutOrder = {
                  id: order.id,
                  userId: order.userId,
                  totalAmount: order.totalAmount.toString(),
                  status: order.status,
            };
            const result = await this.getStrategy(dto.provider).initiate(checkoutOrder, {
                  successUrl: dto.successUrl,
                  cancelUrl: dto.cancelUrl,
                  customerEmail: dto.customerEmail,
            });
            const payment = await this.prisma.payment.create({
                  data: {
                        orderId: order.id,
                        provider: dto.provider,
                        transactionId: result.transactionId,
                        status: PaymentStatus.pending,
                  },
            });
            return {
                  paymentId: payment.id,
                  orderId: order.id,
                  ...result,
            };
      }
}
