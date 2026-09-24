import { ConflictException, Injectable, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import { AuthTokenType, Role } from "src/generated/prisma/enums";
import { User } from "src/domain/user";
import { PrismaService } from "src/prisma/prisma.service";
import type { RegisterDto } from "./dto/register.dto.js";
import type { LoginDto } from "./dto/login.dto.js";
import type { JwtPayload } from "./types/jwt-payload.js";
import { ConfigService } from "@nestjs/config";
import { createHash, randomBytes } from "node:crypto";
import { EnvironmentVariables } from "src/config/env.validation.js";
import { MailService } from "src/mail/mail.service.js";

const BCRYPT_ROUNDS = 12;

@Injectable()
export class AuthService {
      constructor(
            private readonly prisma: PrismaService,
            private readonly jwt: JwtService,
            private readonly config: ConfigService<EnvironmentVariables, true>,
            private readonly mailService: MailService,
      ) {}

      async register(dto: RegisterDto) {
            const email = dto.email.trim().toLowerCase();
            User.assertEmail(email);
            User.assertPassword(dto.password);

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

            const rawToken = randomBytes(48).toString("base64url");
            const tokenHash = createHash("sha256").update(rawToken).digest("hex");
            await this.prisma.authToken.create({
                  data: {
                        userId: created.id,
                        type: AuthTokenType.email_verification,
                        tokenHash,
                        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h for now
                  },
            });
            await this.mailService.sendVerificationEmail({ to: email, token: rawToken });
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

      async logout(rawToken: string) {
            const tokenHash = createHash("sha256").update(rawToken).digest("hex");

            const stored = await this.prisma.refreshToken.findUnique({
                  where: { tokenHash },
            });

            // Idempotent: missing or already revoked → OK
            if (!stored || stored.revokedAt) {
                  return { ok: true };
            }

            await this.prisma.refreshToken.update({
                  where: { id: stored.id },
                  data: { revokedAt: new Date() },
            });

            return { ok: true };
      }

      async verifyEmail(rawToken: string) {
            const tokenHash = createHash("sha256").update(rawToken).digest("hex");

            const stored = await this.prisma.authToken.findUnique({
                  where: { tokenHash },
            });

            if (!stored || stored.type !== AuthTokenType.email_verification || stored.usedAt || stored.expiresAt <= new Date()) {
                  throw new UnauthorizedException("Invalid or expired verification token");
            }

            await this.prisma.$transaction([
                  this.prisma.authToken.update({
                        where: { id: stored.id },
                        data: { usedAt: new Date() },
                  }),
                  this.prisma.user.update({
                        where: { id: stored.userId },
                        data: { emailVerifiedAt: new Date() },
                  }),
            ]);

            // Stub: real redirect to storefront comes in Phase 5
            return { ok: true, message: "Email verified" };
      }
      async resendVerification(userId: string) {
            const record = await this.prisma.user.findUnique({
                  where: { id: userId },
            });
            if (!record) {
                  throw new NotFoundException("User not found");
            }
            if (record.emailVerifiedAt) {
                  return { ok: true, message: "Email already verified" };
            }

            // Invalidate unused verification tokens so only the new link works
            await this.prisma.authToken.updateMany({
                  where: {
                        userId,
                        type: AuthTokenType.email_verification,
                        usedAt: null,
                  },
                  data: { usedAt: new Date() },
            });

            const rawToken = randomBytes(48).toString("base64url");
            const tokenHash = createHash("sha256").update(rawToken).digest("hex");

            await this.prisma.authToken.create({
                  data: {
                        userId,
                        type: AuthTokenType.email_verification,
                        tokenHash,
                        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
                  },
            });

            await this.mailService.sendVerificationEmail({
                  to: record.email,
                  token: rawToken,
            });

            return { ok: true };
      }

      async refresh(rawToken: string) {
            const tokenHash = createHash("sha256").update(rawToken).digest("hex");

            const stored = await this.prisma.refreshToken.findUnique({
                  where: { tokenHash },
                  include: { user: true },
            });

            if (!stored || stored.revokedAt || stored.expiresAt <= new Date()) {
                  throw new UnauthorizedException("Invalid credentials");
            }

            await this.prisma.refreshToken.update({
                  where: { id: stored.id },
                  data: { revokedAt: new Date() },
            });

            const user = User.fromPersistence(stored.user);
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
