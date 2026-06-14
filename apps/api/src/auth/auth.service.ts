import { ConflictException, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import { Role } from "src/generated/prisma/enums";
import { User } from "src/domain/user";
import { PrismaService } from "src/prisma/prisma.service";
import type { RegisterDto } from "./dto/register.dto.js";
import type { LoginDto } from "./dto/login.dto.js";
import type { JwtPayload } from "./types/jwt-payload.js";

const BCRYPT_ROUNDS = 12;

@Injectable()
export class AuthService {
      constructor(
            private readonly prisma: PrismaService,
            private readonly jwt: JwtService,
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
                  user: this.toPublicUser(user),
            };
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
