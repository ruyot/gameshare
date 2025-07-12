import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
)

export interface SteamUser {
  steam_id: string
}

export async function initiateSteamLogin(returnUrl: string = '/marketplace') {
  window.location.href = `/api/auth/steam-login?returnUrl=${encodeURIComponent(returnUrl)}`
}

export async function completeSteamAuth(searchParams: string) {
  try {
    // Call the Steam callback endpoint to get session tokens
    const response = await fetch(`/api/auth/steam-callback?${searchParams}`)
    
    if (!response.ok) {
      throw new Error('Failed to complete Steam authentication')
    }

    const { access_token, refresh_token, user } = await response.json()

    if (!access_token) {
      throw new Error('No access token received')
    }

    // Set the session in Supabase client
    const { error: sessionError } = await supabase.auth.setSession({
      access_token,
      refresh_token
    })

    if (sessionError) {
      throw sessionError
    }

    return { user }
  } catch (error) {
    console.error('Steam auth completion error:', error)
    throw error
  }
}

export async function getCurrentSteamUser() {
  const { data: { user } } = await supabase.auth.getUser()
  if (user && user.user_metadata?.steam_id) {
    return {
      steam_id: user.user_metadata.steam_id
    } as SteamUser
  }
  return null
} 