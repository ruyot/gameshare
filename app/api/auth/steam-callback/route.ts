import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

// Initialize Supabase Admin client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

// Steam OpenID verification
async function verifySteamOpenID(params: URLSearchParams): Promise<string | null> {
  try {
    // Add the required OpenID verification parameters
    const verificationParams = new URLSearchParams(params)
    verificationParams.set('openid.mode', 'check_authentication')
    
    const response = await fetch('https://steamcommunity.com/openid/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: verificationParams.toString(),
    })
    
    const responseText = await response.text()
    
    if (responseText.includes('is_valid:true')) {
      // Extract Steam ID from the OpenID response
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

    // Verify the OpenID response
    const steamId = await verifySteamOpenID(searchParams)
    
    if (!steamId) {
      return NextResponse.redirect(new URL('/auth?error=verification_failed', request.url))
    }

    // Check if user already exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
    const existingUser = existingUsers.users.find(u => 
      u.user_metadata?.steam_id === steamId
    )

    let userId: string

    if (existingUser) {
      // User exists, use existing ID
      userId = existingUser.id
    } else {
      // Create new user
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: `${steamId}@steam.local`,
        password: crypto.randomUUID(),
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
    const { data: session, error: sessionError } = await supabaseAdmin.auth.signInWithPassword({
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