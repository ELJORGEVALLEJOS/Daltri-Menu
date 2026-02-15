import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class MenuService {
  constructor(private readonly prisma: PrismaService) {}

  async getMenu(merchantId: string) {
    const merchant = await this.prisma.merchant.findFirst({
      where: { id: merchantId, isActive: true },
      select: { id: true },
    });

    if (!merchant) {
      throw new NotFoundException(`Merchant with id ${merchantId} not found`);
    }

    return this.prisma.category.findMany({
      where: { merchantId, isActive: true },
      include: {
        items: {
          where: { isActive: true },
          include: {
            modifiers: {
              include: {
                options: true,
              },
            },
          },
          orderBy: { name: 'asc' },
        },
      },
      orderBy: { sortOrder: 'asc' },
    });
  }
}
