import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

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
    const cookieStore = await cookies()
    
    // Create server-side Supabase client
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          },
        },
      }
    )

    // Set the session server-side
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

    // Redirect to marketplace or stored destination
    return NextResponse.redirect(returnUrl)

  } catch (error) {
    console.error('Auth completion server error:', error)
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL}/auth?error=server_error`)
  }
}