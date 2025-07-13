import { NextRequest, NextResponse } from 'next/server'
import openid from 'openid'

const STEAM_OPENID_URL = 'https://steamcommunity.com/openid'

export async function GET(request: NextRequest) {
  try {
    const relyingParty = new openid.RelyingParty(
      `${process.env.NEXT_PUBLIC_SITE_URL}/api/auth/steam-callback`,
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