import { Catch, ArgumentsHost, HttpStatus, Logger, HttpException } from "@nestjs/common";
import { Prisma } from "src/generated/prisma/client"; // adjust if your client export differs
import type { Response } from "express";
import { BaseExceptionFilter, HttpAdapterHost } from "@nestjs/core";

@Catch()
export class PrismaExceptionFilter extends BaseExceptionFilter {
      private readonly logger = new Logger(PrismaExceptionFilter.name);

      constructor(adapterHost: HttpAdapterHost) {
            super(adapterHost.httpAdapter);
      }

      catch(exception: unknown, host: ArgumentsHost) {
            const ctx = host.switchToHttp();
            const res = ctx.getResponse<Response>();

            if (host.getType<"graphql">() === "graphql") {
                  if (this.isDbUnreachable(exception)) {
                        throw new HttpException({ status: "not_ready", database: "down" }, HttpStatus.SERVICE_UNAVAILABLE);
                  }
                  if (this.isRedisUnreachable(exception)) {
                        throw new HttpException({ status: "not_ready", redis: "down" }, HttpStatus.SERVICE_UNAVAILABLE);
                  }
                  throw exception; // let Apollo format Unauthorized / etc.
            }

            if (this.isDbUnreachable(exception)) {
                  this.logger.error("Database not reachable", exception instanceof Error ? exception.message : String(exception));
                  res.status(HttpStatus.SERVICE_UNAVAILABLE).json({
                        status: "not_ready",
                        database: "down",
                  });
                  return;
            }
            if (this.isRedisUnreachable(exception)) {
                  this.logger.error("Redis not reachable", exception instanceof Error ? exception.message : String(exception));
                  res.status(503).json({ status: "not_ready", redis: "down" });
                  return;
            }

            // Let Nest handle everything else (or rethrow)
            super.catch(exception, host);
      }

      private isDbUnreachable(exception: unknown): boolean {
            if (!(exception instanceof Prisma.PrismaClientKnownRequestError)) {
                  // also catch adapter / init errors by message/code if needed
                  const msg = exception instanceof Error ? exception.message : "";
                  return msg.includes("Can't reach database server") || msg.includes("DatabaseNotReachable");
            }
            // P1001 = can't reach DB; your log showed P2010 with DatabaseNotReachable
            return exception.code === "P1001" || exception.code === "P2010" || String(exception.meta?.driverAdapterError ?? "").includes("DatabaseNotReachable");
      }
      private isRedisUnreachable(exception: unknown): boolean {
            if (!(exception instanceof Error)) return false;
            const msg = exception.message;
            const name = exception.name;
            return name === "MaxRetriesPerRequestError" || msg.includes("ECONNREFUSED") || msg.includes("Connection is closed") || msg.includes("connect ETIMEDOUT") || msg.includes("Stream isn't writeable") || msg.toLowerCase().includes("redis");
      }
}
