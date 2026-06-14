import { ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { AppEnv, type EnvironmentVariables } from "src/config/env.validation";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";

async function bootstrap() {
      const app = await NestFactory.create(AppModule);
      const config = app.get(ConfigService<EnvironmentVariables, true>);
      const port = config.get("PORT", { infer: true });
      const appEnv = config.get("APP_ENV", { infer: true });
      const corsOrigins = config
            .get("CORS_ORIGINS", { infer: true })
            .split(",")
            .map((o) => o.trim())
            .filter(Boolean);

      app.setGlobalPrefix("api/v1");

      app.useGlobalPipes(
            new ValidationPipe({
                  whitelist: true,
                  forbidNonWhitelisted: true,
                  transform: true,
            }),
      );

      if (appEnv !== AppEnv.production) {
            const swaggerConfig = new DocumentBuilder()
                  .setTitle("E-commerce API")
                  .setDescription("Portfolio e-commerce REST API")
                  .setVersion("1.0")
                  .addBearerAuth({ type: "http", scheme: "bearer", bearerFormat: "JWT", in: "header" }, "access-token")
                  .build();
            const document = SwaggerModule.createDocument(app, swaggerConfig);
            SwaggerModule.setup("api/docs", app, document);
      }

      app.enableCors({ origin: corsOrigins, credentials: true });

      await app.listen(port);

      console.log(`\n🚀 API is live — ready for requests\n` + `🌍 env:  ${appEnv}\n` + `🔌 port: ${port}\n` + `🔗 url:  http://localhost:${port}/api/v1\n` + (appEnv !== AppEnv.production ? `📚 docs: http://localhost:${port}/api/docs\n` : ""));
}
void bootstrap();
