import { IsString, IsNotEmpty, IsOptional, MaxLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCategoryDto {
      @ApiProperty({ example: 'Electronics', description: 'The name of the category' })
      @IsString()
      @IsNotEmpty()
      @MaxLength(100)
      name: string;

      @ApiProperty({ example: 'electronics', description: 'The slug of the category' })
      @IsString()
      @IsNotEmpty()
      @MaxLength(100)
      @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
            message: 'Slug must be lowercase alphanumeric with hyphens',
      })
      slug: string;

      @ApiProperty({ example: 'All kinds of electronics', description: 'The description of the category', required: false })
      @IsString()
      @IsOptional()
      description?: string;

      @ApiProperty({ example: 'uuid-of-parent-category', description: 'The ID of the parent category', required: false })
      @IsString()
      @IsOptional()
      parentId?: string;
}
