import { Module } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { OrdersModule } from '../orders/orders.module';
import { StripeStrategy } from './strategies/stripe.strategy';
import { BkashStrategy } from './strategies/bkash.strategy';
import { ConfigModule } from '@nestjs/config';

@Module({
      imports: [ConfigModule, PrismaModule, OrdersModule],
      controllers: [PaymentsController],
      providers: [PaymentsService, StripeStrategy, BkashStrategy],
      exports: [PaymentsService],
})
export class PaymentsModule {}
