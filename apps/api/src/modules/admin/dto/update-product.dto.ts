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

export class UpdateProductDto {
  @IsOptional()
  @IsUUID()
  category_id?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  price_cents?: number;

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
