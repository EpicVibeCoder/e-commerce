import { IsEmail, IsString, MinLength } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class LoginDto {
      @ApiProperty({ description: "The email of the user", example: "demo@customer.com" })
      @IsEmail()
      email!: string;

      @ApiProperty({ description: "the password of the user", example: "password123" })
      @IsString()
      @MinLength(1)
      password!: string;
}
