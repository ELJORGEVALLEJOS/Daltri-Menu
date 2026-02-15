import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { MerchantsService } from './merchants.service';
import { CreateMerchantDto } from './dto/create-merchant.dto';
import { AdminApiKeyGuard } from '../../common/guards/admin-api-key.guard';

@Controller('merchants')
export class MerchantsController {
  constructor(private readonly merchantsService: MerchantsService) {}

  @Post()
  @UseGuards(AdminApiKeyGuard)
  create(@Body() createMerchantDto: CreateMerchantDto) {
    return this.merchantsService.create(createMerchantDto);
  }

  @Get()
  findAll() {
    return this.merchantsService.findAll();
  }

  @Get(':slug')
  async findOne(@Param('slug') slug: string) {
    const merchant = await this.merchantsService.findOne(slug);
    if (!merchant) {
      throw new NotFoundException(`Merchant with slug ${slug} not found`);
    }
    return merchant;
  }
}
