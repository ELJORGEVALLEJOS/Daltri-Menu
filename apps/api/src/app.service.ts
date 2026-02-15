import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';

@Injectable()
export class AppService {
  constructor(private readonly prisma: PrismaService) { }

  getHello(): string {
    return 'Hello World!';
  }

  async checkDatabase() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      const count = await this.prisma.merchant.count();
      return { status: 'connected', merchants: count };
    } catch (e: any) {
      return { status: 'error', message: e.message };
    }
  }
}
