import { Module } from '@nestjs/common';
import { MerchantsService } from './merchants.service';
import { MerchantsController } from './merchants.controller';
import { AdminApiKeyGuard } from '../../common/guards/admin-api-key.guard';

@Module({
  controllers: [MerchantsController],
  providers: [MerchantsService, AdminApiKeyGuard],
  exports: [MerchantsService],
})
export class MerchantsModule {}
