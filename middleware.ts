import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';

// Define protected routes that require authentication
const protectedRoutes = ['/host', '/profile', '/tokens', '/support'];

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });
  const { data: { session } } = await supabase.auth.getSession();

  const { pathname, search } = req.nextUrl;
  const isAuthPath = pathname.startsWith('/auth') || pathname.startsWith('/api/auth');
  const isStatic = pathname.startsWith('/_next') || pathname.startsWith('/favicon.ico');
  
  // Check if the current route is protected
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));

  // Only redirect to auth if user is not authenticated AND trying to access a protected route
  if (!session && isProtectedRoute && !isAuthPath && !isStatic) {
    // Store full path+query in cookie
    res.cookies.set('redirect_to', pathname + search, {
      path: '/', httpOnly: true, sameSite: 'lax'
    });
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL}/auth`);
  }

  // If logged in and on /auth, redirect to stored destination or default
  if (session && pathname === '/auth') {
    const redirectTo = req.cookies.get('redirect_to')?.value || '/marketplace';
    res.cookies.delete('redirect_to');
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL}${redirectTo}`);
  }

  return res;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}; 