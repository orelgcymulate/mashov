import { NextResponse, type NextRequest } from 'next/server';

const PUBLIC_PATHS = ['/login', '/api/auth/login', '/api/health'];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return NextResponse.next();
  }

  // API requests get a 401 (TanStack Query handles redirect).
  // HTML requests get a redirect to /login.
  const isApi = pathname.startsWith('/api/');
  const hasCookie = Boolean(req.cookies.get('mashov_session')?.value);

  if (!hasCookie) {
    if (isApi) return new NextResponse(null, { status: 401 });
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    if (pathname !== '/') url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
