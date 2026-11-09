import { Module } from "@nestjs/common";
import { AuthModule } from "src/auth/auth.module";
import { PAYMENT_STRATEGIES } from "./strategies/payment-strategy.interface";
import { PaymentsController } from "./payments.controller";
import { PaymentsService } from "./payments.service";
import { StripePaymentStrategy } from "./strategies/stripe.strategy";
import { SslcommerzPaymentStrategy } from "./strategies/sslcommerz.strategy";

@Module({
      imports: [AuthModule],
      controllers: [PaymentsController],
      providers: [
            StripePaymentStrategy,
            SslcommerzPaymentStrategy,
            {
                  provide: PAYMENT_STRATEGIES,
                  useFactory: (stripe: StripePaymentStrategy, ssl: SslcommerzPaymentStrategy) => [stripe, ssl],
                  inject: [StripePaymentStrategy, SslcommerzPaymentStrategy],
            },
            PaymentsService,
      ],
      exports: [PaymentsService],
})
export class PaymentsModule {}
