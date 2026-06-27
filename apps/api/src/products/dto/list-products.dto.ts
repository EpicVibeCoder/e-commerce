import { IsEnum, IsInt, IsOptional, IsString, Min, Max } from "class-validator";
import { ProductStatus } from "src/generated/prisma/enums";
import { Type } from "class-transformer";

export class ListProductsQueryDto {
      @IsOptional() @IsEnum(ProductStatus) status?: ProductStatus;
      @IsOptional() @IsString() categoryId?: string;
      @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number;
      @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) limit?: number;
}
