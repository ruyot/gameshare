import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// List of protected route prefixes
const protectedRoutes = ['/host', '/profile', '/tokens', '/support']

export async function middleware(request: NextRequest) {
  // Only run auth logic for protected routes
  const path = request.nextUrl.pathname
  const isProtected = protectedRoutes.some((prefix) => path.startsWith(prefix))

  if (!isProtected) {
    // Allow public access to all other routes
    return NextResponse.next()
  }

  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            supabaseResponse.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // If user is not signed in, redirect to /auth
  if (!user) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/auth'
    // Store the intended destination for redirect-after-login
    redirectUrl.searchParams.set('redirectTo', path)
    return NextResponse.redirect(redirectUrl)
  }

  // If user is signed in and tries to access /auth, redirect to /marketplace
  if (user && path.startsWith('/auth')) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/marketplace'
    return NextResponse.redirect(redirectUrl)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    // Only match protected routes
    '/host/:path*',
    '/profile/:path*',
    '/tokens/:path*',
    '/support/:path*',
    // You can add more protected routes here
  ],
} 