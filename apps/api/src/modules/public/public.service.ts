import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DeliveryType, OrderStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreatePublicOrderDto,
  PublicDeliveryType,
} from './dto/create-public-order.dto';
import { RegisterMerchantDto } from './dto/register-merchant.dto';
import { ConflictException } from '@nestjs/common';

@Injectable()
export class PublicService {
  constructor(private readonly prisma: PrismaService) { }

  async registerMerchant(dto: RegisterMerchantDto) {
    try {
      const existing = await this.prisma.merchant.findUnique({
        where: { slug: dto.slug.toLowerCase() },
      });

      if (existing) {
        throw new ConflictException('Merchant slug already exists');
      }

      // Clean phone number (keep only digits)
      const cleanPhone = dto.whatsapp_phone.replace(/\D/g, '');

      const merchant = await this.prisma.merchant.create({
        data: {
          name: dto.name,
          slug: dto.slug.toLowerCase(),
          whatsappNumber: cleanPhone,
          address: dto.address,
          isActive: true,
          currency: 'ARS', // Default to ARS for Argentina as per UI context
        },
      });

      return {
        id: merchant.id,
        name: merchant.name,
        slug: merchant.slug,
        whatsapp_phone: merchant.whatsappNumber,
        share_link: `https://menu.daltrishop.com/m/${merchant.slug}`,
      };
    } catch (error: any) {
      console.error('Error in registerMerchant:', {
        message: error.message,
        code: error.code,
        stack: error.stack,
        dto: dto
      });
      throw error;
    }
  }

