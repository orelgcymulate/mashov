import type { CookieOptions } from 'express';

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export function sessionCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: THIRTY_DAYS_MS,
  };
}
