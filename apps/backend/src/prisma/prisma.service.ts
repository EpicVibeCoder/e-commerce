import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from '../generated/prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
      constructor() {
            if (!process.env.DATABASE_URL) {
                  throw new Error('DATABASE_URL environment variable is not set');
            }
            const adapter = new PrismaMariaDb(process.env.DATABASE_URL);
            super({ adapter, log: ['info', 'warn', 'error'] });
      }

      async onModuleInit() {
            try {
                  await this.$connect();
                  await this.$queryRaw`SELECT 1`;
                  console.log('✅ Prisma connected to MySQL');
            } catch (error) {
                  console.error('❌ Prisma connection error:', error);
                  throw error;
            }
      }

      async onModuleDestroy() {
            await this.$disconnect();
            console.log('🔌 Prisma disconnected from MySQL');
      }
}
