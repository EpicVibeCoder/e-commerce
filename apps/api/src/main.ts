import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { EnvironmentVariables } from "./config/env.validation";

async function bootstrap() {
      const app = await NestFactory.create(AppModule);
      app.setGlobalPrefix("api/v1");
      app.useGlobalPipes(
            new ValidationPipe({
                  whitelist: true,
                  forbidNonWhitelisted: true,
                  transform: true,
                  transformOptions: { enableImplicitConversion: true },
            }),
      );
      const config = app.get(ConfigService<EnvironmentVariables, true>);
      const port = config.get("PORT", { infer: true });
      const corsOrigins = config
            .get("CORS_ORIGINS", { infer: true })!
            .split(",")
            .map((o) => o.trim())
            .filter(Boolean);

      app.enableCors({
            origin: corsOrigins,
            credentials: true,
      });

      await app.listen(port);
      console.log(`\n🚀 API is live!\n✅ NestJS ready\n🔗 http://localhost:${port}\n`);
}
bootstrap();
