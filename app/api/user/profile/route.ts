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
    // Use 'profiles' table: select id, user_id, username, avatar_url, bio, created_at, updated_at, tokensBalance
    // Add PATCH handler for updating username, avatar_url, bio
    // Remove all steamId logic
    const { data: user, error: userError } = await supabase
      .from('Profiles')
      .select('id, user_id, username, avatar_url, bio, created_at, updated_at, tokensBalance')
      .eq('user_id', session.user.id)
      .single()

    if (userError) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Fetch user statistics
    const { data: sessions, error: sessionsError } = await supabase
      .from('Session')
      .select('id, hours, status, startedAt, endedAt')
      .or(`playerId.eq.${session.user.id},hostId.eq.${session.user.id}`)

    if (sessionsError) {
      console.error('Error fetching sessions:', sessionsError)
    }

    // Calculate statistics
    const totalHours = sessions?.reduce((sum, session) => sum + (session.hours || 0), 0) || 0
    const activeSessions = sessions?.filter(s => s.status === 'active').length || 0
    const completedSessions = sessions?.filter(s => s.status === 'ended').length || 0

    // Fetch total earnings (as host)
    const { data: earnings, error: earningsError } = await supabase
      .from('Transaction')
      .select('amount')
      .eq('userId', session.user.id)
      .eq('type', 'earn')

    if (earningsError) {
      console.error('Error fetching earnings:', earningsError)
    }

    const totalEarnings = earnings?.reduce((sum, transaction) => sum + (transaction.amount || 0), 0) || 0

    return NextResponse.json({
      id: user.id,
      username: user.username,
      avatarUrl: user.avatar_url,
      bio: user.bio,
      tokensBalance: user.tokensBalance || 0,
      totalEarnings,
      totalHours,
      activeSessions,
      completedSessions,
      memberSince: user.created_at,
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
    const { username, avatar_url, bio } = body
    // Only allow updating these fields
    const updates: any = {}
    if (username !== undefined) updates.username = username
    if (avatar_url !== undefined) updates.avatar_url = avatar_url
    if (bio !== undefined) updates.bio = bio
    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }
    updates.updated_at = new Date().toISOString()
    const { data, error } = await supabase
      .from('Profiles')
      .update(updates)
      .eq('user_id', session.user.id)
      .select('id, user_id, username, avatar_url, bio, created_at, updated_at')
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