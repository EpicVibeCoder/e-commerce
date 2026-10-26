import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { ArrayMinSize, IsArray, IsInt, IsString, Min, ValidateNested } from "class-validator";

export class CreateOrderItemDto {
      @ApiProperty({ example: "cmu1raw19000rypulrphi3zxs" })
      @IsString()
      productId!: string;

      @ApiProperty({ example: 2, minimum: 1 })
      @IsInt()
      @Min(1)
      quantity!: number;
}

export class CreateOrderDto {
      @ApiProperty({ type: [CreateOrderItemDto] })
      @IsArray()
      @ArrayMinSize(1)
      @ValidateNested({ each: true })
      @Type(() => CreateOrderItemDto)
      items!: CreateOrderItemDto[];
}
