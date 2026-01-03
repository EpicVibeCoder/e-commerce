import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { PaymentIntentResult, PaymentResult, PaymentStrategy } from './payment-strategy.interface';

@Injectable()
export class StripeStrategy implements PaymentStrategy {
  private stripe: Stripe;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    if (!apiKey) {
      throw new Error('STRIPE_SECRET_KEY is not defined in environment variables');
    }
    this.stripe = new Stripe(apiKey, {
      apiVersion: '2024-12-18.acacia' as any,
    });
  }

  async createPaymentIntent(
    orderId: string,
    amount: number, // Amount in USD (or base currency)
    metadata?: any,
  ): Promise<PaymentIntentResult> {
    try {
      // Stripe expects amount in cents for USD
      const amountInCents = Math.round(amount * 100);

      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: amountInCents,
        currency: 'usd',
        metadata: {
          orderId,
          ...metadata,
        },
        automatic_payment_methods: {
          enabled: true,
        },
      });

      return {
        transactionId: paymentIntent.id,
        clientSecret: paymentIntent.client_secret || undefined,
      };
    } catch (error) {
      throw new InternalServerErrorException(`Stripe Payment Intent Failed: ${error.message}`);
    }
  }

  async confirmPayment(transactionId: string): Promise<PaymentResult> {
    const intent = await this.stripe.paymentIntents.retrieve(transactionId);
    return this.mapStatus(intent);
  }

  async queryPayment(transactionId: string): Promise<PaymentResult> {
    const intent = await this.stripe.paymentIntents.retrieve(transactionId);
    return this.mapStatus(intent);
  }

  async handleWebhook(payload: string | any, signature?: string): Promise<PaymentResult | null>  {
   
    let verifiedPayload = payload;
    
    // Validate signature is present
    if (!signature) {
      throw new Error('Missing stripe-signature header. Webhook signature is required.');
    }
    
    if (typeof payload !== 'string') {
      throw new Error('Payload must be a raw string for signature verification');
    }
    
    const webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET');
    console.log('webhookSecret', webhookSecret);
    if (!webhookSecret) {
      throw new Error('STRIPE_WEBHOOK_SECRET is not set in environment variables');
    }
    
    try {
      verifiedPayload = this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    } catch (error) {
      console.error('Stripe webhook signature verification failed:', {
        error: error.message,
        signatureLength: signature?.length,
        payloadLength: payload?.length,
        hasWebhookSecret: !!webhookSecret,
      });
      throw new Error(`Webhook signature verification failed: ${error.message}`);
    }
  
    // Check if it's a successful payment event
    if (verifiedPayload.type === 'payment_intent.succeeded') {
      const intent = verifiedPayload.data.object as Stripe.PaymentIntent;
      return {
        transactionId: intent.id,
        status: 'SUCCESS',
        intentResponse: verifiedPayload,
      };
    }
  
    if (verifiedPayload.type === 'payment_intent.payment_failed') {
      const intent = verifiedPayload.data.object as Stripe.PaymentIntent;
      return {
        transactionId: intent.id,
        status: 'FAILED',
        intentResponse: verifiedPayload,
      };
    }
  
    return null; // Ignore other events
  }

  private mapStatus(intent: Stripe.PaymentIntent): PaymentResult {
    let status: 'PENDING' | 'SUCCESS' | 'FAILED' = 'PENDING';

    if (intent.status === 'succeeded') {
      status = 'SUCCESS';
    } else if (intent.status === 'canceled' || intent.status === 'requires_payment_method') {
      // logic can be expanded. requires_payment_method often means failed attempt or initial state
      if (intent.last_payment_error) {
        status = 'FAILED';
      }
    }

    return {
      transactionId: intent.id,
      status,
      intentResponse: intent,
    };
  }
}
