import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtUser } from '../../common/auth/jwt-user.interface';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AdminService } from './admin.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { GetOrdersQueryDto } from './dto/get-orders-query.dto';
import { IdParamDto } from './dto/id-param.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { UpdateAdminRestaurantDto } from './dto/update-admin-restaurant.dto';

@Controller('admin')
@UseGuards(JwtAuthGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('restaurant')
  getRestaurant(@CurrentUser() user: JwtUser) {
    return this.adminService.getRestaurant(user);
  }

  @Put('restaurant')
  updateRestaurant(
    @CurrentUser() user: JwtUser,
    @Body() dto: UpdateAdminRestaurantDto,
  ) {
    return this.adminService.updateRestaurant(user, dto);
  }

  @Get('categories')
  getCategories(@CurrentUser() user: JwtUser) {
    return this.adminService.getCategories(user);
  }

  @Post('categories')
  createCategory(@CurrentUser() user: JwtUser, @Body() dto: CreateCategoryDto) {
    return this.adminService.createCategory(user, dto);
  }

  @Put('categories/:id')
  updateCategory(
    @CurrentUser() user: JwtUser,
    @Param() params: IdParamDto,
    @Body() dto: UpdateCategoryDto,
  ) {
    return this.adminService.updateCategory(user, params.id, dto);
  }

  @Delete('categories/:id')
  deleteCategory(@CurrentUser() user: JwtUser, @Param() params: IdParamDto) {
    return this.adminService.deleteCategory(user, params.id);
  }

  @Get('products')
  getProducts(@CurrentUser() user: JwtUser) {
    return this.adminService.getProducts(user);
  }

  @Post('products')
  createProduct(@CurrentUser() user: JwtUser, @Body() dto: CreateProductDto) {
    return this.adminService.createProduct(user, dto);
  }

  @Put('products/:id')
  updateProduct(
    @CurrentUser() user: JwtUser,
    @Param() params: IdParamDto,
    @Body() dto: UpdateProductDto,
  ) {
    return this.adminService.updateProduct(user, params.id, dto);
  }

  @Delete('products/:id')
  deleteProduct(@CurrentUser() user: JwtUser, @Param() params: IdParamDto) {
    return this.adminService.deleteProduct(user, params.id);
  }

  @Get('orders')
  getOrders(@CurrentUser() user: JwtUser, @Query() query: GetOrdersQueryDto) {
    return this.adminService.getOrders(user, query);
  }

  @Get('orders/:id')
  getOrderById(@CurrentUser() user: JwtUser, @Param() params: IdParamDto) {
    return this.adminService.getOrderById(user, params.id);
  }
}
