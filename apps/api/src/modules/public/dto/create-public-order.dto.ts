import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { CreatePublicOrderItemDto } from './create-public-order-item.dto';

export enum PublicDeliveryType {
  PICKUP = 'pickup',
  DELIVERY = 'delivery',
}

export class CreatePublicOrderDto {
  @IsString()
  @MaxLength(80)
  customer_name!: string;

  @IsString()
  @MaxLength(30)
  @Matches(/^\+?[0-9]{6,15}$/)
  customer_phone!: string;

  @IsEnum(PublicDeliveryType)
  delivery!: PublicDeliveryType;

  @IsOptional()
  @IsString()
  @MaxLength(250)
  delivery_address?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreatePublicOrderItemDto)
  items!: CreatePublicOrderItemDto[];
}
