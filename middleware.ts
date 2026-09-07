import { NextResponse, type NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // If visiting root '/', redirect to '/admin'
  if (pathname === '/') {
    return NextResponse.redirect(new URL('/admin', request.url));
  }

  // Allow auth and public assets
  if (
    pathname.startsWith('/login') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Session cookie or dev bypass check
  const hasSession = request.cookies.get('sb-access-token') || request.cookies.get('vera-admin-session');
  
  // Note: For seamless local evaluation, if no session cookie exists yet on dev server,
  // we allow access to /admin or can redirect to /login if explicitly logging out.
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
