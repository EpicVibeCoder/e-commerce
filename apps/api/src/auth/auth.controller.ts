import { Body, Controller, Get, Post, Query } from "@nestjs/common";
import { AuthService } from "./auth.service.js";
import { RegisterDto } from "./dto/register.dto.js";
import { LoginDto } from "./dto/login.dto.js";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { RefreshDto } from "./dto/refresh.dto.js";

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
      @Post("logout")
      @ApiOperation({ summary: "Revoke refresh token" })
      logout(@Body() dto: RefreshDto) {
            return this.authService.logout(dto.refreshToken);
      }

      @Get("verify-email")
      @ApiOperation({ summary: "Verify email with token from registration email" })
      verifyEmail(@Query("token") token: string) {
            return this.authService.verifyEmail(token);
      }

      @Post("refresh")
      @ApiOperation({ summary: "Rotate refresh token and issue new access token" })
      refresh(@Body() dto: RefreshDto) {
            return this.authService.refresh(dto.refreshToken);
      }
}
