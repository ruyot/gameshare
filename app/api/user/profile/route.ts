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
    // Fetch user data
    const { data: user, error: userError } = await supabase
      .from('User')
      .select('id, steamId, tokensBalance, createdAt')
      .eq('id', session.user.id)
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
      steamId: user.steamId,
      tokensBalance: user.tokensBalance || 0,
      totalEarnings,
      totalHours,
      activeSessions,
      completedSessions,
      memberSince: user.createdAt,
    })
  } catch (error) {
    console.error('Profile fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 