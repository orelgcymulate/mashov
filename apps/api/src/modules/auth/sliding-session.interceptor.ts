import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request, Response } from 'express';
import { Observable, tap } from 'rxjs';
import { SESSION_COOKIE } from './jwt-auth.guard';
import { sessionCookieOptions } from './cookie';

@Injectable()
export class SlidingSessionInterceptor implements NestInterceptor {
  constructor(private readonly jwt: JwtService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(
      tap(() => {
        const http = context.switchToHttp();
        const req = http.getRequest<Request & { user?: { sub: string } }>();
        const res = http.getResponse<Response>();
        if (req.user?.sub && res.statusCode < 400) {
          const token = this.jwt.sign({ sub: req.user.sub });
          res.cookie(SESSION_COOKIE, token, sessionCookieOptions());
        }
      }),
    );
  }
}
