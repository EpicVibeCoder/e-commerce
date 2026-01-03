import { PartialType } from '@nestjs/mapped-types';
import { CreateProductDto } from './create-product.dto';
import { IsString, IsOptional, IsNumber, IsEnum, IsPositive, Min, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ProductStatus } from '../../generated/prisma/client';

export class UpdateProductDto extends PartialType(CreateProductDto) {
  @ApiProperty({ example: 'Wireless Headphones', description: 'The name of the product', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  name?: string;

  @ApiProperty({ example: 'WH-1000XM4', description: 'The SKU of the product', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  sku?: string;

  @ApiProperty({ example: 'Noise canceling headphones', description: 'The description of the product', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 299.99, description: 'The price of the product', required: false })
  @IsNumber()
  @IsOptional()
  @IsPositive()
  @Min(0.01)
  price?: number;

  @ApiProperty({ example: 100, description: 'The stock quantity of the product', required: false })
  @IsNumber()
  @IsOptional()
  @Min(0)
  stock?: number;

  @ApiProperty({ enum: ProductStatus, description: 'The status of the product', required: false })
  @IsEnum(ProductStatus)
  @IsOptional()
  status?: ProductStatus;

  @ApiProperty({ example: 'uuid-of-category', description: 'The ID of the category', required: false })
  @IsString()
  @IsOptional()
  categoryId?: string;
}
