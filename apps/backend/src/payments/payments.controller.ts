import { Controller, Post, Get, Body, Param, UseGuards, Req, Headers, BadRequestException, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiBody } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { InitiatePaymentDto } from './dto/initiate-payment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { PaymentProvider } from '../generated/prisma/client';
import { RawBody } from '@nestjs/common';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
      constructor(private readonly paymentsService: PaymentsService) {}

      @Post('initiate')
      @UseGuards(JwtAuthGuard)
      @ApiBearerAuth()
      @ApiOperation({ summary: 'Initiate a payment' })
      @ApiResponse({ status: 201, description: 'Payment initiated successfully.' })
      @ApiResponse({ status: 400, description: 'Bad Request.' })
      async initiate(@CurrentUser() user: User, @Body() dto: InitiatePaymentDto) {
            return this.paymentsService.initiatePayment(user.id, dto);
      }

      @Get()
      @UseGuards(JwtAuthGuard)
      @ApiBearerAuth()
      @ApiOperation({ summary: 'Get all payments for current user' })
      @ApiResponse({ status: 200, description: 'Return list of payments.' })
      async findAll(@CurrentUser() user: User) {
            const payments = await this.paymentsService.findAll(user.id);
            return payments.map((p) => p.toJSON());
      }
      /**
       * bKash callback endpoint (user redirects here after payment)
       */
      @Get('callback/bkash')
      @ApiOperation({ summary: 'bKash Callback Endpoint' })
      @ApiQuery({ name: 'paymentID', required: true })
      @ApiQuery({ name: 'status', required: true })
      @ApiQuery({ name: 'orderId', required: true })
      async bkashCallback(@Query('paymentID') paymentID: string, @Query('status') status: string, @Query('orderId') orderId: string) {
            if (!paymentID) {
                  return { success: false, message: 'Payment ID missing' };
            }

            try {
                  // Execute payment to confirm
                  const result = await this.paymentsService.confirmPayment(PaymentProvider.BKASH, paymentID);

                  if (result.status === 'SUCCESS') {
                        return {
                              success: true,
                              message: 'Payment successful',
                              transactionId: paymentID,
                              orderId,
                        };
                  }

                  return {
                        success: false,
                        message: 'Payment failed or pending',
                        transactionId: paymentID,
                  };
            } catch (error) {
                  return {
                        success: false,
                        message: error.message,
                  };
            }
      }
      // Webhooks
      @Post('webhooks/stripe')
      @ApiOperation({ summary: 'Stripe Webhook' })
      @ApiBody({ description: 'Stripe Webhook Payload' })
      async stripeWebhook(@RawBody() rawBody: Buffer, @Headers('stripe-signature') signature: string) {
            try {
                  // Pass raw body as string for signature verification
                  const rawBodyString = rawBody.toString('utf8');
                  await this.paymentsService.handleWebhook(
                        PaymentProvider.STRIPE,
                        rawBodyString, // Pass as string, not parsed JSON
                        signature,
                  );
                  return { received: true };
            } catch (e) {
                  throw new BadRequestException(e.message);
            }
      }

      @Post('webhooks/bkash')
      @ApiOperation({ summary: 'bKash Webhook' })
      @ApiBody({ description: 'bKash Webhook Payload' })
      async bkashWebhook(@Body() payload: any) {
            await this.paymentsService.handleWebhook(PaymentProvider.BKASH, payload);
            return { received: true };
      }
}
