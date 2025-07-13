import { NextRequest, NextResponse } from 'next/server'
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'

export async function GET(request: NextRequest) {
  // Check for secret token
  const { searchParams } = new URL(request.url)
  const secret = searchParams.get('secret')
  
  if (secret !== process.env.DEBUG_SECRET_TOKEN) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const res = NextResponse.next()
    const supabase = createMiddlewareClient({ req: request, res })
    
    // Get session info
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    // Get user info
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    // Get all cookies
    const allCookies = request.cookies.getAll()
    
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      session: {
        exists: !!session,
        error: sessionError?.message,
        user_id: session?.user?.id,
        expires_at: session?.expires_at,
        access_token_exists: !!session?.access_token,
        refresh_token_exists: !!session?.refresh_token,
      },
      user: {
        exists: !!user,
        error: userError?.message,
        id: user?.id,
        email: user?.email,
        metadata: user?.user_metadata,
      },
      cookies: allCookies.map(cookie => ({
        name: cookie.name,
        value: cookie.value ? `${cookie.value.substring(0, 10)}...` : 'empty',
      })),
      headers: {
        host: request.headers.get('host'),
        user_agent: request.headers.get('user-agent'),
        referer: request.headers.get('referer'),
      },
      environment: {
        node_env: process.env.NODE_ENV,
        site_url: process.env.NEXT_PUBLIC_SITE_URL,
        has_supabase_url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        has_supabase_key: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      }
    })
  } catch (error) {
    return NextResponse.json({
      error: 'Debug endpoint error',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
} 