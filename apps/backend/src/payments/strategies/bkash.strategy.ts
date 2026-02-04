import { Injectable, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PaymentIntentResult, PaymentResult, PaymentStrategy } from './payment-strategy.interface';

interface BkashTokenResponse {
      id_token: string;
      token_type: string;
      expires_in: number;
      refresh_token?: string;
}

interface BkashCreatePaymentResponse {
      paymentID: string;
      bkashURL: string;
      transactionStatus: string;
      statusMessage: string;
}

interface BkashExecutePaymentResponse {
      paymentID: string;
      transactionStatus: string;
      statusMessage: string;
      amount: string;
      currency: string;
      merchantInvoiceNumber: string;
      trxID?: string;
}

interface BkashQueryPaymentResponse {
      paymentID: string;
      transactionStatus: string;
      statusMessage: string;
      amount: string;
      currency: string;
      merchantInvoiceNumber: string;
      trxID?: string;
}

@Injectable()
export class BkashStrategy implements PaymentStrategy {
      private readonly baseUrl: string;
      private readonly appKey: string;
      private readonly appSecret: string;
      private readonly username: string;
      private readonly password: string;
      private readonly isSandbox: boolean;
      private accessToken: string | null = null;
      private tokenExpiresAt: number = 0;

      constructor(private readonly configService: ConfigService) {
            this.baseUrl = this.configService.get<string>('BKASH_BASE_URL') || 'https://tokenized.sandbox.bka.sh/v1.2.0-beta';
            this.appKey = this.configService.get<string>('BKASH_APP_KEY') || '';
            this.appSecret = this.configService.get<string>('BKASH_APP_SECRET') || '';
            this.username = this.configService.get<string>('BKASH_USERNAME') || '';
            this.password = this.configService.get<string>('BKASH_PASSWORD') || '';
            this.isSandbox = this.configService.get<string>('BKASH_IS_SANDBOX', 'true') === 'true';

            // Validate credentials in production
            if (!this.isSandbox && (!this.appKey || !this.appSecret || !this.username || !this.password)) {
                  console.warn('⚠️  bKash credentials not configured. Payment will fail.');
            }
      }

      /**
       * Get or refresh access token
       * Req: Grant Token API
       */
      private async getAccessToken(): Promise<string> {
            // Return cached token if still valid (with 5 min buffer)
            if (this.accessToken && Date.now() < this.tokenExpiresAt - 300000) {
                  return this.accessToken;
            }

            try {
                  const credentials = Buffer.from(`${this.username}:${this.password}`).toString('base64');

                  const response = await fetch(`${this.baseUrl}/tokenized/checkout/token/grant`, {
                        method: 'POST',
                        headers: {
                              'Content-Type': 'application/json',
                              Accept: 'application/json',
                              Authorization: `Basic ${credentials}`,
                              'X-APP-Key': this.appKey,
                        },
                        body: JSON.stringify({
                              app_key: this.appKey,
                              app_secret: this.appSecret,
                        }),
                  });

                  if (!response.ok) {
                        const errorText = await response.text();
                        throw new Error(`bKash token grant failed: ${response.status} - ${errorText}`);
                  }

                  const data: BkashTokenResponse = await response.json();

                  if (!data.id_token) {
                        throw new Error('bKash token grant failed: No id_token in response');
                  }

                  this.accessToken = data.id_token;
                  this.tokenExpiresAt = Date.now() + data.expires_in * 1000;

                  return this.accessToken;
            } catch (error) {
                  throw new InternalServerErrorException(`bKash authentication failed: ${error.message}`);
            }
      }

      /**
       * Create payment intent
       * Req: Create Payment API
       */
      async createPaymentIntent(orderId: string, amount: number, metadata?: any): Promise<PaymentIntentResult> {
            try {
                  const token = await this.getAccessToken();

                  // bKash expects amount as string with 2 decimal places
                  const amountStr = amount.toFixed(2);

                  const response = await fetch(`${this.baseUrl}/tokenized/checkout/payment/create`, {
                        method: 'POST',
                        headers: {
                              'Content-Type': 'application/json',
                              Accept: 'application/json',
                              Authorization: `Bearer ${token}`,
                              'X-APP-Key': this.appKey,
                        },
                        body: JSON.stringify({
                              mode: '0011', // Checkout mode
                              payerReference: orderId,
                              callbackURL: metadata?.callbackURL || `${process.env.APP_URL || 'http://localhost:3000'}/payments/callback/bkash`,
                              amount: amountStr,
                              currency: 'BDT',
                              intent: 'sale',
                              merchantInvoiceNumber: orderId,
                        }),
                  });

                  if (!response.ok) {
                        const errorText = await response.text();
                        throw new Error(`bKash create payment failed: ${response.status} - ${errorText}`);
                  }

                  const data: BkashCreatePaymentResponse = await response.json();

                  if (data.statusMessage !== 'Successful' || !data.paymentID) {
                        throw new BadRequestException(`bKash payment creation failed: ${data.statusMessage || 'Unknown error'}`);
                  }

                  return {
                        transactionId: data.paymentID,
                        paymentUrl: data.bkashURL,
                        metadata: {
                              orderId,
                              ...metadata,
                        },
                  };
            } catch (error) {
                  if (error instanceof BadRequestException) {
                        throw error;
                  }
                  throw new InternalServerErrorException(`bKash payment creation failed: ${error.message}`);
            }
      }

