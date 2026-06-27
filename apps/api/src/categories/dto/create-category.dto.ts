import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsInt, IsOptional, IsString, Matches, Min, MinLength } from "class-validator";

export class CreateCategoryDto {
      @ApiProperty({ example: "Wearables" })
      @IsString()
      @MinLength(1)
      name!: string;

      @ApiProperty({ example: "wearables" })
      @IsString()
      @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
      slug!: string;

      @ApiPropertyOptional()
      @IsOptional()
      @IsString()
      parentId?: string;

      @ApiPropertyOptional({ default: 0 })
      @IsOptional()
      @IsInt()
      @Min(0)
      sortOrder?: number;
}
