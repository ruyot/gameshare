import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

// Initialize Supabase client at runtime using public keys
let supabaseAdmin: ReturnType<typeof createClient>
function getSupabaseAdmin() {
  if (!supabaseAdmin) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Missing required Supabase environment variables')
    }
    supabaseAdmin = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  }
  return supabaseAdmin
}

// Steam OpenID verification
async function verifySteamOpenID(params: URLSearchParams): Promise<string | null> {
  try {
    const verificationParams = new URLSearchParams(params)
    verificationParams.set('openid.mode', 'check_authentication')
    const response = await fetch('https://steamcommunity.com/openid/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: verificationParams.toString(),
    })
    const responseText = await response.text()
    if (responseText.includes('is_valid:true')) {
      const steamId = params.get('openid.claimed_id')?.replace('https://steamcommunity.com/openid/id/', '')
      return steamId || null
    }
    return null
  } catch (error) {
    console.error('OpenID verification error:', error)
    return null
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const openidMode = searchParams.get('openid.mode')
    if (openidMode !== 'id_res') {
      return NextResponse.redirect(new URL('/auth?error=invalid_mode', request.url))
    }
    const steamId = await verifySteamOpenID(searchParams)
    if (!steamId) {
      return NextResponse.redirect(new URL('/auth?error=verification_failed', request.url))
    }
    // Check if user already exists
    const { data: existingUsers } = await getSupabaseAdmin().auth.admin.listUsers()
    const existingUser = existingUsers.users.find(u => u.user_metadata?.steam_id === steamId)
    let userId: string
    if (existingUser) {
      userId = existingUser.id
    } else {
      const { data: newUser, error: createError } = await getSupabaseAdmin().auth.admin.createUser({
        email: `${steamId}@steam.local`,
        password: 'steam-user-password',
        email_confirm: true,
        user_metadata: {
          steam_id: steamId,
          provider: 'steam'
        },
        app_metadata: {
          provider: 'steam',
          providers: ['steam']
        }
      })
      if (createError) {
        console.error('User creation error:', createError)
        return NextResponse.redirect(new URL('/auth?error=user_creation_failed', request.url))
      }
      userId = newUser.user.id
    }
    // Create a session for the user using signInWithPassword
    const { data: session, error: sessionError } = await getSupabaseAdmin().auth.signInWithPassword({
      email: `${steamId}@steam.local`,
      password: 'steam-user-password'
    })
    if (sessionError || !session.session) {
      console.error('Session creation error:', sessionError)
      return NextResponse.redirect(new URL('/auth?error=session_failed', request.url))
    }
    // Return session tokens as JSON
    return NextResponse.json({
      access_token: session.session.access_token,
      refresh_token: session.session.refresh_token,
      user: {
        id: userId,
        steam_id: steamId
      }
    })
  } catch (error) {
    console.error('Steam callback error:', error)
    return NextResponse.redirect(new URL('/auth?error=callback_failed', request.url))
  }
} 