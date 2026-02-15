import {
  CanActivate,
  ExecutionContext,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';

@Injectable()
export class AdminApiKeyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const adminApiKey = process.env.ADMIN_API_KEY;
    if (!adminApiKey) {
      throw new InternalServerErrorException('ADMIN_API_KEY is not configured');
    }

    const request = context.switchToHttp().getRequest<Request>();
    const providedApiKey = request.header('x-admin-key');
    if (!providedApiKey || providedApiKey !== adminApiKey) {
      throw new UnauthorizedException('Invalid admin API key');
    }

    return true;
  }
}
