import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    if (process.env.NODE_ENV === 'test') {
      return;
    }

    try {
      await this.$connect();
      console.log('Successfully connected to the database');
    } catch (error) {
      console.error('Failed to connect to the database:', error);
      // In production, we might want to exit or let NestJS handle it
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
