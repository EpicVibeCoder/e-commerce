import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum, IsInt, IsOptional, IsString, Matches, Min, MinLength } from "class-validator";
import { ProductStatus } from "src/generated/prisma/enums";

export class CreateProductDto {
      @ApiProperty({ example: "Wireless Mouse" })
      @IsString()
      @MinLength(1)
      name!: string;

      @ApiProperty({ example: "MS-WRLS-001" })
      @IsString()
      @MinLength(1)
      sku!: string;

      @ApiPropertyOptional({ example: "A high-precision wireless optical mouse." })
      @IsOptional()
      @IsString()
      description?: string;

      @ApiProperty({ example: "29.99" })
      @IsString()
      @Matches(/^\d+(\.\d{1,2})?$/)
      price!: string; // or @IsNumberString

      @ApiProperty({ example: 100 })
      @IsInt()
      @Min(0)
      stock!: number;

      @ApiPropertyOptional({ enum: ProductStatus, enumName: "ProductStatus", default: ProductStatus.draft })
      @IsEnum(ProductStatus)
      @IsOptional()
      status?: ProductStatus;

      @ApiProperty({ example: "category-uuid-123" })
      @IsString()
      categoryId!: string;
}

