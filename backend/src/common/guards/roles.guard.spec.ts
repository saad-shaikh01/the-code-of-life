import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { RolesGuard } from './roles.guard';

describe('RolesGuard', () => {
  let guard: RolesGuard;

  const mockReflector = {
    getAllAndOverride: jest.fn(),
  };

  const createContext = (user?: { role?: Role }): ExecutionContext =>
    ({
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    }) as unknown as ExecutionContext;

  beforeEach(() => {
    guard = new RolesGuard(mockReflector as unknown as Reflector);
    jest.clearAllMocks();
  });

  it('allows public routes without checking roles', () => {
    mockReflector.getAllAndOverride.mockImplementation(
      (metadataKey: string) => {
        if (metadataKey === IS_PUBLIC_KEY) {
          return true;
        }

        return undefined;
      },
    );

    expect(guard.canActivate(createContext())).toBe(true);
  });

  it('allows routes with no role metadata', () => {
    mockReflector.getAllAndOverride.mockReturnValue(undefined);

    expect(guard.canActivate(createContext({ role: Role.USER }))).toBe(true);
  });

  it('allows users whose role matches the required role', () => {
    mockReflector.getAllAndOverride.mockImplementation(
      (metadataKey: string) => {
        if (metadataKey === ROLES_KEY) {
          return [Role.ADMIN];
        }

        return undefined;
      },
    );

    expect(guard.canActivate(createContext({ role: Role.ADMIN }))).toBe(true);
  });

  it('blocks authenticated users whose role does not match', () => {
    mockReflector.getAllAndOverride.mockImplementation(
      (metadataKey: string) => {
        if (metadataKey === ROLES_KEY) {
          return [Role.ADMIN];
        }

        return undefined;
      },
    );

    expect(() => guard.canActivate(createContext({ role: Role.USER }))).toThrow(
      ForbiddenException,
    );
  });

  it('blocks users when no role is present on the request', () => {
    mockReflector.getAllAndOverride.mockImplementation(
      (metadataKey: string) => {
        if (metadataKey === ROLES_KEY) {
          return [Role.ADMIN];
        }

        return undefined;
      },
    );

    expect(() => guard.canActivate(createContext({}))).toThrow(
      ForbiddenException,
    );
  });
});
