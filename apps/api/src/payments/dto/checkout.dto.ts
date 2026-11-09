import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum, IsOptional, IsString, IsUrl } from "class-validator";
import { PaymentProvider } from "src/generated/prisma/enums";

export class CheckoutDto {
      @ApiProperty({ example: "cmu1raw19000rypulrphi3zxs" })
      @IsString()
      orderId!: string;

      @ApiProperty({ enum: PaymentProvider, example: PaymentProvider.stripe })
      @IsEnum(PaymentProvider)
      provider!: PaymentProvider;

      @ApiProperty({ example: "http://localhost:3002/checkout/success" })
      @IsUrl({ require_tld: false })
      successUrl!: string;

      @ApiProperty({ example: "http://localhost:3002/checkout/cancel" })
      @IsUrl({ require_tld: false })
      cancelUrl!: string;

      @ApiPropertyOptional({ example: "demo@customer.com" })
      @IsOptional()
      @IsString()
      customerEmail?: string;
}
