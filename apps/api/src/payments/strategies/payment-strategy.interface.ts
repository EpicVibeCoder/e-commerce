import type { IncomingHttpHeaders } from "node:http";
import { PaymentProvider, PaymentStatus } from "src/generated/prisma/enums";

export type CheckoutOrder = {
      id: string;
      userId: string;
      totalAmount: string;
      status: string;
};

export type InitiateContext = {
      successUrl: string;
      cancelUrl: string;
      customerEmail?: string;
};

export type InitiateResult = {
      provider: PaymentProvider;
      transactionId: string;
      /** Stripe PaymentIntent / Checkout Session client secret */
      clientSecret?: string;
      /** SSLCommerz (or Stripe Checkout) redirect */
      redirectUrl?: string;
};

export type WebhookResult = {
      provider: PaymentProvider;
      transactionId: string;
      orderId: string;
      status: PaymentStatus;
      raw?: unknown;
};

export interface PaymentStrategy {
      readonly provider: PaymentProvider;
      initiate(order: CheckoutOrder, ctx: InitiateContext): Promise<InitiateResult>;
      handleWebhook(headers: IncomingHttpHeaders, rawBody: Buffer): Promise<WebhookResult>;
}

export const PAYMENT_STRATEGIES = Symbol("PAYMENT_STRATEGIES");