  async getRestaurantMenuBySlug(slug: string) {
    try {
      const restaurant = await this.prisma.merchant.findFirst({
        where: { slug: slug.toLowerCase(), isActive: true },
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

      if (!restaurant) {
        throw new NotFoundException(`Restaurant with slug ${slug} not found`);
      }

      return {
        restaurant: {
          id: restaurant.id,
          name: restaurant.name,
          slug: restaurant.slug,
          whatsapp_phone: restaurant.whatsappNumber,
          currency: restaurant.currency,
        },
        categories: restaurant.categories.map((category) => ({
          id: category.id,
          name: category.name,
          sort_order: category.sortOrder,
          products: category.items.map((item) => ({
            id: item.id,
            name: item.name,
            description: item.description,
            price_cents: item.priceCents,
            image_url: item.imageUrl,
            active: item.isActive,
          })),
        })),
      };
    } catch (error) {
      console.error(`Error fetching menu for slug ${slug}:`, error);
      throw error;
    }
  }

  async createOrder(slug: string, dto: CreatePublicOrderDto) {
    const restaurant = await this.prisma.merchant.findFirst({
      where: { slug: slug.toLowerCase(), isActive: true },
      select: {
        id: true,
        name: true,
        slug: true,
        whatsappNumber: true,
        currency: true,
      },
    });

    if (!restaurant) {
      throw new NotFoundException(`Restaurant with slug ${slug} not found`);
    }

    if (
      dto.delivery === PublicDeliveryType.DELIVERY &&
      (!dto.delivery_address || dto.delivery_address.trim().length === 0)
    ) {
      throw new BadRequestException(
        'delivery_address is required for delivery',
      );
    }

    const productIds = [...new Set(dto.items.map((item) => item.product_id))];
    const products = await this.prisma.item.findMany({
      where: {
        id: { in: productIds },
        merchantId: restaurant.id,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        priceCents: true,
      },
    });

    const productMap = new Map(
      products.map((product) => [product.id, product]),
    );
    if (productMap.size !== productIds.length) {
      throw new BadRequestException('One or more products are invalid');
    }

    let totalCents = 0;
    const orderItemsData = dto.items.map((item) => {
      const product = productMap.get(item.product_id);
      if (!product) {
        throw new BadRequestException(`Invalid product ${item.product_id}`);
      }

      const lineTotalCents = item.qty * product.priceCents;
      totalCents += lineTotalCents;

      return {
        productId: item.product_id,
        qty: item.qty,
        notes: item.notes,
        unitPriceCents: product.priceCents,
        lineTotalCents,
      };
    });

    const order = await this.prisma.order.create({
      data: {
        merchantId: restaurant.id,
        customerName: dto.customer_name,
        customerPhone: dto.customer_phone,
        delivery:
          dto.delivery === PublicDeliveryType.DELIVERY
            ? DeliveryType.DELIVERY
            : DeliveryType.PICKUP,
        deliveryAddress: dto.delivery_address,
        notes: dto.notes,
        status: OrderStatus.CREATED,
        totalCents,
        items: {
          create: orderItemsData,
        },
      },
      include: {
        items: true,
      },
    });

    const message = this.buildWhatsappMessage({
      orderId: order.id,
      orderNumber: this.toOrderNumber(order.shortCode),
      restaurantName: restaurant.name,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      delivery: dto.delivery,
      deliveryAddress: order.deliveryAddress ?? undefined,
      notes: order.notes ?? undefined,
      currency: restaurant.currency,
      items: dto.items.map((item) => {
        const product = productMap.get(item.product_id)!;
        return {
          qty: item.qty,
          notes: item.notes,
          name: product.name,
          lineTotalCents: item.qty * product.priceCents,
        };
      }),
      totalCents: order.totalCents,
    });

    const whatsappPhone = restaurant.whatsappNumber.replace(/\D/g, '');
    if (!whatsappPhone) {
      throw new BadRequestException('Restaurant whatsapp phone is invalid');
    }

    const whatsappUrl = `https://wa.me/${whatsappPhone}?text=${encodeURIComponent(message)}`;

    await this.prisma.order.update({
      where: { id: order.id },
      data: {
        whatsappUrl,
        status: OrderStatus.SENT_TO_WHATSAPP,
      },
    });

    return {
      order_id: order.id,
      order_number: this.toOrderNumber(order.shortCode),
      whatsapp_url: whatsappUrl,
      status: 'sent_to_whatsapp',
    };
  }

  async markOrderSent(orderId: string) {
    const result = await this.prisma.order.updateMany({
      where: { id: orderId },
      data: { status: OrderStatus.SENT_TO_WHATSAPP },
    });

    if (result.count === 0) {
      return {
        order_id: orderId,
        status: 'not_found',
      };
    }

    return {
      order_id: orderId,
      status: 'sent_to_whatsapp',
    };
  }

  async getDiag() {
    try {
      const dbStatus = await this.prisma.$queryRaw`SELECT 1`.then(() => 'Connected').catch((e) => `Error: ${e.message}`);
      const merchants = await this.prisma.merchant.findMany({
        select: { name: true, slug: true, isActive: true }
      });

      return {
        status: 'ok',
        version: '2.5',
        database: {
          status: dbStatus,
          merchantCount: merchants.length,
          date: dbDate,
          merchants
        },
        env: {
          NODE_ENV: process.env.NODE_ENV,
          PORT: process.env.PORT,
        }
      };
    } catch (error: any) {
      return {
        status: 'error',
        message: error.message,
        stack: error.stack
      };
    }
  }

  private buildWhatsappMessage(input: {
    orderId: string;
    orderNumber: string;
    restaurantName: string;
    customerName: string;
    customerPhone: string;
    delivery: PublicDeliveryType;
    deliveryAddress?: string;
    notes?: string;
    currency: string;
    items: Array<{
      qty: number;
      notes?: string;
      name: string;
      lineTotalCents: number;
    }>;
    totalCents: number;
  }): string {
    const lines: string[] = [];
    lines.push(`Nuevo pedido en ${input.restaurantName}`);
    lines.push(`Pedido: ${input.orderNumber} (${input.orderId})`);
    lines.push(`Cliente: ${input.customerName}`);
    lines.push(`Telefono: ${input.customerPhone}`);
    lines.push(`Entrega: ${input.delivery}`);
    if (input.deliveryAddress) {
      lines.push(`Direccion: ${input.deliveryAddress}`);
    }
    if (input.notes) {
      lines.push(`Notas: ${input.notes}`);
    }
    lines.push('Items:');
    for (const item of input.items) {
      const notes = item.notes ? ` (${item.notes})` : '';
      lines.push(
        `- ${item.qty} x ${item.name}${notes} = ${this.formatMoney(item.lineTotalCents, input.currency)}`,
      );
    }
    lines.push(`Total: ${this.formatMoney(input.totalCents, input.currency)}`);
    return lines.join('\n');
  }

  private formatMoney(cents: number, currency: string): string {
    return `${(cents / 100).toFixed(2)} ${currency}`;
  }

  private toOrderNumber(shortCode: number): string {
    return `#${shortCode.toString().padStart(6, '0')}`;
  }
}
