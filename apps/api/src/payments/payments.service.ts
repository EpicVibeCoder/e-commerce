import { BadRequestException, Inject, Injectable } from "@nestjs/common";
import { PaymentProvider } from "src/generated/prisma/enums";
import { PAYMENT_STRATEGIES, type CheckoutOrder, type InitiateContext, type InitiateResult, type PaymentStrategy, type WebhookResult } from "./strategies/payment-strategy.interface";
import type { IncomingHttpHeaders } from "node:http";

@Injectable()
export class PaymentsService {
      private readonly strategies = new Map<PaymentProvider, PaymentStrategy>();

      constructor(@Inject(PAYMENT_STRATEGIES) strategies: PaymentStrategy[]) {
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
}
