import { ConflictException, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import { Role } from "src/generated/prisma/enums";
import { User } from "src/domain/user";
import { PrismaService } from "src/prisma/prisma.service";
import type { RegisterDto } from "./dto/register.dto.js";
import type { LoginDto } from "./dto/login.dto.js";
import type { JwtPayload } from "./types/jwt-payload.js";
import { ConfigService } from "@nestjs/config";
import { createHash, randomBytes } from "node:crypto";
import { EnvironmentVariables } from "src/config/env.validation.js";

const BCRYPT_ROUNDS = 12;

@Injectable()
export class AuthService {
      constructor(
            private readonly prisma: PrismaService,
            private readonly jwt: JwtService,
            private readonly config: ConfigService<EnvironmentVariables, true>,
      ) {}

      async register(dto: RegisterDto) {
            const email = dto.email.trim().toLowerCase();
            User.assertEmail(email);

            const existing = await this.prisma.user.findUnique({
                  where: { email },
            });
            if (existing) {
                  throw new ConflictException("Email already registered");
            }

            const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
            const created = await this.prisma.user.create({
                  data: {
                        email,
                        passwordHash,
                        name: dto.name?.trim() || null,
                        role: Role.customer,
                  },
            });

            const user = User.fromPersistence(created);
            return {
                  accessToken: await this.signToken(user),
                  refreshToken: await this.issueRefreshToken(user.id),
                  user: this.toPublicUser(user),
            };
      }

      async login(dto: LoginDto) {
            const email = dto.email.trim().toLowerCase();
            const record = await this.prisma.user.findUnique({
                  where: { email },
            });

            if (!record?.passwordHash) {
                  throw new UnauthorizedException("Invalid credentials");
            }

            const valid = await bcrypt.compare(dto.password, record.passwordHash);
            if (!valid) {
                  throw new UnauthorizedException("Invalid credentials");
            }

            const user = User.fromPersistence(record);
            return {
                  accessToken: await this.signToken(user),
                  refreshToken: await this.issueRefreshToken(user.id),
                  user: this.toPublicUser(user),
            };
      }

      private async issueRefreshToken(userId: string): Promise<string> {
            const rawToken = randomBytes(48).toString("base64url");
            const tokenHash = createHash("sha256").update(rawToken).digest("hex");

            await this.prisma.refreshToken.create({
                  data: {
                        userId,
                        tokenHash,
                        expiresAt: this.getRefreshExpiresAt(),
                  },
            });

            return rawToken;
      }

      private getRefreshExpiresAt(): Date {
            const raw = this.config.get("JWT_REFRESH_EXPIRATION", { infer: true }); // e.g. "7d"
            const match = /^(\d+)([dhms])$/.exec(raw);
            if (!match) {
                  throw new Error(`Invalid JWT_REFRESH_EXPIRATION: ${raw}`);
            }
            const amount = Number(match[1]);
            const unit = match[2];
            const ms = unit === "d" ? amount * 86_400_000 : unit === "h" ? amount * 3_600_000 : unit === "m" ? amount * 60_000 : amount * 1_000;
            return new Date(Date.now() + ms);
      }

      private async signToken(user: User): Promise<string> {
            const payload: JwtPayload = {
                  sub: user.id,
                  email: user.email,
                  role: user.role,
            };
            return this.jwt.signAsync(payload);
      }

      private toPublicUser(user: User) {
            return {
                  id: user.id,
                  email: user.email,
                  role: user.role,
                  name: user.name ?? null,
                  avatar: user.avatar ?? null,
            };
      }
}
