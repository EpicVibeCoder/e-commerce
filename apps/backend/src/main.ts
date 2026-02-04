import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
      const app = await NestFactory.create(AppModule);
      const configService = app.get(ConfigService);

      // Enable raw body for Stripe webhook signature verification
      app.use('/api/v1/payments/webhooks/stripe', (req, res, next) => {
            if (req.is('application/json')) {
                  req.setEncoding('utf8');
                  let data = '';
                  req.on('data', (chunk) => {
                        data += chunk;
                  });
                  req.on('end', () => {
                        req['rawBody'] = Buffer.from(data, 'utf8');
                        next();
                  });
            } else {
                  next();
            }
      });

      // Security: Helmet
      app.use(helmet());

      // CORS
      app.enableCors({
            origin: configService.get<string>('CORS_ORIGIN', '*'),
            credentials: true,
      });

      // Validation Pipe
      app.useGlobalPipes(
            new ValidationPipe({
                  whitelist: true,
                  forbidNonWhitelisted: true,
                  transform: true,
                  transformOptions: { enableImplicitConversion: true },
            }),
      );

      // Global Prefix
      app.setGlobalPrefix('api/v1');

      const port = configService.get<number>('PORT', 3000);

      // Swagger Configuration
      const config = new DocumentBuilder()
            .setTitle('Mini E-commerce API')
            .setDescription('The Mini E-commerce API description')
            .setVersion('1.0')
            .addBearerAuth()
            .build();
      const document = SwaggerModule.createDocument(app, config);
      SwaggerModule.setup('api/docs', app, document);

      await app.listen(port);

      console.log(`🚀 Application is running on: http://localhost:${port}/api/v1`);
      console.log(`📚 Environment: ${configService.get<string>('NODE_ENV')}`);
}
bootstrap();
