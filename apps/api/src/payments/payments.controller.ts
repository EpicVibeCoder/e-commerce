import { Body, Controller, Headers, Param, Post, Req, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiExcludeEndpoint, ApiOperation, ApiTags } from "@nestjs/swagger";
import type { IncomingHttpHeaders } from "node:http";
import type { RawBodyRequest } from "@nestjs/common";
import type { Request } from "express";
import { PaymentProvider } from "src/generated/prisma/enums";
import { JwtAuthGuard } from "src/auth/guards/jwt-auth.guard";
import { EmailVerifiedGuard } from "src/auth/guards/email-verified.guard";
import { CurrentUser } from "src/auth/decorators/current-user.decorator";
import type { JwtPayload } from "src/auth/types/jwt-payload";
import { PaymentsService } from "./payments.service";
import { CheckoutDto } from "./dto/checkout.dto";

@ApiTags("payments")
@Controller("payments")
export class PaymentsController {
      constructor(private readonly paymentsService: PaymentsService) {}

      @Post("checkout")
      @UseGuards(JwtAuthGuard, EmailVerifiedGuard)
      @ApiBearerAuth("access-token")
      @ApiOperation({ summary: "Start checkout for an order (email verified required)" })
      checkout(@CurrentUser() user: JwtPayload, @Body() dto: CheckoutDto) {
            return this.paymentsService.checkout(user.sub, dto);
      }

      @Post("webhooks/stripe")
      @ApiExcludeEndpoint()
      stripeWebhook(@Headers() headers: IncomingHttpHeaders, @Req() req: RawBodyRequest<Request>) {
            return this.paymentsService.handleWebhook(PaymentProvider.stripe, headers, req.rawBody ?? Buffer.from(""));
      }

      @Post("webhooks/sslcommerz")
      @ApiExcludeEndpoint()
      sslcommerzWebhook(@Headers() headers: IncomingHttpHeaders, @Req() req: RawBodyRequest<Request>) {
            return this.paymentsService.handleWebhook(PaymentProvider.sslcommerz, headers, req.rawBody ?? Buffer.from(""));
      }
}