      /**
       * Execute payment after user approval
       * Req: Execute Payment API
       */
      async confirmPayment(transactionId: string, payload?: any): Promise<PaymentResult> {
            try {
                  const token = await this.getAccessToken();

                  const response = await fetch(`${this.baseUrl}/tokenized/checkout/payment/execute`, {
                        method: 'POST',
                        headers: {
                              'Content-Type': 'application/json',
                              Accept: 'application/json',
                              Authorization: `Bearer ${token}`,
                              'X-APP-Key': this.appKey,
                        },
                        body: JSON.stringify({
                              paymentID: transactionId,
                        }),
                  });

                  if (!response.ok) {
                        const errorText = await response.text();
                        throw new Error(`bKash execute payment failed: ${response.status} - ${errorText}`);
                  }

                  const data: BkashExecutePaymentResponse = await response.json();

                  let status: 'PENDING' | 'SUCCESS' | 'FAILED' = 'PENDING';

                  if (data.transactionStatus === 'Completed' && data.trxID) {
                        status = 'SUCCESS';
                  } else if (data.transactionStatus === 'Failed' || data.transactionStatus === 'Canceled') {
                        status = 'FAILED';
                  }

                  return {
                        transactionId: data.paymentID,
                        status,
                        intentResponse: data,
                  };
            } catch (error) {
                  return {
                        transactionId,
                        status: 'FAILED',
                        intentResponse: { error: error.message },
                  };
            }
      }

      /**
       * Query payment status
       * Req: Query Payment API
       */
      async queryPayment(transactionId: string): Promise<PaymentResult> {
            try {
                  const token = await this.getAccessToken();

                  const response = await fetch(`${this.baseUrl}/tokenized/checkout/payment/query`, {
                        method: 'POST',
                        headers: {
                              'Content-Type': 'application/json',
                              Accept: 'application/json',
                              Authorization: `Bearer ${token}`,
                              'X-APP-Key': this.appKey,
                        },
                        body: JSON.stringify({
                              paymentID: transactionId,
                        }),
                  });

                  if (!response.ok) {
                        const errorText = await response.text();
                        throw new Error(`bKash query payment failed: ${response.status} - ${errorText}`);
                  }

                  const data: BkashQueryPaymentResponse = await response.json();

                  let status: 'PENDING' | 'SUCCESS' | 'FAILED' = 'PENDING';

                  if (data.transactionStatus === 'Completed' && data.trxID) {
                        status = 'SUCCESS';
                  } else if (data.transactionStatus === 'Failed' || data.transactionStatus === 'Canceled') {
                        status = 'FAILED';
                  }

                  return {
                        transactionId: data.paymentID,
                        status,
                        intentResponse: data,
                  };
            } catch (error) {
                  return {
                        transactionId,
                        status: 'PENDING',
                        intentResponse: { error: error.message },
                  };
            }
      }

      /**
       * Handle IPN (Instant Payment Notification) webhook
       * Req: IPN Webhook
       */
      async handleWebhook(payload: any, signature?: string): Promise<PaymentResult | null> {
            try {
                  // bKash IPN payload structure
                  // {
                  //   "paymentID": "string",
                  //   "status": "string",
                  //   "transactionStatus": "string",
                  //   "amount": "string",
                  //   "currency": "string",
                  //   "trxID": "string",
                  //   "merchantInvoiceNumber": "string"
                  // }

                  if (!payload.paymentID) {
                        return null; // Invalid payload
                  }

                  // Verify webhook signature if provided (bKash may send signature in headers)
                  // For production, implement signature verification

                  let status: 'PENDING' | 'SUCCESS' | 'FAILED' = 'PENDING';

                  if (payload.transactionStatus === 'Completed' && payload.trxID) {
                        status = 'SUCCESS';
                  } else if (payload.transactionStatus === 'Failed' || payload.transactionStatus === 'Canceled') {
                        status = 'FAILED';
                  }

                  return {
                        transactionId: payload.paymentID,
                        status,
                        intentResponse: payload,
                  };
            } catch (error) {
                  console.error('bKash webhook processing error:', error);
                  return null;
            }
      }
}
