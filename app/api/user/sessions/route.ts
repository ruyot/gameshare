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
    // First get the User record to get the internal User ID
    const { data: userRecord, error: userError } = await supabase
      .from('User')
      .select('id')
      .eq('auth_user_id', session.user.id)
      .single()

    if (userError) {
      console.error('Error fetching User record:', userError)
      return NextResponse.json({ sessions: [] }) // Return empty sessions if User record not found
    }

    // Fetch user sessions with game and listing details using User.id
    const { data: sessions, error } = await supabase
      .from('Session')
      .select(`
        id,
        hours,
        status,
        startedAt,
        endedAt,
        Listing:listingId(
          id,
          rateTokensPerHour,
          Game:gameId(
            id,
            name,
            thumbnailUrl
          )
        ),
        Host:hostId(steamId),
        Player:playerId(steamId)
      `)
      .or(`playerId.eq.${userRecord.id},hostId.eq.${userRecord.id}`)
      .order('startedAt', { ascending: false })

    if (error) {
      console.error('Error fetching sessions:', error)
      return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 })
    }

    // Transform sessions for frontend
    const transformedSessions = sessions?.map((session: any) => ({
      id: session.id,
      gameTitle: session.Listing?.Game?.name || 'Unknown Game',
      gameThumbnail: session.Listing?.Game?.thumbnailUrl || '/placeholder.svg',
      hours: session.hours,
      status: session.status,
      startedAt: session.startedAt,
      endedAt: session.endedAt,
      rateTokensPerHour: session.Listing?.rateTokensPerHour || 0,
      totalCost: (session.Listing?.rateTokensPerHour || 0) * session.hours,
      isHost: session.hostId === userRecord.id,
      otherParty: session.hostId === userRecord.id 
        ? session.Player?.steamId 
        : session.Host?.steamId,
    })) || []

    return NextResponse.json({ sessions: transformedSessions })
  } catch (error) {
    console.error('Sessions fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 