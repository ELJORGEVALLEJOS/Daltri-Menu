import {
  ExecutionContext,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { AdminApiKeyGuard } from './admin-api-key.guard';

describe('AdminApiKeyGuard', () => {
  const originalAdminApiKey = process.env.ADMIN_API_KEY;
  let guard: AdminApiKeyGuard;

  const createExecutionContext = (
    headerValue: string | undefined,
  ): ExecutionContext =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({
          header: (name: string) =>
            name === 'x-admin-key' ? headerValue : undefined,
        }),
      }),
    }) as unknown as ExecutionContext;

  beforeEach(() => {
    guard = new AdminApiKeyGuard();
  });

  afterEach(() => {
    process.env.ADMIN_API_KEY = originalAdminApiKey;
  });

  it('should throw if ADMIN_API_KEY is not configured', () => {
    delete process.env.ADMIN_API_KEY;

    expect(() => guard.canActivate(createExecutionContext('abc'))).toThrow(
      InternalServerErrorException,
    );
  });

  it('should throw on invalid key', () => {
    process.env.ADMIN_API_KEY = 'expected-key';

    expect(() =>
      guard.canActivate(createExecutionContext('invalid-key')),
    ).toThrow(UnauthorizedException);
  });

  it('should allow on valid key', () => {
    process.env.ADMIN_API_KEY = 'expected-key';

    expect(guard.canActivate(createExecutionContext('expected-key'))).toBe(
      true,
    );
  });
});
