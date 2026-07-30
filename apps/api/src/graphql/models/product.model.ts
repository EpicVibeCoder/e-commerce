import { Field, ID, Int, ObjectType } from "@nestjs/graphql";

@ObjectType()
export class CategorySummaryModel {
  @Field(() => ID) id!: string;
  @Field() name!: string;
  @Field() slug!: string;
}

@ObjectType()
export class ProductModel {
  @Field(() => ID) id!: string;
  @Field() name!: string;
  @Field() sku!: string;
  @Field(() => String, { nullable: true }) description!: string | null;
  @Field() price!: string;
  @Field(() => Int) stock!: number;
  @Field() status!: string;
  @Field() categoryId!: string;
  @Field(() => CategorySummaryModel) category!: CategorySummaryModel;
  @Field() createdAt!   : Date;
  @Field() updatedAt!: Date;
}

@ObjectType()
export class ProductConnectionMeta {
  @Field(() => Int) page!: number;
  @Field(() => Int) limit!: number;
  @Field(() => Int) total!: number;
  @Field(() => Int) totalPages!: number;
}

@ObjectType()
export class ProductConnectionModel {
  @Field(() => [ProductModel]) data!: ProductModel[];
  @Field(() => ProductConnectionMeta) meta!: ProductConnectionMeta;
}