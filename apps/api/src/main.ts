import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import type { EnvironmentVariables } from './config/env.validation';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api/v1');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const config = app.get(ConfigService<EnvironmentVariables, true>);
  const port = config.get('PORT', { infer: true });
  const appEnv = config.get('APP_ENV', { infer: true });
  const corsOrigins = config
    .get('CORS_ORIGINS', { infer: true })
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  app.enableCors({ origin: corsOrigins, credentials: true });

  await app.listen(port);

  console.log(
    `\n🚀 API is live — ready for requests\n` +
      `   🌍 env:  ${appEnv}\n` +
      `   🔌 port: ${port}\n` +
      `   🔗 url:  http://localhost:${port}/api/v1\n`,
  );
}
void bootstrap();
