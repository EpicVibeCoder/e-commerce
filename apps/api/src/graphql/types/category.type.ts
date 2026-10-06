import { Field, ID, Int, ObjectType } from "@nestjs/graphql";

@ObjectType()
export class CategoryType {
      @Field(() => ID)
      id!: string;

      @Field()
      name!: string;

      @Field()
      slug!: string;

      // tree-only fields (optional so Product.category still works)
      @Field(() => ID, { nullable: true })
      parentId?: string | null;

      @Field(() => Int, { nullable: true })
      sortOrder?: number;

      @Field(() => Int, { nullable: true })
      productCount?: number;

      @Field(() => Int, { nullable: true })
      childCount?: number;

      @Field(() => [CategoryType], { nullable: true })
      children?: CategoryType[];
}
