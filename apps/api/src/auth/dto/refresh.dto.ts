import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, MinLength } from "class-validator";

export class RefreshDto {
      @ApiProperty({ description: "The refresh token", example: "refresh-token" })
      @IsString()
      @MinLength(1)
      @IsNotEmpty()
      refreshToken!: string;
}
