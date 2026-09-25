import { Field, InputType, Int, ObjectType } from "@nestjs/graphql";
import { ProductStatus } from "src/generated/prisma/enums";
import { ProductType } from "./product.type";
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from "class-validator";
import { Type } from "class-transformer";

@InputType()
export class ProductFilterInput {
      @Field(() => ProductStatus, { nullable: true })
      @IsEnum(ProductStatus)
      @IsOptional()
      status?: ProductStatus;

      @Field({ nullable: true })
      @IsString()
      @IsOptional()
      categoryId?: string;
}

@InputType()
export class PaginationInput {
      @Field(() => Int, { nullable: true, defaultValue: 1 })
      @IsInt()
      @Min(1)
      @Type(() => Number)
      page?: number;

      @Field(() => Int, { nullable: true, defaultValue: 20 })
      @IsInt()
      @Min(1)
      @Max(100)
      @Type(() => Number)
      limit?: number;
}

@ObjectType()
export class ProductConnectionMeta {
      @Field(() => Int)
      @IsInt()
      @Min(1)
      @Type(() => Number)
      page!: number;

      @Field(() => Int)
      @IsInt()
      @Min(1)
      @Max(100)
      @Type(() => Number)
      limit!: number;

      @Field(() => Int)
      @IsInt()
      @Min(0)
      @Type(() => Number)
      total!: number;

      @Field(() => Int)
      @IsInt()
      @Min(1)
      @Type(() => Number)
      totalPages!: number;
}

@ObjectType()
export class ProductConnection {
      @Field(() => [ProductType])
      data!: ProductType[];

      @Field(() => ProductConnectionMeta)
      meta!: ProductConnectionMeta;
}
