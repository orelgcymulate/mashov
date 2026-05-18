import { JwtService } from '@nestjs/jwt';
import { SESSION_COOKIE } from '../auth/jwt-auth.guard';

export interface SocketUser {
  sub: string;
}

export function authenticateHandshake(
  cookieHeader: string | undefined,
  jwt: JwtService,
): SocketUser | null {
  if (!cookieHeader) return null;
  const token = parseCookie(cookieHeader, SESSION_COOKIE);
  if (!token) return null;
  try {
    const payload = jwt.verify<SocketUser>(token);
    return { sub: payload.sub };
  } catch {
    return null;
  }
}

function parseCookie(header: string, name: string): string | null {
  for (const part of header.split(';')) {
    const eq = part.indexOf('=');
    if (eq === -1) continue;
    const k = part.slice(0, eq).trim();
    if (k === name) return decodeURIComponent(part.slice(eq + 1).trim());
  }
  return null;
}
