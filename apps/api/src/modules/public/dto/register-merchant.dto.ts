import { IsString, Length, Matches, IsOptional, IsEmail, MinLength } from 'class-validator';

export class RegisterMerchantDto {
  @IsString()
  @Length(2, 120)
  name!: string;

  @IsString()
  @Length(3, 80)
  @Matches(/^[a-z0-9-]+$/)
  slug!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsString()
  @Matches(/^[\+\d\s\-\(\)]{8,20}$/)
  whatsapp_phone!: string;

  @IsString()
  @IsOptional()
  address?: string;
}
