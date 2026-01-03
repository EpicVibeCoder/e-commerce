import { IsEnum, IsNotEmpty, IsUUID, IsOptional, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PaymentProvider } from '../../generated/prisma/client';

export class InitiatePaymentDto {
  @ApiProperty({ example: 'uuid-of-order', description: 'The ID of the order' })
  @IsUUID()
  @IsNotEmpty()
  orderId: string;

  @ApiProperty({ enum: PaymentProvider, description: 'The payment provider (STRIPE, BKASH)', example: 'STRIPE' })
  @IsEnum(PaymentProvider)
  @IsNotEmpty()
  provider: PaymentProvider;

  @ApiProperty({ example: { currency: 'usd' }, description: 'Additional metadata', required: false })
  @IsObject()
  @IsOptional()
  metadata?: any;
}
