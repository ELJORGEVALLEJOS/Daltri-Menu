import { IsUUID } from 'class-validator';

export class MarkOrderSentParamDto {
  @IsUUID()
  orderId!: string;
}
