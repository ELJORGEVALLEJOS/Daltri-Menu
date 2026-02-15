import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CreatePublicOrderDto } from './dto/create-public-order.dto';
import { MarkOrderSentParamDto } from './dto/mark-order-sent-param.dto';
import { RegisterMerchantDto } from './dto/register-merchant.dto';
import { PublicService } from './public.service';

@Controller('public')
export class PublicController {
  constructor(private readonly publicService: PublicService) { }

  @Get('restaurants/:slug/menu')
  getMenuByRestaurantSlug(@Param('slug') slug: string) {
    return this.publicService.getRestaurantMenuBySlug(slug);
  }

  @Post('restaurants/:slug/orders')
  createOrder(
    @Param('slug') slug: string,
    @Body() createPublicOrderDto: CreatePublicOrderDto,
  ) {
    return this.publicService.createOrder(slug, createPublicOrderDto);
  }

  @Post('orders/:orderId/mark-sent')
  markOrderAsSent(@Param() params: MarkOrderSentParamDto) {
    return this.publicService.markOrderSent(params.orderId);
  }

  @Post('merchants/register')
  registerMerchant(@Body() dto: RegisterMerchantDto) {
    return this.publicService.registerMerchant(dto);
  }
}
