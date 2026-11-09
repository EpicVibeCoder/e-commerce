import { Injectable } from "@nestjs/common";
import { PaymentProvider, PaymentStatus } from "src/generated/prisma/enums";
import type { IncomingHttpHeaders } from "node:http";
import type { CheckoutOrder, InitiateContext, InitiateResult, PaymentStrategy, WebhookResult } from "./payment-strategy.interface.js";

@Injectable()
export class SslcommerzPaymentStrategy implements PaymentStrategy {
      readonly provider = PaymentProvider.sslcommerz;

      async initiate(order: CheckoutOrder, ctx: InitiateContext): Promise<InitiateResult> {
            return {
                  provider: this.provider,
                  transactionId: `ssl_stub_${order.id}`,
                  redirectUrl: ctx.successUrl,
            };
      }

      async handleWebhook(_headers: IncomingHttpHeaders, _rawBody: Buffer): Promise<WebhookResult> {
            return {
                  provider: this.provider,
                  transactionId: "ssl_stub_txn",
                  orderId: "unknown",
                  status: PaymentStatus.succeeded,
            };
      }
}
