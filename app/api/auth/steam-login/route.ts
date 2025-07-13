import { NextRequest, NextResponse } from 'next/server';
import openid from 'openid';

const STEAM_OPENID_URL = 'https://steamcommunity.com/openid';

export async function GET(request: NextRequest) {
  // Read redirect_to from cookie, fallback to /
  const cookies = request.cookies;
  const state = cookies.get('redirect_to')?.value || '/';

  const relyingParty = new openid.RelyingParty(
    `${process.env.NEXT_PUBLIC_SITE_URL}/api/auth/steam-callback`,
    null,
    true,
    false,
    []
  );

  return new Promise<NextResponse>((resolve) => {
    relyingParty.authenticate(STEAM_OPENID_URL, false, (error, authUrl) => {
      if (error || !authUrl) {
        resolve(NextResponse.redirect('/auth?error=steam_login_failed'));
        return;
      }
      // Add state param
      const url = new URL(authUrl);
      url.searchParams.set('state', state);
      resolve(NextResponse.redirect(url));
    });
  });
} 