import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { MerchantsModule } from './modules/merchants/merchants.module';
import { MenuModule } from './modules/menu/menu.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PublicModule } from './modules/public/public.module';
import { AuthModule } from './modules/auth/auth.module';
import { AdminModule } from './modules/admin/admin.module';

@Module({
  imports: [
    PrismaModule,
    MerchantsModule,
    MenuModule,
    PublicModule,
    AuthModule,
    AdminModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
