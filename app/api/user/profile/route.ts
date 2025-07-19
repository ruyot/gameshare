import { NextRequest, NextResponse } from 'next/server'
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(req: NextRequest) {
  const supabaseServer = createMiddlewareClient({ req, res: NextResponse.next() })
  const {
    data: { session },
  } = await supabaseServer.auth.getSession()
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Get profile data from profiles table
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, username, full_name, avatar_url, created_at, updated_at')
      .eq('id', session.user.id)
      .single()
    
    if (profileError) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Get tokens balance from User table
    const { data: userData, error: userError } = await supabase
      .from('User')
      .select('tokensBalance')
      .eq('auth_user_id', session.user.id)
      .single()

    if (userError) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get User record to use for sessions/transactions
    const { data: userRecord } = await supabase
      .from('User')
      .select('id')
      .eq('auth_user_id', session.user.id)
      .single()

    // Fetch user statistics using User.id (not auth.users.id)
    const { data: sessions, error: sessionsError } = await supabase
      .from('Session')
      .select('id, tokensPrepaid, startAt, endAt')
      .eq('borrowerId', userRecord?.id)

    if (sessionsError) {
      console.error('Error fetching sessions:', sessionsError)
    }

    // Calculate statistics (adjust for your schema)
    const totalHours = sessions?.length || 0
    const activeSessions = sessions?.filter(s => !s.endAt).length || 0
    const completedSessions = sessions?.filter(s => s.endAt).length || 0

    // Fetch total earnings (as host) using User.id
    const { data: earnings, error: earningsError } = await supabase
      .from('Transaction')
      .select('amount')
      .eq('userId', userRecord?.id)
      .eq('type', 'earn')

    if (earningsError) {
      console.error('Error fetching earnings:', earningsError)
    }

    const totalEarnings = earnings?.reduce((sum, transaction) => sum + (transaction.amount || 0), 0) || 0

    return NextResponse.json({
      id: profile.id,
      username: profile.username,
      full_name: profile.full_name,
      avatar_url: profile.avatar_url,
      bio: '', // Not in your schema but kept for compatibility
      tokensBalance: userData?.tokensBalance || 0,
      totalEarnings,
      totalHours,
      activeSessions,
      completedSessions,
      memberSince: profile.created_at,
    })
  } catch (error) {
    console.error('Profile fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 

export async function PATCH(req: NextRequest) {
  const supabaseServer = createMiddlewareClient({ req, res: NextResponse.next() })
  const {
    data: { session },
  } = await supabaseServer.auth.getSession()

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { username, avatar_url, full_name } = body
    // Only allow updating these fields (matching your schema)
    const updates: any = {}
    if (username !== undefined) updates.username = username
    if (avatar_url !== undefined) updates.avatar_url = avatar_url
    if (full_name !== undefined) updates.full_name = full_name
    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }
    updates.updated_at = new Date().toISOString()
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', session.user.id)
      .select('id, username, full_name, avatar_url, created_at, updated_at')
      .single()
    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Username already taken' }, { status: 409 })
      }
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    return NextResponse.json(data)
  } catch (error) {
    console.error('Profile update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 