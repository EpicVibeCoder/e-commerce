import { Field, ID, Int, ObjectType, registerEnumType } from "@nestjs/graphql";
import { OrderStatus } from "src/generated/prisma/enums";

registerEnumType(OrderStatus, { name: "OrderStatus" });

@ObjectType()
export class OrderItemProductType {
      @Field(() => ID)
      id!: string;

      @Field()
      name!: string;

      @Field()
      sku!: string;

      @Field()
      price!: string;
}

@ObjectType()
export class OrderItemType {
      @Field(() => ID)
      id!: string;

      @Field(() => ID)
      productId!: string;

      @Field(() => Int)
      quantity!: number;

      @Field()
      price!: string;

      @Field()
      subtotal!: string;

      @Field(() => OrderItemProductType, { nullable: true })
      product?: OrderItemProductType | null;
}

@ObjectType()
export class OrderType {
      @Field(() => ID)
      id!: string;

      @Field(() => OrderStatus)
      status!: OrderStatus;

      @Field()
      totalAmount!: string;

      @Field()
      createdAt!: Date;

      @Field(() => [OrderItemType])
      items!: OrderItemType[];
}
