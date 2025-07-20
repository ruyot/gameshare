import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';

// Define protected routes that require authentication
const protectedRoutes: string[] = ['/profile']; // Profile page requires authentication

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });
  const { data: { session }, error } = await supabase.auth.getSession();

  const { pathname, search } = req.nextUrl;
  const isAuthPath = pathname.startsWith('/auth') || pathname.startsWith('/api/auth');
  const isStatic = pathname.startsWith('/_next') || pathname.startsWith('/favicon.ico');
  
  // Check if the current route is protected
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));

  // Only redirect to auth if user is not authenticated AND trying to access a protected route
  if (!session && isProtectedRoute && !isAuthPath && !isStatic) {
    // Use URL parameter instead of cookie for redirect
    const authUrl = new URL('/auth', req.url);
    authUrl.searchParams.set('redirect', pathname + search);
    return NextResponse.redirect(authUrl);
  }

  // If logged in and on /auth, redirect to stored destination or default
  if (session && pathname === '/auth') {
    const redirectTo = req.nextUrl.searchParams.get('redirect') || '/marketplace';
    const redirectUrl = new URL(redirectTo, req.url);
    return NextResponse.redirect(redirectUrl);
  }

  return res;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}; 