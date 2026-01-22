import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { configValidationSchema } from './app.config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CategoriesModule } from './categories/categories.module';
import { ProductsModule } from './products/products.module';
import { OrdersModule } from './orders/orders.module';
import { PaymentsModule } from './payments/payments.module';
import { RedisModule } from './redis/redis.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: configValidationSchema,
      validationOptions: {
        allowUnknown: true, // Allow system env vars (we only validate schema vars)
        abortEarly: false,
        stripUnknown: true,
      },
      load: [
        () => {
          const nodeEnv = process.env.NODE_ENV || 'development';
          const dbUrl = process.env.DATABASE_URL || '';
          const isPlaceholder = !dbUrl || dbUrl === 'place_your_db_url_here' || dbUrl.includes('${');
          const dbAllowPublicKeyRetrieval = process.env.DB_ALLOW_PUBLIC_KEY_RETRIEVAL;
          const dbSsl = process.env.DB_SSL;

          // If DATABASE_URL exists, ensure it has the required query parameters
          if (dbUrl && !isPlaceholder) {
            try {
              const url = new URL(dbUrl);
              if (dbAllowPublicKeyRetrieval === 'true' && !url.searchParams.has('allowPublicKeyRetrieval')) {
                url.searchParams.set('allowPublicKeyRetrieval', 'true');
              }
              if (dbSsl === 'true' && !url.searchParams.has('ssl')) {
                url.searchParams.set('ssl', 'true');
              }
              process.env.DATABASE_URL = url.toString();
            } catch (e) {
              // If URL parsing fails, continue with original URL
            }
          }

          // In production: Require explicit DATABASE_URL (managed database)
          if (nodeEnv === 'production') {
            if (isPlaceholder) {
              console.warn('⚠️  WARNING: DATABASE_URL is not set in production. ' + 'Please provide a valid database connection string.');
            }
            return {};
          }

          // In development/test: Auto-construct from individual variables
          if (isPlaceholder) {
            const dbUser = process.env.DB_USER;
            const dbPassword = process.env.DB_PASSWORD;
            const dbHost = process.env.DB_HOST || 'localhost';
            const dbPort = process.env.DB_PORT || '3306';
            const dbName = process.env.DB_NAME;

            if (dbUser && dbPassword && dbName) {
              // URL encode password to handle special characters
              const encodedPassword = encodeURIComponent(dbPassword);

              // Build query parameters
              const params = new URLSearchParams();
              if (dbAllowPublicKeyRetrieval === 'true') {
                params.set('allowPublicKeyRetrieval', 'true');
              }
              if (dbSsl === 'true') {
                params.set('ssl', 'true');
              }

              const queryString = params.toString();
              const url = `mysql://${dbUser}:${encodedPassword}@${dbHost}:${dbPort}/${dbName}`;
              process.env.DATABASE_URL = queryString ? `${url}?${queryString}` : url;
              console.log(`✅ Auto-constructed DATABASE_URL for ${nodeEnv} environment`);
            } else {
              console.warn('⚠️  WARNING: Cannot auto-construct DATABASE_URL. ' + 'Missing DB_USER, DB_PASSWORD, or DB_NAME.');
            }
          }

          return {};
        },
      ],
    }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: () => ({
        throttlers: [
          {
            ttl: 60,
            limit: 100,
          },
        ],
      }),
    }),
    PrismaModule,
    RedisModule,
    AuthModule,
    UsersModule,
    CategoriesModule,
    CategoriesModule,
    ProductsModule,
    OrdersModule,
    PaymentsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
