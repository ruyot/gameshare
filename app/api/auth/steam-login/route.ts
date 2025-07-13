import { NextRequest, NextResponse } from 'next/server'
import openid from 'openid'

const STEAM_OPENID_URL = 'https://steamcommunity.com/openid'

export async function GET(request: NextRequest) {
  try {
    // Get returnUrl from query params, default to /marketplace
    const { searchParams } = new URL(request.url)
    const returnUrl = searchParams.get('returnUrl') || '/marketplace'

    // Add returnUrl as a query param to the callback URL
    const callbackUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/api/auth/steam-callback?returnUrl=${encodeURIComponent(returnUrl)}`

    const relyingParty = new openid.RelyingParty(
      callbackUrl,
      null,
      true,
      true,
      []
    )

    const authUrl = await new Promise<string>((resolve, reject) => {
      relyingParty.authenticate(STEAM_OPENID_URL, false, (error, authUrl) => {
        if (error) {
          reject(error)
        } else {
          resolve(authUrl!)
        }
      })
    })

    return NextResponse.redirect(authUrl)
  } catch (error) {
    console.error('Steam login error:', error)
    return NextResponse.redirect('/auth?error=steam_login_failed')
  }
} 