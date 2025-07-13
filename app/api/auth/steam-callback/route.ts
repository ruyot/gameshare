import { NextRequest, NextResponse } from 'next/server'
import openid from 'openid'
import { createClient } from '@supabase/supabase-js'

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

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const relyingParty = new openid.RelyingParty(
      `${process.env.NEXT_PUBLIC_SITE_URL}/api/auth/steam-callback`,
      null,
      true,
      true,
      []
    )

    // Verify the OpenID assertion
    const verificationResult = await new Promise<{ authenticated: boolean; claimedIdentifier?: string }>((resolve, reject) => {
      relyingParty.verifyAssertion(url.toString(), (error, result) => {
        if (error) {
          reject(error)
        } else {
          resolve({
            authenticated: result?.authenticated || false,
            claimedIdentifier: result?.claimedIdentifier
          })
        }
      })
    })

    if (!verificationResult.authenticated || !verificationResult.claimedIdentifier) {
      throw new Error('OpenID verification failed')
    }

    // Extract Steam ID from claimed identifier
    // Steam OpenID format: https://steamcommunity.com/openid/id/76561198012345678
    const steamIdMatch = verificationResult.claimedIdentifier.match(/\/openid\/id\/(\d+)/)
    if (!steamIdMatch) {
      throw new Error('Invalid Steam ID format')
    }
    const steamId = steamIdMatch[1]

    // Upsert user into Supabase
    const { data: user, error: userError } = await supabaseAdmin
      .from('User')
      .upsert(
        { 
          steamId, 
          email: null // Steam doesn't provide email via OpenID
        }, 
        { onConflict: 'steamId' }
      )
      .select()
      .single()

    if (userError || !user) {
      throw new Error('Failed to create/update user')
    }

    // Create Supabase session using signInWithPassword for existing user
    const { data: session, error: sessionError } = await supabaseAdmin.auth.signInWithPassword({
      email: `${steamId}@steam.local`,
      password: 'steam-user-password'
    })

    if (sessionError || !session) {
      throw new Error('Failed to create session')
    }

    // Redirect to complete page with tokens
    const redirectUrl = new URL('/auth/complete', process.env.NEXT_PUBLIC_SITE_URL)
    redirectUrl.searchParams.set('access_token', session.session.access_token)
    redirectUrl.searchParams.set('refresh_token', session.session.refresh_token)

    return NextResponse.redirect(redirectUrl.toString())
  } catch (error) {
    console.error('Steam callback error:', error)
    return NextResponse.redirect('/auth?error=steam_callback_failed')
  }
} 