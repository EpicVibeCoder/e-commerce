import { Body, Controller, Post } from "@nestjs/common";
import { AuthService } from "./auth.service.js";
import { RegisterDto } from "./dto/register.dto.js";
import { LoginDto } from "./dto/login.dto.js";
import { ApiOperation, ApiTags } from "@nestjs/swagger";

@ApiTags("Auth")
@Controller("auth")
export class AuthController {
      constructor(private readonly authService: AuthService) {}
      @Post("register")
      @ApiOperation({ summary: "Register a new customer" })
      register(@Body() dto: RegisterDto) {
            return this.authService.register(dto);
      }
      @Post("login")
      @ApiOperation({ summary: "Login and receive JWT" })
      login(@Body() dto: LoginDto) {
            return this.authService.login(dto);
      }
}
