import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtUser } from '../../common/auth/jwt-user.interface';
import { LoginDto } from './dto/login.dto';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
      include: {
        restaurants: {
          orderBy: { createdAt: 'asc' },
          take: 1,
        },
      },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const restaurantLink = user.restaurants[0];
    const payload: JwtUser = {
      sub: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      restaurantId: restaurantLink?.restaurantId,
      restaurantRole: restaurantLink?.role,
    };

    const accessToken = await this.jwtService.signAsync(payload);

    return {
      access_token: accessToken,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.fullName,
        role: user.role,
        restaurant_id: payload.restaurantId ?? null,
        restaurant_role: payload.restaurantRole ?? null,
      },
    };
  }

  async createUser(dto: CreateUserDto) {
    const email = dto.email.toLowerCase();
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });
    if (existingUser) {
      throw new ConflictException('User already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        email,
        passwordHash,
        fullName: dto.full_name,
        role: dto.role ?? UserRole.MANAGER,
        restaurants: dto.restaurant_id
          ? {
              create: {
                restaurantId: dto.restaurant_id,
                role: dto.restaurant_role ?? UserRole.MANAGER,
              },
            }
          : undefined,
      },
      include: {
        restaurants: {
          select: {
            restaurantId: true,
            role: true,
          },
        },
      },
    });

    return {
      id: user.id,
      email: user.email,
      full_name: user.fullName,
      role: user.role,
      restaurant_links: user.restaurants.map((link) => ({
        restaurant_id: link.restaurantId,
        role: link.role,
      })),
    };
  }

  logout() {
    return { status: 'ok' };
  }
}
