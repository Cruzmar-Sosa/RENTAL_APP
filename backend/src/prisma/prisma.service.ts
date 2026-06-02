import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor() {
    const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;

    if (!connectionString) {
      console.error(
        '[PrismaService] No connection string found in environment variables (DIRECT_URL or DATABASE_URL)',
      );
    }

    const pool = new Pool({
      connectionString,
      ssl: { rejectUnauthorized: false },
    });

    const adapter = new PrismaPg(pool as any);
    super({ adapter });
  }

  async onModuleInit() {
    try {
      await this.$connect();
      console.log('[PrismaService] Connected to database successfully.');
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      console.error(
        '[PrismaService] Failed to connect to database:',
        errorMessage,
      );
    }
  }
}
