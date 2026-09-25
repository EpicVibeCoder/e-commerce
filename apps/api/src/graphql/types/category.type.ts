import { Field, ID, ObjectType } from "@nestjs/graphql";
import { IsString } from "class-validator";

@ObjectType()
export class CategoryType {
      @Field(() => ID)
      @IsString()
      id!: string;

      @Field()
      @IsString()
      name!: string;

      @Field()
      @IsString()
      slug!: string;
}
