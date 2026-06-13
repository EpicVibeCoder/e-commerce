import { IsEmail, IsOptional, IsString, MinLength } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class RegisterDto {
      @ApiProperty({ description: "The email of the user", example: "demo@customer.com" })
      @IsEmail()
      email!: string;

      @ApiProperty({ description: "The password of the user", example: "password123" })
      @IsString()
      @MinLength(8)
      password!: string;

      @ApiPropertyOptional({ description: "The name of the user", example: "John Doe" })
      @IsOptional()
      @IsString()
      name?: string | null;
}
