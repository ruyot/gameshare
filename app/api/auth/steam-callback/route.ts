import { NextRequest, NextResponse } from 'next/server'
import openid from 'openid'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    console.log('Steam callback started')
    
    // 1) Verify Steam OpenID
    const url = request.url
    console.log('Verifying Steam OpenID for URL:', url)
    
    const rp = new openid.RelyingParty(
      'https://gamesharez.netlify.app/api/auth/steam-callback',
      null,
      true,
      true,
      []
    )
    
    const verificationResult = await new Promise<any>((resolve, reject) => {
      rp.verifyAssertion(url, (error, result) => {
        if (error) {
          console.error('Steam OpenID verification error:', error)
          reject(error)
        } else {
          console.log('Steam OpenID verification result:', result)
          resolve(result)
        }
      })
    })
    
    const { authenticated, claimedIdentifier } = verificationResult
    
    if (!authenticated) {
      console.error('Steam authentication failed')
      throw new Error('Steam authentication failed')
    }
    
    if (!claimedIdentifier) {
      console.error('No claimed identifier from Steam')
      throw new Error('No claimed identifier from Steam')
    }

    // 2) Extract steamID64
    const steamMatch = claimedIdentifier.match(/\/id\/(\d+)$/)
    if (!steamMatch) {
      console.error('Invalid Steam ID format:', claimedIdentifier)
      throw new Error('Invalid Steam ID format')
    }
    
    const steamId = steamMatch[1]
    console.log('Extracted Steam ID:', steamId)

    // 3) Create or get user in your custom User table
    const { data: user, error: upsertError } = await supabaseAdmin
      .from('User')
      .upsert(
        { 
          steamId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }, 
        { 
          onConflict: 'steamId',
          ignoreDuplicates: false
        }
      )
      .select()
      .single()
    
    if (upsertError) {
      console.error('User upsert error:', upsertError)
      throw new Error(`User upsert failed: ${upsertError.message}`)
    }
    
    if (!user) {
      console.error('No user returned from upsert')
      throw new Error('User upsert returned no data')
    }
    
    console.log('User upserted successfully:', user.id)

    // 3b) Seed 500 tokens for new users on first login
    if (user.tokensBalance === 0 || user.tokensBalance === null || typeof user.tokensBalance === 'undefined') {
      const { error: seedError } = await supabaseAdmin
        .from('User')
        .update({ tokensBalance: 500 })
        .eq('id', user.id)
      if (seedError) {
        console.error('Error seeding test tokens:', seedError)
      } else {
        console.log('Seeded 500 test tokens for new user:', user.id)
      }
    }

    // 4) Create Supabase Auth user if it doesn't exist
    try {
      const { data: authUser, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
        id: user.id,
        email: `${steamId}@steam.local`,
        user_metadata: { 
          steamId,
          provider: 'steam'
        },
        email_confirm: true
      })
      
      if (createUserError && createUserError.message !== 'User already registered') {
        console.error('Create auth user error:', createUserError)
        throw new Error(`Create auth user failed: ${createUserError.message}`)
      }
      
      console.log('Auth user created/verified:', authUser?.user?.id)
    } catch (authError) {
      console.error('Auth user creation error:', authError)
      // Continue anyway - user might already exist
    }

    // 5) Mint a session via the Admin SDK (magiclink workaround)
    const { data: sessionData, error: sessionError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: `${steamId}@steam.local`,
      options: {
        data: {
          steamId,
          provider: 'steam'
        }
      }
    })
    
    if (sessionError) {
      console.error('Session generation error:', sessionError)
      throw new Error(`Session generation failed: ${sessionError.message}`)
    }
    
    if (!sessionData?.properties?.action_link) {
      console.error('No action link in session data')
      throw new Error('No action link generated')
    }

    // Extract tokens from the action link
    const actionUrl = new URL(sessionData.properties.action_link)
    const accessToken = actionUrl.searchParams.get('access_token')
    const refreshToken = actionUrl.searchParams.get('refresh_token')
    
    if (!accessToken || !refreshToken) {
      console.error('Missing tokens in action link')
      throw new Error('Missing access or refresh token')
    }

    console.log('Session tokens generated successfully')

    // 6) Return a clean 302 redirect to /auth/complete with tokens
    return new NextResponse(null, {
      status: 302,
      headers: {
        Location: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/complete?access_token=${accessToken}&refresh_token=${refreshToken}`,
        'Content-Type': 'text/html; charset=utf-8',
      },
    })

  } catch (error) {
    console.error('Steam callback error:', error)
    
    // Redirect to error page with details
    const errorUrl = new URL('/auth/complete', 'https://gamesharez.netlify.app')
    errorUrl.searchParams.set('error', 'steam_login_failed')
    errorUrl.searchParams.set('message', error instanceof Error ? error.message : 'Unknown error')
    
    return NextResponse.redirect(errorUrl.toString())
  }
} 