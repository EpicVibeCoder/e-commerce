import { Field, ID, Int, ObjectType, registerEnumType } from "@nestjs/graphql";
import { ProductStatus } from "src/generated/prisma/enums";

registerEnumType(ProductStatus, { name: "ProductStatus" });

@ObjectType()
export class ProductType {
      @Field(() => ID)
      id!: string;

      @Field()
      name!: string;

      @Field()
      sku!: string;

      @Field(() => String, { nullable: true })
      description!: string | null;

      @Field()
      price!: string;

      @Field(() => Int)
      stock!: number;

      @Field(() => ProductStatus)
      status!: ProductStatus;

      @Field(() => ID)
      categoryId!: string;
}
