import { Controller, Get, Query } from '@nestjs/common';
import { MenuService } from './menu.service';
import { GetMenuQueryDto } from './dto/get-menu-query.dto';

@Controller('menu')
export class MenuController {
  constructor(private readonly menuService: MenuService) {}

  @Get()
  getMenu(@Query() query: GetMenuQueryDto) {
    return this.menuService.getMenu(query.merchantId);
  }
}
