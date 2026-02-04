/**
 * Result returned after initiating a payment intent
 */
export interface PaymentIntentResult {
      transactionId: string;
      clientSecret?: string; // For Stripe
      paymentUrl?: string; // For bKash/Redirects
      metadata?: any;
}

/**
 * Result returned after confirming or querying a payment
 */
export interface PaymentResult {
      transactionId: string;
      status: 'PENDING' | 'SUCCESS' | 'FAILED';
      intentResponse: any;
}

export interface PaymentStrategy {
      /**
       * Create a payment intent or initiate payment flow
       */
      createPaymentIntent(orderId: string, amount: number, metadata?: any): Promise<PaymentIntentResult>;

      /**
       * Confirm a payment (server-side confirmation if needed)
       */
      confirmPayment(transactionId: string, payload?: any): Promise<PaymentResult>;

      /**
       * Query payment status from the provider
       */
      queryPayment(transactionId: string): Promise<PaymentResult>;

      /**
       * Process incoming webhook event
       */
      handleWebhook(payload: any, signature?: string): Promise<PaymentResult | null>;
}
