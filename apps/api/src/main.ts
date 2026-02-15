import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalFilters(new AllExceptionsFilter());
  const port = Number(process.env.PORT ?? 3000);
  const host = '0.0.0.0';
  app.enableCors({
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      const allowedOrigins = [
        'https://menu.daltrishop.com',
        'https://control.daltrishop.com',
        'https://daltrishop.com',
        'https://www.daltrishop.com',
        'https://server.daltrishop.com',
        'http://localhost:3000',
        'http://localhost:3001',
      ];
      console.log('Incoming request from origin:', origin);
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.warn('Origin blocked by CORS:', origin);
        callback(null, false);
      }
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  await app.listen(port, host);
  console.log(`Server listening on ${host}:${port}`);
}
void bootstrap();
