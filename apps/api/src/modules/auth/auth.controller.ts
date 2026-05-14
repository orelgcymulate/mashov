import { Body, Controller, Get, HttpCode, Post, Res, UnauthorizedException, UsePipes } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Response } from 'express';
import { LoginInput, LoginSchema } from '@mashov/shared';
import { ZodValidationPipe } from '../../common/zod.pipe';
import { Public } from './public.decorator';
import { SESSION_COOKIE } from './jwt-auth.guard';
import { sessionCookieOptions } from './cookie';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly config: ConfigService,
    private readonly jwt: JwtService,
  ) {}

  @Public()
  @Post('login')
  @HttpCode(204)
  @UsePipes(new ZodValidationPipe(LoginSchema))
  login(@Body() body: LoginInput, @Res({ passthrough: true }) res: Response): void {
    const expected = this.config.get<string>('DASHBOARD_PASSWORD');
    if (!expected || body.password !== expected) {
      throw new UnauthorizedException('bad_password');
    }
    const token = this.jwt.sign({ sub: 'dashboard' });
    res.cookie(SESSION_COOKIE, token, sessionCookieOptions());
  }

  @Public()
  @Post('logout')
  @HttpCode(204)
  logout(@Res({ passthrough: true }) res: Response): void {
    res.clearCookie(SESSION_COOKIE, { ...sessionCookieOptions(), maxAge: 0 });
  }

  @Get('me')
  me(): { ok: true } {
    return { ok: true };
  }
}
