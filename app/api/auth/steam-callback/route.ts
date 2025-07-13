import { NextRequest, NextResponse } from 'next/server';
import openid from 'openid';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    // Extract returnUrl from the callback URL
    const callbackUrlObj = new URL(request.url)
    const returnUrl = callbackUrlObj.searchParams.get('returnUrl') || '/marketplace'

    // 1) Verify Steam OpenID
    const url = request.url
    const rp = new openid.RelyingParty(
      `${process.env.NEXT_PUBLIC_SITE_URL}/api/auth/steam-callback?returnUrl=${encodeURIComponent(returnUrl)}`,
      null,
      true,
      true,
      []
    )

    const verificationResult = await new Promise<any>((resolve, reject) => {
      rp.verifyAssertion(url, (error, result) => {
        if (error) {
          reject(error)
        } else {
          resolve(result)
        }
      })
    })

    const { authenticated, claimedIdentifier } = verificationResult
    if (!authenticated) throw new Error('Steam authentication failed')
    if (!claimedIdentifier) throw new Error('No claimed identifier from Steam')

    // 2) Extract steamID64 from claimed_id
    // Format: https://steamcommunity.com/openid/id/<steamid>
    const steamMatch = claimedIdentifier.match(/\/id\/(\d+)$/)
    if (!steamMatch) throw new Error('Invalid Steam ID format: ' + claimedIdentifier)
    const steamId = steamMatch[1]

    // 3) Upsert user in User table
    const { data: user, error: upsertError } = await supabaseAdmin
      .from('User')
      .upsert({
        steamId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }, { onConflict: 'steamId', ignoreDuplicates: false })
      .select()
      .single()
    if (upsertError) throw new Error('User upsert failed: ' + upsertError.message)
    if (!user) throw new Error('User upsert returned no data')

    // 3b) Seed 500 tokens for new users on first login
    if (user.tokensBalance === 0 || user.tokensBalance === null || typeof user.tokensBalance === 'undefined') {
      const { error: seedError } = await supabaseAdmin
        .from('User')
        .update({ tokensBalance: 500 })
        .eq('id', user.id)
      if (seedError) {
        console.error('Error seeding test tokens:', seedError)
      }
    }

    // 4) Create Supabase Auth user if needed
    try {
      const { data: authUser, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
        id: user.id,
        email: `${steamId}@steam.local`,
        user_metadata: {
          steamId,
          provider: 'steam',
        },
        email_confirm: true,
      })
      if (createUserError && createUserError.message !== 'User already registered') {
        throw new Error('Create auth user failed: ' + createUserError.message)
      }
    } catch (authError) {
      console.error('Auth user creation error:', authError)
    }

    // 5) Mint a session via the Admin SDK (magiclink workaround)
    const { data: sessionData, error: sessionError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: `${steamId}@steam.local`,
      options: {
        data: {
          steamId,
          provider: 'steam',
        },
      },
    })
    if (sessionError) throw new Error('Session generation failed: ' + sessionError.message)
    if (!sessionData?.properties?.action_link) throw new Error('No action link generated')

    // Extract tokens from the action link
    const actionUrl = new URL(sessionData.properties.action_link)
    const accessToken = actionUrl.searchParams.get('access_token')
    const refreshToken = actionUrl.searchParams.get('refresh_token')
    if (!accessToken || !refreshToken) throw new Error('Missing access or refresh token')

    // 6) Fetch Steam profile data
    try {
      const steamProfileResponse = await fetch(`https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${process.env.STEAM_API_KEY}&steamids=${steamId}`)
      if (steamProfileResponse.ok) {
        const steamData = await steamProfileResponse.json()
        const steamProfile = steamData.response.players[0]
        await supabaseAdmin
          .from('User')
          .update({
            steamUsername: steamProfile.personaname,
            steamAvatar: steamProfile.avatarfull,
            updatedAt: new Date().toISOString(),
          })
          .eq('id', user.id)
      }
    } catch (profileError) {
      console.error('Steam profile fetch error:', profileError)
    }

    // 7) Set session cookies and redirect to /auth/complete with tokens and returnUrl
    const response = NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL}/auth/complete?access_token=${accessToken}&refresh_token=${refreshToken}&returnUrl=${encodeURIComponent(returnUrl)}`)
    response.cookies.set('sb-access-token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
      domain: process.env.NODE_ENV === 'production' ? process.env.COOKIE_DOMAIN : undefined,
    })
    response.cookies.set('sb-refresh-token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
      domain: process.env.NODE_ENV === 'production' ? process.env.COOKIE_DOMAIN : undefined,
    })
    return response
  } catch (error) {
    console.error('Steam callback error:', error)
    // Redirect to error page with details (absolute URL)
    const errorUrl = new URL('/auth/complete', process.env.NEXT_PUBLIC_SITE_URL)
    errorUrl.searchParams.set('error', 'steam_login_failed')
    errorUrl.searchParams.set('message', error instanceof Error ? error.message : 'Unknown error')
    return NextResponse.redirect(errorUrl.toString())
  }
} 