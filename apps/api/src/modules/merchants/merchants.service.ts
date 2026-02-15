import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateMerchantDto } from './dto/create-merchant.dto';

@Injectable()
export class MerchantsService {
  constructor(private readonly prisma: PrismaService) {}

  create(data: CreateMerchantDto) {
    const createData: Prisma.MerchantCreateInput = {
      slug: data.slug.toLowerCase(),
      name: data.name,
      whatsappNumber: data.whatsappNumber,
      isActive: data.isActive ?? true,
      logoUrl: data.logoUrl,
      config: data.config as Prisma.InputJsonValue | undefined,
    };

    return this.prisma.merchant.create({ data: createData });
  }

  findAll() {
    return this.prisma.merchant.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  findOne(slug: string) {
    return this.prisma.merchant.findUnique({
      where: { slug: slug.toLowerCase() },
      include: {
        categories: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
          include: {
            items: {
              where: { isActive: true },
              orderBy: { name: 'asc' },
            },
          },
        },
      },
    });
  }
}
