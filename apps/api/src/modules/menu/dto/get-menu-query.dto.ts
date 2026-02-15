import { IsUUID } from 'class-validator';

export class GetMenuQueryDto {
  @IsUUID()
  merchantId!: string;
}
