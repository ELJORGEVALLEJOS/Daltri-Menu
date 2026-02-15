import { IsInt, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateCategoryDto {
  @IsString()
  @MaxLength(120)
  name!: string;

  @IsOptional()
  @IsInt()
  sort_order?: number;
}
