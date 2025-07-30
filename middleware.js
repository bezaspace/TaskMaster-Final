import { NextResponse } from 'next/server';

export function middleware(request) {
  console.log('🔒 Middleware running for:', request.nextUrl.pathname);
  
  // Allow access to login page and static assets
  if (
    request.nextUrl.pathname === '/login' ||
    request.nextUrl.pathname.startsWith('/_next') ||
    request.nextUrl.pathname.startsWith('/favicon') ||
    request.nextUrl.pathname.startsWith('/api')
  ) {
    console.log('✅ Allowing access to:', request.nextUrl.pathname);
    return NextResponse.next();
  }

  // Check for auth token in cookies
  const token = request.cookies.get('auth-token')?.value;
  console.log('🔑 Auth token found:', !!token);

  if (!token) {
    console.log('❌ No token, redirecting to login');
    return NextResponse.redirect(new URL('/login', request.url));
  }

  console.log('✅ Token found, allowing access');
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};