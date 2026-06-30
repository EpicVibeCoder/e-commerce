import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum, IsInt, IsOptional, IsString, Min, Max } from "class-validator";
import { ProductStatus } from "src/generated/prisma/enums";
import { Type } from "class-transformer";

export class ListProductsQueryDto {
      @ApiPropertyOptional({ enum: ProductStatus, enumName: "ProductStatus" })
      @IsOptional()
      @IsEnum(ProductStatus)
      status?: ProductStatus;

      @ApiPropertyOptional({ example: "category-uuid-123" })
      @IsOptional()
      @IsString()
      categoryId?: string;

      @ApiPropertyOptional({ example: 1, default: 1 })
      @IsOptional()
      @Type(() => Number)
      @IsInt()
      @Min(1)
      page?: number;

      @ApiPropertyOptional({ example: 10, default: 10 })
      @IsOptional()
      @Type(() => Number)
      @IsInt()
      @Min(1)
      @Max(100)
      limit?: number;
}
