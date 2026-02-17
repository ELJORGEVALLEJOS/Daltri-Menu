import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  IsUrl,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateProductDto {
  @IsUUID()
  category_id!: string;

  @IsString()
  @MaxLength(120)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsInt()
  @Min(0)
  price_cents!: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  original_price_cents?: number;

  @IsOptional()
  @IsUrl({
    require_protocol: true,
  })
  image_url?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
