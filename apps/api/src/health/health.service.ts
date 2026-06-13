import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class HealthService {
      constructor(private readonly prisma: PrismaService) {}

      async checkReady() {
            await this.prisma.$queryRaw`SELECT 1`;
            return { status: "ready", database: "up" };
      }
}
