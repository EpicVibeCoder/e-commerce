import { Injectable, NotFoundException, BadRequestException, Inject } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentStrategy } from './strategies/payment-strategy.interface';
import { StripeStrategy } from './strategies/stripe.strategy';
import { BkashStrategy } from './strategies/bkash.strategy';
import { PaymentProvider, PaymentStatus, OrderStatus } from '../generated/prisma/client';
import { InitiatePaymentDto } from './dto/initiate-payment.dto';
import { OrdersService } from '../orders/orders.service';
import { Payment } from './entities/payment.entity';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ordersService: OrdersService,
    private readonly stripeStrategy: StripeStrategy,
    private readonly bkashStrategy: BkashStrategy,
  ) {}

  private getStrategy(provider: PaymentProvider): PaymentStrategy {
    switch (provider) {
      case PaymentProvider.STRIPE:
        return this.stripeStrategy;
      case PaymentProvider.BKASH:
        return this.bkashStrategy;
      default:
        throw new BadRequestException(`Provider ${provider} is not supported yet`);
    }
  }

  async initiatePayment(userId: string, dto: InitiatePaymentDto) {
    const { orderId, provider, metadata } = dto;

    // Validate Order
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Order not found');
    if (order.userId !== userId) throw new NotFoundException('Order not found');
    if (order.status !== OrderStatus.PENDING) throw new BadRequestException('Order is not in PENDING state');

    // Check if payment already exists for this order and provider (only PENDING or SUCCESS)
    const existingPayment = await this.prisma.payment.findFirst({
      where: {
        orderId: order.id,
        provider,
        status: {
          in: [PaymentStatus.PENDING, PaymentStatus.SUCCESS],
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // If existing payment found, return it
    if (existingPayment) {
      const payment = Payment.fromPrisma(existingPayment);
      const intentResponse = existingPayment.intentResponse as any;

      return {
        payment,
        clientSecret: intentResponse?.clientSecret,
        paymentUrl: intentResponse?.paymentUrl,
      };
    }

    // Get Strategy
    const strategy = this.getStrategy(provider);

    // Prepare metadata with callback URL for bKash
    const callbackMetadata = {
      ...metadata,
      callbackURL: `${process.env.APP_URL || 'http://localhost:3000'}/payments/callback/bkash?orderId=${orderId}`,
    };

    // Create Payment Intent (single call)
    const intent = await strategy.createPaymentIntent(order.id, Number(order.totalAmount), callbackMetadata);

    // Create Payment Record
    const payment = await this.prisma.payment.create({
      data: {
        orderId: order.id,
        provider,
        transactionId: intent.transactionId,
        status: PaymentStatus.PENDING,
        intentResponse: {
          transactionId: intent.transactionId,
          clientSecret: intent.clientSecret,
          paymentUrl: intent.paymentUrl,
        },
      },
    });

    return {
      payment: Payment.fromPrisma(payment),
      clientSecret: intent.clientSecret,
      paymentUrl: intent.paymentUrl,
    };
  }

  async confirmPayment(provider: PaymentProvider, transactionId: string) {
    const strategy = this.getStrategy(provider);
    const result = await strategy.confirmPayment(transactionId);

    // Find payment by transaction ID
    const payment = await this.prisma.payment.findUnique({
      where: { transactionId: result.transactionId },
    });

    if (!payment) {
      throw new NotFoundException(`Payment record not found for transaction: ${result.transactionId}`);
    }

    // Update Payment Status
    const status = result.status === 'SUCCESS' ? PaymentStatus.SUCCESS : result.status === 'FAILED' ? PaymentStatus.FAILED : PaymentStatus.PENDING;

    // Sanitize intentResponse to only store essential fields
    const sanitizedIntentResponse = this.sanitizeIntentResponse(provider, result.intentResponse);

    const updatedPayment = await this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        status,
        intentResponse: sanitizedIntentResponse,
      },
    });

    // If Success, Mark Order as Paid
    if (status === PaymentStatus.SUCCESS) {
      await this.ordersService.markAsPaid(payment.orderId);
    }

    return {
      payment: Payment.fromPrisma(updatedPayment),
      status: result.status,
    };
  }

  async handleWebhook(provider: PaymentProvider, payload: any, signature?: string) {
    const strategy = this.getStrategy(provider);
    const result = await strategy.handleWebhook(payload, signature);

    if (!result) {
      return;
    }
    // Find payment by transaction ID
    const payment = await this.prisma.payment.findUnique({
      where: { transactionId: result.transactionId },
    });

    if (!payment) {
      console.warn(`Payment record not found for transaction: ${result.transactionId}`);
      return;
    }
    // Update Payment Status
    const status = result.status === 'SUCCESS' ? PaymentStatus.SUCCESS : result.status === 'FAILED' ? PaymentStatus.FAILED : PaymentStatus.PENDING;

    // Sanitize intentResponse to only store essential fields
    const sanitizedIntentResponse = this.sanitizeIntentResponse(provider, result.intentResponse);

    await this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        status,
        intentResponse: sanitizedIntentResponse,
      },
    });

    // If Success, Mark Order as Paid
    if (status === PaymentStatus.SUCCESS) {
      await this.ordersService.markAsPaid(payment.orderId);
    }
  }

  // Add this new private method
  private sanitizeIntentResponse(provider: PaymentProvider, intentResponse: any): any {
    if (!intentResponse) return null;

    if (provider === PaymentProvider.STRIPE) {
      // If it's a webhook event, extract only the payment intent data
      if (intentResponse.type && intentResponse.data?.object) {
        const intent = intentResponse.data.object;
        return {
          type: intentResponse.type,
          id: intent.id,
          status: intent.status,
          amount: intent.amount,
          currency: intent.currency,
          created: intent.created,
          payment_method: intent.payment_method,
          charges:
            intent.charges?.data?.map((charge: any) => ({
              id: charge.id,
              status: charge.status,
              amount: charge.amount,
            })) || [],
        };
      }
      // If it's a PaymentIntent object directly
      if (intentResponse.id && intentResponse.status) {
        return {
          id: intentResponse.id,
          status: intentResponse.status,
          amount: intentResponse.amount,
          currency: intentResponse.currency,
          created: intentResponse.created,
          client_secret: intentResponse.client_secret,
          payment_method: intentResponse.payment_method,
        };
      }
    }

    if (provider === PaymentProvider.BKASH) {
      // bKash responses are already small, but sanitize to be safe
      return {
        paymentID: intentResponse.paymentID,
        transactionStatus: intentResponse.transactionStatus,
        statusMessage: intentResponse.statusMessage,
        amount: intentResponse.amount,
        currency: intentResponse.currency,
        trxID: intentResponse.trxID,
        merchantInvoiceNumber: intentResponse.merchantInvoiceNumber,
      };
    }

    return intentResponse; // Fallback for unknown providers
  }

  async findAll(userId: string) {
    const payments = await this.prisma.payment.findMany({
      where: {
        order: {
          userId,
        },
      },
      include: { order: true },
      orderBy: { createdAt: 'desc' },
    });
    return payments.map((p) => Payment.fromPrisma(p));
  }
}
