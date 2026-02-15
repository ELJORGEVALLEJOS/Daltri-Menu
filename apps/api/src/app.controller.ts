import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) { }

  @Get()
  getHello(): string {
    console.log('API V2.1 - Enhanced Logging Active');
    return this.appService.getHello();
  }

  @Get('diag')
  async getDiag() {
    try {
      const dbStatus = await this.appService.checkDatabase();
      return {
        status: 'ok',
        version: '2.3',
        database: dbStatus,
        env: {
          NODE_ENV: process.env.NODE_ENV,
          PORT: process.env.PORT,
        }
      };
    } catch (error: any) {
      return { status: 'error', message: error.message };
    }
  }

  @Get('health')
  getHealth() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }
}
