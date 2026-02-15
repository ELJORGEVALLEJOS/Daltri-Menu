import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtUser } from '../../../common/auth/jwt-user.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    const jwtSecret =
      process.env.JWT_SECRET ??
      (process.env.NODE_ENV === 'test' ? 'test-secret' : undefined);

    if (!jwtSecret) {
      throw new InternalServerErrorException('JWT_SECRET is not configured');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
    });
  }

  validate(payload: JwtUser): JwtUser {
    return payload;
  }
}
