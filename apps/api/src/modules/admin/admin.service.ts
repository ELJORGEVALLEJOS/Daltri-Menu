import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { JwtUser } from '../../common/auth/jwt-user.interface';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { GetOrdersQueryDto } from './dto/get-orders-query.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { UpdateAdminRestaurantDto } from './dto/update-admin-restaurant.dto';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async getRestaurant(user: JwtUser) {
    const restaurantId = this.getRestaurantIdFromUser(user);
    const restaurant = await this.prisma.merchant.findUnique({
      where: { id: restaurantId },
      select: {
        id: true,
        name: true,
        slug: true,
        whatsappNumber: true,
        currency: true,
        address: true,
        logoUrl: true,
        isActive: true,
      },
    });

    if (!restaurant) {
      throw new NotFoundException('Restaurant not found');
    }

    return {
      id: restaurant.id,
      name: restaurant.name,
      slug: restaurant.slug,
      whatsapp_phone: restaurant.whatsappNumber,
      currency: restaurant.currency,
      address: restaurant.address,
      logo_url: restaurant.logoUrl,
      active: restaurant.isActive,
    };
  }

  async updateRestaurant(user: JwtUser, dto: UpdateAdminRestaurantDto) {
    const restaurantId = this.getRestaurantIdFromUser(user);
    const updatedRestaurant = await this.prisma.merchant.update({
      where: { id: restaurantId },
      data: {
        name: dto.name,
        whatsappNumber: dto.whatsapp_phone,
        currency: dto.currency?.toUpperCase(),
        address: dto.address,
        logoUrl: dto.logo_url,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        whatsappNumber: true,
        currency: true,
        address: true,
        logoUrl: true,
        isActive: true,
      },
    });

    return {
      id: updatedRestaurant.id,
      name: updatedRestaurant.name,
      slug: updatedRestaurant.slug,
      whatsapp_phone: updatedRestaurant.whatsappNumber,
      currency: updatedRestaurant.currency,
      address: updatedRestaurant.address,
      logo_url: updatedRestaurant.logoUrl,
      active: updatedRestaurant.isActive,
    };
  }

  async getCategories(user: JwtUser) {
    const restaurantId = this.getRestaurantIdFromUser(user);
    return this.prisma.category.findMany({
      where: { merchantId: restaurantId },
      orderBy: { sortOrder: 'asc' },
      select: {
        id: true,
        name: true,
        sortOrder: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async createCategory(user: JwtUser, dto: CreateCategoryDto) {
    const restaurantId = this.getRestaurantIdFromUser(user);
    return this.prisma.category.create({
      data: {
        merchantId: restaurantId,
        name: dto.name,
        sortOrder: dto.sort_order ?? 0,
      },
      select: {
        id: true,
        name: true,
        sortOrder: true,
        isActive: true,
      },
    });
  }

  async updateCategory(user: JwtUser, id: string, dto: UpdateCategoryDto) {
    const restaurantId = this.getRestaurantIdFromUser(user);
    await this.assertCategoryBelongsToRestaurant(id, restaurantId);

    return this.prisma.category.update({
      where: { id },
      data: {
        name: dto.name,
        sortOrder: dto.sort_order,
        isActive: dto.active,
      },
      select: {
        id: true,
        name: true,
        sortOrder: true,
        isActive: true,
      },
    });
  }

  async deleteCategory(user: JwtUser, id: string) {
    const restaurantId = this.getRestaurantIdFromUser(user);
    await this.assertCategoryBelongsToRestaurant(id, restaurantId);

    await this.prisma.$transaction([
      this.prisma.category.update({
        where: { id },
        data: { isActive: false },
      }),
      this.prisma.item.updateMany({
        where: { categoryId: id, merchantId: restaurantId },
        data: { isActive: false },
      }),
    ]);

    return { id, status: 'deleted' };
  }

  async getProducts(user: JwtUser) {
    const restaurantId = this.getRestaurantIdFromUser(user);
    return this.prisma.item.findMany({
      where: { merchantId: restaurantId },
      orderBy: [{ isActive: 'desc' }, { name: 'asc' }],
      select: {
        id: true,
        categoryId: true,
        name: true,
        description: true,
        priceCents: true,
        imageUrl: true,
        isActive: true,
      },
    });
  }

  async createProduct(user: JwtUser, dto: CreateProductDto) {
    const restaurantId = this.getRestaurantIdFromUser(user);
    await this.assertCategoryBelongsToRestaurant(dto.category_id, restaurantId);

    return this.prisma.item.create({
      data: {
        merchantId: restaurantId,
        categoryId: dto.category_id,
        name: dto.name,
        description: dto.description,
        priceCents: dto.price_cents,
        imageUrl: dto.image_url,
        isActive: dto.active ?? true,
      },
      select: {
        id: true,
        categoryId: true,
        name: true,
        description: true,
        priceCents: true,
        imageUrl: true,
        isActive: true,
      },
    });
  }

  async updateProduct(user: JwtUser, id: string, dto: UpdateProductDto) {
    const restaurantId = this.getRestaurantIdFromUser(user);
    await this.assertProductBelongsToRestaurant(id, restaurantId);
    if (dto.category_id) {
      await this.assertCategoryBelongsToRestaurant(
        dto.category_id,
        restaurantId,
      );
    }

    return this.prisma.item.update({
      where: { id },
      data: {
        categoryId: dto.category_id,
        name: dto.name,
        description: dto.description,
        priceCents: dto.price_cents,
        imageUrl: dto.image_url,
        isActive: dto.active,
      },
      select: {
        id: true,
        categoryId: true,
        name: true,
        description: true,
        priceCents: true,
        imageUrl: true,
        isActive: true,
      },
    });
  }

  async deleteProduct(user: JwtUser, id: string) {
    const restaurantId = this.getRestaurantIdFromUser(user);
    await this.assertProductBelongsToRestaurant(id, restaurantId);
    await this.prisma.item.update({
      where: { id },
      data: { isActive: false },
    });
    return { id, status: 'deleted' };
  }

  async getOrders(user: JwtUser, query: GetOrdersQueryDto) {
    const restaurantId = this.getRestaurantIdFromUser(user);
    const where: Prisma.OrderWhereInput = {
      merchantId: restaurantId,
    };

    if (query.status) {
      where.status = query.status;
    }

    if (query.from || query.to) {
      where.createdAt = {
        gte: query.from ? new Date(query.from) : undefined,
        lte: query.to ? new Date(query.to) : undefined,
      };
    }

    const orders = await this.prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    return orders.map((order) => this.mapOrder(order));
  }

  async getOrderById(user: JwtUser, id: string) {
    const restaurantId = this.getRestaurantIdFromUser(user);
    const order = await this.prisma.order.findFirst({
      where: {
        id,
        merchantId: restaurantId,
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException(`Order ${id} not found`);
    }

    return this.mapOrder(order);
  }

  private getRestaurantIdFromUser(user: JwtUser): string {
    if (!user.restaurantId) {
      throw new ForbiddenException('User is not assigned to a restaurant');
    }

    return user.restaurantId;
  }

  private async assertCategoryBelongsToRestaurant(
    categoryId: string,
    restaurantId: string,
  ) {
    const category = await this.prisma.category.findFirst({
      where: {
        id: categoryId,
        merchantId: restaurantId,
      },
      select: { id: true },
    });

    if (!category) {
      throw new NotFoundException(`Category ${categoryId} not found`);
    }
  }

  private async assertProductBelongsToRestaurant(
    productId: string,
    restaurantId: string,
  ) {
    const product = await this.prisma.item.findFirst({
      where: {
        id: productId,
        merchantId: restaurantId,
      },
      select: { id: true },
    });

    if (!product) {
      throw new NotFoundException(`Product ${productId} not found`);
    }
  }

  private mapOrder(
    order: Prisma.OrderGetPayload<{
      include: {
        items: { include: { product: { select: { id: true; name: true } } } };
      };
    }>,
  ) {
    return {
      id: order.id,
      order_number: `#${order.shortCode.toString().padStart(6, '0')}`,
      short_code: order.shortCode,
      status: order.status.toLowerCase(),
      customer_name: order.customerName,
      customer_phone: order.customerPhone,
      delivery: order.delivery.toLowerCase(),
      delivery_address: order.deliveryAddress,
      notes: order.notes,
      total_cents: order.totalCents,
      whatsapp_url: order.whatsappUrl,
      created_at: order.createdAt,
      updated_at: order.updatedAt,
      items: order.items.map((item) => ({
        id: item.id,
        product_id: item.productId,
        product_name: item.product.name,
        qty: item.qty,
        notes: item.notes,
        unit_price_cents: item.unitPriceCents,
        line_total_cents: item.lineTotalCents,
      })),
    };
  }
}
