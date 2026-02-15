import {
  IsBoolean,
  IsObject,
  IsOptional,
  IsString,
  IsUrl,
  Length,
  Matches,
} from 'class-validator';

export class CreateMerchantDto {
  @IsString()
  @Length(3, 80)
  @Matches(/^[a-z0-9-]+$/)
  slug!: string;

  @IsString()
  @Length(2, 120)
  name!: string;

  @IsString()
  @Matches(/^\+?[0-9]{8,15}$/)
  whatsappNumber!: string;

  @IsOptional()
  @IsUrl({
    require_protocol: true,
  })
  logoUrl?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsObject()
  config?: Record<string, unknown>;
}
