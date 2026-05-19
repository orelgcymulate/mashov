import { JwtService } from '@nestjs/jwt';
import { SESSION_COOKIE } from '../auth/jwt-auth.guard';

export interface SocketUser {
  sub: string;
}

/**
 * Verifies the WebSocket handshake. Accepts the JWT from either the cookie
 * header (same-origin clients) or an explicit token (cross-origin clients
 * where browser cookies don't propagate, e.g. web on one Railway subdomain
 * and api on another).
 */
export function authenticateHandshake(
  args: { cookieHeader?: string; token?: string },
  jwt: JwtService,
): SocketUser | null {
  const candidate = args.token || (args.cookieHeader ? parseCookie(args.cookieHeader, SESSION_COOKIE) : null);
  if (!candidate) return null;
  try {
    const payload = jwt.verify<SocketUser>(candidate);
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
