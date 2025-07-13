import { NextRequest, NextResponse } from 'next/server'
import openid from 'openid'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    // 1) Verify Steam OpenID
    const url = request.url
    const rp = new openid.RelyingParty(
      'https://gamesharez.netlify.app/api/auth/steam-callback',
      null,
      true,
      true,
      []
    )
    const { authenticated, claimedIdentifier } = await new Promise<any>((res, rej) =>
      rp.verifyAssertion(url, (e, r) => e ? rej(e) : res(r))
    )
    if (!authenticated || !claimedIdentifier) throw new Error('Steam verification failed')

    // 2) Extract steamID64
    const steamMatch = claimedIdentifier.match(/\/id\/(\d+)$/)
    if (!steamMatch) throw new Error('Invalid Steam ID')
    const steamId = steamMatch[1]

    // 3) Upsert your custom User table
    const { data: user, error: upsertErr } = await supabaseAdmin
      .from('User')
      .upsert({ steamId }, { onConflict: 'steamId' })
      .select()
      .single()
    if (upsertErr || !user) throw upsertErr || new Error('User upsert failed')

    // 4) Ensure a Supabase Auth user exists (id = user.id)
    //    This will noop if they already exist.
    await supabaseAdmin.auth.admin.createUser({
      id: user.id,
      user_metadata: { steamId },
    })

    // 5) Mint a session via the Admin SDK
    // Use generateLink to create a session
    const { data: linkData, error: linkErr } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: `${steamId}@steam.local`
    })
    if (linkErr) throw linkErr || new Error('Link generation failed')

    // Extract session tokens from the generated link
    const linkUrl = new URL(linkData.properties.action_link)
    const accessToken = linkUrl.searchParams.get('access_token')
    const refreshToken = linkUrl.searchParams.get('refresh_token')
    
    if (!accessToken || !refreshToken) {
      throw new Error('No tokens in generated link')
    }

    const session = {
      access_token: accessToken,
      refresh_token: refreshToken
    }

    // 6) Redirect to your client page
    const redirectUrl = new URL('/auth/complete', process.env.NEXT_PUBLIC_SITE_URL)
    redirectUrl.searchParams.set('access_token', session.access_token)
    redirectUrl.searchParams.set('refresh_token', session.refresh_token)
    return NextResponse.redirect(redirectUrl.toString())

  } catch (err) {
    console.error(err)
    // change this to a valid error page if you have one
    return NextResponse.redirect('/auth/complete?error=login_failed')
  }
} 