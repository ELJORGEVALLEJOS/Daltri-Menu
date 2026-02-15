import { OrderStatus } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsDateString, IsEnum, IsOptional } from 'class-validator';

export class GetOrdersQueryDto {
  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;

  @IsOptional()
  @Transform(({ value }: { value: unknown }) => {
    if (typeof value === 'string') {
      return value.toUpperCase();
    }
    return value;
  })
  @IsEnum(OrderStatus)
  status?: OrderStatus;
}
