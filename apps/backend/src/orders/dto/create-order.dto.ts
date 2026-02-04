import { IsArray, IsNotEmpty, IsNumber, IsString, Min, ValidateNested } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

class OrderItemDto {
      @ApiProperty({ example: 'uuid-of-product', description: 'The ID of the product' })
      @IsString()
      @IsNotEmpty()
      productId: string;

      @ApiProperty({ example: 2, description: 'The quantity of the product' })
      @IsNumber()
      @Min(1)
      quantity: number;
}

export class CreateOrderDto {
      @ApiProperty({ type: [OrderItemDto], description: 'List of items in the order' })
      @IsArray()
      @ValidateNested({ each: true })
      @Type(() => OrderItemDto)
      items: OrderItemDto[];
}
