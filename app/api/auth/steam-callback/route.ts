import { NextRequest, NextResponse } from 'next/server';
import openid from 'openid';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  const url = request.url;
  const searchParams = new URL(url).searchParams;
  const state = searchParams.get('state') || '/';

  const rp = new openid.RelyingParty(
    `${process.env.NEXT_PUBLIC_SITE_URL}/api/auth/steam-callback`,
    null,
    true,
    false,
    []
  );

  return new Promise<NextResponse>(resolve => {
    rp.verifyAssertion(url, async (error, result) => {
      if (error || !result || !result.authenticated) {
        resolve(NextResponse.redirect('/auth?error=steam_login_failed'));
        return;
      }

      // Extract SteamID
      const claimedIdentifier = result.claimedIdentifier;
      const steamId = claimedIdentifier?.split('/').pop();
      if (!steamId) {
        resolve(NextResponse.redirect('/auth?error=steam_id_missing'));
        return;
      }

      // Fetch Steam profile
      let steamProfile = null;
      try {
        const resp = await fetch(
          `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${process.env.STEAM_API_KEY}&steamids=${steamId}`
        );
        const data = await resp.json();
        steamProfile = data.response.players[0];
      } catch (e) {
        // continue, profile is optional
      }

      // Upsert user in Supabase
      await supabaseAdmin
        .from('User')
        .upsert({
          steamId,
          steamUsername: steamProfile?.personaname,
          steamAvatar: steamProfile?.avatarfull,
          updatedAt: new Date().toISOString(),
        });

      // Create Supabase Auth user if needed, mint session, etc. (as before)
      // ... (your existing logic here)
      // For now, just redirect to the original page
      resolve(NextResponse.redirect(state));
    });
  });
} 