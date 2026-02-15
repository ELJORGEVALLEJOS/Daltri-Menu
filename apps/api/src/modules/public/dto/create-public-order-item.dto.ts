import {
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';

export class CreatePublicOrderItemDto {
  @IsUUID()
  product_id!: string;

  @IsInt()
  @Min(1)
  qty!: number;

  @IsOptional()
  @IsString()
  @MaxLength(250)
  notes?: string;
}
