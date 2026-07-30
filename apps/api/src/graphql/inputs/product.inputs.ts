import { Field, InputType, Int, registerEnumType } from "@nestjs/graphql";
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from "class-validator";
import { Type } from "class-transformer";
import { ProductStatus } from "src/generated/prisma/enums";

registerEnumType(ProductStatus, { name: "ProductStatus" });

@InputType()
export class PaginationInput {
      @Field(() => Int, { nullable: true })
      @IsOptional()
      @Type(() => Number)
      @IsInt()
      @Min(1)
      page?: number;

      @Field(() => Int, { nullable: true })
      @IsOptional()
      @Type(() => Number)
      @IsInt()
      @Min(1)
      @Max(100)
      limit?: number;
}

@InputType()
export class ProductFilterInput {
      @Field(() => ProductStatus, { nullable: true })
      @IsOptional()
      @IsEnum(ProductStatus)
      status?: ProductStatus;

      @Field({ nullable: true })
      @IsOptional()
      @IsString()
      categoryId?: string;
}
