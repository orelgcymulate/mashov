import { NextResponse, type NextRequest } from 'next/server';

const PUBLIC_PATHS = ['/login', '/api/auth/login', '/api/health'];

export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  // Persist the wall-tablet flag the moment the request carries ?device=tablet,
  // regardless of where it's headed. Without this, the login redirect strips
  // the query param and DeviceRoleSetter never gets a chance to write the
  // cookie inside (dash)/layout.
  const wantsTablet = req.nextUrl.searchParams.get('device') === 'tablet';
  const hasTabletCookie = req.cookies.get('mashov_device')?.value === 'tablet';

  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    const res = NextResponse.next();
    if (wantsTablet && !hasTabletCookie) {
      res.cookies.set('mashov_device', 'tablet', {
        path: '/',
        maxAge: 60 * 60 * 24 * 365 * 5,
        sameSite: 'lax',
      });
    }
    return res;
  }

  // API requests get a 401 (TanStack Query handles redirect).
  // HTML requests get a redirect to /login.
  const isApi = pathname.startsWith('/api/');
  const hasCookie = Boolean(req.cookies.get('mashov_session')?.value);

  if (!hasCookie) {
    if (isApi) return new NextResponse(null, { status: 401 });
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    // Preserve original path + query so the user lands back on the same URL
    // (e.g. /today?device=tablet) after logging in.
    if (pathname !== '/') url.searchParams.set('next', `${pathname}${search}`);
    const res = NextResponse.redirect(url);
    if (wantsTablet && !hasTabletCookie) {
      res.cookies.set('mashov_device', 'tablet', {
        path: '/',
        maxAge: 60 * 60 * 24 * 365 * 5,
        sameSite: 'lax',
      });
    }
    return res;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
