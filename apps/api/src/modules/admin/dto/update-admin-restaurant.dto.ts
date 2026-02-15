import {
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  Matches,
} from 'class-validator';

export class UpdateAdminRestaurantDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  @Matches(/^\+?[0-9]{8,15}$/)
  whatsapp_phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  currency?: string;

  @IsOptional()
  @IsString()
  @MaxLength(250)
  address?: string;

  @IsOptional()
  @IsUrl({
    require_protocol: true,
  })
  logo_url?: string;
}
