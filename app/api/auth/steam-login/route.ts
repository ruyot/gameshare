import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const returnUrl = searchParams.get('returnUrl') || '/marketplace'
  
  // Steam OpenID login URL
  const steamLoginUrl = new URL('https://steamcommunity.com/openid/login')
  steamLoginUrl.searchParams.set('openid.ns', 'http://specs.openid.net/auth/2.0')
  steamLoginUrl.searchParams.set('openid.mode', 'checkid_setup')
  steamLoginUrl.searchParams.set('openid.return_to', `${process.env.NEXT_PUBLIC_SITE_URL}/api/auth/steam-callback?returnUrl=${encodeURIComponent(returnUrl)}`)
  steamLoginUrl.searchParams.set('openid.realm', process.env.NEXT_PUBLIC_SITE_URL!)
  steamLoginUrl.searchParams.set('openid.identity', 'http://specs.openid.net/auth/2.0/identifier_select')
  steamLoginUrl.searchParams.set('openid.claimed_id', 'http://specs.openid.net/auth/2.0/identifier_select')

  return NextResponse.redirect(steamLoginUrl.toString())
} 