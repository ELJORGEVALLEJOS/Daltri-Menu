import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { RolesGuard } from '../../common/guards/roles.guard';

const jwtExpiresIn = (process.env.JWT_EXPIRES_IN ??
  '1d') as import('ms').StringValue;

@Module({
  imports: [
    JwtModule.register({
      secret:
        process.env.JWT_SECRET ??
        (process.env.NODE_ENV === 'test' ? 'test-secret' : undefined),
      signOptions: {
        expiresIn: jwtExpiresIn,
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, RolesGuard],
  exports: [AuthService, JwtStrategy],
})
export class AuthModule {}
