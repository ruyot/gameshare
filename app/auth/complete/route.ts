import { NextRequest, NextResponse } from 'next/server'
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const access_token = requestUrl.searchParams.get('access_token')
  const refresh_token = requestUrl.searchParams.get('refresh_token')
  const error = requestUrl.searchParams.get('error')
  const message = requestUrl.searchParams.get('message')
  const returnUrl = requestUrl.searchParams.get('returnUrl') || '/marketplace'

  if (error) {
    console.error('Auth completion error:', error, message)
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL}/auth?error=${error}&message=${message}`)
  }

  if (!access_token || !refresh_token) {
    console.error('Missing tokens in auth completion')
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL}/auth?error=missing_tokens`)
  }

  try {
    // Create response and middleware client (same as middleware.ts)
    const res = NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL}${returnUrl}`)
    const supabase = createMiddlewareClient({ req: request, res })

    // Set the session using the middleware client
    const { error: sessionError } = await supabase.auth.setSession({
      access_token,
      refresh_token
    })

    if (sessionError) {
      console.error('Session setting error:', sessionError)
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL}/auth?error=session_error`)
    }

    // Get the user to verify the session was set correctly
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      console.error('User verification error:', userError)
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL}/auth?error=user_verification_failed`)
    }

    console.log('Auth completion successful for user:', user.id)

    // Return the response with the session cookies set
    return res

  } catch (error) {
    console.error('Auth completion server error:', error)
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL}/auth?error=server_error`)
  }
}