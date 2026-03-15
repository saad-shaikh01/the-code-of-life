import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { Role } from '@prisma/client';
import { PrismaService } from '../../prisma';

export interface JwtPayload {
  sub: string;
  email: string;
  username: string;
  role: Role;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    // `passport-jwt` exposes `ExtractJwt` with loose typings in this version.
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken() as (
      request: Request,
    ) => string | null;

    // Nest's PassportStrategy helper uses an untyped constructor signature here.
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    super({
      jwtFromRequest,
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        username: true,
        avatarUrl: true,
        currentLevel: true,
        totalScore: true,
        streakDays: true,
        emailVerified: true,
        growthPoints: true,
        growthStage: true,
        lastPlayedAt: true,
        createdAt: true,
        role: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return {
      ...user,
      role: user.role ?? payload.role ?? Role.USER,
    };
  }
}
