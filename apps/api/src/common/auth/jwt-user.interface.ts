import { UserRole } from '@prisma/client';

export interface JwtUser {
  sub: string;
  email: string;
  fullName: string;
  role: UserRole;
  restaurantId?: string;
  restaurantRole?: UserRole;
}
