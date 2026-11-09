import { Injectable } from "@nestjs/common";
import { PaymentProvider, PaymentStatus } from "src/generated/prisma/enums";
import type { IncomingHttpHeaders } from "node:http";
import type { CheckoutOrder, InitiateContext, InitiateResult, PaymentStrategy, WebhookResult } from "./payment-strategy.interface";

@Injectable()
export class StripePaymentStrategy implements PaymentStrategy {
      readonly provider = PaymentProvider.stripe;

      async initiate(order: CheckoutOrder, _ctx: InitiateContext): Promise<InitiateResult> {
            return {
                  provider: this.provider,
                  transactionId: `stripe_stub_${order.id}`,
                  clientSecret: `secret_stub_${order.id}`,
            };
      }

      async handleWebhook(_headers: IncomingHttpHeaders, _rawBody: Buffer): Promise<WebhookResult> {
            return {
                  provider: this.provider,
                  transactionId: "stripe_stub_txn",
                  orderId: "unknown",
                  status: PaymentStatus.succeeded,
            };
      }
}
